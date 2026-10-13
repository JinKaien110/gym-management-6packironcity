import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Play, X, ChevronLeft, ChevronRight, Dumbbell, Users, Trophy, Flame, Calendar, MapPin, Star, Instagram, Facebook } from "lucide-react";

const galleryItems = [
  { id: 1, type: "image", category: "facility", src: "/icons/6pack.jpg", title: "Main Gym Floor", description: "State-of-the-art equipment and spacious training area" },
  { id: 2, type: "image", category: "equipment", src: "/icons/team.jpg", title: "Free Weights Zone", description: "Complete selection of dumbbells and barbells" },
  { id: 3, type: "image", category: "classes", src: "/icons/6pack.jpg", title: "Yoga Class", description: "Morning yoga session in our dedicated studio" },
  { id: 4, type: "image", category: "events", src: "/icons/team.jpg", title: "client Appreciation Day", description: "Celebrating our amazing community" },
  { id: 5, type: "image", category: "training", src: "/icons/6pack.jpg", title: "Personal Training", description: "One-on-one sessions with certified trainers" },
  { id: 6, type: "image", category: "events", src: "/icons/team.jpg", title: "Boxing Workshop", description: "Special boxing class with Mike Torres" },
  { id: 7, type: "image", category: "facility", src: "/icons/6pack.jpg", title: "Cardio Area", description: "Latest cardio equipment with personal screens" },
  { id: 8, type: "image", category: "classes", src: "/icons/team.jpg", title: "HIIT Session", description: "High-intensity interval training class" },
  { id: 9, type: "image", category: "community", src: "/icons/6pack.jpg", title: "Transformation Stories", description: "client success stories" },
  { id: 10, type: "image", category: "equipment", src: "/icons/team.jpg", title: "Cable Machines", description: "Professional cable resistance machines" },
  { id: 11, type: "image", category: "training", src: "/icons/6pack.jpg", title: "Strength Training", description: "Building strength with proper form" },
  { id: 12, type: "image", category: "facility", src: "/icons/team.jpg", title: "Locker Rooms", description: "Clean and modern facilities" },
];

const categories = [
  { name: "All", icon: Camera, count: 24 },
  { name: "Facility", icon: Dumbbell, count: 8 },
  { name: "Classes", icon: Calendar, count: 6 },
  { name: "Events", icon: Trophy, count: 4 },
  { name: "Training", icon: Users, count: 4 },
  { name: "Community", icon: Flame, count: 2 },
];

const testimonials = [
  { name: "Mark Santos", role: "client since 2023", text: "Lost 30 lbs in 6 months! The trainers here are incredibly supportive and the community keeps me motivated.", rating: 5, image: "/icons/team.jpg" },
  { name: "Jane Rivera", role: "client since 2022", text: "Best gym in Cavite! The 24/7 access fits my schedule perfectly and the equipment is always clean.", rating: 5, image: "/icons/team.jpg" },
  { name: "Mike Torres", role: "client since 2021", text: "Transformed my physique completely. The group classes are addicting and the trainers really know their stuff.", rating: 5, image: "/icons/team.jpg" },
  { name: "Sarah Lee", role: "client since 2024", text: "The AI workout recommendations have been game-changing. Exactly what I needed to reach my goals!", rating: 5, image: "/icons/team.jpg" },
];

const stats = [
  { number: "5,000+", label: "Active clients", icon: Users },
  { number: "50+", label: "Expert Trainers", icon: Trophy },
  { number: "100+", label: "Weekly Classes", icon: Calendar },
  { number: "4.9", label: "Average Rating", icon: Star },
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  const filteredItems = selectedCategory === "All" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory.toLowerCase());

  const openLightbox = (item) => setLightbox(item);
  const closeLightbox = () => setLightbox(null);

  const nextImage = () => {
    if (!lightbox) return;
    const currentIndex = filteredItems.findIndex(item => item.id === lightbox.id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setLightbox(filteredItems[nextIndex]);
  };

  const prevImage = () => {
    if (!lightbox) return;
    const currentIndex = filteredItems.findIndex(item => item.id === lightbox.id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setLightbox(filteredItems[prevIndex]);
  };

  return (
    <div className="min-h-screen text-white relative">

      {/* Hero */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              GALLERY & <span className="text-red-500">SUCCESS STORIES</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Explore our facility, see our classes in action, and read inspiring stories from our clients.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
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

      {/* Category Filter */}
      <section className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.name 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openLightbox(item)}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              >
                <img 
                  src={item.src} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                </div>
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-red-600/80 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              WHAT OUR <span className="text-red-500">clientS SAY</span>
            </h2>
            <p className="text-gray-400">Real results from real people who transformed their lives</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 text-sm italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                    <div className="text-gray-500 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Camera className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-3xl font-bold mb-4">FOLLOW US ON SOCIAL MEDIA</h2>
            <p className="text-gray-400 mb-8">
              Stay updated with the latest news, events, and fitness tips
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="#" 
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </a>
              <a 
                href="#" 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-semibold transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>
            <button 
              onClick={prevImage}
              className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            <div 
              className="max-w-4xl max-h-[80vh] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightbox.src} 
                alt={lightbox.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-white">{lightbox.title}</h3>
                <p className="text-gray-400">{lightbox.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              READY TO BE PART OF OUR COMMUNITY?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Join thousands of clients who have transformed their lives at 6Pack Iron City Gym.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/#daily-pass" 
                className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-bold transition-all"
              >
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