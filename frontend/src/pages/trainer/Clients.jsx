import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, RefreshCw, Search, UserRound } from "lucide-react";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function TrainerClients() {
  const { error } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await api.get("/trainer/bookings?page=1&limit=50");
        setBookings(response.data?.result || []);
      } catch (err) {
        console.error("Error loading trainer clients:", err);
        error(err.response?.data?.message || "Failed to load your clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [error]);

  const clients = useMemo(() => {
    const uniqueClients = new Map();
    bookings.forEach((booking) => {
      const client = booking.client;
      if (client?.client_id) uniqueClients.set(String(client.client_id), client);
    });

    const query = search.trim().toLowerCase();
    return [...uniqueClients.values()].filter((client) => {
      const fullName = `${client.first_name || ""} ${client.last_name || ""}`.toLowerCase();
      return !query || fullName.includes(query) || client.email?.toLowerCase().includes(query);
    });
  }, [bookings, search]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Clients</h1>
        <p className="mt-1 text-slate-400">Clients who have booked training sessions with you.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search clients by name or email"
          className="w-full rounded-xl border border-white/10 bg-slate-800/60 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : clients.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {clients.map((client) => (
              <article key={client.client_id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <UserRound className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-white">
                    {client.first_name} {client.last_name}
                  </h2>
                  {client.email && <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-400"><Mail className="w-4 h-4 shrink-0" />{client.email}</p>}
                  {client.phone && <p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><Phone className="w-4 h-4 shrink-0" />{client.phone}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-slate-400">
            {search ? "No clients match your search." : "Clients will appear here after they book a session."}
          </p>
        )}
      </section>
    </div>
  );
}
