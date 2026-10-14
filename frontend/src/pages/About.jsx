import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Users, Clock, Heart, Target, Zap, Award, Shield, Flame, Phone, Mail, MapPin, Star, Calendar, Activity, TrendingUp, Play, ChevronRight, Check } from "lucide-react";
import api from "../api/axios.js";

export default function About() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/public/trainers");
        setTrainers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching trainers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const stats = [
    { number: "5,000+", label: "Active clients", icon: Users },
    { number: "50+", label: "Expert Trainers", icon: Award },
    { number: "100+", label: "Weekly Classes", icon: Activity },
    { number: "24/7", label: "Open Hours", icon: Clock },
  ];

  const timeline = [
    { year: "2022", title: "Beginning", desc: "6Pack Iron City Gym was founded on July 5, 2022 with a vision to transform fitness in Cavite." },
    { year: "2023", title: "Expansion", desc: "Expanded facility size and added new equipment to serve more clients." },
    { year: "2024", title: "Digitalization", desc: "Launched online booking and membership portal for better client experience." },
    { year: "2025", title: "Innovation", desc: "Introduced AI-powered workout recommendations and virtual classes." },
    { year: "2026", title: "Community", desc: "Over 5,000 active clients and 50+ certified trainers." },
  ];

  const values = [
    { icon: Heart, title: "Commitment", desc: "We're committed to helping every client achieve their fitness goals." },
    { icon: Shield, title: "Quality", desc: "Well-maintained equipment and clean facilities for your safety." },
    { icon: Flame, title: "Energy", desc: "A supportive community that motivates you to push limits." },
    { icon: Target, title: "Results", desc: "Personalized training plans to ensure measurable progress." },
  ];

  const team = [
    { name: "Mark Dela Cruz", role: "Head Trainer", specialty: "Strength & Conditioning", image: "/icons/team.jpg" },
    { name: "Jane Rivera", role: "Yoga Instructor", specialty: "Yoga & Meditation", image: "/icons/team.jpg" },
    { name: "Mike Torres", role: "Boxing Coach", specialty: "Boxing & HIIT", image: "/icons/team.jpg" },
  ];

  return (
    <div className="min-h-screen text-white relative">
      {/* Hero Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ABOUT <span className="text-red-500">6PACK IRON CITY</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Cavite's premier fitness destination committed to transforming lives through quality training and community support since 2022.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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

      {/* Mission & Vision */}
      <section className="relative z-10 py-24 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-red-900/30 to-slate-900 border border-red-500/20"
            >
              <div className="w-14 h-14 mb-6 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">OUR MISSION</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                To provide accessible, high-quality fitness training that empowers individuals in Cavite to achieve their health and wellness goals in a supportive, modern environment with certified trainers and state-of-the-art equipment.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10"
            >
              <div className="w-14 h-14 mb-6 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">OUR VISION</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                To be the leading fitness community in the Philippines, known for excellence in training, innovation in fitness solutions, and creating lasting transformations for our clients.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              OUR <span className="text-red-500">JOURNEY</span>
            </h2>
            <p className="text-gray-400">From humble beginnings to Cavite's largest fitness community</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-red-600/30"></div>
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className="flex-1 p-4">
                  <div className={`p-6 rounded-xl bg-white/5 border border-white/10 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className="text-red-500 font-bold text-xl mb-2">{item.year}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <div className="w-4 h-4 bg-red-600 rounded-full absolute left-1/2 transform -translate-x-1/2 z-10 border-4 border-slate-900"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 py-24 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              OUR <span className="text-red-500">VALUES</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <div className="w-14 h-14 mb-4 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <value.icon className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Trainers */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              MEET OUR <span className="text-red-500">TRAINERS</span>
            </h2>
            <p className="text-gray-400">Certified professionals dedicated to your success</p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : trainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trainers.slice(0, 6).map((trainer, index) => (
                <motion.div
                  key={trainer._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-4">
                    <img 
                      src={trainer.photo || "/icons/team.jpg"} 
                      alt={trainer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">{trainer.name}</h3>
                  <p className="text-red-500 mb-2">{trainer.specialty || trainer.role}</p>
                  <p className="text-gray-400 text-sm">{trainer.bio?.slice(0, 100)}...</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((client, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-4">
                    <img 
                      src={client.image} 
                      alt={client.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white">{client.name}</h3>
                  <p className="text-red-500 mb-2">{client.role}</p>
                  <p className="text-gray-400 text-sm">{client.specialty}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link 
              to="/trainers" 
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold"
            >
              View All Trainers <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Facility Info */}
      <section className="relative z-10 py-24 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                OUR <span className="text-red-500">FACILITY</span>
              </h2>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Located near St. Paul Hospital in Burol 1, Dasmarinas, Cavite, our modern facility features over 500 pieces of state-of-the-art equipment including free weights, cardio machines, and specialized training zones.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-500" /> Free Weights Zone
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-500" /> Cardio Theater
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-500" /> Functional Training Area
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-500" /> Group Class Studios
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-500" /> Locker Rooms & Showers
                </li>
              </ul>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <MapPin className="w-5 h-5" />
                Visit Our Gym
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-red-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-red-600/30 shadow-2xl">
                <img 
                  src="/icons/6pack.jpg" 
                  alt="6Pack Iron City Gym Facility" 
                  className="w-full aspect-video object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              READY TO START YOUR JOURNEY?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of clients who have transformed their lives at 6Pack Iron City Gym.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/#daily-pass" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                <Calendar className="w-5 h-5" />
                Get Your Pass
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}