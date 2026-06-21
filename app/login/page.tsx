 'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import getBrowserSupabaseClient from '@/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any | null>(null);

  // Initialize Supabase client only on the browser
  useState(() => {
    try {
      // Defer creation to client-side only
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const getClient = require('@/utils/supabase/client').default;
      setSupabase(getClient());
    } catch (e) {
      // ignore during server build
    }
    return () => {};
  });

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetMessages = () => setMessage('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email || !password || !displayName) {
      setMessage('Please provide a display name, email and password.');
      return;
    }

    setLoading(true);
    try {
      if (!supabase) {
        setMessage('Initializing client...please try again');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message || 'Failed to sign up');
        setLoading(false);
        return;
      }

      // After sign up, insert a profile row into public.users with default balance 1000
      // Note: With RLS enabled this may require a server-side function or service role.
      const profileInsert = await supabase.from('users').insert([
        { id: data.user?.id, email, username: displayName, full_name: displayName, wallet_balance: 1000 },
      ]);

      if (profileInsert.error) {
        // Not fatal for signup — warn and continue
        console.warn('profile insert error', profileInsert.error);
      }

      setMessage('Sign up successful! Please check your email to confirm (if required). Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      console.error(err);
      setMessage('An unexpected error occurred while signing up.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password) {
      setMessage('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      if (!supabase) {
        setMessage('Initializing client...please try again');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message || 'Failed to sign in');
        return;
      }

      // Signed in, redirect
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setMessage('An unexpected error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-sm text-gray-500 mb-6">{isSignUp ? 'Sign up to start placing bets and climb the leaderboard.' : 'Sign in to manage your bets and balance.'}</p>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          <div className="flex items-center justify-between">
            <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isSignUp ? 'Have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">By continuing you agree to our terms and privacy policy.</div>
      </div>
    </div>
  );
}
