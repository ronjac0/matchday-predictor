'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Stop the form from causing a page reload
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';

    try {
      if (isLogin) {
        // --- CLIENT-SIDE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Force a router refresh to update server components, then redirect
        router.refresh();
        router.push('/dashboard');
        
      } else {
        // --- CLIENT-SIDE SIGN UP ---
        const username = formData.get('username')?.toString().trim() || '';
        const confirmPassword = formData.get('confirmPassword')?.toString() || '';

        if (password !== confirmPassword) throw new Error("Passwords do not match");

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create account.");

        // 2. Create Database Profile
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: authData.user.id,
            display_name: username || email.split('@')[0],
            wallet_balance: 1000,
          },
        ]);

        if (profileError) throw new Error("Account created, but database profile failed.");

        setSuccessMsg('Account created successfully! Switching to login...');
        setTimeout(() => setIsLogin(true), 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  // Inside app/auth/page.tsx - replace your return statement with this:

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900 via-zinc-950 to-zinc-950 text-white p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-emerald-800/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
        
        {/* Subtle top glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>

        <h1 className="text-4xl font-black text-center tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-200">
          🏆 FIFA PREDICT
        </h1>
        <p className="text-emerald-200/60 text-center mb-8 text-sm uppercase tracking-widest font-semibold">
          {isLogin ? 'Enter the Stadium' : 'Claim your 1000 starting points'}
        </p>
        
        {errorMsg && <div className="bg-red-950/50 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center font-medium">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl mb-6 text-sm text-center font-medium">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 pl-1">Manager Name *</label>
              <input type="text" name="username" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="e.g. MessiFan10" />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 pl-1">Email Address *</label>
            <input type="email" name="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="you@pitch.com" />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 pl-1">Password *</label>
            <input type="password" name="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" placeholder="••••••••" />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 pl-1">Confirm Password *</label>
              <input type="password" name="confirmPassword" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none" />
            </div>
          )}
          
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black tracking-widest rounded-xl p-4 mt-6 disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-lg flex justify-center items-center">
            {isLoading ? 'PROCESSING...' : (isLogin ? 'SIGN IN TO PLAY' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} className="text-xs text-zinc-400 font-semibold hover:text-emerald-400 transition-colors uppercase tracking-widest">
            {isLogin ? "New to the league? Create Account" : "Already registered? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );