import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, DollarSign, RefreshCw } from "lucide-react";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function TrainerEarnings() {
  const { error } = useNotification();
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/trainer/earnings?page=${pagination.page}&limit=10`);
        setEarnings(response.data?.result || []);
        setSummary(response.data?.totalEarnings || 0);
        setPagination((current) => ({
          ...current,
          totalPages: response.data?.totalPages || 1,
          total: response.data?.total || 0
        }));
      } catch (err) {
        console.error("Error loading trainer earnings:", err);
        error(err.response?.data?.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [error, pagination.page]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Earnings</h1>
        <p className="mt-1 text-slate-400">Your trainer booking payments and income summary.</p>
      </header>

      <section className="rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 to-slate-800/50 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <DollarSign className="w-6 h-6" />
          </span>
          <div>
            <p className="text-sm text-slate-400">Total paid earnings</p>
            <p className="text-2xl font-bold text-white">₱{summary.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/50">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : earnings.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-slate-700/50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Client</th>
                    <th className="px-5 py-4 font-medium">Payment</th>
                    <th className="px-5 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {earnings.map((earning) => (
                    <tr key={earning._id} className="text-sm">
                      <td className="px-5 py-4 text-slate-300">
                        <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-500" />{earning.date ? new Date(earning.date).toLocaleDateString() : "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-white">{earning.client_name || "Client"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          earning.status === "PAID"
                            ? "bg-green-500/15 text-green-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}>
                          {earning.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-white">₱{Number(earning.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-slate-400">
              <span>{pagination.total} transactions · Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-slate-400">No trainer booking payments found.</p>
        )}
      </section>
    </div>
  );
}
