import { useEffect, useState } from "react";
import { Calendar, Clock, Mail, Phone, RefreshCw, UserRound } from "lucide-react";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";

const statusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "done":
      return "bg-green-500/15 text-green-300";
    case "cancelled":
      return "bg-red-500/15 text-red-300";
    case "pending":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-blue-500/15 text-blue-300";
  }
};

export default function TrainerRequests() {
  const { error } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get("/trainer/bookings?page=1&limit=50");
        setRequests(response.data?.result || []);
      } catch (err) {
        console.error("Error loading trainer client requests:", err);
        error(err.response?.data?.message || "Failed to load client requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Requests</h1>
        <p className="mt-1 text-slate-400">Bookings made with you by clients.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : requests.length ? (
          <div className="space-y-3">
            {requests.map((request) => {
              const name = `${request.client?.first_name || ""} ${request.client?.last_name || ""}`.trim();
              return (
                <article key={request._id} className="rounded-xl border border-white/5 bg-slate-900/50 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                        <UserRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-white">{name || "Client"}</h2>
                        <p className="text-sm text-slate-400">{request.schedule?.class?.name || "Personal training booking"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(request.status)}`}>
                      {(request.status || "scheduled").replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                    {request.client?.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{request.client.email}</span>}
                    {request.client?.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{request.client.phone}</span>}
                    {request.schedule?.start_at && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.schedule.start_at).toLocaleString()}
                      </span>
                    )}
                    {request.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Booked {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {request.notes && <p className="mt-3 rounded-lg bg-slate-800/70 p-3 text-sm text-slate-300">{request.notes}</p>}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-slate-400">There are no client bookings to show.</p>
        )}
      </section>
    </div>
  );
}
