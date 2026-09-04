import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Settings as SettingsIcon, Shield, Database, Sparkles, Moon, HelpCircle, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface SettingsProps {
  session: Session;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ session, onClose, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'project' | 'appearance' | 'ai' | 'privacy' | 'security' | 'about'>('profile');
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Project Preferences State
  const [department, setDepartment] = useState('General');
  const [reportFormat, setReportFormat] = useState('Standard');
  const [explanationLevel, setExplanationLevel] = useState('Intermediate');
  const [requirements, setRequirements] = useState('');
  
  // AI Preferences
  const [recStyle, setRecStyle] = useState('Balanced');
  const [expStyle, setExpStyle] = useState('Balanced');
  
  // Appearance
  const [theme, setTheme] = useState('System');
  
  // Security
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  // Generic Status
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const DEPARTMENTS = [
    'General', 'ECE', 'EEE', 'IT', 'CSE', 'CCE', 'AIDS', 'AIML', 
    'BIO TECH', 'BIO MEDICAL', 'CHEMICAL', 'MECHANICAL', 'CIVIL'
  ];

  const REPORT_FORMATS = [
    'Mini Project Report (Full – Study + Implementation)',
    'Short Mini Project Report',
    'Research Paper Style Report',
    'Viva Preparation Notes',
    'Standard'
  ];

  const EXPLANATION_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  const RECOMMENDATION_STYLES = ['Practical & Implementable', 'Innovative & Emerging', 'Balanced'];
  const AI_EXPLANATION_STYLES = ['Concise', 'Balanced', 'Detailed'];

  useEffect(() => {
    // Load Profile from DB
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      if (data?.full_name) setFullName(data.full_name);
      else {
        // Fallback to metadata
        const metadata = session.user.user_metadata || {};
        const metaName = metadata.full_name || metadata.name || '';
        if (metaName) setFullName(metaName);
      }
      
      const isOAuth = session.user.app_metadata.provider === 'google';
      setIsGoogleAuth(isOAuth);
    };
    loadProfile();

    // Load Local Preferences securely from user_metadata to sync across devices
    const prefs = session.user.user_metadata?.thinkproject_prefs;
    if (prefs) {
      if (prefs.department) setDepartment(prefs.department);
      if (prefs.reportFormat) setReportFormat(prefs.reportFormat);
      if (prefs.explanationLevel) setExplanationLevel(prefs.explanationLevel);
      if (prefs.requirements !== undefined) setRequirements(prefs.requirements);
      if (prefs.recStyle) setRecStyle(prefs.recStyle);
      if (prefs.expStyle) setExpStyle(prefs.expStyle);
    }
    
    // Theme is locally scoped per device
    const localTheme = localStorage.getItem('theme') || 'System';
    setTheme(localTheme);

  }, [session]);

  const showStatus = (message: string, type: 'success' | 'error') => {
    setSaveStatus({ message, type });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // 1. Update DB Profile
      const { error: dbError } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', session.user.id);
      if (dbError) throw dbError;

      // 2. Update Auth session metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (authError) throw authError;

      showStatus('Profile updated successfully', 'success');
      if (onProfileUpdated) onProfileUpdated();
    } catch (e: any) {
      showStatus(e.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    const prefs = { department, reportFormat, explanationLevel, requirements, recStyle, expStyle };
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { thinkproject_prefs: prefs }
      });
      if (error) throw error;
      
      showStatus('Preferences saved successfully', 'success');
    } catch (e: any) {
      showStatus(e.message, 'error');
    }
  };
  
  const saveAppearance = () => {
    localStorage.setItem('theme', theme);
    const isDark = theme === 'Dark' || (theme === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showStatus('Appearance saved', 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showStatus('Password must be at least 6 characters', 'error');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showStatus('Password updated successfully', 'success');
      setNewPassword('');
    } catch (e: any) {
      showStatus(e.message, 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const resetPreferences = async () => {
    if (window.confirm("Are you sure you want to reset your synced preferences to default?")) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { thinkproject_prefs: null }
        });
        if (error) throw error;

        setDepartment('General');
        setReportFormat('Standard');
        setExplanationLevel('Intermediate');
        setRequirements('');
        setRecStyle('Balanced');
        setExpStyle('Balanced');
        showStatus('Preferences reset', 'success');
      } catch (e: any) {
        showStatus('Failed to reset', 'error');
      }
    }
  };

  const renderTabs = () => (
    <div className="flex flex-col gap-1 w-full lg:w-64 border-r border-gray-200 dark:border-gray-800 pr-0 lg:pr-6 mb-6 lg:mb-0">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Settings</h3>
      
      <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <User className="w-4 h-4" /> Account Profile
      </button>
      <button onClick={() => setActiveTab('project')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'project' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <SettingsIcon className="w-4 h-4" /> Project Preferences
      </button>
      <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <Moon className="w-4 h-4" /> Appearance
      </button>
      <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <Sparkles className="w-4 h-4" /> AI Preferences
      </button>
      <button onClick={() => setActiveTab('privacy')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'privacy' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <Database className="w-4 h-4" /> Data & Privacy
      </button>
      <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <Shield className="w-4 h-4" /> Security
      </button>
      <button onClick={() => setActiveTab('about')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-indigo-50 text-indigo-700 dark:bg-[#2c2d30] dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e1f20]'}`}>
        <HelpCircle className="w-4 h-4" /> About & Help
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#16181c] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col animate-in fade-in duration-500 w-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1e1f20] flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight font-serif">Preferences</h2>
        <div className="flex items-center gap-4">
          {saveStatus && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${saveStatus.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus.message}
            </span>
          )}
          <button onClick={onClose} className="text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#2c2d30] px-4 py-2 rounded-lg transition-all">
            Return to Dashboard
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col lg:flex-row bg-white dark:bg-[#0f1115]">
        {renderTabs()}

        <div className="flex-1 lg:pl-6 overflow-y-auto pr-2">
          
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Account Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your basic account information.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Email Address (Read-only)</label>
                  <input type="text" value={session.user.email} disabled className="bg-gray-100 dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Managed via {isGoogleAuth ? 'Google Authentication' : 'Email/Password Authentication'}.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                </div>

                <button onClick={saveProfile} disabled={isSavingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
                </button>
              </div>
            </div>
          )}

          {/* PROJECT PREFERENCES */}
          {activeTab === 'project' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Project Defaults</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set default values for the project generation form.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Default Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Default Report Format</label>
                  <select value={reportFormat} onChange={e => setReportFormat(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {REPORT_FORMATS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Default Explanation Level</label>
                  <select value={explanationLevel} onChange={e => setExplanationLevel(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {EXPLANATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Default Specific Requirements (Optional)</label>
                  <textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="e.g. Use simple technical language..." className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white h-24 resize-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"></textarea>
                </div>

                <button onClick={savePreferences} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize the visual theme across ThinkProject.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Global Theme Preference</label>
                  <select value={theme} onChange={e => setTheme(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {['System', 'Light', 'Dark'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <button onClick={saveAppearance} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                  <Save className="w-4 h-4" /> Apply Theme
                </button>
              </div>
            </div>
          )}

          {/* AI PREFERENCES */}
          {activeTab === 'ai' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">AI Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Guide how the Lyzr AI agent formulates responses.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Recommendation Style</label>
                  <select value={recStyle} onChange={e => setRecStyle(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {RECOMMENDATION_STYLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Project Explanation Style</label>
                  <select value={expStyle} onChange={e => setExpStyle(e.target.value)} className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all">
                    {AI_EXPLANATION_STYLES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <button onClick={savePreferences} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                  <Save className="w-4 h-4" /> Save AI Preferences
                </button>
              </div>
            </div>
          )}

          {/* DATA & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Data & Privacy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Understand and manage your data.</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Stored Information</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-4">
                  <li>Profile metadata (Name, Email).</li>
                  <li>Academic reports generated by you (saved in Project History).</li>
                  <li>Flowchart configurations associated with your reports.</li>
                  <li>Project generation preferences (synced to your account securely).</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Account Preferences</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Clear all your synced defaults and AI preferences for your account.</p>
                <button onClick={resetPreferences} className="text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#2c2d30] px-4 py-2 rounded-lg transition-all">
                  Clear Saved Preferences
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Account Deletion</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Permanently delete your account and all associated academic reports.</p>
                <button disabled className="text-sm font-medium border border-red-200 dark:border-red-900/50 text-red-400 dark:text-red-500/50 bg-red-50 dark:bg-red-950/10 px-4 py-2 rounded-lg cursor-not-allowed">
                  Delete Account
                </button>
                <p className="text-[10px] text-gray-500">Account deletion requires secure server-side handling and is currently disabled in the client interface.</p>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your authentication settings.</p>
              </div>
              
              {isGoogleAuth ? (
                <div className="bg-gray-50 dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Google Authentication</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your account security and password are managed by Google. Local password changes are not required.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-400">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" className="bg-white dark:bg-[#1e1f20] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  </div>
                  <button type="submit" disabled={isSavingPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all">
                    {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Update Password
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ABOUT & HELP */}
          {activeTab === 'about' && (
            <div className="max-w-2xl space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 font-serif">ThinkProject AI</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">An Intelligent Academic Project Assistant</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Troubleshooting Guide</h4>
                
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong className="text-gray-900 dark:text-gray-300">Project Generation:</strong> Ensure you provide either a comprehensive title/description or upload a highly detailed abstract (PDF/DOCX) for the best results.</p>
                  <p><strong className="text-gray-900 dark:text-gray-300">Report Downloads:</strong> Downloads are formatted according to standard IEEE structure. If images or specific assets are missing, use the generated Flowchart to supplement your presentation.</p>
                  <p><strong className="text-gray-900 dark:text-gray-300">AI Plagiarism Analysis:</strong> The AI similarity check is a heuristic analysis. Always run your final academic documents through your institution's official checking software (e.g., Turnitin).</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
