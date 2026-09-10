import React from 'react';
import { Play, SquareTerminal, Settings, HelpCircle, CheckCircle, Flag, Database, Scan, TriangleAlert } from 'lucide-react';

export interface FlowchartNode {
  id: string;
  type: 'start' | 'input' | 'process' | 'decision' | 'output' | 'end';
  label: string;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface LayoutNode extends FlowchartNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: FlowchartEdge[];
  width: number;
  height: number;
}

export function parseAndLayoutFlowchart(dataStr: string): LayoutResult {
  let data: FlowchartData;
  try {
    let raw = dataStr.trim();
    // Sometimes LLMs wrap JSON in markdown code blocks
    if (raw.startsWith('```json')) raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    if (raw.startsWith('```')) raw = raw.replace(/```/g, '').trim();
    
    const parsed = JSON.parse(raw);
    if (parsed.nodes && parsed.edges) {
      data = parsed;
    } else {
      throw new Error("Invalid JSON structure");
    }
  } catch (e) {
    // Legacy support: smarter text parser for linear/branched flowcharts
    const steps = dataStr.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    data = { nodes: [], edges: [] };
    
    let lastNode = '';
    let currentDecision = '';
    let currentBranchLabel = '';

    steps.forEach((step, i) => {
      const upper = step.toUpperCase();
      
      if (/^(IF\s+)?YES:?$/i.test(step) || /^(YES|TRUE):?$/i.test(step)) {
         currentBranchLabel = 'YES';
         lastNode = currentDecision; 
         return;
      }
      if (/^(IF\s+)?NO:?$/i.test(step) || /^(NO|FALSE):?$/i.test(step)) {
         currentBranchLabel = 'NO';
         lastNode = currentDecision;
         return;
      }

      const id = `n${i}`;
      let type: FlowchartNode['type'] = 'process';
      
      if (i === 0 || upper.includes('[START]') || upper === 'START') type = 'start';
      else if (i === steps.length - 1 || upper.includes('[END]') || upper === 'END') type = 'end';
      else if (upper.includes('INPUT') || upper.includes('USER')) type = 'input';
      else if (upper.includes('OUTPUT') || upper.includes('DISPLAY') || upper.includes('ERROR') || upper.includes('NOTIFY')) type = 'output';
      else if (upper.includes('?') || upper.includes('DECISION') || upper.includes('IF')) {
          type = 'decision';
          currentDecision = id;
      }
      
      const cleanLabel = step.replace(/\[START\]|\[END\]/gi, '').replace(/^(PROCESS|INPUT|OUTPUT|DECISION|START|END):\s*/i, '').trim();
      data.nodes.push({ id, type, label: cleanLabel || step });
      
      if (lastNode) {
        data.edges.push({ from: lastNode, to: id, label: currentBranchLabel || undefined });
      }
      
      lastNode = id;
      currentBranchLabel = '';
    });
  }

  // Normalize JSON (remove rogue "YES"/"NO" nodes returned by AI)
  const nodesToRemove = new Set<string>();
  const newEdges: FlowchartEdge[] = [];
  
  data.nodes.forEach(node => {
    const upperLabel = node.label.toUpperCase().trim();
    if (/^(IF\s+)?(YES|NO):?$/.test(upperLabel) || /^(YES|NO)$/.test(upperLabel)) {
      nodesToRemove.add(node.id);
      const label = upperLabel.includes('YES') ? 'YES' : 'NO';
      
      const inEdges = data.edges.filter(e => e.to === node.id);
      const outEdges = data.edges.filter(e => e.from === node.id);
      
      inEdges.forEach(inE => {
        outEdges.forEach(outE => {
          newEdges.push({ from: inE.from, to: outE.to, label });
        });
      });
    }
  });
  
  if (nodesToRemove.size > 0) {
    data.nodes = data.nodes.filter(n => !nodesToRemove.has(n.id));
    data.edges = data.edges.filter(e => !nodesToRemove.has(e.from) && !nodesToRemove.has(e.to));
    data.edges.push(...newEdges);
  }

  // Layout parameters
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 70;
  const X_SPACING = 300;
  const Y_SPACING = 140;

  // Build adjacency
  const inDegree: Record<string, number> = {};
  data.nodes.forEach(n => { inDegree[n.id] = 0; });
  data.edges.forEach(e => {
    if (inDegree[e.to] !== undefined) {
      inDegree[e.to]++;
    }
  });

  // Assign levels (Y coordinate)
  const levels: Record<string, number> = {};
  data.nodes.forEach(n => levels[n.id] = 0);
  
  // Bellman-Ford style relaxation to find longest path from root
  for (let i = 0; i < data.nodes.length; i++) {
    let changed = false;
    data.edges.forEach(e => {
      if (levels[e.from] !== undefined && levels[e.to] !== undefined) {
        if (levels[e.to] < levels[e.from] + 1) {
          levels[e.to] = levels[e.from] + 1;
          changed = true;
        }
      }
    });
    if (!changed) break;
  }

  // Group by level
  const levelGroups: Record<number, string[]> = {};
  data.nodes.forEach(n => {
    const lvl = levels[n.id] || 0;
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(n.id);
  });

  // Calculate coordinates
  const layoutNodes: LayoutNode[] = [];
  data.nodes.forEach(n => {
    const lvl = levels[n.id] || 0;
    const group = levelGroups[lvl];
    const index = group.indexOf(n.id);
    const totalInLevel = group.length;
    
    // Center alignment for level
    const xOffset = (totalInLevel - 1) * X_SPACING / 2;
    const x = -xOffset + index * X_SPACING;
    const y = lvl * Y_SPACING;

    layoutNodes.push({ ...n, x, y, width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Shift X and Y for padding
  let minX = Math.min(...layoutNodes.map(n => n.x));
  if (layoutNodes.length === 0) minX = 0;
  
  layoutNodes.forEach(n => {
    n.x = n.x - minX + 60; // 60px padding left
    n.y = n.y + 60; // 60px padding top
  });
  
  let maxX = Math.max(...layoutNodes.map(n => n.x));
  let maxY = Math.max(...layoutNodes.map(n => n.y));
  
  const width = Math.max(800, maxX + NODE_WIDTH + 60);
  const height = Math.max(600, maxY + NODE_HEIGHT + 60);

  return { nodes: layoutNodes, edges: data.edges, width, height };
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'start': return <Play className="w-4 h-4 mr-2" />;
    case 'end': return <Flag className="w-4 h-4 mr-2" />;
    case 'input': return <SquareTerminal className="w-4 h-4 mr-2" />;
    case 'decision': return <HelpCircle className="w-4 h-4 mr-2" />;
    case 'output': return <CheckCircle className="w-4 h-4 mr-2" />;
    case 'process':
    default: return <Settings className="w-4 h-4 mr-2" />;
  }
};

const getNodeStyle = (type: string) => {
  const base = "absolute flex items-center justify-center p-3 text-sm font-semibold tracking-wide border-2 shadow-lg transition-transform hover:scale-105 z-10 ";
  switch (type) {
    case 'start':
    case 'end':
      return base + "rounded-full bg-emerald-100 border-emerald-500 text-emerald-800";
    case 'input':
      return base + "rounded-xl bg-blue-100 border-blue-500 text-blue-800 [clip-path:polygon(10%_0%,100%_0%,90%_100%,0%_100%)] px-8";
    case 'decision':
      return base + "rounded-lg bg-amber-100 border-amber-500 text-amber-800 [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] py-6 px-8";
    case 'output':
      return base + "rounded-lg bg-purple-100 border-purple-500 text-purple-800";
    case 'process':
    default:
      return base + "rounded-lg bg-gray-100 border-gray-500 text-gray-800";
  }
};

export const FlowchartRenderer: React.FC<{ data: string }> = ({ data }) => {
  const layout = React.useMemo(() => parseAndLayoutFlowchart(data), [data]);

  return (
    <div className="relative w-full overflow-auto bg-white border border-gray-200 rounded-xl mb-4 shadow-inner" style={{ height: '600px' }}>
      <div style={{ width: layout.width, height: layout.height, position: 'relative', margin: '0 auto' }}>
        
        {/* SVG Layer for Edges */}
        <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>
          {layout.edges.map((edge, i) => {
            const fromNode = layout.nodes.find(n => n.id === edge.from);
            const toNode = layout.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            const startX = fromNode.x + fromNode.width / 2;
            const startY = fromNode.y + fromNode.height;
            const endX = toNode.x + toNode.width / 2;
            const endY = toNode.y;
            
            // Curved path
            const pathD = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;
            
            // Midpoint for label
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={i}>
                <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                {edge.label && (
                  <text x={midX} y={midY - 5} fill="#475569" fontSize="11" fontWeight="bold" textAnchor="middle" className="bg-white">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* DOM Layer for Nodes */}
        {layout.nodes.map((node) => (
          <div
            key={node.id}
            className={getNodeStyle(node.type)}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
            }}
          >
            {getNodeIcon(node.type)}
            <span className="text-center leading-tight overflow-hidden text-ellipsis line-clamp-2">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
