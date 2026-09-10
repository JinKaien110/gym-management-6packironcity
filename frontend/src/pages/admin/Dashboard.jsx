import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  UserCog,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  BookOpen,
  FolderOpen,
  Home,
  FileText,
  Tag,
  Package,
  Settings,
  BarChart3,
  Layers,
  Briefcase,
  ClipboardList,
  Target,
  Award
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import { CardSkeleton, ListSkeleton, EmptyState } from "../../components/UIEnhancements.jsx";


const formatDateTime = (dateTime) => {
     if (!dateTime) return "N/A";
      return new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
   };
  const formatTime = (time) => {
    if (!time) return "N/A";
    return time;
  };

const statsCards = [
  { 
    title: "Total clients", 
    icon: Users, 
    color: "bg-blue-600",
    path: "/admin/clients",
    getValue: (data) => data.totalclients || 0
  },
  { 
    title: "Active memberships", 
    icon: CreditCard, 
    color: "bg-green-600",
    path: "/admin/memberships",
    getValue: (data) => data.activememberships || 0
  },
  { 
    title: "Total Revenue", 
    icon: DollarSign, 
    color: "bg-red-600",
    path: "/admin/payments",
    getValue: (data) => `₱${(data.totalRevenue || 0).toLocaleString()}`
  },
  { 
    title: "Pending Requests", 
    icon: Clock, 
    color: "bg-yellow-600",
    path: "/admin/memberships",
    getValue: (data) => data.pendingRequests || 0
  },
];

const quickLinkItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: Home },
  { name: "Clients", path: "/admin/clients", icon: Users },
  { name: "Freeze Requests", path: "/admin/membership-requests", icon: FileText },
  { name: "Memberships", path: "/admin/memberships", icon: CreditCard },
  { name: "Payments", path: "/admin/payments", icon: DollarSign },
  { name: "Classes", path: "/admin/classes", icon: BookOpen },
  { name: "Schedules", path: "/admin/schedules", icon: Calendar },
  { name: "Trainers", path: "/admin/trainers", icon: UserCog },
  { name: "Pricing", path: "/admin/pricing", icon: Tag },
  { name: "Plans", path: "/admin/plans", icon: Package },
  { name: "Bookings", path: "/admin/bookings", icon: Calendar },
  { name: "Discounts", path: "/admin/discounts", icon: CreditCard },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { name: "Membership Config", path: "/admin/membership-config", icon: Settings },
  { name: "Activity Logs", path: "/admin/activity-logs", icon: Activity },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);
  
  const [stats, setStats] = useState({
    totalclients: 0,
    activememberships: 0,
    totalRevenue: 0,
    pendingRequests: 0
  });
  const [todayClasses, setTodayClasses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({
    newmemberships: 0,
    renewals: 0,
    other: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/dashboard");
      const data = response.data;
      console.log(data)

      // ==============================
      // STATS
      // ==============================
      const dashboard = data.dashboard || {};
      const revenueArray = dashboard.revenue || [];
      const totalRevenue = revenueArray.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);

      setStats({
        totalclients: Number(dashboard.totalclients) || 0,
        activememberships: Number(dashboard.activemembership) || 0,
        totalRevenue: totalRevenue,
        pendingRequests: Number(dashboard.totalPending) || 0
      });

      // ==============================
      // TODAY CLASSES
      // ==============================
      const todayClassesData = data.todaysClasses || [];
      
      setTodayClasses(
        todayClassesData.map(cls => ({
          
          _id: cls._id,
          name: cls.name || cls.class?.name || "Class",
          start_at: cls.start_at,
          end_at: cls.end_at,
          spots: `${cls.joined_count || 0}/${cls.capacity || 0}`
        }))
      );

      // ==============================
      // PENDING APPROVALS
      // ==============================
      const allDiscountRequests = data.pendingApprovals || [];

      const pendingApprovalsData = Array.isArray(allDiscountRequests)
        ? allDiscountRequests
            .filter(d => ["submitted", "pending"].includes(d?.status))
            .slice(0, 5)
            .map(d => ({
              type: "Discount",
              name:
                d.first_name && d.last_name
                  ? `${d.first_name} ${d.last_name}`
                  : "client",
              action: d.discount_type || "Discount Request",
              _id: d._id
            }))
        : [];

      setPendingApprovals(pendingApprovalsData);

      // ==============================
      // REVENUE
      // ==============================
      const revenueThisMonth = data.revenueThisMonthCard || {};
      const monthlyRev = revenueThisMonth.total || 
        ((revenueThisMonth.daily_pass || 0) + (revenueThisMonth.membership || 0) + (revenueThisMonth.trainer_booking || 0));

      setMonthlyRevenue(monthlyRev);
      setRevenueChange(0);

      setRevenueBreakdown({
        newmemberships: revenueThisMonth.daily_pass || 0,
        renewals: revenueThisMonth.membership || 0,
        other: revenueThisMonth.trainer_booking || 0
      });

      // ==============================
      // RECENT ACTIVITIES
      // ==============================
      const auditLogs = data.recentActivities?.items || [];

      const filteredLogs = Array.isArray(auditLogs)
        ? auditLogs.filter(
            log => log?.action?.toUpperCase() !== "AUTH_LOGIN"
          ).slice(0, 5)
        : [];

      const formattedActivities = filteredLogs.map(log => {
        let type = "info";

        if (log.status === "success") {
          type = "success";
        } else if (log.status === "fail") {
          type = "error";
        } else if (
          log.action?.toLowerCase().includes("update") ||
          log.action?.toLowerCase().includes("pending")
        ) {
          type = "warning";
        }

        const cleanMessage = (log.summary || log.action || "Activity recorded")
        .replace(/\(NaN\)/g, "")     // remove (NaN)
        .replace(/\s+/g, " ")        // normalize spacing
        .trim();

        return {
          type,
          message: cleanMessage,
          time: log.createdAt
            ? new Date(log.createdAt).toLocaleString()
            : "Just now"
        };
      });

      setRecentActivities(formattedActivities);

    } catch (err) {
      console.error("Unexpected dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };

    load();

    const interval = setInterval(() => {
      if (isMounted) {
        fetchDashboardData();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-slate-700/60 backdrop-blur-sm hover:bg-slate-600/80 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link 
            to="/admin/clients" 
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition shadow-lg shadow-red-500/25"
          >
            + Add client
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20 hover:border-white/20 hover:shadow-2xl hover:shadow-black/30 transition-all card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-300 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stat.getValue(stats)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color.replace('bg-', 'from-').replace('600', '-500')} ${stat.color.replace('bg-', 'to-').replace('600', '-700')} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <Link 
                to={stat.path} 
                className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white mt-4"
              >
                View details <TrendingUp className="w-4 h-4" />
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
          <h2 className="text-lg font-bold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {quickLinkItems.map((action) => (
              <Link
                key={action.name}
                to={action.path}
                className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/5 hover:border-white/20 transition-all"
              >
                <div className="p-2 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-lg">
                  <action.icon className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-white font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? (
              <ListSkeleton items={3} />
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm table-row-hover"
                >
                  {activity.type === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "warning" && (
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "error" && (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  {activity.type === "info" && (
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-slate-400 text-xs">{activity.time}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={Activity}
                title="No Activity Yet"
                description="Recent activities will appear here when clients interact with the system."
              />
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Classes */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Today's Classes</h2>
            <Link to="/admin/schedules" className="text-red-500 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <ListSkeleton items={3} />
            ) : todayClasses.length > 0 ? (
              todayClasses.map((cls, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl card-hover"
                >
                  <div>
                    <p className="text-white font-medium">{cls.name}</p>
                    <p className="text-slate-400 text-sm">{formatDateTime(cls.start_at)} - {formatDateTime(cls.end_at)}</p>
                  </div>
                  <span className="text-slate-400 text-sm">{cls.spots} spots</span>
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Classes Today"
                description="There are no classes scheduled for today."
              />
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Pending Approvals</h2>
            <span className="bg-yellow-600/30 text-yellow-400 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {pendingApprovals.length} Pending
            </span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <ListSkeleton items={3} />
            ) : pendingApprovals.length > 0 ? (
              pendingApprovals.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl card-hover"
                >
                  {console.log("Pending Approval Item:", item)}
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-sm">{item.action}</p>
                  </div>
                  <span className="text-xs text-yellow-500 bg-yellow-600/20 px-2 py-1 rounded">
                    {item.type}
                  </span>
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="All Caught Up!"
                description="No pending approvals at the moment."
              />
            )}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Revenue This Month</h2>
            <Link to="/admin/payments" className="text-red-400 text-sm hover:underline">
              View Details
            </Link>
          </div>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-white">₱{monthlyRevenue.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? '+' : ''}{revenueChange}% from last month
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Daily Pass</span>
              <span className="text-white font-medium">₱{(revenueBreakdown.newmemberships || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Membership</span>
              <span className="text-white font-medium">₱{(revenueBreakdown.renewals || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Trainer Booking</span>
              <span className="text-white font-medium">₱{(revenueBreakdown.other || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
