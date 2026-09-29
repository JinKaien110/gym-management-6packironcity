import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Dumbbell, Heart, Zap, Activity, ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import api from "../api/axios.js";

const classTypes = [
  { name: "Yoga", icon: Activity, color: "bg-purple-500" },
  { name: "Calisthenics", icon: Dumbbell, color: "bg-blue-500" },
  { name: "HIIT", icon: Zap, color: "bg-orange-500" },
  { name: "Boxing", icon: Heart, color: "bg-red-500" },
];

const mockSchedules = [
  { _id: "1", className: "Yoga", instructor: "Jane Rivera", startTime: "06:00", endTime: "07:00", dayOfWeek: "Monday", maxParticipants: 20, bookedCount: 12 },
  { _id: "2", className: "HIIT", instructor: "Mark Dela Cruz", startTime: "07:00", endTime: "08:00", dayOfWeek: "Monday", maxParticipants: 15, bookedCount: 14 },
  { _id: "3", className: "Boxing", instructor: "Mike Torres", startTime: "08:00", endTime: "09:00", dayOfWeek: "Monday", maxParticipants: 10, bookedCount: 8 },
  { _id: "4", className: "Calisthenics", instructor: "John Smith", startTime: "10:00", endTime: "11:00", dayOfWeek: "Monday", maxParticipants: 15, bookedCount: 10 },
  { _id: "5", className: "Yoga", instructor: "Jane Rivera", startTime: "06:00", endTime: "07:00", dayOfWeek: "Tuesday", maxParticipants: 20, bookedCount: 15 },
  { _id: "6", className: "HIIT", instructor: "Mark Dela Cruz", startTime: "07:00", endTime: "08:00", dayOfWeek: "Tuesday", maxParticipants: 15, bookedCount: 15 },
  { _id: "7", className: "Boxing", instructor: "Mike Torres", startTime: "08:00", endTime: "09:00", dayOfWeek: "Wednesday", maxParticipants: 10, bookedCount: 6 },
  { _id: "8", className: "Yoga", instructor: "Jane Rivera", startTime: "06:00", endTime: "07:00", dayOfWeek: "Thursday", maxParticipants: 20, bookedCount: 18 },
  { _id: "9", className: "HIIT", instructor: "Mark Dela Cruz", startTime: "07:00", endTime: "08:00", dayOfWeek: "Friday", maxParticipants: 15, bookedCount: 12 },
  { _id: "10", className: "Calisthenics", instructor: "John Smith", startTime: "10:00", endTime: "11:00", dayOfWeek: "Saturday", maxParticipants: 15, bookedCount: 10 },
  { _id: "11", className: "Boxing", instructor: "Mike Torres", startTime: "08:00", endTime: "09:00", dayOfWeek: "Saturday", maxParticipants: 10, bookedCount: 9 },
  { _id: "12", className: "Yoga", instructor: "Jane Rivera", startTime: "09:00", endTime: "10:00", dayOfWeek: "Sunday", maxParticipants: 20, bookedCount: 16 },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ClassSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, scheduleRes] = await Promise.all([
          api.get("/class?status=active&limit=100").catch(() => ({ data: { data: [] } })),
          api.get("/class-schedule?status=active").catch(() => ({ data: { data: [] } }))
        ]);
        
        const rawSchedules = scheduleRes.data?.result || scheduleRes.data?.data || [];
        
        // Transform data from API format to component format
        const transformedSchedules = rawSchedules.map(s => {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const startDate = new Date(s.start_at);
          const endDate = new Date(s.end_at);
          
          return {
            _id: s._id,
            className: s.class?.name || "N/A",
            classId: s.class?.class_id || s.class?._id,
            instructor: s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : "TBA",
            trainerEmail: s.trainer?.email,
            trainerPhone: s.trainer?.phone,
            startTime: startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
            endTime: endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
            start_at: s.start_at,
            end_at: s.end_at,
            dayOfWeek: dayNames[startDate.getDay()],
            maxParticipants: s.capacity || 0,
            bookedCount: s.joined_count || 0,
            availableSlots: s.available_slots || 0,
            location: s.location || "TBA",
            notes: s.notes,
            status: s.status
          };
        });
        
        setClasses(classRes.data.data || []);
        setSchedules(transformedSchedules);
      } catch (err) {
        console.error("Error fetching data:", err);
        setSchedules(mockSchedules);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getClassType = (className) => {
    return classTypes.find(c => c.name.toLowerCase() === className?.toLowerCase()) || classTypes[0];
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesDay = schedule.dayOfWeek === selectedDay;
    const matchesClass = selectedClass === "all" || schedule.className?.toLowerCase() === selectedClass.toLowerCase();
    const matchesSearch = !searchTerm || 
      schedule.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDay && matchesClass && matchesSearch;
  });

  const availableClasses = [...new Set(schedules.map(s => s.className).filter(Boolean))];

  return (
    <div className="min-h-screen text-white relative">
      {/* Hero */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              CLASS <span className="text-red-500">SCHEDULES</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Browse our group fitness classes and book your spot today. Certified instructors, real-time availability, and personalized fitness.
            </p>
          </motion.div>

          {/* Class Types */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {classTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${type.color} bg-opacity-20 border border-white/10 flex items-center gap-3`}
              >
                <type.icon className="w-6 h-6" />
                <span className="font-semibold">{type.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative z-10 py-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Day Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedDay === day 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-800">All Classes</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls} className="bg-slate-800">{cls}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Grid */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {selectedDay} Classes
            </h2>
            <span className="text-gray-400">
              {filteredSchedules.length} classes available
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading schedules...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">No Classes Found</h3>
              <p className="text-gray-400 mb-6">There are no classes scheduled for this day.</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                Login to Book Classes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchedules.map((schedule, index) => {
                const classType = getClassType(schedule.className);
                const availableSlots = (schedule.maxParticipants || 15) - (schedule.bookedCount || 0);
                const isFull = availableSlots <= 0;

                return (
                  <motion.div
                    key={schedule._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${classType.color} flex items-center justify-center`}>
                        <classType.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isFull 
                          ? 'bg-red-500/20 text-red-500' 
                          : 'bg-green-500/20 text-green-500'
                      }`}>
                        {isFull ? 'FULL' : `${availableSlots} spots left`}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{schedule.className}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{schedule.instructor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400">
                        {(schedule.bookedCount || 0)}/{schedule.maxParticipants || 15} booked
                      </div>
                      {isFull ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-lg bg-gray-600/50 text-gray-400 font-semibold cursor-not-allowed"
                        >
                          Waitlist
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold transition-all"
                        >
                          Book Now
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 py-16 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              WHY JOIN OUR <span className="text-red-500">CLASSES</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Certified Trainers</h3>
              <p className="text-gray-400">All classes are led by certified instructors with years of experience in their respective fields.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Booking</h3>
              <p className="text-gray-400">Book your spot instantly and receive instant notifications for confirmations and cancellations.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                <img src="/icons/6pack.jpg" className="w-6 h-6 object-cover rounded-xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Modern Equipment</h3>
              <p className="text-gray-400">Train with top-of-the-line equipment in our spacious, well-ventilated group fitness studios.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              READY TO JOIN A CLASS?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Login to your client portal to book classes and track your fitness journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                <Calendar className="w-5 h-5" />
                Login to Book
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                Sign Up Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}