import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { 
  Dumbbell, 
  Menu, 
  X, 
  Home, 
  Users, 
  CreditCard, 
  Calendar, 
  UserCog, 
  Tag, 
  DollarSign,
  FileText,
  Bot,
  BookOpen,
  LogOut,
  ChevronDown,
  Package,
  List,
  Settings,
  PieChart,
  TrendingUp,
  BarChart3,
  Layers,
  Briefcase,
  ClipboardList,
  Target,
  Award,
  Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { PageTransition } from "../components/UIEnhancements.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

// Helper function to capitalize first letter
const ucfirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/admin/dashboard" },
  { name: "Clients", icon: Users, path: "/admin/clients" },
  { name: "Freeze Requests", icon: FileText, path: "/admin/membership-requests" },
  { name: "Memberships", icon: CreditCard, path: "/admin/memberships" },
  { name: "Payments", icon: DollarSign, path: "/admin/payments" },
  { name: "Classes", icon: BookOpen, path: "/admin/classes" },
  { name: "Schedules", icon: Calendar, path: "/admin/schedules" },
  { name: "Trainers", icon: UserCog, path: "/admin/trainers" },
  { name: "Pricing", icon: Tag, path: "/admin/pricing" },
  { name: "Plans", icon: Package, path: "/admin/plans" },
  { name: "Bookings", icon: Calendar, path: "/admin/bookings" },
  { name: "Discounts Requests", icon: CreditCard, path: "/admin/discounts" },
  { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { name: "Membership Config", icon: Settings, path: "/admin/membership-config" },
    { name: "Activity Logs", icon: Activity, path: "/admin/activity-logs" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Sidebar expands on hover
  const isSidebarExpanded = isHovered || sidebarOpen;

  const handleLogout = async () => {
      await logout();
      navigate("/admin/login"); 
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0b0b0c] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.18),_transparent_30%),linear-gradient(135deg,_#0b0b0c_0%,_#111111_45%,_#1a1111_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-5 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-[#121212]/90 backdrop-blur-xl border-r border-[#2f2f2f]
          shadow-[0_0_40px_rgba(0,0,0,0.35)]
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarExpanded ? 'lg:w-64' : 'lg:w-20'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-2 lg:px-4 border-b border-white/10 overflow-hidden">
          <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold whitespace-nowrap overflow-hidden transition-all duration-300">
              {isSidebarExpanded && (
                <span className="opacity-100">6Pack Admin</span>
              )}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25' 
                    : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white backdrop-blur-sm'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#2f2f2f] bg-[#0f0f10]/90 p-3 backdrop-blur-xl">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium uppercase">
                  {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {ucfirst(user?.first_name) || 'Admin'} {ucfirst(user?.last_name) || ''}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {user?.email || 'admin@6pack.com'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 p-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-500"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-0">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#2f2f2f] bg-[#121212]/80 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:px-6">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:block text-right">
              <p className="text-white font-medium text-sm">
                {ucfirst(user?.first_name) || 'Admin'} {ucfirst(user?.last_name) || ''}
              </p>
              <p className="text-slate-400 text-xs capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
              <span className="text-white font-medium uppercase">
                {user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative z-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* CSS for fluid gradient animations */}
      <style>{`
        @keyframes swirl {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            border-radius: 50%;
          }
          25% {
            transform: translate(30px, -40px) scale(1.1);
            border-radius: 40% 60% 70% 30%;
          }
          50% {
            transform: translate(-20px, 20px) scale(0.95);
            border-radius: 60% 40% 30% 70%;
          }
          75% {
            transform: translate(40px, 30px) scale(1.05);
            border-radius: 30% 70% 60% 40%;
          }
        }
        
        @keyframes flow {
          0%, 100% {
            transform: translateX(0) rotate(0deg) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translateX(50px) rotate(120deg) scale(1.2);
            opacity: 0.4;
          }
          66% {
            transform: translateX(-30px) rotate(240deg) scale(0.9);
            opacity: 0.2;
          }
        }
        
        @keyframes drift {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(15px, -25px) rotate(8deg);
          }
          50% {
            transform: translate(-10px, 15px) rotate(-5deg);
          }
          75% {
            transform: translate(25px, 10px) rotate(3deg);
          }
        }
      `}</style>
    </div>
  );
}
