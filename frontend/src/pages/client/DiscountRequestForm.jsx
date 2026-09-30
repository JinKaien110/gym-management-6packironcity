import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import api from "../../api/axios.js";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, CheckCircle, AlertCircle, ArrowLeft, User, CreditCard, Clock, X } from "lucide-react";

export default function DiscountRequestForm() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const data = location.state;
  const searchParams = new URLSearchParams(window.location.search);
  const planIdFromUrl = searchParams.get('plan_id');
  const pricingIdFromUrl = searchParams.get('pricing_id');
  const paymentForFromUrl = searchParams.get('payment_for');
  
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [idUrl, setIdUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [isReviewState, setIsReviewState] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await api.get('/client/discount-request');
        const request = response.data;
        
        if (request && (request.status === 'pending' || request.status === 'approved' || request.status === 'rejected')) {
          setExistingRequest(request);
          setIsReviewState(true);
        }
      } catch (err) {
        console.error("Error checking existing request:", err);
      } finally {
        setCheckingRequest(false);
      }
    };

    checkExistingRequest();
  }, [isAuthenticated, user]);


  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       setSelfieUrl(file); 
       setSelfiePreview(URL.createObjectURL(file)); 
     };
  }

  const handleIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdUrl(file);
      setIdPreview(URL.createObjectURL(file)); 
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selfieUrl || !idUrl) {
        error("Please upload both selfie and ID.");
        setIsSubmitting(false);
        return;
    }

    try {
        const formData = new FormData();
        formData.append("selfie_url", selfieUrl);
        formData.append("id_url", idUrl);
      const response = await api.post("/discount-request", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
      });
      
      success("Discount request submitted successfully! We'll review your application and send you an email once it's processed.");
      
      // Set the existing request manually to trigger review state
      setExistingRequest({
        _id: response.data?._id || Date.now().toString(),
        client_id: user?.id,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      setIsReviewState(true);
    } catch (err) {
      error(err.response?.data?.message || "Failed to submit discount request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Pay as regular instead" - cancel discount request and go to payment
  const handlePayRegularInstead = async () => {
    setIsCancelling(true);
    try {
      // Empty function - user can fill this with actual API call to cancel discount request
      console.log("Cancelling discount request and redirecting to payment...");

      await api.patch("/client/discount-requests/payasregular");

      success("Discount request cancelled. Proceeding to regular payment.");

      setShowConfirmModal(false);

      navigate(
        `/client/payment?plan_id=${planIdFromUrl}&pricing_id=${pricingIdFromUrl}&payment_for=${paymentForFromUrl}`
      );
      
      // Close modal and navigate to payment page
      setShowConfirmModal(false);
      navigate(`/client/payment?plan_id=${planIdFromUrl}&pricing_id=${pricingIdFromUrl}&payment_for=${paymentForFromUrl}`);
    } catch (err) {
      error(err.response?.data?.message || "Failed to cancel discount request.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading || checkingRequest) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          <span className="text-slate-400">Checking your request status...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="relative z-10 text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/client/dashboard")}
            className="inline-flex items-center text-slate-400 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Discount Request</h1>
            <p className="text-slate-400">
              Submit your application for PWD, Student, or Senior Citizen discount
            </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <User className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">PWD Discount</h3>
            <p className="text-sm text-slate-400">Persons with Disability</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <CreditCard className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Student Discount</h3>
            <p className="text-sm text-slate-400">Valid ID Required</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <CreditCard className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Senior Discount</h3>
            <p className="text-sm text-slate-400">60 years old and above</p>
          </div>
        </div>



        {/* Review Status - Show when client has existing request */}
        {isReviewState && existingRequest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-8 mb-6 ${
              existingRequest.status === 'approved' 
                ? 'bg-green-900/20 border border-green-500/50' 
                : existingRequest.status === 'rejected'
                ? 'bg-red-900/20 border border-red-500/50'
                : 'bg-slate-800/50 border border-yellow-500/50'
            }`}
          >
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                existingRequest.status === 'approved' 
                  ? 'bg-green-600/20' 
                  : existingRequest.status === 'rejected'
                  ? 'bg-red-600/20'
                  : 'bg-yellow-600/20'
              }`}>
                {existingRequest.status === 'approved' ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : existingRequest.status === 'rejected' ? (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                ) : (
                  <Clock className="w-10 h-10 text-yellow-500" />
                )}
              </div>
              
              {existingRequest.status === 'approved' ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-green-500">Congratulations! Your Discount is Approved</h2>
                  <p className="text-slate-300 mb-6">
                    Your discount request has been approved! You can now enjoy discounted pricing on your gym membership. 
                    Proceed to payment to avail your discount.
                  </p>
                  <button
                    onClick={() => navigate(`/client/payment?plan_id=${planIdFromUrl}&pricing_id=${pricingIdFromUrl}&payment_for=${paymentForFromUrl}`)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Proceed to Payment
                  </button>
                </>
              ) : existingRequest.status === 'rejected' ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-red-500">Your Discount Request Was Rejected</h2>
                  <p className="text-slate-300 mb-6">
                    Unfortunately, your discount request did not meet our requirements. 
                    Please contact us for more information or submit a new application with valid documents.
                  </p>
                  <button
                    onClick={() => {
                      setExistingRequest(null);
                      setIsReviewState(false);
                    }}
                    className="px-6 py-3 bg-transparent border-2 border-red-600 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-semibold transition-all"
                  >
                    Submit New Request
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">
                    Please Wait for Review...
                  </h2>

                  <p className="text-slate-400 mb-6">
                    Your discount request is currently being reviewed by our team.
                    We'll send you an email once the review is complete.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-3 bg-transparent border-2 border-red-600 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-semibold transition-all"
                  >
                    Pay Regular Price Instead
                  </button>
                </>
              )}

              <div className={`rounded-xl p-4 mt-6 ${
                existingRequest.status === 'approved' 
                  ? 'bg-green-900/30' 
                  : existingRequest.status === 'rejected'
                  ? 'bg-red-900/30'
                  : 'bg-slate-900/50'
              }`}>
                <p className="text-sm text-slate-400 mb-2">Application Status</p>
                <p className={`font-semibold capitalize ${
                  existingRequest.status === 'approved' 
                    ? 'text-green-500' 
                    : existingRequest.status === 'rejected'
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`}>{existingRequest.status}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form - Show when not in review state */}
        {!isReviewState && (
          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-red-600/30 rounded-2xl p-8" >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-red-500" />
              Upload Required Documents
            </h2>

            {/* Selfie Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                📸 Selfie Photo <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-red-600/50 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                {selfiePreview ? (
                  <div className="relative">
                    <img
                      src={selfiePreview}
                      alt="Selfie Preview"
                      className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelfiePreview(null);
                        setSelfieUrl("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-slate-400 mb-2">Take a selfie or upload a photo</p>
                    <label className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        id="selfieInput"
                        accept="image/*"
                        onChange={handleSelfieChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Please take a clear photo of yourself holding your valid ID
              </p>
            </div>

            {/* ID Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                🪪 Valid ID <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-red-600/50 rounded-xl p-6 text-center hover:border-red-500 transition-colors">
                {idPreview ? (
                  <div className="relative">
                    <img
                      src={idPreview}
                      alt="ID Preview"
                      className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIdPreview(null);
                        setIdUrl("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <CreditCard className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-slate-400 mb-2">Upload a photo of your valid ID</p>
                    <label className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        id="idInput"
                        accept="image/*"
                        onChange={handleIdChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Accepted: PWD ID, Student ID, Senior Citizen ID, or government-issued IDs
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selfieUrl || !idUrl}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isSubmitting || !selfieUrl || !idUrl
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Discount Request"
              )}
            </button>
          </form>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-800 border border-red-600/50 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Confirm Decision</h3>
                <p className="text-slate-400 mb-6">
                  Are you sure you want to proceed with regular pricing instead of the discounted rate? 
                  Your discount request will be cancelled.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-slate-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayRegularInstead}
                    disabled={isCancelling}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? "Processing..." : "Yes, Pay Regular Price"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Need help? Contact us at <span className="text-red-500">info@6packironcity.com</span></p>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
