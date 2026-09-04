import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Sun, Moon, Lightbulb, Code, FileText, Presentation, Sparkles, Network, CheckCircle } from 'lucide-react';

export function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Animate only once
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    });

    document.querySelectorAll('.reveal-target').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden relative flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-[#EDEDED] selection:bg-[#333]' : 'bg-[#FDFBF7] text-[#1A1A1A] selection:bg-[#E5E5E5]'}`}>
      
      {/* Global Animation Styles */}
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .reveal-target .reveal-up {
              opacity: 0;
              transform: translateY(24px);
              transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
              transition-delay: var(--delay, 0ms);
            }
            .reveal-target.revealed .reveal-up {
              opacity: 1;
              transform: translateY(0);
            }
            
            .draw-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
            .workflow-node { opacity: 0; transform: translateY(20px); }
            
            .workflow-container.revealed .draw-line {
              animation: drawLine 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .workflow-container.revealed .delay-line-1 { animation-delay: 0.8s; }
            .workflow-container.revealed .delay-line-2 { animation-delay: 1.8s; }
            
            .workflow-container.revealed .workflow-node {
              animation: emergeNode 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .workflow-container.revealed .fade-node-1 { animation-delay: 1.0s; }
            .workflow-container.revealed .fade-node-2 { animation-delay: 1.2s; }
            .workflow-container.revealed .fade-node-3 { animation-delay: 1.4s; }
            .workflow-container.revealed .fade-node-center { 
              animation: emergeNode 1s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulseGlow 4s ease-in-out infinite alternate; 
              animation-delay: 1.8s, 2.8s; 
            }
            .workflow-container.revealed .fade-node-4 { animation-delay: 2.2s; }
            .workflow-container.revealed .fade-node-5 { animation-delay: 2.4s; }
            .workflow-container.revealed .fade-node-6 { animation-delay: 2.6s; }

            @keyframes drawLine { to { stroke-dashoffset: 0; } }
            @keyframes emergeNode { to { opacity: 1; transform: translateY(0); } }
            @keyframes pulseGlow {
              0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
              100% { box-shadow: 0 0 30px 10px rgba(79, 70, 229, 0.1); }
            }
          }
        `}
      </style>

      {/* Subtle Background Grid */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-[0.05]' : 'opacity-[0.03]'}`} 
        style={{
          backgroundImage: `linear-gradient(to right, ${isDark ? '#FFF' : '#000'} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? '#FFF' : '#000'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Top Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10 reveal-target revealed">
        <div className="text-xl font-medium tracking-tight reveal-up font-serif" style={{ '--delay': '100ms' } as React.CSSProperties}>ThinkProject AI</div>
        <div className="flex items-center gap-6 reveal-up" style={{ '--delay': '200ms' } as React.CSSProperties}>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-4 text-xs font-semibold tracking-widest uppercase">
            <a href="#login" className={`transition-colors border-b border-transparent ${isDark ? 'text-gray-400 hover:text-white hover:border-white' : 'text-gray-500 hover:text-black hover:border-black'}`}>
              Sign In
            </a>
            <a href="#signup" className={`transition-colors border-b border-transparent ${isDark ? 'text-gray-400 hover:text-white hover:border-white' : 'text-gray-500 hover:text-black hover:border-black'}`}>
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-12 pb-24 reveal-target revealed">
        <div className="max-w-4xl text-center space-y-10">
          <h1 
            className={`text-6xl md:text-7xl lg:text-[100px] leading-[1.05] tracking-tight transition-colors duration-500 font-serif ${isDark ? 'text-white' : 'text-[#111]'}`}
          >
            <span className="block reveal-up" style={{ '--delay': '300ms' } as React.CSSProperties}>BUILD</span>
            <span className="block reveal-up" style={{ '--delay': '450ms' } as React.CSSProperties}>YOUR PROJECT</span>
            <span className="block reveal-up" style={{ '--delay': '600ms' } as React.CSSProperties}>WITH <span className="italic">CLARITY.</span></span>
          </h1>
          
          <p className={`text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium transition-colors duration-500 reveal-up ${isDark ? 'text-gray-400' : 'text-[#555]'}`} style={{ '--delay': '750ms' } as React.CSSProperties}>
            Plan your engineering project, develop the idea, generate structured documentation, explore recommendations, and turn your work into a complete project workflow with AI.
          </p>

          <div className="pt-8 reveal-up" style={{ '--delay': '900ms' } as React.CSSProperties}>
            <a 
              href="#login"
              className={`group inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-white/5' : 'bg-[#111] text-[#FDFBF7] hover:bg-[#333] shadow-black/10'}`}
            >
              TRY THINKPROJECT
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </main>

      {/* Interactive Workflow Visual */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 pt-20 overflow-hidden reveal-target workflow-container">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className={`text-sm font-bold tracking-widest uppercase reveal-up ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ '--delay': '100ms' } as React.CSSProperties}>
            HOW THINKPROJECT WORKS
          </h2>
          <p className={`text-lg md:text-xl font-medium max-w-2xl mx-auto reveal-up font-serif ${isDark ? 'text-[#EDEDED]' : 'text-[#1A1A1A]'}`} style={{ '--delay': '250ms' } as React.CSSProperties}>
            From the first project idea to structured documentation and presentation.
          </p>
        </div>
        
        {/* Desktop Workflow SVG Structure (Hidden on Mobile) */}
        <div className="hidden lg:flex relative w-full min-h-[600px] flex-col items-center justify-center">
          
          {/* Background SVG Connectors */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 1000 600" className="w-full h-full max-w-[1000px] overflow-visible">
              <defs>
                <linearGradient id="lineGradIn" x1="0%" y1="0%" x2="50%" y2="50%">
                  <stop offset="0%" stopColor={isDark ? '#333' : '#EAEAEA'} />
                  <stop offset="100%" stopColor={isDark ? '#4F46E5' : '#4F46E5'} />
                </linearGradient>
                <linearGradient id="lineGradOut" x1="50%" y1="50%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? '#4F46E5' : '#4F46E5'} />
                  <stop offset="100%" stopColor={isDark ? '#333' : '#EAEAEA'} />
                </linearGradient>
              </defs>

              {/* Input Lines -> Center */}
              <path d="M 500 100 L 500 250" fill="none" stroke="url(#lineGradIn)" strokeWidth="2" className="draw-line delay-line-1" strokeLinecap="round" />
              <path d="M 200 300 L 400 300" fill="none" stroke="url(#lineGradIn)" strokeWidth="2" className="draw-line delay-line-1" strokeLinecap="round" />
              <path d="M 800 300 L 600 300" fill="none" stroke="url(#lineGradIn)" strokeWidth="2" className="draw-line delay-line-1" strokeLinecap="round" />

              {/* Output Lines <- Center */}
              <path d="M 500 350 L 500 450" fill="none" stroke="url(#lineGradOut)" strokeWidth="2" className="draw-line delay-line-2" strokeLinecap="round" />
              <path d="M 500 350 L 500 400 L 300 400 L 300 450" fill="none" stroke="url(#lineGradOut)" strokeWidth="2" className="draw-line delay-line-2" strokeLinecap="round" />
              <path d="M 500 350 L 500 400 L 700 400 L 700 450" fill="none" stroke="url(#lineGradOut)" strokeWidth="2" className="draw-line delay-line-2" strokeLinecap="round" />
            </svg>
          </div>

          {/* HTML Overlay Nodes */}
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Top: 01 IDEATE */}
            <div className={`absolute top-[40px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-1`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-yellow-400' : 'bg-white border-gray-200 text-yellow-500'}`}>
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>01 IDEATE</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Project idea and problem definition</p>
              </div>
            </div>

            {/* Left: 02 DEVELOP */}
            <div className={`absolute left-[50px] top-[260px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-2`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-blue-400' : 'bg-white border-gray-200 text-blue-500'}`}>
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>02 DEVELOP</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Project structure and technical direction</p>
              </div>
            </div>

            {/* Right: 03 RECOMMEND */}
            <div className={`absolute right-[50px] top-[260px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-3`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-purple-400' : 'bg-white border-gray-200 text-purple-500'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>03 RECOMMEND</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>AI-generated suggestions and improvements</p>
              </div>
            </div>

            {/* CENTER: ThinkProject AI Engine */}
            <div className={`absolute top-[250px] flex flex-col items-center justify-center w-[200px] h-[100px] rounded-2xl border shadow-xl workflow-node fade-node-center z-10 ${isDark ? 'bg-[#16181c] border-indigo-500/30' : 'bg-white border-indigo-200'}`}>
              <span className={`text-xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#111]'}`}>ThinkProject AI</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mt-1">
                ENGINE
              </span>
            </div>

            {/* Bottom Left: 04 DOCUMENT */}
            <div className={`absolute left-[200px] bottom-[50px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-4`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-emerald-400' : 'bg-white border-gray-200 text-emerald-500'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>04 DOCUMENT</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Academic report and documentation</p>
              </div>
            </div>

            {/* Bottom Center: 05 VISUALIZE */}
            <div className={`absolute bottom-[50px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-5`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-orange-400' : 'bg-white border-gray-200 text-orange-500'}`}>
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>05 VISUALIZE</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Flowcharts and project visuals</p>
              </div>
            </div>

            {/* Bottom Right: 06 PRESENT */}
            <div className={`absolute right-[200px] bottom-[50px] flex flex-col items-center gap-3 w-[200px] text-center workflow-node fade-node-6`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800 text-rose-400' : 'bg-white border-gray-200 text-rose-500'}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>06 PRESENT</h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Submission-ready material</p>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Workflow Stack (Hidden on Desktop) */}
        <div className="lg:hidden flex flex-col items-center gap-8 mt-8 relative">
          
          <div className={`absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 ${isDark ? 'bg-[#333]' : 'bg-[#EAEAEA]'}`} />
          
          {[
            { id: '01', title: 'IDEATE', desc: 'Project idea and problem definition', icon: Lightbulb, color: isDark ? 'text-yellow-400' : 'text-yellow-500' },
            { id: '02', title: 'DEVELOP', desc: 'Project structure and direction', icon: Code, color: isDark ? 'text-blue-400' : 'text-blue-500' },
            { id: '03', title: 'RECOMMEND', desc: 'AI-generated suggestions', icon: Sparkles, color: isDark ? 'text-purple-400' : 'text-purple-500' },
          ].map((item, idx) => (
            <div key={item.id} className="flex flex-col items-center text-center gap-3 relative z-10 workflow-node fade-node-1 bg-inherit px-4" style={{ animationDelay: `${1.0 + idx * 0.2}s` }}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800' : 'bg-white border-gray-200'} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>{item.id} {item.title}</h3>
                <p className={`text-xs mt-1 font-medium max-w-[200px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Mobile Center Engine */}
          <div className={`relative z-10 flex flex-col items-center justify-center w-[220px] py-6 rounded-2xl border shadow-xl workflow-node fade-node-center bg-inherit ${isDark ? 'bg-[#16181c] border-indigo-500/30' : 'bg-white border-indigo-200'}`}>
            <span className={`text-xl font-bold tracking-tight font-serif ${isDark ? 'text-white' : 'text-[#111]'}`}>ThinkProject AI</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mt-1">
              ENGINE
            </span>
          </div>

          {[
            { id: '04', title: 'DOCUMENT', desc: 'Academic report and documentation', icon: FileText, color: isDark ? 'text-emerald-400' : 'text-emerald-500' },
            { id: '05', title: 'VISUALIZE', desc: 'Flowcharts and visuals', icon: Network, color: isDark ? 'text-orange-400' : 'text-orange-500' },
            { id: '06', title: 'PRESENT', desc: 'Submission-ready material', icon: CheckCircle, color: isDark ? 'text-rose-400' : 'text-rose-500' },
          ].map((item, idx) => (
            <div key={item.id} className="flex flex-col items-center text-center gap-3 relative z-10 workflow-node fade-node-4 bg-inherit px-4" style={{ animationDelay: `${2.2 + idx * 0.2}s` }}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-[#16181c] border-gray-800' : 'bg-white border-gray-200'} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-white' : 'text-[#111]'}`}>{item.id} {item.title}</h3>
                <p className={`text-xs mt-1 font-medium max-w-[200px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary Value Section */}
      <section className={`relative z-10 border-t py-32 text-center px-6 transition-colors duration-500 reveal-target ${isDark ? 'border-[#222] bg-[#0A0A0A]' : 'border-[#EAEAEA] bg-[#FDFBF7]'}`}>
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className={`text-4xl md:text-5xl tracking-tight reveal-up font-serif ${isDark ? 'text-white' : 'text-[#111]'}`} style={{ '--delay': '100ms' } as React.CSSProperties}>
            <span className="block reveal-up" style={{ '--delay': '150ms' } as React.CSSProperties}>FROM FIRST IDEA</span>
            <span className="block italic reveal-up" style={{ '--delay': '300ms' } as React.CSSProperties}>TO FINAL PROJECT.</span>
          </h2>
          <p className={`text-base leading-relaxed font-medium mx-auto max-w-xl reveal-up ${isDark ? 'text-gray-400' : 'text-[#555]'}`} style={{ '--delay': '450ms' } as React.CSSProperties}>
            ThinkProject brings project ideation, documentation, recommendations, architectural flowcharts, and related academic project work into one seamless workspace.
          </p>
          <div className="pt-6 reveal-up" style={{ '--delay': '600ms' } as React.CSSProperties}>
            <a 
              href="#login"
              className={`inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase transition-colors ${isDark ? 'text-white hover:text-gray-400' : 'text-[#111] hover:text-[#555]'}`}
            >
              READY TO BUILD YOUR PROJECT? <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-12 px-6 transition-colors duration-500 ${isDark ? 'border-[#222] bg-[#0A0A0A]' : 'border-[#EAEAEA] bg-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className={`text-lg font-medium font-serif ${isDark ? 'text-white' : 'text-black'}`}>ThinkProject AI</div>
        </div>
      </footer>
    </div>
  );
}
