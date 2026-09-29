import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Dumbbell, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ 
        email: "", 
        password: "",
        user_type: "admin"
    });
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
            console.log(request)
            success(request.message || "Login successful!");
            if(request.redirectedPath) {
                navigate(request.redirectedPath);
            } else {
                navigate("/client/dashboard");
            }
        } catch (err) {
            error(err.response?.data?.message || "Login failed. Please check your credentials.");
            console.log("Login failed", err.message);
            setLoading(false);
        }
    }

    return (
    <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="min-h-screen flex bg-slate-900">
      {/* Left (Form) - Dark Slate Background */}
      {loading && <LoadingSpinner />}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-md">
          {/* Logo & Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-2xl mb-4 border border-slate-600">
              <img src="/icons/6pack.jpg" className="w-8 h-8 object-cover rounded-xl" />
            </div>
            <h2 className="text-2xl font-bold text-white">6Pack Iron City</h2>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-sm text-slate-300">Admin Portal</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</h3>
            <p className="text-slate-400 mb-6 text-center text-sm">
              Sign in to access the admin dashboard
            </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Admin Email"
                className="w-full pl-10 pr-4 py-3 border border-slate-600 bg-slate-800 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-500"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPass ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border border-slate-600 bg-slate-800 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-500"
                required
              />
              <div
                className="absolute right-3 top-3 cursor-pointer text-slate-500 hover:text-white"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
            
            {/* Hidden field to specify admin user_type */}
            <input type="hidden" name="user_type" value="admin" />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded bg-slate-700 border-slate-600 text-red-500 focus:ring-red-500" />
                Reclient me
              </label>
              <a href="#" className="text-red-500 hover:text-red-400">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/25 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400">
            Are you a client?{" "}
            <Link to="/login" className="text-red-500 font-medium hover:text-red-400">
              client Login
            </Link>
          </p>
          
          {/* Back to Home */}
          <p className="mt-4 text-center">
            <Link to="/" className="text-slate-500 hover:text-slate-300 text-sm">
              ← Back to Home
            </Link>
          </p>
          </div>
        </div>
      </div>

      {/* Right (Info Panel) - Dark with subtle pattern */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white items-center justify-center p-10 relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)', backgroundSize: '50px 50px' }}></div>
        </div>
        
        <div className="max-w-md text-center relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-20 h-20 bg-slate-700 rounded-2xl flex items-center justify-center border border-slate-600">
              <Shield className="w-10 h-10 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-slate-300 mb-8">
            Manage your gym operations, clients, and memberships from one place.
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="text-2xl font-bold text-red-500">15K+</div>
              <div className="text-slate-400 text-sm">Total clients</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="text-2xl font-bold text-red-500">50+</div>
              <div className="text-slate-400 text-sm">Trainers</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="text-2xl font-bold text-red-500">100+</div>
              <div className="text-slate-400 text-sm">Classes</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="text-2xl font-bold text-red-500">24/7</div>
              <div className="text-slate-400 text-sm">Access</div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-left">
            <h4 className="font-semibold mb-2 text-slate-300">Admin Features</h4>
            <ul className="space-y-1 text-slate-400 text-sm">
              <li>• client management & approvals</li>
              <li>• membership plans & pricing</li>
              <li>• Class scheduling</li>
              <li>• Payment monitoring</li>
              <li>• Analytics & reports</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
