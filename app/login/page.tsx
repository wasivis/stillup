'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Adjust path if needed
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else router.push('/dashboard');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email for the confirmation link!');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Login to StillUp?</h1>
      <form className="flex flex-col gap-2 w-64">
        <input className="border p-2 rounded text-black" type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 rounded text-black" type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="bg-blue-600 text-white p-2 rounded">Login</button>
        <button onClick={handleSignUp} className="text-sm text-gray-500 mt-2 text-center underline">Sign Up</button>
      </form>
    </div>
  );
}