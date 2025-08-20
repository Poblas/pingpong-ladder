"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    // Obtener usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMsg("Error: no se pudo identificar el usuario.");
      setLoading(false);
      return;
    }

    // Validar que el username sea único
    const { data: existing, error: checkError } = await supabase
      .from("Profiles")
      .select("*")
      .eq("display_name", name)
      .maybeSingle();

    if (checkError) {
      setMsg("Error validando el nombre.");
      setLoading(false);
      return;
    }

    if (existing) {
      setMsg("Ese nombre ya está en uso.");
      setLoading(false);
      return;
    }

    // Guardar el nombre en su perfil
    const { error: updateError } = await supabase
      .from("Profiles")
      .update({ display_name: name })
      .eq("user_id", user.id);

    if (updateError) {
      setMsg("Error guardando el nombre.");
      setLoading(false);
      return;
    }

    setMsg("¡Perfil creado!");
    setTimeout(() => router.replace("/dashboard"), 800);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleSave}
        className="bg-white p-6 rounded shadow w-80 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Elige tu nombre</h1>
        <input
          type="text"
          placeholder="Tu username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        {msg && <p className="text-center text-sm">{msg}</p>}
      </form>
    </div>
  );
}

