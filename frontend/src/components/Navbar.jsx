// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Dumbbell, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Users, 
  Calendar, 
  HelpCircle, 
  MapPin, 
  BookOpen, 
  Image, 
  Home, 
  ChevronDown, 
  Bell, 
  Settings, 
  Shield, 
  CreditCard 
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState("main");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const isLoggedIn = !!user && isAuthenticated;
  const userType = user?.user_type || user?.user?.user_type;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (err) {
      window.location.href = "/";
    }
  };

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/about", label: "About", icon: Users },
    { to: "/schedules", label: "Classes", icon: Calendar },
    { to: "/trainers", label: "Trainers", icon: Users },
    { to: "/blog", label: "Blog", icon: BookOpen },
    { to: "/gallery", label: "Gallery", icon: Image },
    { to: "/faqs", label: "FAQs", icon: HelpCircle },
    { to: "/contact", label: "Contact", icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
              <img src="../../public/icons/6pack.jpg" className="w-full h-full object-cover rounded-xl" />
            </div>
            <Link to="/" className="text-lg font-bold text-white whitespace-nowrap hover:text-white transition">
              6Pack Iron City
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            <Link to="/" className="px-2 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition text-xs flex items-center gap-1 shrink-0">
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to}
                className="px-2 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition text-xs flex items-center gap-1 shrink-0"
              >
                <link.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}

            {isLoggedIn ? (
              <>
                {/* User Menu Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition flex items-center gap-1 shrink-0"
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Dashboard</span>
                    <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]"
                      >
                        <div className="p-2">
                          {userType === 'trainer' ? (
                            <>
                              <Link to="/trainer/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>Trainer Dashboard</span>
                              </Link>
                              <Link to="/trainer/clients" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>My Clients</span>
                              </Link>
                              <Link to="/trainer/schedule" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>My Schedule</span>
                              </Link>
                              <Link to="/trainer/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span>My Profile</span>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link to="/client/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>Dashboard</span>
                              </Link>
                              <Link to="/client/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span>My Profile</span>
                              </Link>
                              <Link to="/client/membership" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Shield className="w-4 h-4 flex-shrink-0" />
                                <span>Membership</span>
                              </Link>
                              <Link to="/client/bookings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>Bookings</span>
                              </Link>
                              <Link to="/client/payments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-sm">
                                <CreditCard className="w-4 h-4 flex-shrink-0" />
                                <span>Payments</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition flex-shrink-0">
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-medium transition flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition flex items-center gap-2 shrink-0">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Login</span>
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/30 transition-all duration-300 flex items-center gap-2 shrink-0"
                >
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-slate-900/95"
          >
            <div className="px-4 py-4 space-y-2">
              <div className="space-y-1 pb-2 border-b border-white/10 mb-2">
                <Link to="/" className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                {navLinks.map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium flex items-center gap-2"
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                ))}
              </div>
              
              {isLoggedIn ? (
                <>
                  <div className="space-y-1">
                    <button
                      onClick={() => setMobileMenuActive(mobileMenuActive === 'user' ? '' : 'user')}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                    >
                      <span className="flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        <span>Dashboard</span>
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuActive === 'user' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {mobileMenuActive === 'user' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 space-y-1">
                            {userType === 'trainer' ? (
                              <>
                                <Link to="/trainer/dashboard" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  Trainer Dashboard
                                </Link>
                                <Link to="/trainer/clients" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  My Clients
                                </Link>
                                <Link to="/trainer/schedule" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  My Schedule
                                </Link>
                                <Link to="/trainer/profile" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  My Profile
                                </Link>
                              </>
                            ) : (
                              <>
                                <Link to="/client/dashboard" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  Dashboard
                                </Link>
                                <Link to="/client/profile" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  My Profile
                                </Link>
                                <Link to="/client/membership" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  Membership
                                </Link>
                                <Link to="/client/bookings" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  Bookings
                                </Link>
                                <Link to="/client/payments" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm">
                                  Payments
                                </Link>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg bg-red-600 text-white font-medium flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link to="/register" className="block w-full text-center px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1">
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .glass-header {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </header>
  );
}

