import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  DollarSign,
  Camera,
  Save,
  ArrowLeft,
  Star,
  Dumbbell,
  FileText,
  Clock,
  Calendar,
  Upload,
  XCircle,
  PhilippinePeso 
} from "lucide-react";

export default function TrainerProfile() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [loading, setLoading] = useState(false);
  const [certificationFile, setCertificationFile] = useState(null);
  const [certificationPreview, setCertificationPreview] = useState(null);

  const specializationOptions = ["bulk", "cut", "calisthenics", "cardio", "strength training", "hiit", "yoga", "flexibility", "weight loss"];
  const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    specialization: [],
    certification: "",
    experience_years: "",
    rate: "",
    max_hours: "",
    bio: "",
    availability: {
      days: [],
      time_from: "8:00AM",
      time_to: "8:00PM"
    }
  });

  useEffect(() => {
    if (user) {
      const specializationArray = user.specialization || [];
      const availability = user.availability || {};
      const daysArray = availability.days || [];

      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        specialization: Array.isArray(specializationArray) ? specializationArray : [],
        certification: user.certification || "",
        rate: user.rate || "",
        max_hours: user.max_hours || "",
        bio: user.bio || "",
        availability: {
          days: Array.isArray(daysArray) ? daysArray : [],
          time_from: availability.time_from || "8:00AM",
          time_to: availability.time_to || "8:00PM"
        }
      });

      if (user.certification) {
        setCertificationPreview(user.certification);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecializationToggle = (spec) => {
    const updated = formData.specialization.includes(spec)
      ? formData.specialization.filter(s => s !== spec)
      : [...formData.specialization, spec];
    setFormData({ ...formData, specialization: updated });
  };

  const handleDayToggle = (day) => {
    const updated = formData.availability.days.includes(day)
      ? formData.availability.days.filter(d => d !== day)
      : [...formData.availability.days, day];
    setFormData({
      ...formData,
      availability: { ...formData.availability, days: updated }
    });
  };

  const handleTimeChange = (field, value) => {
    setFormData({
      ...formData,
      availability: { ...formData.availability, [field]: value }
    });
  };

  const handleCertificationFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        error("Please select an image file");
        return;
      }
      setCertificationFile(file);
      setCertificationPreview(URL.createObjectURL(file));
    }
  };

  const removeCertificationFile = () => {
    setCertificationFile(null);
    setCertificationPreview(null);
    setFormData({ ...formData, certification: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build FormData for multipart upload (handles file + JSON fields)
      const formDataToSend = new FormData();

      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("specialization", JSON.stringify(formData.specialization));
      formDataToSend.append("certification", formData.certification || "");
      formDataToSend.append("experience_years", formData.experience_years || "");
      formDataToSend.append("rate", formData.rate);
      formDataToSend.append("max_hours", formData.max_hours);
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("availability", JSON.stringify(formData.availability));

      if (certificationFile) {
        formDataToSend.append("certification_file", certificationFile);
      }

      await api.put("/trainer/profile/update", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      success("Profile updated successfully!");
      if (fetchUser) await fetchUser();
    } catch (err) {
      error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/trainer/dashboard")}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-600/20">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {user.first_name} {user.last_name}
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 w-fit mx-auto md:mx-0">
                  Professional Trainer
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 text-sm mb-4">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-white font-medium">{user.rating || "5.0"}</span>
                  <span>Rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  <span>{user.specialization?.join(", ") || "Fitness Coach"}</span>
                </div>
              </div>
              <p className="text-slate-400 max-w-lg italic">
                "{user.bio || "Motivating clients to reach their fitness goals through discipline."}"
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
          >
            <div className="px-8 py-5 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-red-500" />
                Personal Information
              </h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-slate-900/50 border border-white/5 text-slate-500 rounded-xl py-3 pl-10 pr-4 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Professional Details Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
          >
            <div className="px-8 py-5 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Professional Expertise
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Specialization</label>
                <div className="flex flex-wrap gap-2">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationToggle(spec)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.specialization.includes(spec)
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certification Photo */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Certification Photo</label>
                {certificationPreview || formData.certification ? (
                  <div className="relative inline-block">
                    <img
                      src={certificationPreview || formData.certification}
                      alt="Certification"
                      className="w-32 h-32 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeCertificationFile}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs px-4 py-6 bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-red-500 hover:bg-slate-600 transition">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-400">Click to upload certification</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertificationFileChange}
                      className="hidden"
                    />
                  </label>
                )}
                <input
                  type="hidden"
                  value={formData.certification || ""}
                  onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                />
              </div>

              {/* Rate & Max Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Hourly Rate (₱)</label>
                  <div className="relative">
                    <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 ml-1">Max Hours per Week</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="number"
                      name="max_hours"
                      value={formData.max_hours}
                      onChange={handleChange}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Biography</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </motion.section>

          {/* Availability Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
          >
            <div className="px-8 py-5 border-b border-white/5 bg-white/5">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Availability
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        formData.availability.days.includes(day)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Time From</label>
                  <select
                    value={formData.availability.time_from}
                    onChange={(e) => handleTimeChange("time_from", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  >
                    {["6:00AM", "7:00AM", "8:00AM", "9:00AM", "10:00AM", "11:00AM", "12:00PM", "1:00PM", "2:00PM", "3:00PM", "4:00PM", "5:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Time To</label>
                  <select
                    value={formData.availability.time_to}
                    onChange={(e) => handleTimeChange("time_to", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  >
                    {["12:00PM", "1:00PM", "2:00PM", "3:00PM", "4:00PM", "5:00PM", "6:00PM", "7:00PM", "8:00PM", "9:00PM", "10:00PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="flex justify-end pt-4 pb-12">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Save Profile"}
              {!loading && <Save className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
