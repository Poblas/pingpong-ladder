"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Callback() {
  const [msg, setMsg] = useState("Procesando login...");
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setMsg("Error iniciando sesión.");
        setTimeout(() => router.replace("/"), 1500);
        return;
      }

      // Revisar si ya existe perfil
      const { data: profile, error: profileError } = await supabase
        .from("Profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        // Crear perfil si no existe
        await supabase.from("Profiles").insert([
          {
            user_id: user.id,
            display_name: null,
          },
        ]);
      }

      setMsg("¡Listo! Iniciaste sesión.");

      // Si tiene nombre → dashboard, si no → onboarding
      const goTo = profile?.display_name ? "/dashboard" : "/onboarding";
      setTimeout(() => router.replace(goTo), 800);
    };

    handleLogin();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>{msg}</p>
    </div>
  );
}

