"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Flame, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'; // <--- Added Eye icons
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <--- New State

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Create the Auth User
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, 
        }
      }
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Create the Puritan Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: data.user.id, 
          full_name: fullName, 
          updated_at: new Date() 
        });

      if (profileError) {
        console.error("Forge Profile Error:", profileError.message);
      } else {
        // 3. SEND WELCOME EMAIL (Trigger API)
        const firstName = fullName.split(' ')[0];
        
        await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email, 
            firstName: firstName 
          }),
        });

        alert("Welcome, Puritan! Your account has been forged.");
      }
      
      // 4. Redirect to Dashboard
      router.push('/'); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="bg-orange-500 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20 rotate-3">
            <Flame className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">Join The Forge</h1>
          <p className="text-slate-500 mt-2 font-medium">Identify yourself, Puritan.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          
          {/* Full Name Input */}
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              required
              type="text" 
              placeholder="Your Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold"
            />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold"
            />
          </div>

          {/* Password Input with Toggle */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input 
              required
              type={showPassword ? "text" : "password"} // <--- Dynamic Type
              placeholder="Secure Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold"
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
            className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-orange-500/10"
          >
            {loading ? <Loader2 className="animate-spin text-orange-500" /> : <>FORGE MY ACCOUNT <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 font-medium">
          Already a Puritan? <Link href="/auth/login" className="text-white font-black hover:text-orange-500 transition-colors underline decoration-slate-800 underline-offset-4">Login here</Link>
        </p>
      </div>
    </div>
  );
}