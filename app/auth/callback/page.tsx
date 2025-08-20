 'use client';
 import { useEffect, useState } from 'react';
 import { getSupabaseClient } from '@/lib/supabaseClient';
 import { useRouter } from 'next/navigation';

 export default function Callback() {
   const supabase = getSupabaseClient();
   const router = useRouter();
   const [msg, setMsg] = useState('Verificando enlace...');

   useEffect(() => {
     (async () => {
       const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
       if (error) { setMsg(`Error: ${error.message}`); return; }

       // checar si ya tiene display_name
       const uid = data.session?.user?.id;
       if (!uid) { setMsg('Sesión no encontrada'); return; }

       const { data: prof } = await supabase
         .from('profiles')
         .select('display_name')
         .eq('user_id', uid)
         .maybeSingle();

-      setMsg('¡Listo! Iniciaste sesión.');
-      setTimeout(() => router.replace('/'), 800);
+      setMsg('¡Listo! Iniciaste sesión.');
+      const hasName = !!prof?.display_name;
+      setTimeout(() => router.replace(hasName ? '/dashboard' : '/onboarding'), 600);
     })();
   }, []);

   return <p>{msg}</p>;
 }
