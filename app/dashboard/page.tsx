"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Site {
  id: string;
  url: string;
  status: string;
  last_checked_at: string | null;
  user_id: string;
}

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSites = async () => {
    console.log("Refreshing sites..."); // Add this to debug
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("created_at", { ascending: false }); // Latest sites at the top

    if (error) {
      console.error("Error loading sites:", error);
    } else {
      setSites(data || []);
    }
  };

  useEffect(() => {
    let isMounted = true; // Prevents memory leaks if user leaves page fast

    const fetchInitialData = async () => {
      if (isMounted) {
        await loadSites();
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty array means "only run once on load"

const handleAddSite = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('sites')
    .insert([{ 
      url: newUrl, 
      user_id: user?.id,
      status: 'pending' // Explicitly set it so the UI knows
    }]);

  if (error) {
    alert(error.message);
  } else {
    setNewUrl("");
    await loadSites();
  }
  setIsSubmitting(false);
};

  const handleDeleteSite = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to remove this site?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("sites").delete().eq("id", id);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      // OPTIMISTIC UPDATE: Manually filter out the deleted site from the UI state
      setSites((currentSites) => currentSites.filter((site) => site.id !== id));
      console.log("Site removed from UI state.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    try {
      const host = window.location.hostname.split(':')[0];
      const hostPrefix = host.split('.')[0] || host;
      const cookieName = `sb-${hostPrefix}-auth-token`;
      document.cookie = `${cookieName}=; path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log('Cleared auth cookie:', cookieName);
    } catch (e) {
      console.warn('Failed to clear auth cookie:', e);
    }
    router.push("/login"); // Send them back to login after signing out
  };

  useEffect(() => {
    // Listen for ANY changes to the 'sites' table
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sites" },
        () => {
          console.log("Change detected! Reloading...");
          loadSites(); // Auto-refresh whenever the Python script updates a row
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
  // 1. Create a "Pipe" to Supabase
  const channel = supabase
    .channel('realtime-sites')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sites' },
      (payload) => {
        console.log('Change received!', payload);
        loadSites(); // Refresh the list automatically!
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase, loadSites]);

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="grid grid-cols-3 items-center mb-8">
        {/* Left Column: Empty or for a "back" button later */}
        <div></div>

        {/* Middle Column: Centered Text */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">StillUp?</h1>
          <p className="text-sm text-slate-500">
            Monitor your uptime in real-time
          </p>
        </div>

        {/* Right Column: Logout Button */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="relative z-10 cursor-pointer text-sm px-3 py-1 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors font-medium shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>
      {/* Add Site Form */}
      <form onSubmit={handleAddSite} className="flex gap-2 mb-10">
        <input
          className="border border-slate-200 p-3 flex-1 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://example.com"
          type="url"
          required
        />
        <button className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md active:scale-95">
          Add Site
        </button>
      </form>

      {/* Sites List Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-800">Your Sites</h2>
          <button
            onClick={() => {
              loadSites();
            }}
            className="text-xs cursor-pointer flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <span className="text-lg">↻</span> Refresh Status
          </button>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">
              No sites added yet. Start by adding one above!
            </p>
          </div>
        ) : (
          sites.map((site) => (
            <div
              key={site.id}
              className="p-5 border border-slate-200 rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-1">
                <span className="font-mono text-blue-600 font-medium text-lg truncate max-w-[250px] sm:max-w-md">
                  {site.url}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  {site.last_checked_at
                    ? `Checked ${formatDistanceToNow(new Date(site.last_checked_at))} ago`
                    : "Awaiting first check..."}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    site.status === "up"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : site.status === "down"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {site.status || "PENDING"}
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteSite(site.id)}
                  className="text-slate-300 cursor-pointer hover:text-red-500 transition-colors p-1"
                  title="Delete site"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
