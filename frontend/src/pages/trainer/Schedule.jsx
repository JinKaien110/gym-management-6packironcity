import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, RefreshCw, User } from "lucide-react";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";

const formatDate = (value) => value
  ? new Date(value).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  : "Date not set";

const formatTime = (start, end) => {
  if (!start) return "Time not set";
  const from = new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const to = end
    ? new Date(end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;
  return to ? `${from} - ${to}` : from;
};

export default function TrainerSchedule() {
  const { error } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const [scheduleResponse, bookingResponse] = await Promise.all([
          api.get("/trainer/class-schedule?page=1&limit=50"),
          api.get("/trainer/bookings?page=1&limit=50")
        ]);

        const schedules = scheduleResponse.data?.result || [];
        const bookings = bookingResponse.data?.result || [];
        const classSessions = schedules.map((schedule) => ({
          ...schedule,
          _id: `class-${schedule._id}`,
          kind: "Class",
          title: schedule.class?.name || schedule.class_name || "Class Session",
          date: schedule.start_at,
          start_at: schedule.start_at,
          end_at: schedule.end_at
        }));
        const personalSessions = bookings.map((booking) => ({
          ...booking,
          kind: "Personal Training",
          title: booking.client
            ? `${booking.client.first_name || ""} ${booking.client.last_name || ""}`.trim() || "Client Session"
            : "Client Session",
          date: booking.schedule?.start_at || booking.date || booking.createdAt,
          bookedAt: booking.createdAt || booking.date,
          start_at: booking.schedule?.start_at,
          end_at: booking.schedule?.end_at
        }));

        setSessions([...classSessions, ...personalSessions].sort(
          (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
        ));
      } catch (err) {
        console.error("Error loading trainer schedule:", err);
        error(err.response?.data?.message || "Failed to load your schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Schedule</h1>
        <p className="mt-1 text-slate-400">Your assigned classes and personal training sessions.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-800/50 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-red-400" />
          </div>
        ) : sessions.length ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <article key={session._id} className="flex gap-4 rounded-xl border border-white/5 bg-slate-900/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{session.title}</h2>
                    <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs text-violet-300">{session.kind}</span>
                    {session.status && (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-slate-300">{session.status}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{
                      session.kind === "Personal Training"
                        ? `Booked ${formatDate(session.bookedAt)}`
                        : formatDate(session.start_at)
                    }</span>
                    {session.start_at && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatTime(session.start_at, session.end_at)}</span>}
                    {session.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{session.location}</span>}
                    {session.client?.email && <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{session.client.email}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-slate-400">No sessions are currently scheduled.</p>
        )}
      </section>
    </div>
  );
}
