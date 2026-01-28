
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Loader2, 
  FileUp, 
  MessageSquare, 
  Send,
  Trash2,
  FileText
} from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

// API CONSTANTS
const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const LYZR_API_KEY = 'sk-default-dnznvkXvx9zrt9859ZTv4xOVBFiN4IGW';
const LYZR_AGENT_ID = '696fa434b50537828e0b25c9';
const LYZR_SESSION_ID = '696fa434b50537828e0b25c9-fa188pi9h9q';

const DEPARTMENTS = [
  'General', 'ECE', 'EEE', 'IT', 'CSE', 'CCE', 'AIDS', 'AIML', 
  'BIO TECH', 'BIO MEDICAL', 'CHEMICAL', 'MECHANICAL', 'CIVIL'
];

interface ProjectIdea {
  title: string;
  description: string;
}

interface CategorizedIdeas {
  easy: ProjectIdea[];
  medium: ProjectIdea[];
  advanced: ProjectIdea[];
}

const App: React.FC = () => {
  // Form State
  const [department, setDepartment] = useState('General');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Output States
  const [reportContent, setReportContent] = useState<string>('');
  const [plagiarismContent, setPlagiarismContent] = useState<string>('');
  const [recommendations, setRecommendations] = useState<CategorizedIdeas | null>(null);
  const [historyIdeas, setHistoryIdeas] = useState<string[]>([]);
  const [flowchart, setFlowchart] = useState<string | null>(null);
  
  // Status States
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isImprovingOriginality, setIsImprovingOriginality] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeSection, setActiveSection] = useState<'report' | 'recommendation' | 'flowchart'>('report');
  
  // Feedback States
  const [reportStatus, setReportStatus] = useState('');
  const [plagiarismStatus, setPlagiarismStatus] = useState('');
  const [flowchartStatus, setFlowchartStatus] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const callLyzrAI = async (message: string) => {
    try {
      const response = await fetch(LYZR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LYZR_API_KEY
        },
        body: JSON.stringify({
          user_id: "brijeshmtr2006@gmail.com",
          agent_id: LYZR_AGENT_ID,
          session_id: LYZR_SESSION_ID,
          message: message
        })
      });
      
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.response || "No response content found.";
    } catch (error) {
      console.error('Lyzr API Error:', error);
      return "Error: Could not connect to the academic agent.";
    }
  };

  const parseFile = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (fileType === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText.trim();
    } else {
      return await file.text();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      alert("The uploaded file is empty.");
      return;
    }

    setIsParsing(true);
    try {
      const text = await parseFile(file);
      if (!text.trim()) {
        alert("Extraction failed: The file contains no readable text.");
        return;
      }
      setAbstract(text);
      setFileName(file.name);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to extract text from this file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearAbstract = () => {
    setAbstract('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateReport = async () => {
    const sourceContent = abstract.trim() ? abstract.trim() : (projectTitle.trim() + " " + projectDescription.trim()).trim();
    
    if (!sourceContent) {
      alert("Please provide a project title or description, or upload an abstract first.");
      return;
    }

    setIsLoading(true);
    setActiveSection('report');
    
    setReportStatus(abstract.trim() ? "Generating report from uploaded abstract..." : "Generating report...");

    const prompt = `Generate a comprehensive academic engineering report.
    Source Data: ${sourceContent}
    Department: ${department}

    MANDATORY IEEE-STYLE REPORT HEADINGS AND ORDER:
    1. ABSTRACT
    2. KEYWORDS
    3. 1. INTRODUCTION
    4. 2. PROBLEM STATEMENT
    5. 3. OBJECTIVES OF THE PROJECT
    6. 4. LITERATURE REVIEW
    7. 5. PROPOSED SYSTEM
    8. 6. SYSTEM ARCHITECTURE
    9. 7. METHODOLOGY
    10. 8. FLOWCHART DESCRIPTION
    11. 9. TECHNOLOGIES USED
    12. 10. IMPLEMENTATION DETAILS
    13. 11. RESULTS AND DISCUSSION
    14. 12. APPLICATIONS
    15. 13. ADVANTAGES
    16. 14. LIMITATIONS
    17. 15. FUTURE ENHANCEMENTS
    18. 16. CONCLUSION
    19. REFERENCES

    STRICT CONTENT AND FORMATTING RULES:
    - For EVERY heading listed above, you MUST write at least TWO well-structured paragraphs.
    - Each paragraph MUST consist of exactly 4 to 6 complete, meaningful, and professional sentences.
    - For 19. REFERENCES: Generate exactly 5 REALISTIC engineering references in IEEE format relevant to the topic. 
      Format: [1] Author, "Paper Title," Journal Name, vol. X, no. X, pp. XX–XX, Year. 
      DO NOT use bracket instructions or placeholders like [Insert name].
    - DO NOT use bullet points or markdown symbols like ** or #.
    - Use ONLY plain text. NO markdown formatting.
    
    IMPORTANT: AFTER the report content, add this separator: [PLAGIARISM_ANALYSIS_START]
    
    Then provide a SEPARATE section: 
    AI PLAGIARISM AND ORIGINALITY ANALYSIS:
    - Originality Score: (e.g., 94%)
    - AI Similarity Risk: (Low/Medium/High)
    - Linguistic Analysis: (Detailed observation)
    - Suggestions to Improve Originality: (List of actionable steps)
    - Final Verdict: (Final academic standing)
    
    Ensure the tones are formal. Output EVERYTHING requested using ONLY the LYZR API logic.`;
    
    try {
      const result = await callLyzrAI(prompt);
      const separator = "[PLAGIARISM_ANALYSIS_START]";
      const parts = result.split(separator);
      
      if (parts.length > 1) {
        setReportContent(parts[0].trim());
        setPlagiarismContent(parts[1].trim());
      } else {
        setReportContent(result);
        setPlagiarismContent("AI PLAGIARISM AND ORIGINALITY ANALYSIS:\nAnalysis not found in response. Please regenerate.");
      }
      setReportStatus('');
    } catch (error) {
      alert("API Error: Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestIdeas = async () => {
    setIsLoading(true);
    setActiveSection('recommendation');
    
    const avoidList = historyIdeas.slice(-50).join(', ');
    const prompt = `Using LYZR API logic, provide exactly 15 unique project recommendations for the ${department} department.
    CATEGORIES:
    EASY PROJECTS (5 ideas)
    MEDIUM PROJECTS (5 ideas)
    ADVANCED PROJECTS (5 ideas)

    For EACH category, provide exactly 5 ideas in the following strict format:
    [Number]. Title: [Formal Academic Title] | Description: [2-line comprehensive academic explanation of the concept]
    
    Avoid: ${avoidList}. Use ONLY plain text. NO markdown. Ensure descriptions are 4-6 sentences long internally for each idea even if the summary is 2 lines.`;
    
    try {
      const result = await callLyzrAI(prompt);
      const lines = result.split('\n').filter(l => l.trim().length > 0);
      const easy: ProjectIdea[] = [];
      const medium: ProjectIdea[] = [];
      const advanced: ProjectIdea[] = [];
      
      let currentCat: 'easy' | 'medium' | 'advanced' | null = null;
      lines.forEach((line: string) => {
        const upper = line.toUpperCase();
        if (upper.includes('EASY')) currentCat = 'easy';
        else if (upper.includes('MEDIUM')) currentCat = 'medium';
        else if (upper.includes('ADVANCED')) currentCat = 'advanced';
        else if (currentCat) {
          const parts = line.split('|');
          if (parts.length >= 1) {
            const titlePart = parts[0].replace(/^\d+\.\s*/, '').replace(/Title:\s*/i, '').trim();
            const descPart = parts[1] ? parts[1].replace(/Description:\s*/i, '').trim() : "Academic engineering project exploration.";
            if (titlePart) {
              const idea = { title: titlePart, description: descPart };
              if (currentCat === 'easy' && easy.length < 5) easy.push(idea);
              else if (currentCat === 'medium' && medium.length < 5) medium.push(idea);
              else if (currentCat === 'advanced' && advanced.length < 5) advanced.push(idea);
            }
          }
        }
      });

      if (easy.length === 0 && medium.length === 0 && advanced.length === 0) {
        throw new Error("Parsing failed");
      }

      setRecommendations({ easy, medium, advanced });
      setHistoryIdeas(prev => [...prev, ...easy.map(i => i.title), ...medium.map(i => i.title), ...advanced.map(i => i.title)]);
    } catch (error) {
      alert("Failed to suggest ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueIdea = async (ideaTitle: string) => {
    setProjectTitle(ideaTitle);
    setProjectDescription('');
    setIsGeneratingDesc(true);
    // Stay on current tab as per UI rules
    const prompt = `Using LYZR API logic, generate a comprehensive academic project description for: "${ideaTitle}". 
    Structure: Background, Problem Statement, Objectives, and Technical Components.
    Write at least TWO paragraphs for each section. No markdown. Plain text only.`;
    const result = await callLyzrAI(prompt);
    setProjectDescription(result);
    setIsGeneratingDesc(false);
  };

  const handleImproveOriginality = async () => {
    if (!reportContent || !plagiarismContent) return;
    
    const suggestionMarker = "Suggestions to Improve Originality";
    let extractedSuggestions = "";
    const index = plagiarismContent.indexOf(suggestionMarker);
    if (index !== -1) {
      extractedSuggestions = plagiarismContent.substring(index).trim();
    } else {
      extractedSuggestions = plagiarismContent;
    }

    setIsImprovingOriginality(true);
    
    const prompt = `You are an academic writing expert using LYZR API logic. 
    TASK: PERFORM A COMPLETE REWRITE OF THE ENTIRE REPORT FROM SCRATCH. 
    REPLACE EVERY SENTENCE TO IMPROVE ORIGINALITY WHILE PRESERVING ALL TECHNICAL FACTS.

    CONSTRAINTS:
    - Strictly maintain IEEE heading structure and order (ABSTRACT to REFERENCES).
    - Under EVERY heading, write at least TWO well-structured paragraphs (4-6 sentences each).
    - Use formal scholarly language. NO bullet points. NO markdown like ** or #.
    - Apply these specific suggestions: ${extractedSuggestions}

    ORIGINAL REPORT TO REWRITE:
    ${reportContent}

    IMPORTANT: AFTER the rewritten report, add exactly this separator: [PLAGIARISM_ANALYSIS_START]
    
    Then provide a COMPLETELY FRESH section: 
    AI PLAGIARISM AND ORIGINALITY ANALYSIS:
    - Originality Score: (Fresh assessment)
    - AI Similarity Risk: (Fresh assessment)
    - Linguistic Analysis: (Detailed look at rewritten text)
    - Suggestions to Improve Originality: (New remaining suggestions)
    - Final Verdict: (Fresh academic standing)

    Output ONLY the rewritten content and fresh analysis. DO NOT append old text.`;

    try {
      const result = await callLyzrAI(prompt);
      const separator = "[PLAGIARISM_ANALYSIS_START]";
      const parts = result.split(separator);

      if (parts.length > 1) {
        // STRICT OVERWRITE LOGIC
        setReportContent(parts[0].trim());
        setPlagiarismContent(parts[1].trim());
        setReportStatus('Originality improved. Report rewritten and re-analyzed by LYZR AI.');
        setTimeout(() => setReportStatus(''), 4000);
      } else {
        throw new Error("Rewrite response parsing failed");
      }
    } catch (error) {
      alert("Failed to rewrite report. Please try again.");
    } finally {
      setIsImprovingOriginality(false);
    }
  };

  const handleGenerateFlowchart = async () => {
    if (!projectTitle && !abstract) {
      alert("Project title or abstract required.");
      return;
    }
    setIsLoading(true);
    setActiveSection('flowchart');
    const source = abstract.trim() || projectTitle;
    const prompt = `Using LYZR API logic, provide exactly 6-10 sequential logical steps for a technical flowchart for the project based on: "${source}". 
    Rules:
    - Provide exactly one logical step per line.
    - Start with [START] and end with [END].
    - Use clear engineering logic (Input, Process, Decision, Output).
    - No markdown symbols, no bullets, no arrows. Just plain text steps.
    - Output ONLY the sequential steps.`;
    const result = await callLyzrAI(prompt);
    setFlowchart(result);
    setIsLoading(false);
  };

  const copyFlowchart = async () => {
    if (!flowchart) return;
    try {
      await navigator.clipboard.writeText(flowchart);
      setFlowchartStatus('Flowchart steps copied.');
      setTimeout(() => setFlowchartStatus(''), 4000);
    } catch (err) { alert('Copy failed.'); }
  };

  const downloadFlowchart = () => {
    if (!flowchart) return;
    const steps = flowchart.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockWidth = 280;
    const blockHeight = 60;
    const margin = 40;
    const padding = 50;

    canvas.width = blockWidth + (padding * 2);
    canvas.height = (steps.length * blockHeight) + ((steps.length - 1) * margin) + (padding * 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    steps.forEach((step, i) => {
      const x = padding;
      const y = padding + (i * (blockHeight + margin));

      ctx.strokeRect(x, y, blockWidth, blockHeight);
      
      const words = step.split(' ');
      let line = '';
      let lines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > blockWidth - 20 && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      lines.forEach((l, idx) => {
        ctx.fillText(l.trim(), x + blockWidth / 2, y + (blockHeight / 2) - ((lines.length - 1) * 8) + (idx * 16));
      });

      if (i < steps.length - 1) {
        const arrowX = x + blockWidth / 2;
        const arrowYStart = y + blockHeight;
        const arrowYEnd = arrowYStart + margin;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowYStart);
        ctx.lineTo(arrowX, arrowYEnd);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(arrowX - 6, arrowYEnd - 8);
        ctx.lineTo(arrowX + 6, arrowYEnd - 8);
        ctx.lineTo(arrowX, arrowYEnd);
        ctx.fill();
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'ThinkProject_Flowchart.png';
    link.click();
    setFlowchartStatus('Flowchart image downloaded.');
    setTimeout(() => setFlowchartStatus(''), 4000);
  };

  const copyReport = async () => {
    if (!reportContent) return;
    try {
      await navigator.clipboard.writeText(reportContent);
      setReportStatus('Report copied successfully.');
      setTimeout(() => setReportStatus(''), 4000);
    } catch (err) { alert('Copy failed.'); }
  };

  const copyPlagiarism = async () => {
    if (!plagiarismContent) return;
    try {
      await navigator.clipboard.writeText(plagiarismContent);
      setPlagiarismStatus('Analysis copied successfully.');
      setTimeout(() => setPlagiarismStatus(''), 4000);
    } catch (err) { alert('Copy failed.'); }
  };

  const downloadWord = () => {
    if (!reportContent) return;
    const header = `<html><head><style>body { font-family: 'Times New Roman', serif; }</style></head><body>`;
    const body = reportContent.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '<br>').join('');
    const blob = new Blob([header + body + '</body></html>'], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ThinkProject_Report.doc';
    link.click();
    setReportStatus('Word report downloaded successfully.');
    setTimeout(() => setReportStatus(''), 4000);
  };

  const downloadPDF = () => {
    if (!reportContent) return;
    const pdfData = `%PDF-1.4\n1 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n2 0 obj\n<< /Type /Page /Parent 3 0 R /Resources << /Font << /F1 1 0 R >> >> /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [2 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Length ${reportContent.length + 50} >>\nstream\nBT /F1 12 Tf 50 800 Td 15 TL\n${reportContent.split('\n').map(l => `(${l.substring(0, 90).replace(/[()]/g, '')}) Tj T*`).join('\n')}\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\ntrailer\n<< /Size 6 /Root 5 0 R >>\n%%EOF`;
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ThinkProject_Report.pdf';
    link.click();
    setReportStatus('PDF report downloaded successfully.');
    setTimeout(() => setReportStatus(''), 4000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    const aiResponse = await callLyzrAI(`Using LYZR API logic, answer the following technical question: ${userMsg}`);
    setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsChatLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-[#0f1115] text-[#e5e7eb]">
      {isImprovingOriginality && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <p className="text-white font-bold uppercase tracking-widest animate-pulse text-center px-6">Rewriting report and refreshing analysis...</p>
        </div>
      )}

      <header className="w-full max-w-5xl text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          ThinkProject AI
        </h1>
        <p className="text-[11px] md:text-xs text-gray-400 uppercase tracking-[0.4em] mt-1 font-medium">An Intelligent Academic Project Assistant</p>
        <p className="text-green-500 font-bold text-xl md:text-2xl mt-4 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">by BRIJESH BALAJI</p>
      </header>

      <main className="w-full max-w-4xl space-y-10 pb-24">
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-[#1e1f20] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-white">
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className={`flex flex-col gap-4 transition-opacity duration-300 ${abstract ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Project Title</label>
                <input ref={titleInputRef} type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Enter formal project title..." className="bg-[#1e1f20] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-white" />
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Project Description</label>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Provide context or project details..." className="bg-[#1e1f20] border border-gray-700 rounded-xl px-4 py-3 min-h-[120px] text-white outline-none focus:ring-1 focus:ring-white" />
                {isGeneratingDesc && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-xs uppercase animate-pulse">Generating context...</div>}
              </div>
            </div>

            <div className="p-6 border-2 border-dashed border-gray-700 rounded-2xl bg-[#1e1f20] text-center">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              
              {!abstract ? (
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 group mx-auto">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <FileUp className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors" />
                  )}
                  <span className="text-xs font-bold uppercase text-gray-500 group-hover:text-white tracking-widest transition-colors">
                    {isParsing ? "Extracting Text..." : "Upload Abstract"}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 text-green-500 font-bold uppercase text-xs tracking-widest">
                    <FileText className="w-5 h-5" />
                    <span>{fileName || "Document Loaded"}</span>
                  </div>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={handleClearAbstract} 
                      className="flex-1 bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-white font-bold py-2 rounded-lg uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                    <button 
                      onClick={handleGenerateReport} 
                      disabled={isLoading}
                      className="flex-1 bg-white text-black font-bold py-2 rounded-lg uppercase tracking-widest text-[10px] transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Generate Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={handleGenerateReport} 
              disabled={isLoading || !!abstract} 
              className={`flex-1 bg-[#2d2f31] text-white font-bold py-4 rounded-xl border border-gray-700 uppercase tracking-widest text-xs h-14 disabled:opacity-30 hover:bg-white hover:text-black flex items-center justify-center transition-all ${!!abstract ? 'cursor-not-allowed' : ''}`}
            >
              {isLoading && activeSection === 'report' ? <Loader2 className="animate-spin mr-2" /> : "Generate Report"}
            </button>
            <button onClick={handleSuggestIdeas} disabled={isLoading} className="flex-1 bg-[#2d2f31] text-white font-bold py-4 rounded-xl border border-gray-700 uppercase tracking-widest text-xs h-14 disabled:opacity-50 hover:bg-white hover:text-black flex items-center justify-center transition-all">
              {isLoading && activeSection === 'recommendation' ? <Loader2 className="animate-spin mr-2" /> : "Suggest Ideas"}
            </button>
            <button onClick={handleGenerateFlowchart} disabled={isLoading} className="flex-1 bg-[#2d2f31] text-white font-bold py-4 rounded-xl border border-gray-700 uppercase tracking-widest text-xs h-14 disabled:opacity-50 hover:bg-white hover:text-black flex items-center justify-center transition-all">
              {isLoading && activeSection === 'flowchart' ? <Loader2 className="animate-spin mr-2" /> : "Flowchart"}
            </button>
          </div>
        </section>

        <section className="bg-white text-black rounded-2xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex border-b border-gray-100 bg-gray-50">
            {['report', 'recommendation', 'flowchart'].map(sec => (
              <button key={sec} onClick={() => setActiveSection(sec as any)} className={`flex-1 px-4 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeSection === sec ? 'text-black border-b-2 border-black bg-white' : 'text-gray-400'}`}>
                {sec}
              </button>
            ))}
          </div>

          <div className="p-8 flex-1 overflow-y-auto font-serif text-sm leading-relaxed">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-300 uppercase tracking-widest font-bold text-xs">
                <Loader2 className="animate-spin mb-4" /> 
                {reportStatus || "Processing..."}
              </div>
            ) : (
              <>
                {activeSection === 'report' && (
                  <div>
                    {reportContent ? (
                      <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="whitespace-pre-wrap">{reportContent}</div>
                        <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                          <button onClick={copyReport} className="text-[10px] font-bold uppercase border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all">Copy Report</button>
                          <div className="flex gap-4">
                            <button onClick={downloadWord} className="text-[10px] font-bold uppercase border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all">Download Word</button>
                            <button onClick={downloadPDF} className="text-[10px] font-bold uppercase border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all">Download PDF</button>
                          </div>
                        </div>
                        {reportStatus && <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">{reportStatus}</p>}
                        
                        {plagiarismContent && (
                          <div className="mt-12 p-10 border-t-2 border-gray-200 space-y-10 bg-white">
                            <div className="whitespace-pre-wrap text-[16px] text-black leading-relaxed font-normal">
                              {plagiarismContent}
                            </div>
                            <div className="flex items-center gap-4 pt-4">
                              <button onClick={handleImproveOriginality} disabled={isImprovingOriginality} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all disabled:opacity-50">Improve Originality</button>
                              <button onClick={copyPlagiarism} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all">Copy Analysis</button>
                            </div>
                            {plagiarismStatus && <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">{plagiarismStatus}</p>}
                          </div>
                        )}
                      </div>
                    ) : <p className="text-center py-20 text-gray-400 italic">No report generated.</p>}
                  </div>
                )}

                {activeSection === 'recommendation' && (
                  <div className="space-y-8 animate-in fade-in duration-700">
                    {recommendations ? (
                      <div className="space-y-12">
                        {['easy', 'medium', 'advanced'].map(cat => (
                          <div key={cat} className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] border-b-2 border-black inline-block pb-1 mb-4">{cat} Projects</h3>
                            <div className="space-y-8 pl-4 border-l-2 border-gray-100">
                              {recommendations[cat as keyof CategorizedIdeas].map((idea, idx) => (
                                <div key={idx} className="space-y-2 pb-6 border-b border-gray-50 last:border-0">
                                  <p className="font-bold text-sm leading-tight text-black">{idx + 1}. {idea.title}</p>
                                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{idea.description}</p>
                                  <button onClick={() => handleContinueIdea(idea.title)} className="mt-3 text-[9px] font-bold uppercase underline tracking-widest hover:text-black transition-colors block">Continue Idea</button>
                                </div>
                              ))}
                              {recommendations[cat as keyof CategorizedIdeas].length === 0 && (
                                <p className="text-xs text-gray-400 italic">No ideas found in this category.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-gray-400 italic text-sm">No suggestions loaded yet.</p>
                        <button onClick={handleSuggestIdeas} className="text-xs font-bold uppercase border border-black px-8 py-3 hover:bg-black hover:text-white transition-all">Explore Ideas</button>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'flowchart' && (
                  <div className="flex flex-col items-center animate-in fade-in duration-700">
                    {flowchart ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="flex flex-col items-center gap-4 py-8 w-full bg-white border border-gray-200 rounded-xl mb-4">
                          {flowchart.split('\n').map(s => s.trim()).filter(s => s.length > 0).map((step, i, arr) => (
                            <React.Fragment key={i}>
                              <div className="border-2 border-black p-4 w-72 text-center font-bold uppercase text-[11px] tracking-widest bg-white shadow-sm">
                                {step}
                              </div>
                              {i < arr.length - 1 && (
                                <div className="h-10 w-0.5 bg-black relative">
                                  <div className="absolute bottom-0 -left-[5px] border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-black"></div>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        
                        <p className="mb-8 text-[13px] text-gray-700 italic text-center max-w-lg font-medium leading-relaxed">
                          This flowchart illustrates the system design and operational flow, suitable for inclusion in the System Design section of the academic report.
                        </p>

                        <div className="flex gap-4 w-full">
                          <button onClick={copyFlowchart} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-4 hover:bg-black hover:text-white transition-all">Copy Flowchart</button>
                          <button onClick={downloadFlowchart} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-4 hover:bg-black hover:text-white transition-all">Download Flowchart</button>
                        </div>
                        {flowchartStatus && <p className="mt-4 text-[9px] font-bold text-green-600 uppercase tracking-widest">{flowchartStatus}</p>}
                      </div>
                    ) : <p className="text-center py-20 text-gray-400 italic">No flowchart available.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Floating Chatbot */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all ${isChatOpen ? 'w-[350px] h-[500px]' : 'w-14 h-14'}`}>
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-full h-full bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-full h-full bg-[#1e1f20] border border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#2d2f31] flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-white tracking-widest">LYZR AI Assistant</span>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#161718] text-[11px]">
              {chatMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl max-w-[85%] ${m.role === 'user' ? 'bg-white text-black ml-auto' : 'bg-[#2d2f31] text-white'}`}>
                  {m.content}
                </div>
              ))}
              {isChatLoading && <Loader2 className="animate-spin w-4 h-4 text-gray-500" />}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-[#1e1f20] border-t border-gray-700 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} type="text" placeholder="Ask a question..." className="flex-1 bg-transparent text-xs outline-none text-white px-2" />
              <button onClick={handleSendMessage} className="bg-white text-black p-2 rounded-lg"><Send className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full text-center py-10 text-gray-600 text-[10px] tracking-[0.2em] uppercase font-bold border-t border-gray-800 mt-auto">
        ThinkProject AI Framework • {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
