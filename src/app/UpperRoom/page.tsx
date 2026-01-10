"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import UpperRoom from '@/components/UpperRoom';
import { Loader2 } from 'lucide-react';

export default function UpperRoomPage() {
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        setProfileName(profile?.full_name?.split(' ')[0] || 'Puritan');
      }
      setLoading(false);
    }
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-white overflow-hidden">
      {user && (
        <UpperRoom 
          user={user} 
          profileName={profileName} 
          isFullPage={true} 
        />
      )}
    </div>
  );
}