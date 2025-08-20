"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: true }); // temporalmente por fecha

      if (!error && data) {
        setProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-6">🏓 Ranking de Jugadores</h1>

      {loading ? (
        <p>Cargando jugadores...</p>
      ) : profiles.length === 0 ? (
        <p>No hay jugadores todavía.</p>
      ) : (
        <table className="table-auto border-collapse border border-gray-400 w-full max-w-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-4 py-2">Posición</th>
              <th className="border border-gray-400 px-4 py-2">Jugador</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <tr key={p.id} className="text-center">
                <td className="border border-gray-400 px-4 py-2">{i + 1}</td>
                <td className="border border-gray-400 px-4 py-2">
                  {p.display_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
