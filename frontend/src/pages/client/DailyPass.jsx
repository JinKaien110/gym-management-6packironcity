import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Zap, Clock, Shield, Star, Users, ArrowRight, Trophy, Heart, Dumbbell } from "lucide-react";
import api from "../../api/axios.js";

export default function DailyPass() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);
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
        setError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPlanById = (planId) => {
    if (!planId) return null;
    const planIdStr = String(planId);
    return plans.find(p => {
      if (!p._id) return false;
      return String(p._id) === planIdStr || p._id === planId;
    });
  };

  const regularPricing = useMemo(() => {
    return pricing?.filter(p => {
      const type = (p.type || p.pricing_type || '').toLowerCase();
      return type === 'regular' || type === '';
    }) || [];
  }, [pricing]);

  const discountedPricing = useMemo(() => {
    return pricing?.filter(p => (p.type || p.pricing_type || '').toLowerCase() === 'discounted') || [];
  }, [pricing]);

  // Determine which pricing to show based on user discount status
  const isDiscountedUser = user?.user?.is_discounted === true;
  const showRegular = !isDiscountedUser && regularPricing.length > 0;
  const showDiscounted = discountedPricing.length > 0;

  const handleSelectPlan = (priceOption) => {
    const associatedPlan = getPlanById(priceOption.plan_id);
    // If user is already discounted, skip verification and go straight to payment
    if (priceOption.type === "discounted" && isDiscountedUser) {
      navigate(`/client/payment?plan_id=${priceOption.plan_id}&pricing_id=${priceOption._id}&payment_for=daily_pass`);
      return;
    }
    if(priceOption.type === "discounted") {
      navigate(`/client/discount-request?plan_id=${priceOption.plan_id}&pricing_id=${priceOption._id}&payment_for=daily_pass`);
      return;
    }
    navigate(`/client/payment?plan_id=${priceOption.plan_id}&pricing_id=${priceOption._id}&payment_for=daily_pass`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <span className="ml-3 text-gray-400">Loading passes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-red-500 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section - Enhanced */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-16"
         >
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 px-4 py-2 rounded-full mb-6"
           >
             <Zap className="w-4 h-4 text-red-500" />
             <span className="text-red-400 text-sm font-medium">
               {isDiscountedUser ? "Discounted Daily Access" : "Flexible Daily Access"}
             </span>
           </motion.div>
           
           <h1 className="text-4xl md:text-5xl font-bold mb-4">
             {isDiscountedUser ? (
               <>
                 DISCOUNTED <span className="text-amber-500">PASSES</span>
               </>
             ) : (
               <>
                 YOUR <span className="text-red-600">GYM</span>, <span className="text-white">YOUR</span> <span className="text-red-600">RULES</span>
               </>
             )}
           </h1>
           <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
             {isDiscountedUser 
               ? "Enjoy exclusive discounted rates as a 6Pack Iron City valued member."
               : "Unlock unlimited potential with our flexible daily passes. No commitments, just gains."
             }
           </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5 text-red-500" />
              <span className="text-sm">10K+ Active clients</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-sm">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">Secure & Safe</span>
            </div>
          </div>
        </motion.div>

        {!showRegular && !showDiscounted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
              <img src="/icons/6pack.jpg" className="w-10 h-10 object-cover rounded-xl" />
            </div>
            <p className="text-gray-400 text-lg">
              {isDiscountedUser ? "No discounted passes available at the moment." : "No passes available at the moment."}
            </p>
            <p className="text-gray-500 mt-2">Check back soon for exciting offers!</p>
          </motion.div>
        ) : (
          <>
            {/* Regular Section */}
            {showRegular && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-16"
              >
                <div className="mb-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg shadow-red-600/20">
                      <Dumbbell className="text-white" />
                      <h2 className="text-xl md:text-2xl font-bold text-white">REGULAR PASS</h2>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-gray-400 text-sm">Instant activation</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-base ml-1">Full access to all gym facilities. No hidden fees, no surprises.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {regularPricing.map((priceOption, index) => {
                    const associatedPlan = getPlanById(priceOption.plan_id);
                    const isPopular = index === 1;
                    const durationText = priceOption.duration_days === 1 ? 'day' : priceOption.duration_days >= 30 ? 'month' : 'days';

                    return (
                      <motion.div 
                        key={priceOption._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className={`relative group bg-zinc-900/80 backdrop-blur-sm border-2 ${
                          isPopular ? 'border-red-500 shadow-lg shadow-red-600/20' : 'border-zinc-800 hover:border-red-600/50'
                        } p-6 rounded-2xl flex flex-col`}
                      >
                        {isPopular && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            POPULAR
                          </motion.div>
                        )}

                        {/* Duration Badge */}
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-full text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {priceOption.duration_days} {durationText}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h3 className="text-2xl font-bold uppercase pr-20">{priceOption.label}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {associatedPlan?.label || associatedPlan?.name || 'Standard Pass'}
                          </p>
                        </div>
                        
                        {associatedPlan?.duration && associatedPlan?.duration_days && (
                          <p className="text-gray-400 text-sm mb-2">
                            {associatedPlan.duration}
                          </p>
                        )}
                        
                        <div className="mb-6">
                          <motion.span 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-5xl font-bold text-white"
                          >
                            ₱{priceOption.price?.toLocaleString()}
                          </motion.span>
                          <span className="text-gray-500 ml-1">/{durationText}</span>
                        </div>

                        {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                          <ul className="space-y-3 mb-6 flex-grow">
                            {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /> 
                                <span className="line-clamp-2 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-3 mb-6 flex-grow">
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-red-500" /> <span className="text-sm">Full Gym Access</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-red-500" /> <span className="text-sm">All Equipment</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-red-500" /> <span className="text-sm">Locker Room Access</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-red-500" /> <span className="text-sm">Free Parking</span>
                            </li>
                          </ul>
                        )}

                        {priceOption.membership_fee > 0 && (
                          <div className="mb-4 text-sm text-gray-500 bg-zinc-800/50 py-2 px-3 rounded-lg">
                            + ₱{priceOption.membership_fee?.toLocaleString()} one-time activation
                          </div>
                        )}

                        <motion.button 
                          onClick={() => handleSelectPlan(priceOption)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3 rounded-xl font-bold text-center transition mt-auto flex items-center justify-center gap-2 ${
                            isPopular 
                              ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-600/30' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                          }`}
                        >
                          Get Pass
                          <ArrowRight className="w-4 h-4" />
                       </motion.button>
                     </motion.div>
                   );
                 })}
                 </div>
               </motion.div>
             )}

             {/* Discounted Section */}
             {showDiscounted && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="mb-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg shadow-amber-600/20">
                      <Heart className="text-white" />
                      <h2 className="text-xl md:text-2xl font-bold text-white">DISCOUNTED PASS</h2>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-gray-400 text-sm">Up to 10% OFF</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-base ml-1">Special rates for students, PWD, and senior citizens with valid ID.</p>
                </div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {discountedPricing.map((priceOption, index) => {
                    const associatedPlan = getPlanById(priceOption.plan_id);
                    const isPopular = index === 0;
                    const durationText = priceOption.duration_days === 1 ? 'day' : priceOption.duration_days >= 30 ? 'month' : 'days';

                    return (
                      <motion.div 
                        key={priceOption._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className={`relative group bg-zinc-900/80 backdrop-blur-sm border-2 ${
                          isPopular ? 'border-amber-500 shadow-lg shadow-amber-600/20' : 'border-zinc-800 hover:border-amber-600/50'
                        } p-6 rounded-2xl flex flex-col`}
                      >
                        {isPopular && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5" />
                            BEST VALUE
                          </motion.div>
                        )}

                        {/* Duration Badge */}
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-full text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {priceOption.duration_days} {durationText}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h3 className="text-2xl font-bold uppercase pr-20">{priceOption.label}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {associatedPlan?.label || associatedPlan?.name || 'Standard Pass'}
                          </p>
                        </div>
                        
                        {associatedPlan?.duration && associatedPlan?.duration_days && (
                          <p className="text-gray-400 text-sm mb-2">
                            {associatedPlan.duration}
                          </p>
                        )}
                        
                        <div className="mb-6">
                          <motion.span 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-5xl font-bold text-amber-400"
                          >
                            ₱{priceOption.price?.toLocaleString()}
                          </motion.span>
                          <span className="text-gray-500 ml-1">/{durationText}</span>
                        </div>

                        {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                          <ul className="space-y-3 mb-6 flex-grow">
                            {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-300">
                                <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" /> 
                                <span className="line-clamp-2 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-3 mb-6 flex-grow">
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-amber-500" /> <span className="text-sm">Full Gym Access</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-amber-500" /> <span className="text-sm">All Equipment</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-amber-500" /> <span className="text-sm">Locker Room Access</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-300">
                              <Check className="w-5 h-5 text-amber-500" /> <span className="text-sm">Free Parking</span>
                            </li>
                          </ul>
                        )}

                        {priceOption.membership_fee > 0 && (
                          <div className="mb-4 text-sm text-gray-500 bg-zinc-800/50 py-2 px-3 rounded-lg">
                            + ₱{priceOption.membership_fee?.toLocaleString()} one-time activation
                          </div>
                        )}

                        <motion.button 
                          onClick={() => handleSelectPlan(priceOption)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-3 rounded-xl font-bold text-center transition mt-auto flex items-center justify-center gap-2 ${
                            isPopular 
                              ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-600/30' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                          }`}
                        >
                          {isDiscountedUser ? "Get Pass" : "Verify & Get Pass"}
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Bottom CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">STILL HAVE QUESTIONS?</h3>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Our team is here to help you find the perfect pass for your fitness goals. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <motion.a 
                href="#"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition"
              >
                Contact Us
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Special discounts available for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="bg-amber-900/30 text-amber-400 border border-amber-700/50 px-4 py-2 rounded-full text-sm font-medium cursor-default"
            >
              🎓 Students (with valid ID)
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="bg-amber-900/30 text-amber-400 border border-amber-700/50 px-4 py-2 rounded-full text-sm font-medium cursor-default"
            >
              ♿ PWD (with valid ID)
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="bg-amber-900/30 text-amber-400 border border-amber-700/50 px-4 py-2 rounded-full text-sm font-medium cursor-default"
            >
              👴 Senior Citizens (with valid ID)
            </motion.span>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            * Discounted pricing requires verification. Valid ID must be presented at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}