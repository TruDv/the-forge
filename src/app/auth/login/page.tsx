"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Flame, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'; // <--- Added Icons
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <--- New State

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/'); // Send them to The Forge
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-10">
          <Flame className="text-orange-500 mx-auto mb-4" size={40} />
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">ENTER THE FORGE</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Welcome back, Puritan.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email Input */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              required
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-transparent focus:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold placeholder:text-slate-600"
            />
          </div>

          {/* Password Input with Toggle */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              required
              type={showPassword ? "text" : "password"} // <--- Dynamic Type
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-transparent focus:border-slate-700 rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold placeholder:text-slate-600"
            />
            {/* Eye Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-orange-600 transition-all flex justify-center shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : "SIGN IN"}
          </button>
        </form>
        
        <p className="text-center mt-6 text-slate-500 text-sm font-medium">
          New here? <Link href="/auth/signup" className="text-white font-bold hover:text-orange-500 transition-colors underline decoration-slate-700 underline-offset-4">Join the Puritans</Link>
        </p>
      </div>
    </div>
  );
}