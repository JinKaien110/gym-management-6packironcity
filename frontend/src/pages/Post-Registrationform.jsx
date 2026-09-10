import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { motion } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Navbar from "../components/Navbar.jsx";
import { User, Calendar, Ruler, Scale, Target, Heart, Dumbbell, Zap, Clock } from "lucide-react";

export default function PostRegistrationForm() {
    const navigate = useNavigate();
    const { user, fetchUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        gender: "",
        date_of_birth: "",
        height: "",
        weight: "",
        bmi: "",
        fitness_goal: [],
        medical_condition: "",
        training_type: "",
        experience_level: "",
        days_per_week: "",
        session_minutes: ""
    });

    // Set form data from user object when available
    useEffect(() => {
        if (user) {
            // Format date_of_birth to yyyy-MM-dd for date input
            const formattedDob = user.user.date_of_birth ? user.user.date_of_birth.split('T')[0] : '';
            setFormData({
                gender: user.user.gender || '',
                date_of_birth: formattedDob,
                height: user.user.height || '',
                weight: user.user.weight || '',
                bmi: user.user.bmi || '',
                fitness_goal: Array.isArray(user.user.fitness_goal) ? user.user.fitness_goal : [],
                medical_condition: user.user.medical_condition || '',
                training_type: user.user.training_type || '',
                experience_level: user.user.experience_level || '',
                days_per_week: user.user.days_per_week || '',
                session_minutes: user.user.session_minutes || ''
            });
        }
    }, [user]);

    // Fitness goal options
    const fitnessGoals = [
        { value: "bulk", label: "Build Muscle (Bulk)", icon: "💪" },
        { value: "cut", label: "Lose Fat (Cut)", icon: "🔥" },
        { value: "maintain", label: "Maintain Weight", icon: "⚖️" },
        { value: "strength", label: "Increase Strength", icon: "🏋️" },
        { value: "endurance", label: "Build Endurance", icon: "🏃" },
        { value: "flexibility", label: "Improve Flexibility", icon: "🧘" },
        { value: "general", label: "General Fitness", icon: "❤️" }
    ];

    // Training type options
    const trainingTypes = [
        { value: "resistance", label: "Resistance Training", icon: "🏋️" },
        { value: "bodyweight", label: "Bodyweight Training", icon: "🤸" },
        { value: "cardio", label: "Cardio", icon: "🏃" },
        { value: "hiit", label: "HIIT", icon: "⚡" },
        { value: "crossfit", label: "CrossFit", icon: "🔥" },
        { value: "calisthenics", label: "Calisthenics", icon: "💪" }
    ];

    // Experience level options
    const experienceLevels = [
        { value: "beginner", label: "Beginner", description: "New to fitness" },
        { value: "intermediate", label: "Intermediate", description: "1-3 years experience" },
        { value: "expert", label: "Expert", description: "3+ years experience" }
    ];

    // Update form fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        let updated = { ...formData, [name]: value };

        // Auto BMI calculation: weight (lbs) -> kg, height (cm)
        if (name === "height" || name === "weight") {
            const h = name === "height" ? Number(value) : Number(updated.height);
            const w = name === "weight" ? Number(value) : Number(updated.weight);

            if (h > 0 && w > 0) {
                // Convert lbs to kg (1 lb = 0.453592 kg)
                const weightInKg = w * 0.453592;
                updated.bmi = Number((weightInKg / ((h / 100) ** 2)).toFixed(1));
            } else {
                updated.bmi = "";
            }
        }

        setFormData(updated);
    };

    // Handle fitness goal selection (max 3)
    const handleGoalToggle = (goalValue) => {
        const currentGoals = formData.fitness_goal;
        
        if (currentGoals.includes(goalValue)) {
            // Remove if already selected
            setFormData({
                ...formData,
                fitness_goal: currentGoals.filter(g => g !== goalValue)
            });
        } else {
            // Add if less than 3 goals
            if (currentGoals.length < 3) {
                setFormData({
                    ...formData,
                    fitness_goal: [...currentGoals, goalValue]
                });
            }
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate minimum fitness goals
        if (formData.fitness_goal.length < 1) {
            setError("Please select at least one fitness goal");
            return;
        }

        // Validate required fields
        if (!formData.gender || !formData.date_of_birth || !formData.height || 
            !formData.weight || !formData.training_type || !formData.experience_level ||
            !formData.days_per_week || !formData.session_minutes) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const request = await api.patch("/client/postform", formData);

            setMessage(request.data.message);
            await fetchUser();
            setTimeout(() => {
                navigate("/client/dashboard");
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong.");
            setLoading(false);
        }
    };

return (
    <div className="min-h-screen relative overflow-hidden">
            <Navbar />
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-black via-red-900/20 to-black">
        {loading && <LoadingSpinner />}
        <div className="bg-[#1a0000]/90 shadow-2xl rounded-2xl p-6 md:p-8 w-full max-w-3xl border border-red-700/50">

                <h2 className="text-2xl md:text-3xl font-bold text-red-400 mb-2 text-center">
                    Complete Your Profile
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    Help us understand your fitness journey better
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-xl text-red-300">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-xl text-green-300">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Gender & Date of Birth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                onChange={handleChange}
                                value={formData.date_of_birth}
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Ruler className="w-4 h-4" /> Height (cm) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="height"
                                onChange={handleChange}
                                value={formData.height}
                                required
                                min="50"
                                max="300"
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 no-spin"
                                placeholder="e.g. 170"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Scale className="w-4 h-4" /> Weight (lbs) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="weight"
                                onChange={handleChange}
                                value={formData.weight}
                                required
                                min="50"
                                max="500"
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 no-spin"
                                placeholder="e.g. 150"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" /> BMI (Auto)
                            </label>
                            <div className={`w-full bg-black border rounded-lg p-3 text-center font-bold ${
                                formData.bmi > 0 
                                    ? formData.bmi < 18.5 ? "text-yellow-500 border-yellow-600" 
                                    : formData.bmi < 25 ? "text-green-500 border-green-600"
                                    : formData.bmi < 30 ? "text-yellow-500 border-yellow-600"
                                    : "text-red-500 border-red-600"
                                    : "border-red-600 text-gray-500"
                            }`}>
                                {formData.bmi || "--"}
                            </div>
                        </div>
                    </div>

                    {/* Fitness Goals - Multi-select (max 3) */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Fitness Goals <span className="text-red-500">*</span>
                            <span className="text-gray-500 text-sm">(Select 1-3)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {fitnessGoals.map((goal) => (
                                <button
                                    key={goal.value}
                                    type="button"
                                    onClick={() => handleGoalToggle(goal.value)}
                                    className={`p-3 rounded-lg border transition-all text-sm ${
                                        formData.fitness_goal.includes(goal.value)
                                            ? "bg-red-600/20 border-red-500 text-red-400"
                                            : "bg-black border-red-600/50 text-gray-300 hover:border-red-500"
                                    }`}
                                >
                                    <span className="block text-lg mb-1">{goal.icon}</span>
                                    {goal.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Training Type */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" /> Training Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {trainingTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, training_type: type.value })}
                                    className={`p-3 rounded-lg border transition-all text-sm ${
                                        formData.training_type === type.value
                                            ? "bg-red-600/20 border-red-500 text-red-400"
                                            : "bg-black border-red-600/50 text-gray-300 hover:border-red-500"
                                    }`}
                                >
                                    <span className="block text-lg mb-1">{type.icon}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Experience Level <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {experienceLevels.map((level) => (
                                <button
                                    key={level.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, experience_level: level.value })}
                                    className={`p-4 rounded-lg border transition-all ${
                                        formData.experience_level === level.value
                                            ? "bg-red-600/20 border-red-500 text-red-400"
                                            : "bg-black border-red-600/50 text-gray-300 hover:border-red-500"
                                    }`}
                                >
                                    <div className="font-semibold">{level.label}</div>
                                    <div className="text-xs text-gray-500">{level.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Days per week & Session minutes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Days per Week <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="days_per_week"
                                value={formData.days_per_week}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            >
                                <option value="" disabled>Select Days</option>
                                {[1,2,3,4,5,6,7].map((day) => (
                                    <option key={day} value={day}>{day} {day === 1 ? 'day' : 'days'}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Session Duration <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="session_minutes"
                                value={formData.session_minutes}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            >
                                <option value="" disabled>Select Duration</option>
                                {[30,45,60,90,120].map((mins) => (
                                    <option key={mins} value={mins}>{mins} minutes</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Medical Condition - Optional */}
                    <div>
                        <label className="block text-gray-200 font-semibold mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Medical Condition 
                            <span className="text-gray-500 text-sm">(Optional)</span>
                        </label>
                        <textarea
                            name="medical_condition"
                            rows="3"
                            onChange={handleChange}
                            value={formData.medical_condition}
                            className="w-full bg-black border border-red-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                            placeholder="Any injuries, health conditions, or concerns we should know about..."
                        ></textarea>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold text-lg transition"
                    >
                        {loading ? "Submitting..." : "Complete Registration"}
                    </button>

                </form>

            </div>
        </motion.div>
        </div>
    );
}
