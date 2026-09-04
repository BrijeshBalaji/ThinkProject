import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface LoginProps {
  initialIsSignUp?: boolean;
}

const Login: React.FC<LoginProps> = ({ initialIsSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (isSignUp && !fullName.trim()) {
      setAuthError('Full name is required');
      return;
    }

    if (!email.trim() || !password) {
      setAuthError('Email and password are required');
      return;
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }
    }

    setIsAuthLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        
        if (data?.user && !data?.session) {
          setAuthSuccess('Account created. Please check your email to confirm your account.');
          setFullName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during Google login');
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-black p-4 sm:p-6 lg:p-10 font-sans overflow-hidden">
      <div className="w-full h-full max-w-6xl flex flex-col lg:flex-row bg-[#0f1115] text-[#e5e7eb] overflow-hidden border border-gray-700/50 rounded-2xl shadow-2xl">
      {/* Left Column - Image */}
      <div className="hidden md:block flex-1 lg:flex-none lg:w-1/2 relative bg-[#0f1115]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f1115] opacity-20 pointer-events-none z-10 hidden lg:block"></div>
        <img 
          src="/login-image.png" 
          alt="ThinkProject Academic Visual" 
          className="w-full h-full object-cover object-center opacity-90"
        />
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex-none lg:flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="w-full max-w-[400px] mx-auto relative bg-[#1e1f20] border border-gray-700/50 rounded-xl shadow-2xl p-6 sm:p-8">
          
          {/* Folded Corner Detail */}
          <div className="absolute -top-[1px] -right-[1px] w-10 h-10 bg-[#0f1115] z-10 pointer-events-none rounded-bl-xl" />
          <div className="absolute -top-[1px] -right-[1px] w-10 h-10 z-20 pointer-events-none" style={{ filter: 'drop-shadow(-2px 2px 3px rgba(0,0,0,0.4))' }}>
            <div 
              className="w-full h-full bg-gradient-to-bl from-[#32363b] to-[#1e1f20] rounded-bl-xl border-b border-l border-gray-500/50"
              style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
            />
          </div>

          <header className="text-left mb-8 relative z-30">
            <h1 className="text-3xl font-semibold text-white tracking-tight font-serif">
              ThinkProject AI
            </h1>
            <p className="text-sm text-gray-400 mt-1.5">
              {isSignUp ? "Create your ThinkProject account" : "Sign in to your account"}
            </p>
          </header>

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isSignUp && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name" 
                  required={isSignUp}
                  className="bg-[#1e1f20] border border-gray-700/50 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                required
                className="bg-[#1e1f20] border border-gray-700/50 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-400">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                required
                className="bg-[#1e1f20] border border-gray-700/50 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600"
              />
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-gray-400">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password" 
                  required={isSignUp}
                  className="bg-[#1e1f20] border border-gray-700/50 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                />
              </div>
            )}

            {authError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs sm:text-sm font-medium text-center">{authError}</p>
              </div>
            )}
            {authSuccess && (
              <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-xs sm:text-sm font-medium text-center">{authSuccess}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 hover:bg-indigo-700 flex items-center justify-center transition-all mt-4"
            >
              {isAuthLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1e1f20] px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthLoading}
            className="w-full bg-[#1e1f20] text-white font-medium py-2.5 rounded-lg border border-gray-700/50 text-sm disabled:opacity-50 hover:bg-[#2d2f31] hover:border-gray-600 flex items-center justify-center gap-3 transition-all"
          >
            {isAuthLoading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
