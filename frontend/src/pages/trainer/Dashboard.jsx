// pages/trainer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import Modal from "../../components/Modal.jsx";
import { 
  Dumbbell,
  Calendar,
  DollarSign,
  Activity,
  User,
  Clock,
  TrendingUp,
  Zap,
  Heart,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Menu,
  X,
  Play,
  CheckCircle,
  AlertCircle,
  Timer,
  Target,
  Flame,
  Users,
  UserPlus,
  Award,
  Wallet,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Star,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

export default function TrainerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  // View booking detail modal
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
 
    // Quick action modals
    const [showMyScheduleModal, setShowMyScheduleModal] = useState(false);
    const [showEarningsModal, setShowEarningsModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showClientRequestsModal, setShowClientRequestsModal] = useState(false);
    const [showMyClientsModal, setShowMyClientsModal] = useState(false);
    const [clientBookings, setClientBookings] = useState([]);
    const [myclients, setMyClients] = useState([]);

    const requestCount = clientBookings.length;
    const totalclients = myclients.length;

    const quickActions = [
      {
        title: "My Schedule",
        subtitle: "View today's sessions",
        icon: Calendar,
        bgColor: "bg-violet-500/10",
        iconColor: "text-violet-400",
        onClick: () => setShowMyScheduleModal(true)
      },
      {
        title: "Client Requests",
        subtitle: "Review client bookings",
        icon: ClipboardList,
        bgColor: "bg-amber-500/10",
        iconColor: "text-amber-400",
        onClick: () => setShowClientRequestsModal(true),
        badge: requestCount > 0 ? requestCount : null
      },
      {
        title: "My Clients",
        subtitle: "Manage trainees",
        icon: Users,
        bgColor: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        onClick: () => setShowMyClientsModal(true)
      },
      {
        title: "Earnings",
        subtitle: "Track your income",
        icon: Wallet,
        bgColor: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        onClick: () => setShowEarningsModal(true)
      },
      {
        title: "My Profile",
        subtitle: "Update your info",
        icon: User,
        bgColor: "bg-red-500/10",
        iconColor: "text-red-400",
        onClick: () => setShowProfileModal(true)
      }
    ];
 
  useEffect(() => {
    if (!user) return;
    setAnimateIn(true);
    fetchTrainerData();
  }, [user]);
 
  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      
      // Fetch trainer's upcoming bookings/sessions
      try {
        const bookingResponse = await api.get("/trainer/bookings?page=1&limit=10");
        const bookingsData = bookingResponse.data.result || [];
        
        const transformedBookings = bookingsData.map(booking => ({
          ...booking,
          date: booking.date || booking.createdAt || booking.scheduledDate 
            ? new Date(booking.date || booking.createdAt || booking.scheduledDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
            : "TBD",
          time: "TBD",
          client_name: booking.client?.first_name + " " + booking.client?.last_name || booking.client?.email || "Client"
        }));
        
        setMyBookings(transformedBookings);
      } catch (err) {
        console.log("No bookings found", err);
        setMyBookings([]);
      }

      // Fetch trainer earnings/payments
      try {
        const paymentResponse = await api.get("/trainer/earnings?page=1&limit=5");
        const paymentsArray = paymentResponse.data.data || paymentResponse.data.result || [];
        
        const transformedPayments = paymentsArray.map(payment => ({
          _id: payment._id,
          date: payment.date ? new Date(payment.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }),
          description: payment.description || "Training Session",
          amount: payment.amount || 0,
          status: payment.status?.toUpperCase() || "PAID"
        }));
        
        setRecentPayments(transformedPayments);
      } catch (err) {
        console.log("No payments found");
        setRecentPayments([]);
      }

      // Fetch trainer bookings for the client and request summaries
      try {
        const bookingsResponse = await api.get("/trainer/bookings?page=1&limit=50");
        const trainerBookings = bookingsResponse.data?.result || [];
        const uniqueClients = new Map();
        trainerBookings.forEach((booking) => {
          const client = booking.client;
          if (client?.client_id) uniqueClients.set(String(client.client_id), client);
        });
        setMyClients([...uniqueClients.values()]);
        setClientBookings(trainerBookings);
      } catch (err) {
        console.error("Error fetching trainer overview data", err);
        setMyClients([]);
        setClientBookings([]);
      }
    } catch (err) {
      console.error("Error fetching trainer data:", err);
    } finally {
      setLoading(false);
    }
  };  
 
  // Calculate total stats
  const totalSessions = myBookings.length;
  const completedSessions = myBookings.filter(b => b.status === 'completed' || b.status === 'done').length;
 
  // Stats cards
  const statsCards = [
    {
      label: "Total Sessions",
      value: totalSessions,
      icon: Dumbbell,
      color: "text-red-400",
      bgColor: "bg-red-500/10"
    },
    {
      label: "Completed",
      value: completedSessions,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    }
  ];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Welcome Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
           transition={{ duration: 0.5 }}
           className="mb-8"
         >
           <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
             Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Coach {user?.first_name || "Trainer"}!</span>
           </h1>
           <p className="text-slate-400 text-lg">Here's your training overview for today</p>
         </motion.div>

         {/* Quick Actions Grid */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
           transition={{ duration: 0.5, delay: 0.1 }}
           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
         >
           {quickActions.map((action, index) => (
             <motion.div
               key={action.title}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
               transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
               className="flex"
             >
               <div
                 onClick={action.onClick}
                 className={`group w-full flex flex-col justify-between p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 cursor-pointer relative ${
                   action.isCTA
                     ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30 hover:border-cyan-400/50"
                     : "bg-slate-800/40 border-white/10 hover:border-white/20"
                 }`}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     action.onClick?.();
                   }
                 }}
               >
                 <div className="text-left">
                   <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                     <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                   </div>
                   <h3 className="font-semibold mb-1 text-white group-hover:text-red-400 transition-colors">{action.title}</h3>
                   <p className="text-slate-400 text-sm">{action.subtitle}</p>
                 </div>
                 {action.badge && (
                   <div className="absolute top-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                     <span className="text-xs text-white font-bold">{action.badge}</span>
                   </div>
                 )}
               </div>
             </motion.div>
           ))}
        </motion.div>

        {/* Stats Cards Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: animateIn ? 1 : 0, scale: animateIn ? 1 : 0.9 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
              className="p-4 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile & Stats Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user?.first_name} {user?.last_name}</h3>
                  <p className="text-slate-400 text-sm">Personal Trainer</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Specialty</span>
                  <span className="text-white text-right">{user?.specialty || "General Fitness"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Experience</span>
                  <span className="text-white">{user?.experience_years || "0"} years</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Hourly Rate</span>
                  <span className="text-white">₱{user?.rate?.toLocaleString() || "0"}/hr</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-white">{user?.rating || "0.0"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-400">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Active
                  </span>
                </div>
              </div>

              <Link 
                to="/trainer/profile"
                className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition group"
              >
                <span>Edit Profile</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="lg:col-span-2 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-red-400" />
                  <span>Upcoming Sessions</span>
                </h3>
                <Link to="/trainer/schedule" className="text-sm text-red-400 hover:text-red-300 transition flex items-center space-x-1">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 rounded-xl bg-slate-700/30">
                      <div className="w-12 h-12 rounded-xl bg-slate-600/50"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-600/50 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-600/50 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myBookings.length > 0 ? (
                <div className="space-y-3">
                  {myBookings.slice(0, 4).map((booking, index) => (
                    <motion.div
                      key={booking._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetailModal(true);
                      }}
                      className="flex items-center space-x-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium group-hover:text-red-400 transition">
                          {booking.client_name || "client Session"}
                        </h4>
                        <p className="text-slate-400 text-sm flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>{booking.date || "Today"} • {booking.time || "TBD"}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          booking.status === 'completed' || booking.status === 'done'
                            ? 'bg-green-500/20 text-green-400' 
                            : booking.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status === 'scheduled' ? 'Scheduled' : 
                           booking.status === 'completed' ? 'Completed' : 
                           booking.status === 'in_progress' ? 'In Progress' : 
                           booking.status || 'Pending'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">No Upcoming Sessions</h4>
                  <p className="text-slate-400 text-sm mb-4">Your schedule is clear</p>
                  <Link 
                    to="/trainer/schedule"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>View Schedule</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Earnings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>Recent Earnings</span>
                </h3>
                <Link to="/trainer/earnings" className="text-sm text-red-400 hover:text-red-300 transition flex items-center space-x-1">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm border-b border-white/5">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length > 0 ? (
                      recentPayments.map((payment) => (
                        <tr key={payment._id} className="border-b border-white/5">
                          <td className="py-4 text-slate-300">{payment.date}</td>
                          <td className="py-4 text-white">{payment.description}</td>
                          <td className="py-4 text-white">₱{payment.amount.toLocaleString()}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'COMPLETED'
                                ? 'bg-green-500/20 text-green-400'
                                : payment.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-400">
                          No recent earnings
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                 </div>
              </div>
          </motion.div>

          {/* Performance Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="lg:col-span-1 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Performance</span>
              </h3>

              {/* Simple progress circle */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mb-4">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-700" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="none" 
                      className="text-green-500 transition-all duration-1000"
                      strokeDasharray="301.59"
                      strokeDashoffset="75"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round((completedSessions / (totalSessions || 1)) * 100)}%</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm text-center">Session Completion Rate</p>
                
                <div className="mt-6 w-full space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400">This Month</span>
                     <span className="text-white">{completedSessions} sessions</span>
                   </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rating</span>
                    <span className="text-amber-400 flex items-center">
                      <Star className="w-3 h-3 mr-1" fill="currentColor" />
                      {user?.rating || "0.0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
      </div>
    </main>

        {/* Booking Detail Modal */}
        <Modal isOpen={showBookingDetailModal} onClose={() => setShowBookingDetailModal(false)} title="Session Details">
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedBooking.client_name || "Client Session"}</h3>
                  <p className="text-slate-400 text-sm">{selectedBooking.date} • {selectedBooking.time}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedBooking.status === 'joined' || selectedBooking.status === 'in_training' || selectedBooking.status === 'on_going' || selectedBooking.status === 'in training' || selectedBooking.status === 'on going' ||
                   selectedBooking.status === 'completed'  
                     ? 'bg-green-500/20 text-green-400' 
                     : selectedBooking.status === 'cancelled'
                     ? 'bg-red-500/20 text-red-400' 
                     : selectedBooking.status === 'scheduled' 
                     ? 'bg-yellow-500/20 text-yellow-400'
                     : selectedBooking.status === 'on_going' 
                     ?? 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedBooking.status === 'in_training' || selectedBooking.status === 'in training' ? 'In Training' : 
                   selectedBooking.status === 'completed' || selectedBooking.status === 'completed' ? 
                    'Completed' :
                    selectedBooking.status === 'cancelled' || selectedBooking.status === 'cancelled' ? 
                    'Cancelled' :
                    selectedBooking.status === 'scheduled' || selectedBooking.status === 'scheduled' ? 
                    'Scheduled' :
                    selectedBooking.status === 'on_going' || selectedBooking.status === 'on going' ? 'Ongoing' : 
                    selectedBooking.status === 'joined' ? 'Joined' : selectedBooking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white">Personal Training</span>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <span className="text-slate-400 block mb-1">Notes</span>
                    <p className="text-white text-sm">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBookingDetailModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
                >
                  Close
                </button>
                <Link
                  to={`/trainer/schedule?session=${selectedBooking._id}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition text-center"
                >
                  View Schedule
                </Link>
              </div>
            </div>
          )}
        </Modal>

        {/* My Schedule Modal */}
      <Modal isOpen={showMyScheduleModal} onClose={() => setShowMyScheduleModal(false)} title="My Schedule">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">Today's Sessions</h3>
            </div>
            <span className="text-sm text-slate-400">
              {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {myBookings.length > 0 ? (
            <div className="space-y-3">
              {myBookings.slice(0, 5).map((booking, index) => (
                <motion.div
                  key={booking._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium group-hover:text-red-400 transition">
                          {booking.client_name || "Client Session"}
                        </h4>
                        <p className="text-slate-400 text-xs">{booking.client?.email || "No email"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'completed' || booking.status === 'done'
                        ? 'bg-green-500/20 text-green-400'
                        : booking.status === 'cancelled'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {booking.status === 'scheduled' ? 'Scheduled' :
                       booking.status === 'completed' ? 'Completed' :
                       booking.status === 'in_progress' ? 'In Progress' :
                       booking.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{booking.time || "TBD"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.date || "Today"}</span>
                    </div>
                  </div>
                  {booking.notes && (
                    <p className="mt-3 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      {booking.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-white font-medium mb-2">No Upcoming Sessions</h4>
              <p className="text-slate-400 text-sm">Your schedule is clear for today</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowMyScheduleModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
            >
              Close
            </button>
            <Link
              to="/trainer/schedule"
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition text-center"
            >
              View Full Schedule
            </Link>
          </div>
        </div>
      </Modal>

      {/* Client Requests Modal */}
      <Modal isOpen={showClientRequestsModal} onClose={() => setShowClientRequestsModal(false)} title="Client Requests">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Client Bookings</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400">
              {requestCount} bookings
            </span>
          </div>

          {clientBookings.length > 0 ? (
            <div className="space-y-3">
              {clientBookings.map((request, index) => (
                <motion.div
                  key={request._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium group-hover:text-red-400 transition">
                          {`${request.client?.first_name || ""} ${request.client?.last_name || ""}`.trim() || "Client"}
                        </h4>
                        <p className="text-slate-400 text-xs">
                          {request.createdAt ? `Booked ${new Date(request.createdAt).toLocaleDateString()}` : "Booking date unavailable"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 capitalize">
                      {(request.status || "scheduled").replaceAll("_", " ")}
                    </span>
                  </div>
                  {(request.schedule?.class?.name || request.notes) && (
                    <p className="mt-2 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      {request.schedule?.class?.name || request.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-white font-medium mb-2">All Caught Up!</h4>
              <p className="text-slate-400 text-sm">No client bookings to review</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowClientRequestsModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
            >
              Close
            </button>
            <Link
              to="/trainer/requests"
              className="flex-1 px-4 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 transition text-center"
            >
              View All Requests
            </Link>
          </div>
        </div>
      </Modal>

      {/* My Clients Modal */}
      <Modal isOpen={showMyClientsModal} onClose={() => setShowMyClientsModal(false)} title="My Clients" size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Active Clients</h3>
            </div>
            <span className="text-sm text-slate-400">
              {totalclients} total clients
            </span>
          </div>

          {myclients.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {myclients.map((client, index) => (
                <motion.div
                  key={client._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition group flex items-center space-x-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate group-hover:text-red-400 transition">
                      {client.first_name} {client.last_name}
                    </h4>
                    <p className="text-slate-400 text-sm truncate">{client.email}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-slate-500">Goal: {client.fitness_goal?.[0] || "General"}</span>
                      {client.phone && (
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">
                      Message
                    </button>
                    <Link
                      to={`/trainer/client/${client._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition text-center"
                    >
                      View Profile
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-white font-medium mb-2">No Clients Yet</h4>
              <p className="text-slate-400 text-sm">Clients will appear here when assigned to you</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowMyClientsModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
            >
              Close
            </button>
            <Link
              to="/trainer/clients"
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition text-center"
            >
              View All Clients
            </Link>
          </div>
        </div>
      </Modal>

      {/* Earnings Modal */}
      <Modal isOpen={showEarningsModal} onClose={() => setShowEarningsModal(false)} title="Earnings Overview" size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Income Details</h3>
            </div>
            <span className="text-sm text-slate-400">Recent transactions</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-white">
                ₱{recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <p className="text-slate-400 text-sm mb-1">Transactions</p>
              <p className="text-2xl font-bold text-white">{recentPayments.length}</p>
            </div>
          </div>

          {recentPayments.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {recentPayments.map((payment, index) => (
                <motion.div
                  key={payment._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'COMPLETED'
                        ? 'bg-green-500/20'
                        : payment.status === 'PENDING'
                        ? 'bg-yellow-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${
                        payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'COMPLETED'
                          ? 'text-green-400'
                          : payment.status === 'PENDING'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{payment.description}</h4>
                      <p className="text-slate-400 text-xs">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">₱{payment.amount.toLocaleString()}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : payment.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-white font-medium mb-2">No Earnings Yet</h4>
              <p className="text-slate-400 text-sm">Your earnings will appear here</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowEarningsModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
            >
              Close
            </button>
            <Link
              to="/trainer/earnings"
              className="flex-1 px-4 py-3 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition text-center"
            >
              View Detailed Report
            </Link>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="My Profile">
        <div className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-slate-400">Personal Trainer</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-700/30 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Specialty</span>
              <span className="text-white font-medium capitalize">{user?.specialty || "General Fitness"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Experience</span>
              <span className="text-white font-medium">{user?.experience_years || 0} years</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Hourly Rate</span>
              <span className="text-white font-medium">₱{user?.rate?.toLocaleString() || "0"}/hr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Rating</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <span className="text-white font-medium">{user?.rating || "0.0"}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Email</span>
              <span className="text-white font-medium text-sm">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Phone</span>
              <span className="text-white font-medium">{user?.phone || "Not set"}</span>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowProfileModal(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
            >
              Close
            </button>
            <Link
              to="/trainer/profile"
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition text-center"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </Modal>


    </div>
  );
}