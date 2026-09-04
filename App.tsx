import React, { useState, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Settings as SettingsComponent } from './components/Settings';
import { FlowchartRenderer, parseAndLayoutFlowchart } from './components/FlowchartRenderer';
import { 
  ChevronDown, 
  Loader2, 
  FileUp, 
  MessageSquare, 
  Send,
  Trash2,
  FileText,
  User, 
  LogOut, 
  Settings, 
  RefreshCw, 
  Plus, 
  Lightbulb,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';
import { navigate } from './lib/navigation';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';
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

interface ReportHistoryItem {
  id: string;
  created_at: string;
  project_title: string;
  department: string;
  project_description: string;
  abstract: string;
  report_content: string;
  plagiarism_content: string;
  recommendations: CategorizedIdeas | null;
  flowchart_data: string | null;
  report_downloaded_at: string | null;
}

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Form State
  const [department, setDepartment] = useState('General');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [reportFormat, setReportFormat] = useState('Standard');
  const [explanationLevel, setExplanationLevel] = useState('Intermediate');
  const [specificRequirements, setSpecificRequirements] = useState('');
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
  
  // History State
  const [viewMode, setViewMode] = useState<'dashboard' | 'main' | 'history' | 'reports' | 'flowcharts' | 'settings'>('dashboard');
  const [highlightSuggestIdeas, setHighlightSuggestIdeas] = useState(false);
  const [historyReports, setHistoryReports] = useState<ReportHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleRouting = async () => {
      const hash = window.location.hash;
      setCurrentHash(hash);
      
      const [pathPart, queryPart] = hash.split('?');
      const params = new URLSearchParams(queryPart || '');

      // Auth protection & Normalization
      if (!session) {
        if (pathPart !== '#login' && pathPart !== '#signup' && pathPart !== '' && pathPart !== '#/') {
          navigate('#login', true);
          return;
        }
      } else {
        if (pathPart === '#login' || pathPart === '#signup' || pathPart === '' || pathPart === '#/') {
          navigate('#/home', true);
          return;
        }
      }

      if (!session) return; // Let auth wrapper handle unauthenticated state

      // Map Route to State
      if (pathPart === '#/home') {
        setViewMode('dashboard');
      } else if (pathPart === '#/history') {
        setViewMode('history');
        fetchHistory();
      } else if (pathPart === '#/reports') {
        setViewMode('reports');
        fetchHistory();
      } else if (pathPart === '#/flowcharts') {
        setViewMode('flowcharts');
        fetchHistory();
      } else if (pathPart === '#/settings') {
        setViewMode('settings');
      } else if (pathPart === '#/create') {
        handleNewReportRoute(params.get('suggest') === 'true');
      } else if (pathPart.startsWith('#/project/')) {
        const id = pathPart.replace('#/project/', '');
        const section = (params.get('section') as 'report' | 'flowchart' | 'recommendation') || 'report';
        await loadProjectRoute(id, section);
      }
    };

    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);
    
    handleRouting(); // Execute on mount

    return () => {
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('hashchange', handleRouting);
    };
  }, [session]); // Re-evaluate when session changes

  const loadProjectRoute = async (id: string, section: 'report' | 'flowchart' | 'recommendation') => {
    try {
      const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
      if (data) {
        const report = data as ReportHistoryItem;
        setCurrentReportId(report.id);
        setProjectTitle(report.project_title || '');
        setDepartment(report.department || 'General');
        setProjectDescription(report.project_description || '');
        setAbstract(report.abstract || '');
        setReportContent(report.report_content || '');
        setPlagiarismContent(report.plagiarism_content || '');
        setRecommendations(report.recommendations || null);
        setFlowchart(report.flowchart_data || null);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveSection(section);
        setViewMode('main');
        setHighlightSuggestIdeas(false);
      } else {
        navigate('#/home', true);
      }
    } catch (e) {
      navigate('#/home', true);
    }
  };

  const handleNewReportRoute = (highlightSuggest: boolean = false) => {
    setCurrentReportId(null);
    setProjectTitle('');
    setDepartment('General');
    setProjectDescription('');
    setReportFormat('Standard');
    setExplanationLevel('Intermediate');
    setSpecificRequirements('');
    setAbstract('');
    setFileName('');
    setReportContent('');
    setPlagiarismContent('');
    setRecommendations(null);
    setFlowchart(null);
    setHistoryIdeas([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveSection('report');
    setViewMode('main');
    setHighlightSuggestIdeas(highlightSuggest);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);



  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setDepartment('General');
        setProjectTitle('');
        setProjectDescription('');
        setReportFormat('Standard');
        setExplanationLevel('Intermediate');
        setSpecificRequirements('');
        setAbstract('');
        setFileName('');
        setReportContent('');
        setPlagiarismContent('');
        setRecommendations(null);
        setHistoryIdeas([]);
        setFlowchart(null);
        setReportStatus('');
        setPlagiarismStatus('');
        setFlowchartStatus('');
        setChatMessages([]);
        setChatInput('');
        setViewMode('dashboard');
        setHistoryReports([]);
        setCurrentReportId(null);
        window.location.hash = '';

      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      // Load synced settings from Supabase metadata
      const prefs = session.user.user_metadata?.thinkproject_prefs;
      if (prefs) {
        if (prefs.department) setDepartment(prefs.department);
        if (prefs.reportFormat) setReportFormat(prefs.reportFormat);
        if (prefs.explanationLevel) setExplanationLevel(prefs.explanationLevel);
        if (prefs.requirements !== undefined) setSpecificRequirements(prefs.requirements);
      }

      const syncProfile = async () => {
        try {
          const metadata = session.user.user_metadata || {};
          const metaName = metadata.full_name || metadata.name || '';
          const metaAvatar = metadata.avatar_url || metadata.picture || '';

          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;

          if (!profile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                full_name: metaName,
                avatar_url: metaAvatar
              });
              
          } else {
            const updates: any = {};
            if (!profile.full_name && metaName) updates.full_name = metaName;
            if (!profile.avatar_url && metaAvatar) updates.avatar_url = metaAvatar;

            if (Object.keys(updates).length > 0) {
              await supabase
                .from('profiles')
                .update(updates)
                .eq('id', session.user.id);
            }


          }
        } catch (err) {
          console.error("Profile sync error:", err);
          const metadata = session.user.user_metadata || {};
        }
      };
      syncProfile();
    }
  }, [session]);

  const fetchHistory = async () => {
    if (!session?.user?.id) return;
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryReports(data as ReportHistoryItem[]);
    } catch (err: any) {
      setHistoryError('Failed to load history.');
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Routing replaced handleNewReport and openHistoryReport with handleNewReportRoute and loadProjectRoute

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this saved report? This action cannot be undone.")) {
      return;
    }
    setDeletingReportId(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', session?.user?.id || '');

      if (error) throw error;
      setHistoryReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert("Failed to delete report. Please try again.");
      console.error(err);
    } finally {
      setDeletingReportId(null);
    }
  };

  const callLyzrAI = async (message: string) => {
    try {
      const response = await fetch(LYZR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LYZR_API_KEY
        },
        body: JSON.stringify({
          user_id: session?.user?.email || "anonymous",
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

    let stylePrompt = '';
    if (session?.user?.user_metadata?.thinkproject_prefs) {
      const prefs = session.user.user_metadata.thinkproject_prefs;
      if (prefs.recStyle) stylePrompt += `\n    RECOMMENDATION FOCUS: ${prefs.recStyle}`;
      if (prefs.expStyle) stylePrompt += `\n    EXPLANATION STYLE: ${prefs.expStyle}`;
    }

    const prompt = `Generate a comprehensive academic engineering report.
    project_title: ${projectTitle}
    department: ${department}
    project_description: ${sourceContent}
    report_format: ${reportFormat}
    explanation_level: ${explanationLevel}
    specific_requirements: ${specificRequirements}
    ${stylePrompt}

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
      
      let finalReportContent = '';
      let finalPlagiarismContent = '';

      if (parts.length > 1) {
        finalReportContent = parts[0].trim();
        finalPlagiarismContent = parts[1].trim();
      } else {
        finalReportContent = result;
        finalPlagiarismContent = "AI PLAGIARISM AND ORIGINALITY ANALYSIS:\nAnalysis not found in response. Please regenerate.";
      }
      
      setReportContent(finalReportContent);
      setPlagiarismContent(finalPlagiarismContent);

      if (session?.user?.id) {
        try {
          if (currentReportId) {
            const { error: dbError } = await supabase.from('reports').update({
              project_title: projectTitle,
              department: department,
              project_description: projectDescription,
              abstract: abstract,
              report_content: finalReportContent,
              plagiarism_content: finalPlagiarismContent,
              recommendations: recommendations,
              flowchart_data: flowchart
            }).eq('id', currentReportId).eq('user_id', session.user.id);
            
            if (dbError) {
              console.error('Failed to update report in database:', dbError);
              setReportStatus('Report generated, but failed to update history.');
            } else {
              setReportStatus('Report generated and updated in history.');
              setTimeout(() => setReportStatus(''), 4000);
            }
          } else {
            const { data: dbData, error: dbError } = await supabase.from('reports').insert({
              user_id: session.user.id,
              project_title: projectTitle,
              department: department,
              project_description: projectDescription,
              abstract: abstract,
              report_content: finalReportContent,
              plagiarism_content: finalPlagiarismContent,
              recommendations: recommendations,
              flowchart_data: flowchart
            }).select('id').single();
            
            if (dbError) {
              console.error('Failed to save report to database:', dbError);
              setReportStatus('Report generated, but failed to save to history.');
            } else {
              setCurrentReportId(dbData.id);
              setReportStatus('Report generated and saved to history.');
              setTimeout(() => setReportStatus(''), 4000);
            }
          }
        } catch (dbCatchError) {
          console.error('Exception saving report to database:', dbCatchError);
          setReportStatus('Report generated, but failed to save to history.');
        }
      } else {
        setReportStatus('');
      }
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
    const userContext = projectTitle ? `Existing Idea Context: ${projectTitle} - ${abstract || 'None provided'}` : 'No existing idea context provided.';
    
    const prompt = `Using LYZR API logic, provide exactly 15 unique engineering project recommendations for the ${department} department.
    Context: ${userContext}
    
    CATEGORIES:
    EASY PROJECTS (5 ideas)
    MEDIUM PROJECTS (5 ideas)
    ADVANCED PROJECTS (5 ideas)

    For EACH category, provide exactly 5 ideas in the following strict format:
    [Number]. Title: [Formal Academic Title] | Description: [2-line comprehensive academic explanation of the concept]
    
    CRITICAL GENERATION INSTRUCTIONS:
    1. Freshness is required for every generation. Do NOT reuse project titles, concepts, or near-duplicate ideas from this previous recommendation set: [${avoidList}].
    2. If a previous idea is similar, choose a completely different problem domain or substantially different technical approach.
    3. Avoid generic repeated ideas such as basic 'Smart Attendance System' or 'Hospital Management System' unless they are substantially novel.
    4. Explore different problem domains, modern technologies, and practical applications suitable for engineering students.
    5. Use ONLY plain text. NO markdown. Ensure descriptions are 4-6 sentences long internally for each idea even if the summary is 2 lines.
    
    (Randomness Token: ${Math.random().toString(36).substring(7)} - Bypass cache and guarantee completely different ideas than the standard ones.)`;
    
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

      if (currentReportId && session?.user?.id) {
        try {
          const { error: updateError } = await supabase
            .from('reports')
            .update({ recommendations: { easy, medium, advanced } })
            .eq('id', currentReportId)
            .eq('user_id', session.user.id);
          if (updateError) console.error('Failed to update recommendations in history:', updateError);
        } catch (updateCatch) {
          console.error('Exception updating recommendations:', updateCatch);
        }
      }
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
        const newReportContent = parts[0].trim();
        const newPlagiarismContent = parts[1].trim();
        setReportContent(newReportContent);
        setPlagiarismContent(newPlagiarismContent);
        
        if (session?.user?.id) {
          try {
            if (currentReportId) {
              const { error: dbError } = await supabase.from('reports').update({
                report_content: newReportContent,
                plagiarism_content: newPlagiarismContent
              }).eq('id', currentReportId).eq('user_id', session.user.id);
              
              if (dbError) {
                console.error('Failed to update rewritten report:', dbError);
              }
            } else {
              const { data: dbData, error: dbError } = await supabase.from('reports').insert({
                user_id: session.user.id,
                project_title: projectTitle,
                department: department,
                project_description: projectDescription,
                abstract: abstract,
                report_content: newReportContent,
                plagiarism_content: newPlagiarismContent,
                recommendations: recommendations,
                flowchart_data: flowchart
              }).select('id').single();
              
              if (dbError) {
                console.error('Failed to save rewritten report:', dbError);
              } else {
                setCurrentReportId(dbData.id);
              }
            }
          } catch (dbCatchError) {
            console.error('Exception saving rewritten report:', dbCatchError);
          }
        }
        
        setReportStatus('Originality improved. Report rewritten and saved to history.');
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
    const prompt = `Using LYZR API logic, generate a structured logical flowchart for an engineering project based on: "${source}".
    Identify inputs, processes, decisions, and outputs.
    
    CRITICAL INSTRUCTIONS FOR DECISIONS:
    - Decisions MUST have multiple outgoing edges (branches).
    - Do NOT create standalone nodes for "IF YES" or "IF NO".
    - Instead, use the "label" property on the edge (e.g., "YES" or "NO") to represent the outcome of a decision.
    - Merge branches logically if they lead to the same final output or end step.
    
    IMPORTANT: You MUST return ONLY a raw JSON object in the exact format below, with NO markdown formatting, NO backticks, and NO additional text.
    {
      "nodes": [
        { "id": "1", "type": "start", "label": "START" },
        { "id": "2", "type": "input", "label": "User Uploads Document" },
        { "id": "3", "type": "decision", "label": "Is Document Valid?" },
        { "id": "4", "type": "process", "label": "Process Document" },
        { "id": "5", "type": "output", "label": "Show Error" },
        { "id": "6", "type": "end", "label": "END" }
      ],
      "edges": [
        { "from": "1", "to": "2" },
        { "from": "2", "to": "3" },
        { "from": "3", "to": "4", "label": "YES" },
        { "from": "3", "to": "5", "label": "NO" },
        { "from": "4", "to": "6" },
        { "from": "5", "to": "6" }
      ]
    }
    Allowed node types: start, end, input, process, decision, output.`;
    const result = await callLyzrAI(prompt);
    setFlowchart(result);

    if (currentReportId && session?.user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ flowchart_data: result })
          .eq('id', currentReportId)
          .eq('user_id', session.user.id);
        if (updateError) console.error('Failed to update flowchart in history:', updateError);
      } catch (updateCatch) {
        console.error('Exception updating flowchart:', updateCatch);
      }
    }

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
    
    let layout;
    try {
      layout = parseAndLayoutFlowchart(flowchart);
    } catch(e) {
      alert('Error parsing flowchart for download.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = layout.width;
    canvas.height = layout.height;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Edges
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    layout.edges.forEach(edge => {
      const fromNode = layout.nodes.find(n => n.id === edge.from);
      const toNode = layout.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const startX = fromNode.x + fromNode.width / 2;
      const startY = fromNode.y + fromNode.height;
      const endX = toNode.x + toNode.width / 2;
      const endY = toNode.y;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      // Simple bezier curve approximation for canvas
      ctx.bezierCurveTo(startX, startY + 40, endX, endY - 40, endX, endY);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(endX - 5, endY - 7);
      ctx.lineTo(endX + 5, endY - 7);
      ctx.lineTo(endX, endY);
      ctx.fill();

      if (edge.label) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 11px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.label, midX, midY);
      }
    });

    // Draw Nodes
    layout.nodes.forEach(node => {
      // Background colors
      let fillStyle = '#f3f4f6';
      let strokeStyle = '#6b7280';
      if (node.type === 'start' || node.type === 'end') { fillStyle = '#d1fae5'; strokeStyle = '#10b981'; }
      if (node.type === 'input') { fillStyle = '#dbeafe'; strokeStyle = '#3b82f6'; }
      if (node.type === 'decision') { fillStyle = '#fef3c7'; strokeStyle = '#f59e0b'; }
      if (node.type === 'output') { fillStyle = '#f3e8ff'; strokeStyle = '#a855f7'; }

      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;

      // Shapes
      ctx.beginPath();
      if (node.type === 'start' || node.type === 'end') {
        const radius = node.height / 2;
        ctx.roundRect(node.x, node.y, node.width, node.height, radius);
      } else if (node.type === 'input') {
        // Parallelogram
        ctx.moveTo(node.x + 20, node.y);
        ctx.lineTo(node.x + node.width, node.y);
        ctx.lineTo(node.x + node.width - 20, node.y + node.height);
        ctx.lineTo(node.x, node.y + node.height);
        ctx.closePath();
      } else if (node.type === 'decision') {
        // Diamond
        ctx.moveTo(node.x + node.width / 2, node.y);
        ctx.lineTo(node.x + node.width, node.y + node.height / 2);
        ctx.lineTo(node.x + node.width / 2, node.y + node.height);
        ctx.lineTo(node.x, node.y + node.height / 2);
        ctx.closePath();
      } else {
        // Rounded Rect (process/output)
        ctx.roundRect(node.x, node.y, node.width, node.height, 8);
      }
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = node.label.split(' ');
      let line = '';
      let lines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > node.width - 40 && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      lines.forEach((l, idx) => {
        ctx.fillText(l.trim(), node.x + node.width / 2, node.y + (node.height / 2) - ((lines.length - 1) * 8) + (idx * 16));
      });
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    
    let filename = 'ThinkProject_Flowchart.png';
    if (projectTitle && projectTitle.trim()) {
      filename = projectTitle.trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        + '_Flowchart.png';
    }
    link.download = filename;
    
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

  const downloadWord = async () => {
    if (!reportContent) return;
    
    setReportStatus('Generating DOCX file...');
    
    try {
      const sections = [];
      
      if (projectTitle) {
        sections.push(new Paragraph({
          text: projectTitle.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: "center",
          spacing: { after: 400 }
        }));
      }
      
      const reportLines = reportContent.split('\n');
      reportLines.forEach(line => {
        if (line.trim()) {
          sections.push(new Paragraph({
            text: line.trim(),
            spacing: { after: 200 }
          }));
        }
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${projectTitle ? projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'thinkproject'}_report.docx`;
      link.click();
      
      setReportStatus('Word report downloaded successfully.');

      if (currentReportId && session?.user) {
        await supabase
          .from('reports')
          .update({ report_downloaded_at: new Date().toISOString() })
          .eq('id', currentReportId);
      }
      setTimeout(() => setReportStatus(''), 4000);
    } catch (err) {
      console.error("DOCX Generation Error:", err);
      setReportStatus('Error generating Word document.');
      setTimeout(() => setReportStatus(''), 4000);
    }
  };

  const downloadPDF = () => {
    if (!reportContent) return;
    
    setReportStatus('Generating PDF file...');
    
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const pageHeight = doc.internal.pageSize.height;
      
      if (projectTitle) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(projectTitle.toUpperCase(), doc.internal.pageSize.width - 2 * margin);
        doc.text(titleLines, margin, y);
        y += (titleLines.length * 8) + 10;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      const lines = reportContent.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const splitLines = doc.splitTextToSize(line.trim(), doc.internal.pageSize.width - 2 * margin);
          splitLines.forEach((textLine: string) => {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin + 10;
            }
            doc.text(textLine, margin, y);
            y += 7;
          });
          y += 3; // Extra spacing between paragraphs
        }
      });
      
      doc.save(`${projectTitle ? projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'thinkproject'}_report.pdf`);
      setReportStatus('PDF report downloaded successfully.');

      if (currentReportId && session?.user) {
        supabase
          .from('reports')
          .update({ report_downloaded_at: new Date().toISOString() })
          .eq('id', currentReportId);
      }
      setTimeout(() => setReportStatus(''), 4000);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      setReportStatus('Error generating PDF document.');
      setTimeout(() => setReportStatus(''), 4000);
    }
  };

  const formatChatResponse = (text: string) => {
    // 1. Remove markdown heading symbols like ### or ####
    let cleanText = text.replace(/#{1,6}\s?/g, '');
    // 2. Format bold text **text** to <strong>text</strong>
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 3. Format italic text *text* to <em>text</em>
    cleanText = cleanText.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // 4. Format line breaks
    cleanText = cleanText.replace(/\n/g, '<br/>');
    
    return <span dangerouslySetInnerHTML={{ __html: cleanText }} />;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    
    const updatedMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updatedMessages as any);
    setIsChatLoading(true);
    
    try {
      // Build conversation history (last 5 messages)
      const recentHistory = updatedMessages.slice(-5).map(m => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n');
      
      const prompt = `[SYSTEM INSTRUCTION: CHAT MODE]
You are ThinkProject's AI project mentor—a friendly, smart senior engineer helping a student with their academic project.
Tone: Conversational, friendly, helpful, encouraging. Use emojis naturally. Do NOT use overly childish slang (no "Brooo!").
Format: Concise (1-5 paragraphs). Do NOT output raw Markdown headings (like ####). Use bold text and bullet points if needed. Do NOT dump a full report unless explicitly requested.

[PROJECT CONTEXT]
Department: ${department || 'Not specified'}
Project Title: ${projectTitle || 'Not specified'}
Abstract/Context: ${abstract.substring(0, 150) || projectDescription.substring(0, 150) || 'Not specified'}

[CONVERSATION HISTORY]
${recentHistory}

Mentor:`;

      const aiResponse = await callLyzrAI(prompt);
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Oops, I couldn't reach the AI assistant right now. 😕 Please try again in a moment." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
        <Loader2 className="w-12 h-12 text-gray-900 dark:text-white animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (currentHash === '#login' || currentHash === '#signup') {
      return <Login initialIsSignUp={currentHash === '#signup'} />;
    }
    return <LandingPage />;
  }

  const getFilteredReports = () => {
    if (viewMode === 'reports') return historyReports.filter(r => r.report_downloaded_at !== null);
    if (viewMode === 'flowcharts') return historyReports.filter(r => r.flowchart_data !== null);
    return historyReports;
  };
  const displayReports = getFilteredReports();
  const viewTitle = viewMode === 'reports' ? 'Downloaded Reports' : viewMode === 'flowcharts' ? 'Flowcharts' : 'Project History';
  const emptyMessage = viewMode === 'reports' ? 'No downloaded reports yet. Your generated reports will appear here after you download them.' : viewMode === 'flowcharts' ? 'No flowcharts generated yet.' : 'No saved reports found.';

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-[#e5e7eb]">
      
      {/* Shared Authenticated Workspace Grid Background */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000 opacity-[0.03] dark:opacity-[0.05] z-0"
        style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {viewMode !== 'dashboard' && (
          <button 
            onClick={() => navigate('#/home')}
            className="text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1e1f20] hover:bg-gray-200 dark:bg-[#2c2d30] px-4 py-2 rounded-lg transition-all"
          >
            Home
          </button>
        )}
        {viewMode !== 'history' && (
          <button 
            onClick={() => {
              navigate('#/history');
            }}
            className="text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1e1f20] hover:bg-gray-200 dark:bg-[#2c2d30] px-4 py-2 rounded-lg transition-all"
          >
            History
          </button>
        )}
        {viewMode !== 'main' && (
          <button 
            onClick={() => navigate('#/create')}
            className="text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1e1f20] hover:bg-gray-200 dark:bg-[#2c2d30] px-4 py-2 rounded-lg transition-all"
          >
            New Report
          </button>
        )}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1e1f20] hover:bg-gray-200 dark:bg-[#2c2d30] w-[38px] h-[38px] rounded-lg transition-all"
            title="Account"
          >
            <User size={18} />
          </button>
          
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-50 dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col z-50 text-left">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                <div className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">
                  {session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {session.user.email}
                </div>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button 
                  onClick={() => {
                    navigate('#/settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-[#2c2d30] rounded-md transition-all text-left w-full"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    supabase.auth.signOut();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-200 dark:bg-[#2c2d30] rounded-md transition-all text-left w-full"
                >
                  <RefreshCw size={16} />
                  Switch Account
                </button>
                <div className="h-px bg-gray-700 my-1 w-full"></div>
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    supabase.auth.signOut();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-md transition-all text-left w-full font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isImprovingOriginality && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-gray-900 dark:text-white animate-spin mb-4" />
          <p className="text-gray-900 dark:text-white font-bold uppercase tracking-widest animate-pulse text-center px-6">Rewriting report and refreshing analysis...</p>
        </div>
      )}

      {viewMode !== 'dashboard' && (
        <header className="w-full max-w-5xl text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-3 font-serif">ThinkProject AI</h1>
          <p className="text-[13px] md:text-sm text-gray-500 font-medium">An Intelligent Academic Project Assistant</p>
        </header>
      )}

      <main className="w-full max-w-4xl space-y-10 pb-24">
        {viewMode === 'dashboard' && session ? (
          <Dashboard 
            session={session}
            historyReports={historyReports}
            fetchHistory={fetchHistory}
          />
        ) : viewMode === 'settings' && session ? (
          <SettingsComponent session={session} onClose={() => navigate('#/home')} onProfileUpdated={() => {
            supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
          }} />
        ) : viewMode === 'history' || viewMode === 'reports' || viewMode === 'flowcharts' ? (
          <section className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden min-h-[500px] flex flex-col animate-in fade-in duration-500">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1f20] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewTitle}</h2>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 font-medium text-sm">
                  <Loader2 className="animate-spin mb-4 w-8 h-8" /> 
                  Loading...
                </div>
              ) : historyError ? (
                <div className="text-center py-20 text-red-500 font-medium text-sm">
                  {historyError}
                </div>
              ) : displayReports.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-6">
                  <div className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                    {emptyMessage}
                  </div>
                  {viewMode === 'reports' && (
                    <button onClick={() => navigate('#/create')} className="text-sm font-medium bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all">
                      CREATE YOUR IDEA
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {displayReports.map(report => (
                    <div key={report.id} className="bg-gray-50 dark:bg-[#1e1f20] p-6 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-[#e5e7eb] flex flex-col hover:border-gray-300 dark:border-gray-700 transition-colors shadow-lg shadow-black/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">{report.department}</span>
                        <span className="text-xs text-gray-500 font-medium">
                          {viewMode === 'reports' && report.report_downloaded_at 
                            ? `Downloaded: ${new Date(report.report_downloaded_at).toLocaleDateString()}` 
                            : new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {report.project_title || 'Untitled Project'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 flex-1 leading-relaxed">
                        {report.project_description || report.abstract || 'No description available.'}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => navigate(`#/project/${report.id}?section=${viewMode === 'flowcharts' ? 'flowchart' : 'report'}`)}
                          className="flex-1 bg-indigo-600 text-white font-medium py-2 rounded-lg transition-all hover:bg-indigo-700 text-sm"
                        >
                          {viewMode === 'flowcharts' ? 'View Flowchart' : 'Open Report'}
                        </button>
                        {viewMode === 'history' && (
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            disabled={deletingReportId === report.id}
                            className="px-4 bg-gray-200 dark:bg-[#2c2d30] hover:bg-gray-300 dark:bg-[#383a3f] text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Report"
                          >
                            {deletingReportId === report.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className={`flex flex-col gap-4 transition-opacity duration-300 ${abstract ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Title</label>
                <input ref={titleInputRef} type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Enter formal project title..." className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600" />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Description</label>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Provide context or project details..." className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 min-h-[120px] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600" />
                {isGeneratingDesc && <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">Generating context...</div>}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Format</label>
                  <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)} className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                    <option value="Standard">Standard</option>
                    <option value="Mini Project Report (Full – Study + Implementation)">Mini Project Report (Full – Study + Implementation)</option>
                    <option value="Short Mini Project Report">Short Mini Project Report</option>
                    <option value="Research Paper Style Report">Research Paper Style Report</option>
                    <option value="Viva Preparation Notes">Viva Preparation Notes</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Level of Explanation</label>
                  <select value={explanationLevel} onChange={(e) => setExplanationLevel(e.target.value)} className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Specific Requirements <span className="text-gray-600 normal-case font-normal">(Optional)</span></label>
                <textarea value={specificRequirements} onChange={(e) => setSpecificRequirements(e.target.value)} placeholder="Enter any additional requirements, formatting preferences, or instructions..." className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 min-h-[80px] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600" />
              </div>
            </div>

            <div className="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-[#16181c] text-center hover:bg-gray-50 dark:bg-[#1e1f20] transition-colors cursor-pointer" onClick={() => !abstract && fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              
              {!abstract ? (
                <div className="flex flex-col items-center gap-2 group mx-auto">
                  {isParsing ? (
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  ) : (
                    <FileUp className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors mt-2">
                    {isParsing ? "Extracting Text..." : "Upload Abstract"}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm">
                    <FileText className="w-5 h-5" />
                    <span>{fileName || "Document Loaded"}</span>
                  </div>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleClearAbstract(); }} 
                      className="flex-1 bg-gray-200 dark:bg-[#2c2d30] border border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:bg-[#383a3f] hover:text-gray-900 dark:text-white font-medium py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleGenerateReport(); }} 
                      disabled={isLoading}
                      className="flex-1 bg-indigo-600 text-white font-medium py-2 rounded-lg text-sm transition-all hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
              className={`flex-1 bg-indigo-600 text-white font-medium py-3 rounded-lg text-sm h-12 disabled:opacity-50 hover:bg-indigo-700 flex items-center justify-center transition-all ${!!abstract ? 'cursor-not-allowed' : ''}`}
            >
              {isLoading && activeSection === 'report' ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : "Generate Report"}
            </button>
            <button 
              onClick={handleSuggestIdeas} 
              disabled={isLoading} 
              className={`flex-1 font-medium py-3 rounded-lg border text-sm h-12 disabled:opacity-50 flex items-center justify-center transition-all ${highlightSuggestIdeas ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#1e1f20] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 animate-pulse' : 'bg-gray-200 dark:bg-[#2c2d30] text-gray-900 dark:text-white border-transparent hover:bg-gray-300 dark:bg-[#383a3f]'}`}
            >
              {isLoading && activeSection === 'recommendation' ? <Loader2 className="animate-spin mr-2" /> : "Suggest Ideas"}
            </button>
            <button onClick={handleGenerateFlowchart} disabled={isLoading} className="flex-1 bg-gray-200 dark:bg-[#2c2d30] text-gray-900 dark:text-white font-medium py-3 rounded-lg border border-transparent text-sm h-12 disabled:opacity-50 hover:bg-gray-300 dark:bg-[#383a3f] flex items-center justify-center transition-all">
              {isLoading && activeSection === 'flowchart' ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : "Flowchart"}
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-[#e5e7eb] rounded-xl shadow-2xl shadow-black/40 overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1f20]">
            {['report', 'recommendation', 'flowchart'].map(sec => (
              <button key={sec} onClick={() => setActiveSection(sec as any)} className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-all ${activeSection === sec ? 'text-indigo-400 border-b-2 border-indigo-400 bg-white dark:bg-[#16181c]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:bg-[#2c2d30]'}`}>
                {sec}
              </button>
            ))}
          </div>

          <div className="p-8 flex-1 overflow-y-auto text-sm leading-relaxed prose prose-invert max-w-none">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 font-medium text-sm">
                <Loader2 className="animate-spin mb-4 w-8 h-8" /> 
                {reportStatus || "Processing..."}
              </div>
            ) : (
              <>
                {activeSection === 'report' && (
                  <div>
                    {reportContent ? (
                      <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{reportContent}</div>
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                          <button onClick={copyReport} className="text-sm font-medium border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-[#2c2d30] text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 dark:bg-[#383a3f] hover:text-gray-900 dark:text-white transition-all">Copy Report</button>
                          <div className="flex gap-4">
                            <button onClick={downloadWord} className="text-sm font-medium border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-[#2c2d30] text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 dark:bg-[#383a3f] hover:text-gray-900 dark:text-white transition-all">Download Word</button>
                            <button onClick={downloadPDF} className="text-sm font-medium bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all">Download PDF</button>
                          </div>
                        </div>
                        {reportStatus && <p className="text-xs font-medium text-emerald-500">{reportStatus}</p>}
                        
                        {plagiarismContent && (
                          <div className="mt-12 p-8 border border-gray-200 dark:border-gray-800 rounded-xl space-y-8 bg-gray-50 dark:bg-[#1e1f20]">
                            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                              {plagiarismContent}
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                              <button onClick={handleImproveOriginality} disabled={isImprovingOriginality} className="flex-1 w-full text-sm font-medium bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 mt-4">Improve Originality</button>
                              <button onClick={copyPlagiarism} className="flex-1 w-full text-sm font-medium border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-[#2c2d30] text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:bg-[#383a3f] hover:text-gray-900 dark:text-white transition-all mt-4">Copy Analysis</button>
                            </div>
                            {plagiarismStatus && <p className="text-xs font-medium text-emerald-500">{plagiarismStatus}</p>}
                          </div>
                        )}
                      </div>
                    ) : <p className="text-center py-20 text-gray-500 italic text-sm">No report generated.</p>}
                  </div>
                )}

                {activeSection === 'recommendation' && (
                  <div className="space-y-8 animate-in fade-in duration-700">
                    {recommendations ? (
                      <div className="space-y-12">
                        {['easy', 'medium', 'advanced'].map(cat => (
                          <div key={cat} className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-gray-200 dark:border-gray-800 inline-block pb-2 mb-4">{cat} Projects</h3>
                            <div className="space-y-8 pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                              {recommendations[cat as keyof CategorizedIdeas].map((idea, idx) => (
                                <div key={idx} className="space-y-2 pb-6 border-b border-gray-200 dark:border-gray-800/50 last:border-0">
                                  <p className="font-semibold text-base leading-tight text-gray-900 dark:text-white">{idx + 1}. {idea.title}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">{idea.description}</p>
                                  <button onClick={() => handleContinueIdea(idea.title)} className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors block">Continue Idea →</button>
                                </div>
                              ))}
                              {recommendations[cat as keyof CategorizedIdeas].length === 0 && (
                                <p className="text-sm text-gray-500 italic">No ideas found in this category.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-gray-500 italic text-sm">No suggestions loaded yet.</p>
                        <button onClick={handleSuggestIdeas} className="text-sm font-medium border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-[#2c2d30] text-gray-900 dark:text-white px-8 py-3 rounded-lg hover:bg-gray-300 dark:bg-[#383a3f] transition-all">Explore Ideas</button>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'flowchart' && (
                  <div className="flex flex-col items-center animate-in fade-in duration-700">
                    {flowchart ? (
                      <div className="w-full flex flex-col items-center">
                        <FlowchartRenderer data={flowchart} />
                        
                        <p className="mb-8 text-sm text-gray-500 italic text-center max-w-lg font-medium leading-relaxed mt-6">
                          This flowchart illustrates the system design and operational flow, suitable for inclusion in the System Design section of the academic report.
                        </p>

                        <div className="flex gap-4 w-full">
                          <button onClick={copyFlowchart} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-4 hover:bg-black hover:text-gray-900 dark:text-white transition-all">Copy Flowchart</button>
                          <button onClick={downloadFlowchart} className="flex-1 text-[10px] font-bold uppercase border-2 border-black px-6 py-4 hover:bg-black hover:text-gray-900 dark:text-white transition-all">Download Flowchart</button>
                        </div>
                        {flowchartStatus && <p className="mt-4 text-[9px] font-bold text-green-600 uppercase tracking-widest">{flowchartStatus}</p>}
                      </div>
                    ) : <p className="text-center py-20 text-gray-600 dark:text-gray-400 italic">No flowchart available.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
          </>
        )}
      </main>

      {/* Floating Chatbot */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all group ${isChatOpen ? 'w-[350px] h-[500px]' : 'w-14 h-14'}`}>
        {!isChatOpen ? (
          <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setIsChatOpen(true)}>
            <div className="absolute bottom-full right-0 mb-2 flex flex-col items-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-700 motion-safe:animate-subtle-bounce group-hover:animate-none transition-transform group-hover:-translate-y-1">
              <div className="whitespace-nowrap text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-[#16181c]/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                Have a query? Chat with Think
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 opacity-80" />
            </div>
            <button className="w-full h-full bg-white text-black rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform relative z-10 pointer-events-none">
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-50 dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-200 dark:bg-[#2d2f31] flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-gray-900 dark:text-white tracking-widest">THINK AI</span>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#161718] text-[11px]">
              {chatMessages.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl max-w-[85%] ${m.role === 'user' ? 'bg-white text-black ml-auto' : 'bg-gray-200 dark:bg-[#2d2f31] text-gray-900 dark:text-white'}`}>
                  {m.role === 'ai' ? formatChatResponse(m.content) : m.content}
                </div>
              ))}
              {isChatLoading && <div className="text-gray-500 dark:text-gray-400 p-2 text-xs italic opacity-70 animate-pulse">Thinking... 🤔</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#1e1f20] border-t border-gray-300 dark:border-gray-700 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} type="text" placeholder="Ask a question..." className="flex-1 bg-transparent text-xs outline-none text-gray-900 dark:text-white px-2" />
              <button onClick={handleSendMessage} className="bg-white text-black p-2 rounded-lg"><Send className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default App;
