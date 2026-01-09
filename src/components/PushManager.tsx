"use client"

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { supabase } from '@/lib/supabase';

export default function PushManager() {
  
  useEffect(() => {
    async function runOneSignal() {
      try {
        // We cast this object 'as any' to stop TypeScript from complaining 
        // about the 'notifyButton' property.
        await OneSignal.init({
          appId: "e2ae7af9-258c-4cbe-8397-99a8cc438376", 
          safari_web_id: "web.onesignal.auto.3cda868c-95ba-4dc0-a9c6-5ad5b099bc53",
          allowLocalhostAsSecureOrigin: true, 
          notifyButton: {
            enable: true, 
          },
        } as any); // <--- THIS 'as any' FIXES THE ERROR

        // Ask for permission
        await OneSignal.Slidedown.promptPush();

        // Save User ID to Supabase
        // Wait 3 seconds to ensure OneSignal has finished connecting
        setTimeout(async () => {
           // New Syntax for getting ID in v16+
           const playerId = OneSignal.User.PushSubscription.id;
           
           if (playerId) {
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                console.log("🔔 OneSignal ID Found:", playerId);
                await supabase
                  .from('profiles')
                  .update({ onesignal_id: playerId })
                  .eq('id', session.user.id);
             }
           }
        }, 3000);

      } catch (error) {
        console.error("OneSignal Init Error:", error);
      }
    }

    runOneSignal();
  }, []);

  return null;
}