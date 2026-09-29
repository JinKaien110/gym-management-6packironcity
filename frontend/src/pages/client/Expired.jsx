// pages/client/Expired.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import { 
  Dumbbell, 
  User, 
  History, 
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  Calendar,
  Shield,
  Heart
} from "lucide-react";

export default function Expired() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { error: notifyError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  // Fetch plans and pricing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, pricingRes] = await Promise.all([
          api.get("/public/plans?status=active&limit=100"),
          api.get("/public/pricing?status=active&limit=100")
        ]);
        
        const plansData = plansRes.data.data || [];
        const pricingData = pricingRes.data.data || [];
        
        setPlans(plansData);
        setPricing(pricingData);
      } catch (err) {
        console.error("Error fetching plans/pricing:", err);
        setPriceError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get plan info by plan_id
  const getPlanById = (planId) => {
    if (!planId) return null;
    const planIdStr = String(planId);
    return plans.find(p => {
      if (!p._id) return false;
      return String(p._id) === planIdStr || p._id === planId;
    });
  };

  // Display pricing based on user.is_discounted from useAuth()
  // If user.is_discounted === true, show only pricing.type === "discounted"
  // If user.is_discounted === false, show only pricing.type === "regular"
  const isDiscounted = user?.user?.is_discounted === true;
  
  // Get the pricing to display based on is_discounted
  const displayPricing = isDiscounted 
    ? pricing.filter(p => p.type === "discounted")
    : pricing.filter(p => !p.type || p.type === "regular");

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="relative z-50 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                <img src="/icons/6pack.jpg" className="w-5 h-5 object-cover rounded-xl" />
              </div>
              <span className="text-xl font-bold text-white">6Pack Iron City</span>
            </div>
            
            {/* Desktop Navigation - Limited for expired clients */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link to="/client/profile" className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition">
                Profile
              </Link>
              <Link to="/client/dashboard" className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 font-medium transition">
                Dashboard
              </Link>
              <button 
                onClick={async () => {
                  try {
                    await api.post("/auth/logout");
                    window.location.href = "/login";
                  } catch (err) {
                    window.location.href = "/login";
                  }
                }}
                className="ml-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Expired Warning Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border border-red-600/50 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Your client Pass Has Expired
              </h1>
              <p className="text-slate-300 mb-4">
                Your client pass has already expired. You may only visit your profile and view your history.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link 
                  to="/client/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition"
                >
                  <User className="w-4 h-4" />
                  View Profile
                </Link>
                <Link 
                  to="/client/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition"
                >
                  <History className="w-4 h-4" />
                  View History
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Your Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                client Pass Status
              </div>
              <div className="text-red-400 font-bold">Expired</div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Heart className="w-4 h-4" />
                Discount Status
              </div>
              <div className={`font-bold ${isDiscounted ? 'text-green-400' : 'text-slate-400'}`}>
                {isDiscounted ? 'Discounted' : 'Regular'}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Shield className="w-4 h-4" />
                Available Actions
              </div>
              <div className="text-white font-medium">Profile & History Only</div>
            </div>
          </div>
        </motion.div>

        {/* membership Plans Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              RENEW YOUR <span className="text-red-600">client PASS</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Choose a plan that fits your fitness journey and renew today
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <span className="ml-3 text-slate-400">Loading daily passes...</span>
            </div>
          ) : priceError ? (
            <div className="text-center py-20">
              <p className="text-red-400">{priceError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-red-500 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Row 1: Primary Pricing (based on user.is_discounted) */}
              <div className="mb-12">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  {isDiscounted ? (
                    <>
                      <Heart className="w-5 h-5 text-red-500" />
                      Your Discounted Rates
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 text-red-500" />
                      Regular membership Plans
                    </>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayPricing.map((priceOption, index) => {
                    const associatedPlan = getPlanById(priceOption.plan_id);
                    const isPopular = index === 1;

                    return (
                      <motion.div 
                        key={priceOption._id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative bg-slate-800 border-2 ${
                          isPopular ? 'border-red-600' : 'border-slate-700'
                        } p-6 rounded-2xl flex flex-col`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                            RECOMMENDED
                          </div>
                        )}

                        {/* Main Name - Pricing Label (duration) */}
                        <h3 className="text-2xl font-bold mb-1 uppercase">{priceOption.label}</h3>
                        
                        {/* Secondary - Plan Name */}
                        <p className="text-slate-400 mb-4 text-sm">
                          {associatedPlan?.label || associatedPlan?.name || 'Standard Plan'}
                        </p>
                        
                        {/* Price */}
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-red-600">₱{priceOption.price?.toLocaleString()}</span>
                          <span className="text-slate-400">/{priceOption.duration_days >= 30 ? 'month' : 'day'}</span>
                        </div>

                        {/* Features from plan */}
                        {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                          <ul className="space-y-3 mb-6 flex-grow">
                            {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-slate-300">
                                <Check className="w-5 h-5 text-red-600 flex-shrink-0" /> 
                                <span className="line-clamp-2">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-3 mb-6 flex-grow">
                            <li className="flex items-center gap-2 text-slate-300">
                              <Check className="w-5 h-5 text-red-600" /> Gym Access
                            </li>
                            <li className="flex items-center gap-2 text-slate-300">
                              <Check className="w-5 h-5 text-red-600" /> Modern Equipment
                            </li>
                            <li className="flex items-center gap-2 text-slate-300">
                              <Check className="w-5 h-5 text-red-600" /> Locker Room
                            </li>
                          </ul>
                        )}

                        {/* client Pass Fee Info */}
                        {priceOption.membership_fee > 0 && (
                          <div className="mb-4 text-sm text-slate-500">
                            + ₱{priceOption.membership_fee?.toLocaleString()} one-time client pass fee
                          </div>
                        )}

                        <button 
                          onClick={() => navigate(`/register?plan_id=${priceOption.plan_id}&price_id=${priceOption._id}&client_type=${isDiscounted ? 'discounted' : 'regular'}`)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-center transition mt-auto"
                        >
                          Choose Plan
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>



              {/* Discount Request Button */}
              {!isDiscounted && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-red-900/50 to-slate-900 border border-red-600/30 rounded-2xl p-8 text-center"
                >
                  <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Applying for a Discount?
                  </h3>
                  <p className="text-slate-300 mb-6 max-w-xl mx-auto">
                    Students, PWD, and Senior Citizens are eligible for discounted client pass rates. 
                    Click below to submit your discount request with valid ID verification.
                  </p>
                  <Link 
                    to="/client/discount-request"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition"
                  >
                    Request Discount
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              )}

              {/* Discount Info */}
              <div className="mt-12 text-center">
                <p className="text-slate-400 mb-4">Discounts available for:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                    🎓 Students
                  </span>
                  <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                    ♿ PWD
                  </span>
                  <span className="bg-red-900/50 text-red-400 px-4 py-2 rounded-full text-sm font-medium">
                    👴 Senior Citizens
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-4">
                  Discounted pricing requires verification. Submit your discount request to apply.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
