import React, { useEffect, useState, useRef } from 'react';
import { Plus, Lightbulb, History, FileText, Layers, GitCommit, ArrowRight, Sparkles, Code, Network } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { navigate } from '../lib/navigation';

interface DashboardProps {
  session: Session;
  historyReports: any[];
  fetchHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  session,
  historyReports,
  fetchHistory
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    const timer = setTimeout(() => setIsRevealed(true), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use the same intersection observer logic for scroll reveals as LandingPage
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    });

    if (containerRef.current) {
      containerRef.current.querySelectorAll('.reveal-target').forEach((el) => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, []);

  const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'there';

  return (
    <div ref={containerRef} className="w-full relative min-h-screen text-left flex flex-col items-center">
      
      {/* Reusing Landing Page Animation Styles */}
      <style>
        {`
          @media (prefers-reduced-motion: no-preference) {
            .dashboard-reveal .reveal-up,
            .reveal-target .reveal-up {
              opacity: 0;
              transform: translateY(24px);
              transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
              transition-delay: var(--delay, 0ms);
            }
            .dashboard-reveal.revealed .reveal-up,
            .reveal-target.revealed .reveal-up {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>



      <div className={`dashboard-reveal w-full max-w-5xl mx-auto flex flex-col gap-16 py-12 relative z-10 ${isRevealed ? 'revealed' : ''}`}>
        
        {/* Welcome Section */}
        <section className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white font-serif leading-[1.1]">
            <span className="block reveal-up" style={{ '--delay': '100ms' } as React.CSSProperties}>Good afternoon,</span>
            <span className="block reveal-up" style={{ '--delay': '250ms' } as React.CSSProperties}>{userName}.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium reveal-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
            What are you building today?
          </p>
        </section>

        {/* Primary Action */}
        <section className="reveal-up" style={{ '--delay': '550ms' } as React.CSSProperties}>
          <button
            onClick={() => navigate('#/create')}
            className="group w-full relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12 rounded-3xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/5 hover:shadow-2xl hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-500 overflow-hidden text-left hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/20 dark:group-hover:bg-white/10 transition-colors duration-700"></div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105">
              <Plus size={32} />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight mb-2">CREATE YOUR IDEA</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                Start a new engineering project. Define your requirements and let ThinkProject AI generate structured documentation, architecture, and recommendations.
              </p>
            </div>

            <div className="hidden md:flex shrink-0 w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 items-center justify-center text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-[#222] group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-500">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
            </div>
          </button>
        </section>

        {/* Quick Access */}
        <section className="reveal-up" style={{ '--delay': '700ms' } as React.CSSProperties}>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lightbulb, title: 'Suggest Ideas', desc: 'Explore tailored projects.', onClick: () => navigate('#/create?suggest=true'), color: 'text-yellow-500' },
              { icon: History, title: 'History', desc: 'Open previous projects.', onClick: () => navigate('#/history'), color: 'text-indigo-500' },
              { icon: FileText, title: 'Reports', desc: 'Access documentation.', onClick: () => navigate('#/reports'), color: 'text-emerald-500' },
              { icon: Network, title: 'Flowcharts', desc: 'Project visualizations.', onClick: () => navigate('#/flowcharts'), color: 'text-rose-500' }
            ].map((item, idx) => (
              <button 
                key={idx} 
                onClick={item.onClick} 
                className="group flex flex-col gap-4 p-6 rounded-2xl bg-white/50 dark:bg-[#111]/50 border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-[#16181c] transition-all duration-500 text-left hover:shadow-lg shadow-black/5 hover:-translate-y-1"
              >
                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-[#1e1f20] border border-gray-100 dark:border-gray-800 inline-block w-fit ${item.color} group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1.5 font-medium">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Projects (Scroll Reveal) */}
        <section className="reveal-target pt-8">
          <div className="flex justify-between items-end mb-6 reveal-up" style={{ '--delay': '100ms' } as React.CSSProperties}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Recent Projects</h3>
            <button onClick={() => navigate('#/history')} className="text-xs font-semibold text-gray-900 dark:text-white border-b border-transparent hover:border-gray-900 dark:hover:border-white transition-colors pb-0.5">
              View All History
            </button>
          </div>
          
          {historyReports.length === 0 ? (
            <div className="p-12 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-[#111]/30 flex flex-col items-center justify-center text-center reveal-up" style={{ '--delay': '250ms' } as React.CSSProperties}>
              <div className="text-3xl mb-4 grayscale opacity-50">🌱</div>
              <h4 className="text-lg font-serif font-medium text-gray-900 dark:text-white mb-2">Nothing here yet</h4>
              <p className="text-sm text-gray-500 font-medium mb-8">Your saved projects will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {historyReports.slice(0, 3).map((report, idx) => (
                <button 
                  key={report.id || idx}
                  onClick={() => navigate(`#/project/${report.id}?section=report`)}
                  className={`group flex flex-col items-start p-6 rounded-3xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-500 text-left reveal-up hover:-translate-y-1`}
                  style={{ '--delay': `${200 + (idx * 150)}ms` } as React.CSSProperties}
                >
                  <div className="w-full flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-[#1e1f20] text-gray-600 dark:text-gray-300 rounded uppercase tracking-wider">
                      {report.department || 'Project'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                      {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white font-serif line-clamp-2 leading-snug mb-3">
                    {report.project_title || 'Untitled Project'}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-auto">
                    {report.project_description || report.abstract || 'No description provided.'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Project Journey (Scroll Reveal) */}
        <section className="reveal-target pt-12 mb-24">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-10 text-center reveal-up" style={{ '--delay': '100ms' } as React.CSSProperties}>Your Project Journey</h3>
          
          <div className="relative flex flex-col md:flex-row justify-between w-full max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200 dark:bg-gray-800 -z-10 -translate-y-1/2 reveal-up" style={{ '--delay': '200ms' } as React.CSSProperties}></div>
            
            {[
              { num: '01', title: 'IDEATE', icon: Lightbulb },
              { num: '02', title: 'DEVELOP', icon: Code },
              { num: '03', title: 'RECOMMEND', icon: Sparkles },
              { num: '04', title: 'DOCUMENT', icon: FileText },
              { num: '05', title: 'VISUALIZE', icon: Network },
              { num: '06', title: 'PRESENT', icon: Layers }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="flex md:flex-col items-center gap-6 md:gap-4 p-4 md:p-0 bg-transparent reveal-up"
                style={{ '--delay': `${300 + (idx * 150)}ms` } as React.CSSProperties}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gray-50 dark:bg-[#1e1f20] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 relative z-10">{step.num}</span>
                  <step.icon size={16} className="text-gray-900 dark:text-white mt-1 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={2} />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
