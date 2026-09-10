// pages/client/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import Modal from "../../components/Modal.jsx";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Activity,
  User,
  Clock,
  TrendingUp,
  Zap,
  Heart,
  Dumbbell,
  ChevronRight,
  Play,
  CheckCircle,
  Check,
  AlertCircle,
  Timer,
  Target,
  Flame,
  Users,
  UserCheck,
  Filter,
  Star,
  Shield
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  console.log("Dashboard user data:", user);
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  // Join Class Modal State
  const [joinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [classSchedules, setClassSchedules] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showConfirmJoinModal, setShowConfirmJoinModal] = useState(false);
  const [classFilter, setClassFilter] = useState({
    day: "",
    time: "",
    trainer: ""
  });

  // Book Trainer Modal State
  const [bookTrainerModalOpen, setBookTrainerModalOpen] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [selectedHours, setSelectedHours] = useState(1);
  const [membershipConfig, setMembershipConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

   // Booking Detail Modal State
   const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
   const [selectedBooking, setSelectedBooking] = useState(null);

   // Daily Pass Modal State
   const [showDailyPassModal, setShowDailyPassModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setAnimateIn(true);
    fetchclientData();
  }, [user]);

  const fetchclientData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings (both class and trainer bookings from same endpoint)
      try {
        const bookingResponse = await api.get("/client/my-bookings?page=1&limit=10");
        const allBookings = bookingResponse.data.data || [];
        
        // Transform bookings - differentiate between class and trainer bookings
        const transformedBookings = allBookings.map(booking => {
          // Check if it's a trainer booking (has trainer_id) or class booking (has schedule_id)
          const isTrainerBooking = !!booking.trainer?.trainer_id;
          
          // Get trainer name from nested trainer object
          const trainerFirstName = booking.trainer?.first_name ? booking.trainer.first_name.trim() : '';
          const trainerLastName = booking.trainer?.last_name ? booking.trainer.last_name.trim() : '';
          const trainerName = trainerFirstName || trainerLastName ? `${trainerFirstName} ${trainerLastName}`.trim() : null;
          
          // Get schedule start time for display (fallback to booking createdAt for trainer bookings)
          const scheduleStart = booking.schedule?.start_at || booking.class?.start_at || booking.booking?.createdAt || booking.createdAt;
          const scheduleEnd = booking.schedule?.end_at || booking.class?.end_at;
          
          // Format date and time from schedule start_at
          const formatDate = (dateStr) => {
            if (!dateStr) return "N/A";
            return new Date(dateStr).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
          };
          
          const formatTime = (dateStr) => {
            if (!dateStr) return "TBD";
            return new Date(dateStr).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
          };
          
          return {
            ...booking,
            type: isTrainerBooking ? 'trainer' : 'class',
            class_name: isTrainerBooking 
              ? (trainerName ? `${trainerName} Session` : "Trainer Session") 
              : (booking.class?.name || "Fitness Class"),
            schedule_id: booking.schedule?.schedule_id,
            trainer_id: booking.trainer?.trainer_id,
            trainer_name: trainerName,
            schedule_start: scheduleStart,
            schedule_end: scheduleEnd,
            hours: booking.booking?.hours,
            date: formatDate(scheduleStart),
            time: formatTime(scheduleStart),
            status: (booking.booking?.status || booking.status || 'Pending'),
          };
        });
        
        // Sort by schedule start date (newest first)
        const sortedBookings = transformedBookings
          .sort((a, b) => {
            const dateA = new Date(a.schedule_start || a.createdAt || 0);
            const dateB = new Date(b.schedule_start || b.createdAt || 0);
            return dateB - dateA;
          });
        
        setBookings(sortedBookings);
      } catch (err) {
        console.log("No bookings found", err);
        setBookings([]);
      }

      // Fetch payments
      try {
        const paymentResponse = await api.get("/client/payments?page=1&limit=5");
        const paymentsArray = paymentResponse.data.result || paymentResponse.data.data || [];
        
        // Transform payments to match component structure
        const formatPaymentFor = (value) => {
          if (!value) return "Payment";
          const formatMap = {
            "daily_pass": "Daily Pass",
            "client_pass": "client Pass",
            "membership": "membership",
            "registration": "Registration Fee",
            "freeze": "Freeze Fee",
            "extension": "Extension Fee"
          };
          const lower = value.toLowerCase();
          return formatMap[lower] || value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
        };
        
        const transformedPayments = paymentsArray.map(payment => ({
          _id: payment._id,
          date: payment.date ? new Date(payment.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }),
          description: formatPaymentFor(payment.payment_for) || formatPaymentFor(payment.type) || "Payment",
          amount: payment.amount || 0,
          status: payment.status?.toUpperCase() || "PENDING"
        }));
        
        setRecentPayments(transformedPayments);
      } catch (err) {
        console.log("No payments found");
        setRecentPayments([]);
      }
    } catch (err) {
      console.error("Error fetching client data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available class schedules
   const fetchClassSchedules = async () => {
     try {
       setClassLoading(true);
       const response = await api.get("/client/class-schedule?status=open&limit=50");
       const data = response.data.result || response.data.data || [];

       // Transform to match expected format
       const transformed = data.map(schedule => {
         const startDate = new Date(schedule.start_at);
         const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
         const day = days[startDate.getDay()];



         const trainerFirstName = schedule.trainer?.first_name?.trim() || '';
         const trainerLastName = schedule.trainer?.last_name?.trim() || '';
         const trainerName = trainerFirstName || trainerLastName ? `${trainerFirstName} ${trainerLastName}`.trim() : '';

         return {
           ...schedule,
           _id: schedule._id,
           class_name: schedule.class?.name || "Fitness Class",
           trainer_name: trainerName,
           day: day,
           start_at: schedule.start_at,
           end_at: schedule.end_at,
           capacity: schedule.capacity,
           joined_count: schedule.joined_count || 0,
           location: schedule.location || 'Main Gym',
           status: schedule.status || 'open'
         };
       });

       setClassSchedules(transformed);
     } catch (err) {
       console.error("Error fetching class schedules:", err);
       error("Failed to load class schedules");
     } finally {
       setClassLoading(false);
     }
   };

  // Fetch available trainers
  const fetchTrainers = async () => {
    try {
      setTrainerLoading(true);
      const response = await api.get("/trainers");
      console.log("Trainers response:", response.data);
      // Handle response format: { trainers: [...], page, total, etc. }
      let trainerData = [];
      if (response.data && response.data.trainers) {
        trainerData = response.data.trainers;
      } else if (response.data && response.data.data) {
        trainerData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        trainerData = response.data;
      } else if (response.data && response.data.result) {
        trainerData = Array.isArray(response.data.result) ? response.data.result : [];
      }
      setTrainers(trainerData);
    } catch (err) {
      console.error("Error fetching trainers:", err);
      error("Failed to load trainers");
    } finally {
      setTrainerLoading(false);
    }
  };

  // Join a class
  const handleJoinClass = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await api.post(`/client/booking/${selectedClass._id}`);
      if (response.data) {
        success("Successfully joined the class!");
        setJoinClassModalOpen(false);
        setSelectedClass(null);
        setShowConfirmJoinModal(false);
        fetchclientData(); // Refresh bookings
      }
    } catch (err) {
      console.error("Error joining class:", err);
      error(err.response?.data?.message || "Failed to join class");
    }
  };

  // Select class and show confirm modal
  const handleSelectClass = (schedule) => {
    setSelectedClass(schedule);
    setShowConfirmJoinModal(true);
  };

   // Book a trainer - redirect to payment
   const handleBookTrainer = async (trainer) => {
     if (!selectedTrainer) {
       error("Please select a trainer");
       return;
     }

     const amount = (selectedTrainer.rate || 0) * selectedHours;
     const trainerName = encodeURIComponent(selectedTrainer.first_name + ' ' + selectedTrainer.last_name);
     
     // Navigate to payment page with trainer booking params
     navigate(`/client/payment?payment_for=trainer-booking&trainer_id=${selectedTrainer._id}&hours=${selectedHours}&amount=${amount}&trainer_name=${trainerName}`);
     
     setBookTrainerModalOpen(false);
     setSelectedTrainer(null);
     setSelectedHours(1);
     setBookingNotes("");
   };

   // Complete trainer booking
   const handleCompleteBooking = async (booking) => {
     if (!booking || !booking._id) return;
     
     try {
       const response = await api.patch(`/client/booking/trainer/${booking._id}/complete`);
       if (response.data) {
         success("Training session marked as completed!");
         setShowBookingDetailModal(false);
         setSelectedBooking(null);
         fetchclientData(); // Refresh bookings
       }
     } catch (err) {
       console.error("Error completing booking:", err);
       error(err.response?.data?.message || "Failed to complete booking");
     }
   };

  // Open join class modal
  const openJoinClassModal = () => {
    fetchClassSchedules();
    setJoinClassModalOpen(true);
  };

  // Open book trainer modal
  const openBookTrainerModal = () => {
    fetchTrainers();
    setBookTrainerModalOpen(true);
  };

   const handleLogout = async () => {
     await logout();
     success("Logged out successfully!");
     navigate("/login");
   };

   // Handle Daily Pass card click
   const handleDailyPassClick = () => {
     const clientPass = user?.client_pass;
     if (clientPass && clientPass.status === 'active') {
       setShowDailyPassModal(true);
     } else {
       navigate('/client/daily-pass');
     }
   };

  // Helper to capitalize first letter
  const ucfirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper component for detail rows
  const DetailField = ({ label, value }) => (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-medium text-sm truncate" title={value}>{value}</p>
    </div>
  );

  // Calculate BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return { label: "Not Set", color: "text-slate-400" };
    if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-500" };
    if (bmi < 25) return { label: "Normal", color: "text-green-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  // Quick action cards configuration
  const quickActions = [
    {
      title: "Join Class",
      subtitle: "Join a class now",
      icon: Users,
      bgColor: "bg-violet-500/20",
      iconColor: "text-violet-400",
      action: openJoinClassModal
    },
    {
      title: "Book Trainer",
      subtitle: "Book a personal trainer",
      icon: UserCheck,
      bgColor: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      action: openBookTrainerModal
    },
    {
      title: "Daily Pass",
      subtitle: user?.client_pass?.status === "active" ? "Active pass" : "Get daily access",
      icon: CreditCard,
      bgColor: "bg-amber-500/20",
      iconColor: "text-amber-400",
      action: handleDailyPassClick,
      status: user?.client_pass?.status === "active" ? "active" : "No active pass"
    },
    {
      title: "membership Status",
      subtitle: user?.membership?.status === "active" ? "Active membership" : "Get membership",
      icon: Shield,
      bgColor: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      link:  "/client/membership",
      status: user?.membership?.status === 'active' ? 'active' : 'No membership'
    },
    {
      title: "Payment History",
      subtitle: "View transactions",
      icon: DollarSign,
      bgColor: "bg-amber-500/20",
      iconColor: "text-amber-400",
      link: "/client/payments"
    }
  ];

  // Stats cards
  const statsCards = [
    {
      label: "Workouts This Week",
      value: user?.user?.workouts_this_week || "0",
      icon: Dumbbell,
      color: "text-red-400",
      bgColor: "bg-red-500/10"
    },
    {
      label: "Calories Burned",
      value: user?.user?.calories_burned || "0",
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    },
    {
      label: "Active Minutes",
            value: user?.user?.active_minutes || "0",
      icon: Timer,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
    {
      label: "Goals Achieved",
            value: user?.user?.goals_achieved || "0",
      icon: Target,
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    }
  ];

    useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/client/membership-config");
        setMembershipConfig(response.data);
      } catch (err) {
        console.error("Error fetching membership config:", err);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

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
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">{user?.user?.first_name || "Champion"}!</span>
          </h1>
          <p className="text-slate-400 text-lg">Here's what's happening with your fitness journey</p>
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
              {action.action ? (
                <button 
                  onClick={action.action}
                  className={`group w-full flex flex-col justify-between p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 ${
                    action.isCTA 
                      ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30 hover:border-cyan-400/50" 
                      : "bg-slate-800/40 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <h3 className={`font-semibold mb-1 transition-colors ${action.isCTA ? "text-cyan-400 group-hover:text-cyan-300" : "text-white group-hover:text-red-400"}`}>{action.title}</h3>
                    <p className="text-slate-400 text-sm">{action.subtitle}</p>
                  </div>
                  {action.status && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${action.status === 'active' ? 'bg-green-500' : 'bg-slate-500'} animate-pulse`}></span>
                      <span className="text-xs text-slate-500">{action.status === 'active' ? 'Active' : 'No Active Daily Pass'}</span>
                    </div>
                  )}
                </button>
              ) : (
                <Link 
                  to={action.link}
                  className={`group w-full flex flex-col justify-between p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 ${
                    action.isCTA 
                      ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30 hover:border-cyan-400/50" 
                      : "bg-slate-800/40 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-left">
                    <div className={`w-12 h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <h3 className={`font-semibold mb-1 transition-colors ${action.isCTA ? "text-cyan-400 group-hover:text-cyan-300" : "text-white group-hover:text-red-400"}`}>{action.title}</h3>
                    <p className="text-slate-400 text-sm">{action.subtitle}</p>
                  </div>
                  {action.status && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${action.status === 'active' ? 'bg-green-500' : 'bg-slate-500'} animate-pulse`}></span>
                      <span className="text-xs text-slate-500">{action.status === 'active' ? 'Active' : 'No Active membership'}</span>
                    </div>
                  )}
                </Link>
              )}
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
          {/* Profile & membership Card */}
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
                   <h3 className="text-lg font-semibold text-white">{user?.user?.first_name} {user?.user?.last_name}</h3>
                   <p className="text-slate-400 text-sm">{user?.user?.email}</p>
                 </div>
               </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.user?.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {user?.user?.status === 'active' ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">Height</span>
                    <span className="text-white">{user?.user?.height ? `${user?.user?.height} cm` : "N/A cm"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">Weight</span>
                    <span className="text-white">{user?.user?.weight ? `${user?.user?.weight} kg` : "N/A kg"}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-slate-400">BMI</span>
                    <span className={`font-medium ${getBMICategory(user?.user?.bmi).color}`}>
                      {user?.user?.bmi ? `${user?.user?.bmi} (${getBMICategory(user?.user?.bmi).label})` : "N/A (Not Set)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-400">Fitness Goal</span>
                    <span className="text-white text-right capitalize">{user?.user?.fitness_goal?.[0] || "N/A"}</span>
                  </div>
              </div>

              <Link 
                to="/client/profile"
                className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition group"
              >
                <span>Edit Profile</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Upcoming Classes */}
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
                  <span>Upcoming Classes & Trainer Sessions</span>
                </h3>
                <Link to="/client/bookings" className="text-sm text-red-400 hover:text-red-300 transition flex items-center space-x-1">
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
              ) : bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 4).map((booking, index) => (
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
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                        booking.type === 'trainer' 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                          : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-500/20'
                      }`}>
                        {booking.type === 'trainer' ? (
                          <UserCheck className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium group-hover:text-red-400 transition">
                          {booking.class_name || "Fitness Class"}
                        </h4>
                        <p className="text-slate-400 text-sm flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>{booking.date || "Today"} • {booking.time || "TBD"}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          booking.status === 'joined' || booking.status === 'in_training' || booking.status === 'on_going' || booking.status === 'in training' || booking.status === 'on going' || booking.status === 'completed'
                            ? 'bg-green-500/20 text-green-400' 
                            : booking.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {booking.status === 'in_training' || booking.status === 'in training' ? 'In Training' : 
                          booking.status === 'completed' || booking.status === 'completed' ? 'Completed' : 
                          booking.status === 'cancelled' || booking.status === 'cancelled' ? 'Cancelled' : 
                           booking.status === 'on_going' || booking.status === 'on going' ? 'Ongoing' :
                           booking.status === 'joined' ? 'Joined' : booking.status.replace('_', ' ')}
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
                  <h4 className="text-white font-medium mb-2">No Upcoming Classes</h4>
                  <p className="text-slate-400 text-sm mb-4">Book a class to start your fitness journey</p>
                  <button 
                    onClick={openJoinClassModal}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Browse Classes</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>Recent Payments</span>
                </h3>
                <Link to="/client/payments" className="text-sm text-red-400 hover:text-red-300 transition flex items-center space-x-1">
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
                          <td className="py-4 text-white">{ucfirst(payment.description)}</td>
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
                          No recent payments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Workout Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="lg:col-span-1 flex"
          >
            <div className="p-6 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 w-full flex flex-col">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Weekly Progress</span>
              </h3>

              {/* Progress Circles */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                        className="text-green-500 transition-all duration-1000"
                        strokeDasharray="251.2"
                        strokeDashoffset="251.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">0%</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">Weekly Goal</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-400">Workouts</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-400">Minutes</p>
                  </div>
                </div>

                <Link 
                  to="/client/progress"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

         {/* membership Details Card */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: animateIn ? 1 : 0, y: animateIn ? 0 : 20 }}
           transition={{ duration: 0.5, delay: 0.5 }}
           className="mt-6"
         >
           <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800/60 to-slate-800/40 backdrop-blur-xl border border-white/10 relative overflow-hidden">
             {/* Decorative elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
               <div className="flex items-center space-x-6 mb-6 md:mb-0">
                 <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                   <CreditCard className="w-10 h-10 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white mb-1">
                     {membershipConfig?.name ||  "Premium membership"}
                   </h3>
                   {user?.membership?.end_date ? (
                     <>
                       <p className="text-slate-400">
                         Valid until {new Date(user.membership.end_date).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                       </p>
                       <div className="flex items-center space-x-2 mt-2">
                         <CheckCircle className="w-4 h-4 text-green-400" />
                         <span className="text-green-400 text-sm">
                           {user?.membership?.auto_renew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
                         </span>
                       </div>
                     </>
                   ) : (
                     <p className="text-slate-400">No active membership</p>
                   )}
                 </div>
               </div>
               
               <div className="flex space-x-3">
                 <Link 
                   to={user?.membership ? "/client/membership" : "/client/payment?payment_for=membership"}
                   className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition flex items-center space-x-2"
                 >
                   <CreditCard className="w-4 h-4" />
                   <span>{user?.membership ? 'Manage' : 'Get membership'}</span>
                 </Link>
               </div>
             </div>
           </div>
         </motion.div>
      </main>

      {/* Join Class Modal */}
      <Modal
        isOpen={joinClassModalOpen}
        onClose={() => setJoinClassModalOpen(false)}
        title="Join a Class"
        size="lg"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={classFilter.day}
              onChange={(e) => setClassFilter({ ...classFilter, day: e.target.value })}
              className="px-4 py-2 rounded-xl bg-slate-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <select
              value={classFilter.time}
              onChange={(e) => setClassFilter({ ...classFilter, time: e.target.value })}
              className="px-4 py-2 rounded-xl bg-slate-700/50 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">All Times</option>
              <option value="morning">Morning (6AM-12PM)</option>
              <option value="afternoon">Afternoon (12PM-5PM)</option>
              <option value="evening">Evening (5PM-10PM)</option>
            </select>
          </div>

          {/* Class List */}
          {classLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : classSchedules.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {classSchedules
                .filter(schedule => {
                  if (classFilter.day && schedule.day !== classFilter.day) return false;
                  if (classFilter.time) {
                    const hour = new Date(schedule.start_at).getHours();
                    if (classFilter.time === 'morning' && (hour < 6 || hour >= 12)) return false;
                    if (classFilter.time === 'afternoon' && (hour < 12 || hour >= 17)) return false;
                    if (classFilter.time === 'evening' && (hour < 17 || hour >= 22)) return false;
                  }
                  return true;
                })
                .map((schedule) => (
                  <div
                    key={schedule._id}
                    className={`p-4 rounded-xl bg-slate-700/30 border transition cursor-pointer ${
                      selectedClass?._id === schedule._id 
                        ? 'border-red-500 bg-red-500/10' 
                        : 'border-white/5 hover:border-red-500/50'
                    }`}
                    onClick={() => handleSelectClass(schedule)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{schedule.class_name || "Fitness Class"}</h4>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{schedule.day || "N/A"}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{schedule.start_at ? new Date(schedule.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{schedule.trainer_name || "Trainer"}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">{schedule.joined_count || 0}/{schedule.capacity || 0}</span>
                        <div className="mt-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Join
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No classes available</p>
            </div>
          )}
        </div>
        
        {/* Join Button */}
        {classSchedules.length > 0 && selectedClass && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowConfirmJoinModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Join Class
            </button>
          </div>
        )}
      </Modal>

      {/* Confirm Join Modal */}
      <Modal
        isOpen={showConfirmJoinModal}
        onClose={() => { setShowConfirmJoinModal(false); setSelectedClass(null); }}
        title="Confirm Class Booking"
        size="md"
      >
        {selectedClass && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/30 border border-white/10">
              <h4 className="text-white font-medium mb-2">{selectedClass.class_name || "Fitness Class"}</h4>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedClass.day || "N/A"}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedClass.start_at ? new Date(selectedClass.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{selectedClass.trainer_name || "Trainer"}</span>
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmJoinModal(false); setSelectedClass(null); }}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Confirm
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Book Trainer Modal */}
      <Modal
        isOpen={bookTrainerModalOpen}
        onClose={() => { setBookTrainerModalOpen(false); setSelectedHours(1); }}
        title="Book a Personal Trainer"
        size="lg"
      >
        <div className="space-y-4">
          {/* Trainer List */}
          {trainerLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : trainers.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {trainers.map((trainer) => (
                <div
                  key={trainer._id}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedTrainer?._id === trainer._id
                      ? "bg-red-600/20 border-red-500"
                      : "bg-slate-700/30 border-white/5 hover:border-red-500/50"
                  }`}
                  onClick={() => setSelectedTrainer(trainer)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">
                        {trainer.first_name} {trainer.last_name}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {Array.isArray(trainer.specialization) 
                          ? trainer.specialization.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") 
                          : trainer.specialization || "Personal Trainer"}
                      </p>
                      {trainer.availability && (
                        <p className="text-xs text-slate-500">
                          {trainer.availability.days?.join(", ")}: {trainer.availability.time_from} - {trainer.availability.time_to}
                        </p>
                      )}
                      <div className="flex items-center mt-1">
                        <span className="text-green-400 font-medium">
                          ₱{trainer.rate?.toLocaleString() || 0}/hr
                        </span>
                      </div>
                    </div>
                    {selectedTrainer?._id === trainer._id && (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No trainers available</p>
            </div>
          )}

          {/* Hours Selector */}
          {selectedTrainer && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select hours to book
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHours(Math.max(1, selectedHours - 1))}
                    className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={selectedHours}
                    onChange={(e) => setSelectedHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-center font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedHours(Math.min(24, selectedHours + 1))}
                    className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <span className="text-slate-400">
                  hour{selectedHours > 1 ? 's' : ''}
                </span>
                <div className="ml-auto text-right">
                  <span className="text-slate-400 text-sm">Rate: </span>
                  <span className="text-green-400 font-bold">₱{selectedTrainer.rate?.toLocaleString() || 0}/hr</span>
                  <div className="text-xl font-bold text-white mt-1">
                    Total: ₱{((selectedTrainer.rate || 0) * selectedHours).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Button */}
          <button
            onClick={handleBookTrainer}
            disabled={!selectedTrainer}
            className={`w-full py-3 rounded-xl font-medium transition ${
              selectedTrainer
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {selectedTrainer
              ? `Book ${selectedTrainer.first_name} ${selectedTrainer.last_name}`
              : "Select a Trainer"
            }
          </button>
        </div>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showBookingDetailModal}
        onClose={() => {
          setShowBookingDetailModal(false);
          setSelectedBooking(null);
        }}
        title={selectedBooking?.booking.type === 'trainer-booking' ? "Trainer Session Details" : "Class Booking Details"}
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-700/50">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                selectedBooking.booking.type === 'trainer-booking' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}>
                {selectedBooking.booking.type === 'trainer-booking' ? (
                  <UserCheck className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">
                  {selectedBooking.class_name || "Fitness Class"}
                </h4>
                <p className="text-slate-400 text-sm">
                  {selectedBooking.booking.type === 'trainer-booking' ? 'Personal Training Session' : 'Group Fitness Class'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Date</p>
                <p className="text-white font-medium">{selectedBooking.date || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Time</p>
                <p className="text-white font-medium">{selectedBooking.time || "TBD"}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                 <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                   selectedBooking.status === 'joined' || selectedBooking.status === 'in_training' || selectedBooking.status === 'on_going' || selectedBooking.status === 'in training' || selectedBooking.status === 'on going' ||
                   selectedBooking.status === 'completed'
                     ? 'bg-green-500/20 text-green-400' 
                     : selectedBooking.status === 'cancelled'
                     ? 'bg-red-500/20 text-red-400'
                     : 'bg-yellow-500/20 text-yellow-400'
                 }`}>
                   {selectedBooking.status === 'in_training' || selectedBooking.status === 'in training' ? 'In Training' : 
                   selectedBooking.status === 'completed' || selectedBooking.status === 'completed' ? 
                    'Completed' :
                    selectedBooking.status === 'cancelled' || selectedBooking.status === 'cancelled' ? 
                    'Cancelled' :
                    selectedBooking.status === 'on_going' || selectedBooking.status === 'on going' ? 'Ongoing' : 
                    selectedBooking.status === 'joined' ? 'Joined' : selectedBooking.status.replace('_', ' ')}
                 </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Booking Type</p>
                <p className="text-white font-medium capitalize">{selectedBooking.booking.type || "Class"}</p>
              </div>
            </div>

            {selectedBooking.booking.type === 'trainer-booking' && selectedBooking.hours && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Duration</p>
                <p className="text-white font-medium">{selectedBooking.hours} hour(s)</p>
              </div>
            )}

            {selectedBooking.schedule_id && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs mb-1">Schedule ID</p>
                <p className="text-white font-mono text-sm">{selectedBooking.schedule_id}</p>
              </div>
            )}

             {selectedBooking.trainer_id && (
               <div className="p-3 rounded-lg bg-slate-800/50">
                 <p className="text-slate-400 text-xs mb-1">Trainer</p>
                 <p className="text-white font-medium">{selectedBooking.trainer_name || "N/A"}</p>
               </div>
             )}

             {selectedBooking.schedule?.notes && (
               <div className="p-3 rounded-lg bg-slate-800/50 col-span-2">
                 <p className="text-slate-400 text-xs mb-1">Notes</p>
                 <p className="text-white font-medium text-sm">{selectedBooking.schedule.notes}</p>
               </div>
             )}

             {/* Action Buttons for Trainer Bookings */}
            {selectedBooking.type === 'trainer' && selectedBooking.status === 'on_going' && (
              <div className="pt-4 border-t border-slate-700/50 flex justify-end">
                <button
                  onClick={() => handleCompleteBooking(selectedBooking)}
                  className="w-10 h-10 rounded-lg text-green-400 hover:text-green-300 hover:bg-white/5 transition-all flex items-center justify-center"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowBookingDetailModal(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        )}
       </Modal>

       {/* Daily Pass Status Modal */}
       <Modal
         isOpen={showDailyPassModal}
         onClose={() => setShowDailyPassModal(false)}
         title="Daily Pass Details"
         size="md"
       >
         {user?.client_pass && (
           <div className="space-y-6">
             {/* Header */}
             <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 border border-slate-600/50">
               <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                 <CreditCard className="w-7 h-7 text-white" />
               </div>
               <div>
                 <h4 className="text-white font-semibold text-lg">
                   {user.plan?.label || "Daily Pass"}
                 </h4>
                 <p className="text-slate-400 text-sm">
                   Price: <span className="text-green-400 font-medium">₱{user.pricing?.price?.toLocaleString() || '0'}</span>
                 </p>
                 <p className="text-slate-400 text-sm">
                   Status: <span className={`font-medium ${user.client_pass.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                     {user.client_pass.status}
                   </span>
                 </p>
               </div>
             </div>

             {/* Details Grid */}
             <div className="grid grid-cols-2 gap-4">
               <DetailField label="Start Date" value={user.client_pass.start_date ? new Date(user.client_pass.start_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"} />
               <DetailField label="End Date" value={user.client_pass.end_date ? new Date(user.client_pass.end_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"} />
                <DetailField label="Payment Ref" value={user.payment?.reference_no || "N/A"} />
                <DetailField label="Duration" value={`${user.client_pass.duration_days || 0} days`} />
                <DetailField label="Reference No" value={user.client_pass.reference_no || "N/A"} />
                <DetailField label="Created At" value={user.client_pass.createdAt ? new Date(user.client_pass.createdAt).toLocaleString("en-US") : "N/A"} />
               <DetailField label="Updated At" value={user.client_pass.updatedAt ? new Date(user.client_pass.updatedAt).toLocaleString("en-US") : "N/A"} />
             </div>
           </div>
         )}
       </Modal>

       {/* Custom CSS for glassmorphism */}
      <style>{`
        .glass-header {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
