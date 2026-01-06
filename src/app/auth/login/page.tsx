"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Flame, Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/'); // Send them to The Forge
      router.refresh(); // Refresh to show the Navbar
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 backdrop-blur-xl">
        <div className="text-center mb-10">
          <Flame className="text-orange-500 mx-auto mb-4" size={40} />
          <h1 className="text-3xl font-black italic text-white">ENTER THE FORGE</h1>
          <p className="text-slate-500 text-sm mt-2">Welcome back, Puritan.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input 
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-orange-600 transition-all flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
        
        <p className="text-center mt-6 text-slate-500 text-sm">
          New here? <Link href="/auth/signup" className="text-orange-500 font-bold">Join the Puritans</Link>
        </p>
      </div>
    </div>
  );
}