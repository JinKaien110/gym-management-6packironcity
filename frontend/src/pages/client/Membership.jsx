// pages/client/membership.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/Modal.jsx";
import api from "../../api/axios.js";
import {
  Dumbbell,
  Shield,
  ArrowRight,
  Check,
  Award,
  AlertCircle,
  Heart,
  Sparkles,
  DollarSign,
  Clock,
  Wifi,
  Car,
  Coffee,
  Droplets,
  Lock,
  Users,
  Calendar,
  Trophy,
  Send
} from "lucide-react";

export default function Membership() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [membershipConfig, setMembershipConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [lastMembership, setLastMembership] = useState(null);
  const [lastMembershipLoading, setLastMembershipLoading] = useState(true);
  const [lastMembershipError, setLastMembershipError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/client/membership-config");
        setMembershipConfig(response.data);
      } catch (err) {
        console.error("Error fetching membership config:", err);
        setConfigError("Unable to load membership details");
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchLastMembership = async () => {
      if (user?.membership === null) {
        try {
          const response = await api.get("/client/membership/last");
          setLastMembership(response.data);
          console.log("Last membership data:", response.data);
        } catch (err) {
          console.error("Error fetching last membership:", err);
          setLastMembershipError("Unable to load last membership");
        } finally {
          setLastMembershipLoading(false);
        }
      } else {
        setLastMembershipLoading(false);
      }
    };
    fetchLastMembership();
  }, [user]);

  const membership = user?.membership;
  const hasActiveMembership = membership?.status === "active";
  const [freezeRequestLoading, setFreezeRequestLoading] = useState(false);
  const [freezeRequestError, setFreezeRequestError] = useState(null);
  const [freezeRequestSuccess, setFreezeRequestSuccess] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeStartDate, setFreezeStartDate] = useState("");
  const [freezeEndDate, setFreezeEndDate] = useState("");
  const [medicalProofFile, setMedicalProofFile] = useState(null);
  const [medicalProofFileName, setMedicalProofFileName] = useState("");
  const fileInputRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getDaysRemaining = () => {
    if (!membership?.end_date) return 0;
    const endDate = new Date(membership.end_date);
    const today = new Date();
    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const ucfirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleFreezeSubmit = async (e) => {
    e.preventDefault();
    setFreezeRequestLoading(true);
    setFreezeRequestError(null);
    setFreezeRequestSuccess(false);

    try {
      const formData = new FormData();
      formData.append("freeze_start_date", freezeStartDate);
      formData.append("freeze_end_date", freezeEndDate);
      if (medicalProofFile) {
        formData.append("medical_proof_url", medicalProofFile);
      }

      await api.post("/membership-request/freeze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFreezeRequestSuccess(true);
      setFreezeRequestLoading(false);
      // Reset form after successful submission
      setTimeout(() => {
        setShowFreezeModal(false);
        setFreezeStartDate("");
        setFreezeEndDate("");
        setMedicalProofFile(null);
        setMedicalProofFileName("");
        setFreezeRequestSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting freeze request:", err);
      setFreezeRequestError(err.response?.data?.message || "Failed to submit freeze request");
      setFreezeRequestLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedicalProofFile(file);
      setMedicalProofFileName(file.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setMedicalProofFile(file);
      setMedicalProofFileName(file.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (!user) return null;

  return (
    <div className="py-12 px-4">
       <div className="max-w-3xl mx-auto relative">
         {/* Page Header */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
         >
           <h1 className="text-3xl font-bold text-white mb-3">
             YOUR <span className="text-red-500">MEMBERSHIP</span>
           </h1>
           <p className="text-slate-400 max-w-xl mx-auto">
             View your membership details and perks
           </p>
           {hasActiveMembership && (
             <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="absolute top-4 right-4"
             >
               <button
                 onClick={() => navigate("/client/daily-pass")}
                 className="group px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 flex items-center gap-2 text-sm"
               >
                 Proceed to Daily Pass
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
               </button>
             </motion.div>
           )}
         </motion.div>

        {/* membership Status */}
        <AnimatePresence mode="wait">
          {hasActiveMembership ? (
            <motion.div 
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Status Banner */}
              <div className="flex items-center gap-4 p-5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Active membership</h2>
                  <p className="text-slate-400 text-sm">Membership is currently active</p>
                </div>
                  {membership.is_frozen ? (
                    <div className="ml-auto px-3 py-1.5 bg-amber-600/20 border border-amber-600/30 text-amber-400 text-sm font-medium rounded-lg">
                      Frozen
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowFreezeModal(true)}
                      disabled={freezeRequestLoading}
                      className="ml-auto px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-600/30 transition-all"
                    >
                      {freezeRequestLoading ? "Requesting..." : "Request Freeze"}
                    </button>
                  )}
              </div>

              {/* Membership Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 text-xs mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Days Remaining
                  </div>
                  <div className="text-2xl font-bold text-green-400">{getDaysRemaining()}</div>
                  <div className="text-slate-500 text-xs">days left</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Membership Fee
                  </div>
                  <div className="text-lg font-bold text-emerald-400">₱{membershipConfig?.fee ? Number(membershipConfig.fee).toLocaleString() : '900'}</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Start Date
                  </div>
                  <div className="text-lg font-bold text-white">{formatDate(membership.start_date)}</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-400 text-xs mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    End Date
                  </div>
                  <div className="text-lg font-bold text-white">{formatDate(membership.end_date)}</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-400 text-xs mb-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Status
                  </div>
                  <div className="text-lg font-bold text-white capitalize">{membership.status}</div>
                </div>
              </div>
              
               {/* Freeze Request Modal Trigger */}
               <Modal
                 isOpen={showFreezeModal}
                 onClose={() => {
                   if (!freezeRequestLoading) {
                     setShowFreezeModal(false);
                     setFreezeStartDate("");
                     setFreezeEndDate("");
                     setMedicalProofFile(null);
                     setMedicalProofFileName("");
                     setFreezeRequestError(null);
                     setFreezeRequestSuccess(false);
                   }
                 }}
                 title="Request Membership Freeze"
                 size="md"
               >
                 {freezeRequestSuccess ? (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-center py-4"
                   >
                     <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                     <p className="text-slate-400 text-sm mb-2">Your membership freeze request has been submitted successfully.</p>
                     <p className="text-xs text-slate-500">Please allow 1-2 business days for processing.</p>
                   </motion.div>
                 ) : (
                   <form onSubmit={handleFreezeSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-slate-400 text-sm mb-2">Start Date</label>
                         <input
                           type="date"
                           value={freezeStartDate}
                           onChange={(e) => setFreezeStartDate(e.target.value)}
                           required
                           min={new Date().toISOString().split('T')[0]}
                           className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                       <div>
                         <label className="block text-slate-400 text-sm mb-2">End Date</label>
                         <input
                           type="date"
                           value={freezeEndDate}
                           onChange={(e) => setFreezeEndDate(e.target.value)}
                           required
                           min={new Date().toISOString().split('T')[0]}
                           className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-slate-400 text-sm mb-2">Medical Proof (Optional)</label>
                       <div
                         className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${medicalProofFileName ? "border-green-500/50 bg-green-600/5" : "border-slate-600 hover:border-slate-500 bg-slate-700/30"}`}
                         onDrop={handleDrop}
                         onDragOver={handleDragOver}
                         onClick={() => fileInputRef.current?.click()}
                       >
                         <input
                           ref={fileInputRef}
                           type="file"
                           onChange={handleFileChange}
                           accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                           className="hidden"
                         />
                         {medicalProofFileName ? (
                           <div className="flex items-center justify-center gap-2 text-green-400">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             <span className="text-sm font-medium">{medicalProofFileName}</span>
                           </div>
                         ) : (
                           <>
                             <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4m0-12v12m0 0l-4 4m4-4l-4-4" />
                             </svg>
                             <span className="text-slate-400 text-sm">Click to choose file or drag and drop</span>
                             <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                           </>
                         )}
                       </div>
                       <p className="text-xs text-slate-500 mt-1">Upload medical documentation to support your freeze request.</p>
                     </div>

                     {freezeRequestError && (
                       <div className="bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg p-3">
                         <p className="text-sm">{freezeRequestError}</p>
                       </div>
                     )}

                     <div className="flex gap-3 pt-2">
                       <button
                         type="button"
                         onClick={() => {
                           setShowFreezeModal(false);
                           setFreezeStartDate("");
                           setFreezeEndDate("");
                           setMedicalProofFile(null);
                           setMedicalProofFileName("");
                           setFreezeRequestError(null);
                           setFreezeRequestSuccess(false);
                         }}
                         disabled={freezeRequestLoading}
                         className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                       >
                         Cancel
                       </button>
                       <button
                         type="submit"
                         disabled={freezeRequestLoading}
                         className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                         {freezeRequestLoading ? (
                           <>
                             <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                             <span>Submitting...</span>
                           </>
                         ) : (
                           <>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                             </svg>
                             <span>Submit Request</span>
                           </>
                         )}
                       </button>
                     </div>
                   </form>
                 )}
               </Modal>
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-slate-800/60 border border-slate-700/50 rounded-xl"
            >
              <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-white mb-1">No Active membership</h2>
                {user?.membership === null && membershipConfig && (
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                    <span className="text-emerald-400 font-semibold">₱{Number(membershipConfig.fee).toLocaleString()}</span>
                    <span>{ucfirst(membershipConfig.duration)} ({membershipConfig.duration_days} days)</span>
                  </div>
                )}
                <p className="text-slate-400 text-sm">Renew to continue enjoying gym access</p>
              </div>
   
                 <Link 
                  to={("/client/payment?payment_for=" + 
                  (lastMembership && lastMembership?.status === "expired" ? "membership" : "membership")
                  )}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {lastMembershipLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      {lastMembership && lastMembership?.status === "expired" ? "Renew" : "Buy Membership"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Link>
                 <button
                   onClick={() => navigate("/client/daily-pass")}
                   className="group px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-slate-600/50 hover:border-slate-500"
                 >
                   Skip
                   <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                 </button>
             </motion.div>
           )}
         </AnimatePresence>

        {/* Benefits Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Benefits Included
          </h3>
          
          {configLoading ? (
            <div className="flex items-center justify-center gap-3 text-slate-400 py-8">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-red-500 rounded-full animate-spin" />
              <span>Loading benefits...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(membershipConfig?.perks && membershipConfig.perks.length > 0 
                ? membershipConfig.perks 
                : [
                    "24/7 Gym Access",
                    "Modern Equipment",
                    "Locker Room Access",
                    "Free Parking",
                    "Priority Client Support",
                    "Full Facility Access"
                  ]
              ).map((perk, index) => {
                const perkLower = perk.toLowerCase();
                let IconComponent = Check;
                let color = "text-blue-400";
                let bg = "bg-blue-600/10";
                let borderColor = "border-slate-600/50";

                if (perkLower.includes("24/7") || perkLower.includes("unlimited")) {
                  IconComponent = Clock;
                  color = "text-blue-400";
                  bg = "bg-blue-600/10";
                } else if (perkLower.includes("boxing")) {
                  IconComponent = Dumbbell;
                  color = "text-red-400";
                  bg = "bg-red-600/10";
                } else if (perkLower.includes("coffee") || perkLower.includes("water") || perkLower.includes("mineral")) {
                  IconComponent = Coffee;
                  color = "text-amber-400";
                  bg = "bg-amber-600/10";
                } else if (perkLower.includes("equipment") || perkLower.includes("heavy") || perkLower.includes("machines")) {
                  IconComponent = Dumbbell;
                  color = "text-orange-400";
                  bg = "bg-orange-600/10";
                } else if (perkLower.includes("assessment") || perkLower.includes("consultation")) {
                  IconComponent = Trophy;
                  color = "text-green-400";
                  bg = "bg-green-600/10";
                } else if (perkLower.includes("group") || perkLower.includes("class") || perkLower.includes("zumba")) {
                  IconComponent = Users;
                  color = "text-purple-400";
                  bg = "bg-purple-600/10";
                } else if (perkLower.includes("basketball") || perkLower.includes("court")) {
                  IconComponent = Award;
                  color = "text-cyan-400";
                  bg = "bg-cyan-600/10";
                } else if (perkLower.includes("calisthenics") || perkLower.includes("functional")) {
                  IconComponent = Dumbbell;
                  color = "text-pink-400";
                  bg = "bg-pink-600/10";
                } else if (perkLower.includes("wifi")) {
                  IconComponent = Wifi;
                  color = "text-indigo-400";
                  bg = "bg-indigo-600/10";
                } else if (perkLower.includes("locker") || perkLower.includes("storage")) {
                  IconComponent = Lock;
                  color = "text-yellow-500";
                  bg = "bg-yellow-600/10";
                } else if (perkLower.includes("shower")) {
                  IconComponent = Droplets;
                  color = "text-teal-400";
                  bg = "bg-teal-600/10";
                } else if (perkLower.includes("parking")) {
                  IconComponent = Car;
                  color = "text-emerald-400";
                  bg = "bg-emerald-600/10";
                } else if (perkLower.includes("lounge")) {
                  IconComponent = Coffee;
                  color = "text-amber-500";
                  bg = "bg-amber-700/10";
                } else {
                  IconComponent = Check;
                  color = "text-green-400";
                  bg = "bg-green-600/10";
                }

                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${bg} ${borderColor} hover:border-slate-500/70 transition-all group`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${bg} border border-slate-600/50`}>
                      <IconComponent className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-slate-300 text-sm leading-tight">{ucfirst(perk)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Why Choose Us */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">WHY CHOOSE <span className="text-red-500">6Pack Iron City</span>?</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            We're more than a gym — we're a community built on real results. Whether you're just starting out or training for competition, we provide the tools, coaching, and support to help you transform your body and mindset.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
                <Dumbbell className="w-5 h-5 text-slate-300" />
              </div>
              <div className="font-semibold text-white text-sm mb-1">Progressive Results</div>
              <div className="text-slate-400 text-xs">Track your gains with measurable improvements every week</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5 text-slate-300" />
              </div>
              <div className="font-semibold text-white text-sm mb-1">Expert Coaching</div>
              <div className="text-slate-400 text-xs">Certified trainers who adapt to your goals and lifestyle</div>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-slate-300" />
              </div>
              <div className="font-semibold text-white text-sm mb-1">Your Second Home</div>
              <div className="text-slate-400 text-xs">Join a community that motivates, supports, and celebrates with you</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}