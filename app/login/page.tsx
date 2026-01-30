'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();
  const router = useRouter();

  // If the user is already authenticated, send them straight to /dashboard ✅
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/dashboard');
    };

    check();
  }, [router, supabase]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('Attempting login for', email);
    // Diagnostic: ensure the client has the supabase env values (do not print keys)
    console.log('SUPABASE URL', process.env.NEXT_PUBLIC_SUPABASE_URL, 'HAS_ANON_KEY?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      console.log('signInWithPassword result:', res);

      // Supabase returns { data, error }
      if (res.error) {
        console.error('Login error:', res.error);
        alert(res.error.message);
        return;
      }

      // If a session was created, redirect. Otherwise, show info.
      if (res.data?.session) {
        console.log('Login successful, session:', res.data.session);
        try {
          const session = res.data.session;
          const host = window.location.hostname.split(':')[0];
          const hostPrefix = host.split('.')[0] || host;
          const cookieName = `sb-${hostPrefix}-auth-token`;
          const cookieValue = JSON.stringify(session);
          const expires = session.expires_at ? new Date(session.expires_at * 1000).toUTCString() : '';
          const secureFlag = window.location.protocol === 'https:' ? 'Secure;' : '';
          document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; path=/; ${secureFlag} SameSite=Lax; ${expires ? `Expires=${expires};` : ''}`;
          console.log('Auth cookie set:', cookieName);
        } catch (e) {
          console.warn('Failed to set auth cookie:', e);
        }

        router.push('/dashboard');
      } else {
        console.warn('No session returned from sign-in. Response data:', res.data);
        alert('Login did not create a session. Check the console output.');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      alert('An unexpected error occurred. See console.');
    }
  };

  const handleSignUp = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('Attempting signup for', email);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Signup error:', error);
        alert(error.message);
      } else {
        alert('Check your email for the confirmation link!');
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      alert('An unexpected error occurred. See console.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Login to StillUp?</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-2 w-64">
        <input className="border p-2 rounded text-black" type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 rounded text-black" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="cursor-pointer bg-blue-600 text-white p-2 rounded">Login</button>
        <button type="button" onClick={handleSignUp} className="cursor-pointer text-sm text-gray-500 mt-2 text-center underline">Sign Up</button>
      </form>
    </div>
  );
}