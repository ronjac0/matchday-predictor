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
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.refresh();
        router.push('/dashboard');
        
      } else {
        // SIGNUP FLOW
        const username = formData.get('username')?.toString().trim() || '';
        const confirmPassword = formData.get('confirmPassword')?.toString() || '';

        if (password !== confirmPassword) throw new Error("Passwords do not match");

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create account.");

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white p-4 font-sans relative overflow-hidden">
      
      {/* SUBTLE BACKGROUND GLOW */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* LOGO ICON */}
        <div className="flex justify-center mb-6">
           <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.3)]">
             <span className="text-black font-black text-3xl leading-none">P</span>
           </div>
        </div>

        <h1 className="text-3xl font-black text-center tracking-tighter mb-2 text-white uppercase">
          Predictor<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-zinc-500 text-center mb-8 text-[10px] uppercase tracking-widest font-bold">
          {isLogin ? 'Enter the Arena' : 'Claim your 1000 starting points'}
        </p>
        
        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-medium">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-sm text-center font-medium">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 pl-1">Manager Name</label>
              <input type="text" name="username" required className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm" placeholder="e.g. Tactician99" />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 pl-1">Email Address</label>
            <input type="email" name="email" required className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm" placeholder="manager@club.com" />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 pl-1">Password</label>
            <input type="password" name="password" required className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm" placeholder="••••••••" />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 pl-1">Confirm Password</label>
              <input type="password" name="confirmPassword" required className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm" placeholder="••••••••" />
            </div>
          )}
          
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black tracking-widest uppercase rounded-xl p-4 mt-6 disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm">
            {isLoading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} className="text-[10px] text-zinc-500 font-bold hover:text-emerald-400 transition-colors uppercase tracking-widest">
            {isLogin ? "New manager? Create Account" : "Already registered? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}