import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Users, Clock, Heart, ArrowRight, Check, Loader2, Target, Zap, Award, Shield, Flame, Utensils, Tv, Car, Play, Phone, Mail, MapPin, Star, ChevronRight, Calendar, Activity, TrendingUp } from "lucide-react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Home() {
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        setError("Unable to load pricing. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const scrollToPricing = () => {
    document.getElementById('daily-pass')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
      if(window.location.hash === "#membership" || window.location.hash === "#daily-pass") {
        scrollToPricing();
      }
  }, [])

  const getPlanById = (planId) => {
    if (!planId) return null;
    const planIdStr = String(planId);
    return plans.find(p => {
      if (!p._id) return false;
      return String(p._id) === planIdStr || p._id === planId;
    });
  };

  const discountedPricing = pricing.filter(p => (p.type || p.pricing_type || '').toLowerCase() === 'discounted');
  const regularPricing = pricing.filter(p => {
    const type = (p.type || p.pricing_type || '').toLowerCase();
    return type === 'regular' || type === '';
  });

  const handleChoosePlan = (priceOption) => {
    const params = new URLSearchParams({
      plan_id: priceOption.plan_id,
      pricing_id: priceOption._id,
      payment_for: 'daily_pass'
    });
    
    navigate(`/register?${params.toString()}`);
  }

  const stats = [
    { number: "15,000+", label: "Active clients", icon: Users },
    { number: "50+", label: "Expert Trainers", icon: Award },
    { number: "100+", label: "Group Classes", icon: Activity },
    { number: "24/7", label: "Open Hours", icon: Clock },
  ];

  const amenities = [
    { icon: Dumbbell, title: "Modern Equipment", desc: "Over 500+ pieces of state-of-the-art gym equipment including free weights, machines, and cardio gear" },
    { icon: Clock, title: "24/7 Access", desc: "Train anytime with round-the-clock facility access - early mornings, late nights, even holidays" },
    { icon: Users, title: "Expert Trainers", desc: "Certified personal trainers ready to guide you with personalized workout plans and nutrition advice" },
    { icon: Flame, title: "Group Classes", desc: "100+ weekly classes including HIIT, yoga, spin, boxing, and more - all included in your membership" },
    { icon: Utensils, title: "Nutrition Coaching", desc: "Free meal planning and nutrition counseling to help you achieve your fitness goals faster" },
    { icon: Car, title: "Free Parking", desc: "Spacious parking lot with designated spots for clients - always available and convenient" },
  ];

  const features = [
    { icon: Dumbbell, title: "Free Weights Zone", desc: "Complete selection of dumbbells, barbells, and plates for serious strength training" },
    { icon: Tv, title: "Cardio Theater", desc: "Interactive cardio equipment with individual screens and entertainment options" },
    { icon: Heart, title: "Recovery Zone", desc: "Sauna, steam room, and recovery tools for post-workout relaxation" },
    { icon: Shield, title: "Clean & Safe", desc: "Daily sanitization, clean locker rooms, and well-maintained facilities" },
  ];

  const testimonials = [
    { name: "Mark Santos", role: "client since 2023", text: "Lost 30 lbs in 6 months! The trainers here are incredibly supportive and the community keeps me motivated.", rating: 5 },
    { name: "Jane Rivera", role: "client since 2022", text: "Best gym in Cavite! The 24/7 access fits my schedule perfectly and the equipment is always clean.", rating: 5 },
    { name: "Mike Torres", role: "client since 2021", text: "Transformed my physique completely. The group classes are addicting and the trainers really know their stuff.", rating: 5 },
  ];

  const faqs = [
    { q: "What are your gym hours?", a: "We are open 24 hours a day, 7 days a week including holidays!" },
    { q: "Do you offer personal training?", a: "Yes! We have certified personal trainers available for one-on-one sessions. Ask at the front desk for packages." },
    { q: "What's included in the membership?", a: "Full gym access, all equipment, locker rooms, group classes, free parking, and mobile app access." },
    { q: "Do you have parking?", a: "Yes, we have free parking available for all clients with spacious lots and easy access." },
  ];

  return (
    <div className="relative min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(220,38,38,0.16),_transparent_35%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#2f2f2f] bg-[#090909]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12 lg:p-16">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {loading && <LoadingSpinner />}
                <div className="overflow-hidden rounded-[1.5rem] border border-[#3a3a3a] bg-[#121212] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                  <img 
                    src="/icons/team.jpg" 
                    alt="6Pack Iron City Gym - Transform Your Body" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src="/icons/6pack.jpg" 
                    alt="6Pack Iron City Logo" 
                    className="h-12 w-12 rounded-full border-2 border-red-600 object-cover"
                  />
                  <span className="text-lg font-bold tracking-wider text-red-500">6PACK IRON CITY</span>
                </div>

                <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  <span className="text-white">BUILD YOUR</span>
                  <br />
                  <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">DREAM BODY</span>
                </h1>

                <p className="max-w-xl text-lg leading-relaxed text-gray-300">
                  Experience world-class fitness at Cavite's premier gym. Our state-of-the-art facility, 
                  expert trainers, and supportive community are here to help you achieve your fitness goals.
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>500+ Equipment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>24/7 Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Expert Trainers</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                  <button
                    onClick={scrollToPricing}
                    className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:from-red-500 hover:to-red-600 hover:shadow-red-600/40"
                  >
                    <Calendar className="h-5 w-5" />
                    Get Your Pass
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => document.getElementById('amenities')?.scrollIntoView({ behavior: 'smooth' })}
                    className="rounded-xl border border-[#3a3a3a] bg-[#111111] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-[#5a5a5a] hover:bg-[#1a1a1a]"
                  >
                    Explore Gym
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="flex h-14 w-8 justify-center rounded-full border-2 border-red-500 pt-2">
            <div className="h-3 w-1.5 animate-pulse rounded-full bg-red-500"></div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-[#2a2a2a] bg-[#111111]/80 py-16 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-red-500" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="relative z-10 py-24 bg-slate-900/10 backdrop-blur-[1px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              WORLD-CLASS <span className="text-red-500">AMENITIES</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to achieve your fitness goals in one place
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/50 transition-all duration-300 hover:bg-white/10"
              >
                <div className="w-14 h-14 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <item.icon className="w-7 h-7 text-red-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 bg-slate-800/10 backdrop-blur-[1px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                WHY <span className="text-red-500">6PACK IRON CITY?</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                We're not just a gym - we're a community of fitness enthusiasts committed to helping you become the best version of yourself. With cutting-edge equipment, expert guidance, and a supportive environment, your transformation starts here.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-red-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-red-600/30 shadow-2xl">
                <img 
                  src="/icons/6pack.jpg" 
                  alt="6Pack Iron City Gym Interior" 
                  className="w-full aspect-square object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 bg-slate-900/10 backdrop-blur-[1px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              WHAT OUR <span className="text-red-500">clientS SAY</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Real results from real people who transformed their lives at 6Pack Iron City
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Pass Section */}
      <section id="daily-pass" className="relative z-10 py-24 bg-slate-900/30 backdrop-blur-[1px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              DAILY <span className="text-red-500">PASS</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Flexible options for every fitness journey - choose what works for you
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <span className="ml-3 text-gray-400">Loading plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-red-500 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (regularPricing.length === 0 && discountedPricing.length === 0) ? (
            <div className="text-center py-20">
              <p className="text-gray-400">No plans available at the moment. Please check back later.</p>
            </div>
          ) : (
            <>
              {regularPricing.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="px-4 py-2 bg-red-600/20 rounded-lg">
                      <h3 className="text-xl font-bold text-red-500">REGULAR PRICING</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {regularPricing.map((priceOption, index) => {
                      const associatedPlan = getPlanById(priceOption.plan_id);
                      const isPopular = index === 1;

                      return (
                        <motion.div 
                          key={priceOption._id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.02 }}
                          className={`relative bg-gradient-to-b from-slate-800 to-slate-900 border-2 ${
                            isPopular ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-white/10'
                          } p-6 rounded-2xl flex flex-col`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                              MOST POPULAR
                            </div>
                          )}

                          <h3 className="text-2xl font-bold mb-2 uppercase text-white">{priceOption.label}</h3>
                          
                          <p className="text-gray-400 mb-3 text-sm">
                            {associatedPlan?.label || associatedPlan?.name || 'Standard Pass'}
                          </p>
                          
                          {associatedPlan?.duration && associatedPlan?.duration_days && (
                            <p className="text-gray-300 text-sm mb-3">
                              {associatedPlan.duration} ({associatedPlan.duration_days} days)
                            </p>
                          )}
                          
                          {priceOption.duration_days && (
                            <p className="text-amber-400 text-sm mb-4">
                              {priceOption.duration_days} {priceOption.duration_days === 1 ? 'day' : 'days'} access
                            </p>
                          )}
                          
                          <div className="mb-6">
                            <span className="text-4xl font-bold text-white">₱{priceOption.price?.toLocaleString()}</span>
                            <span className="text-gray-400 ml-1">/{priceOption.duration_days >= 30 ? 'month' : 'day'}</span>
                          </div>

                          {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                            <ul className="space-y-2 mb-6 flex-grow">
                              {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> 
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="space-y-2 mb-6 flex-grow">
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-green-500" /> Full Gym Access
                              </li>
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-green-500" /> All Equipment
                              </li>
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-green-500" /> Locker Room
                              </li>
                            </ul>
                          )}

                          {priceOption.membership_fee > 0 && (
                            <div className="mb-4 text-sm text-gray-500">
                              + ₱{priceOption.membership_fee?.toLocaleString()} registration
                            </div>
                          )}

                          <button 
                            onClick={() => handleChoosePlan(priceOption)}
                            className={`w-full py-3 rounded-xl font-bold text-center transition mt-auto ${
                              isPopular 
                                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400' 
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            Get Started
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {discountedPricing.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="px-4 py-2 bg-amber-600/20 rounded-lg">
                      <h3 className="text-xl font-bold text-amber-500">DISCOUNTED PRICING</h3>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">Special rates for Students, PWD, and Senior Citizens with valid ID</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {discountedPricing.map((priceOption, index) => {
                      const associatedPlan = getPlanById(priceOption.plan_id);
                      const isPopular = index === 0;

                      return (
                        <motion.div 
                          key={priceOption._id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.02 }}
                          className={`relative bg-gradient-to-b from-amber-900/20 to-slate-900 border-2 ${
                            isPopular ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-amber-700/30'
                          } p-6 rounded-2xl flex flex-col`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                              BEST VALUE
                            </div>
                          )}

                          <h3 className="text-2xl font-bold mb-2 uppercase text-white">{priceOption.label}</h3>
                          
                          <p className="text-gray-400 mb-3 text-sm">
                            {associatedPlan?.label || associatedPlan?.name || 'Standard Pass'}
                          </p>
                          
                          {associatedPlan?.duration && associatedPlan?.duration_days && (
                            <p className="text-gray-300 text-sm mb-3">
                              {associatedPlan.duration} ({associatedPlan.duration_days} days)
                            </p>
                          )}
                          
                          <div className="mb-6">
                            <span className="text-4xl font-bold text-amber-500">₱{priceOption.price?.toLocaleString()}</span>
                            <span className="text-gray-400 ml-1">/{priceOption.duration_days >= 30 ? 'month' : 'day'}</span>
                          </div>

                          {associatedPlan?.features && associatedPlan.features.length > 0 ? (
                            <ul className="space-y-2 mb-6 flex-grow">
                              {associatedPlan.features.slice(0, 4).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" /> 
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="space-y-2 mb-6 flex-grow">
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-amber-500" /> Full Gym Access
                              </li>
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-amber-500" /> All Equipment
                              </li>
                              <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Check className="w-4 h-4 text-amber-500" /> Locker Room
                              </li>
                            </ul>
                          )}

                          {priceOption.membership_fee > 0 && (
                            <div className="mb-4 text-sm text-gray-500">
                              + ₱{priceOption.membership_fee?.toLocaleString()} registration
                            </div>
                          )}

                          <button 
                            onClick={() => handleChoosePlan(priceOption)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-center transition mt-auto hover:from-amber-400 hover:to-orange-400"
                          >
                            Get Started
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 bg-slate-800/10 backdrop-blur-[1px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              FREQUENTLY ASKED <span className="text-red-500">QUESTIONS</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                    <p className="text-gray-400 text-sm">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              START YOUR FITNESS JOURNEY TODAY
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of clients who have transformed their lives at 6Pack Iron City. 
              Your dream body is just one visit away!
            </p>
            <button 
              onClick={scrollToPricing}
              className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-10 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-xl"
            >
              <Calendar className="w-5 h-5" />
              Get Your Pass Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 bg-slate-900/90 backdrop-blur-md border-t border-red-900/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-white" />
                </div>
                <span className="text-xl font-bold tracking-wider">6Pack Iron City</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Cavite's premier fitness destination. We're committed to helping you achieve your fitness goals in a supportive, modern environment.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                  <span className="text-sm font-bold">fb</span>
                </a>
                <a href="#" className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                  <span className="text-sm font-bold">ig</span>
                </a>
                <a href="#" className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                  <span className="text-sm font-bold">tw</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">QUICK LINKS</h4>
              <ul className="space-y-2">
                <li><a href="#daily-pass" className="text-gray-400 hover:text-red-500 transition-colors">Daily Pass</a></li>
                <li><a href="#amenities" className="text-gray-400 hover:text-red-500 transition-colors">Amenities</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-red-500 transition-colors">Contact Us</a></li>
                <li><a href="/register" className="text-gray-400 hover:text-red-500 transition-colors">Join Now</a></li>
                <li><a href="/admin/login" className="text-gray-400 hover:text-red-500 transition-colors">Admin Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">CONTACT</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>City of Dasmarinas, Cavite, Philippines</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>+63 XXX XXX XXXX</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>info@6packironcity.com</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>Open 24/7</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500">© 2026 6Pack Iron City Gym. All rights reserved. Made with dedication in Cavite.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}