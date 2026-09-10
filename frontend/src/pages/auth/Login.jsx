import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Dumbbell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function Login() {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: ""});
    const { login } = useAuth();
    const { success, error } = useNotification();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const request = await login(formData);
            
            success(request.message || "Login successful!");
            
            setLoading(false)

            if(request?.redirectedPath) {
              navigate(request.redirectedPath)
            } 
            

        } catch (err) {
            error(err.response?.data?.message || "Login failed");
            console.log("Login failed", err.message);
            setLoading(false);
        }
    }
    return (
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex">
      {/* Left (Form) - Black Background */}
      {loading && <LoadingSpinner />}
      <div className="flex-1 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider">6Pack Iron City</span>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Welcome Back!</h2>
          <p className="text-gray-400 mb-8 text-center">
            Sign in to continue your fitness journey
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border border-red-900 bg-black text-white rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-gray-500 hover:text-white"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            <div className="text-right">
              <a href="#" className="text-sm text-red-500 hover:underline">
                Forgot Password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-px bg-red-900 flex-1"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="h-px bg-red-900 flex-1"></div>
          </div>

          <div className="mt-4 space-y-3">
            <button className="w-full flex items-center justify-center gap-2 border border-red-900 bg-black text-white py-3 rounded-lg hover:bg-red-900/30 transition">
              <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-2 border border-red-900 bg-black text-white py-3 rounded-lg hover:bg-red-900/30 transition">
              <img src="https://www.svgrepo.com/show/303128/apple-logo.svg" alt="Apple" className="w-5 h-5" />
              Continue with Apple
            </button>
          </div>

          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-red-500 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
          
          {/* Back to Home */}
          <p className="mt-4 text-center">
            <Link to="/" className="text-gray-500 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>

      {/* Right (Info Panel) - Red Gradient */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-red-900 via-red-800 to-black text-white items-center justify-center p-10">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-6">6Pack Iron City</h2>
          <p className="text-lg mb-6 text-gray-300">
            "Transform your body and life with professional trainers and modern equipment."
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="../../public/icons/6pack.jpg" alt="User" className="w-12 h-12 rounded-full border-2 border-red-500" />
            <div className="text-left">
              <p className="font-semibold">Shin Yamauchi</p>
              <p className="text-gray-400 text-sm">6Pack Iron City Gym Trece</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">15K+</div>
              <div className="text-xs text-gray-400">clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">20+</div>
              <div className="text-xs text-gray-400">Trainers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">24/7</div>
              <div className="text-xs text-gray-400">Open</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
