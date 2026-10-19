import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext.jsx";
import api from "../../api/axios";
import { motion } from "framer-motion";
import { CreditCard, ArrowLeft, CheckCircle, Phone, Wallet, Loader, AlertTriangle, Calculator } from "lucide-react";

export default function PaymentForm() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentFor = searchParams.get('payment_for');
  const pricing_id = searchParams.get('pricing_id');
  const plan_id = searchParams.get('plan_id');
  const trainer_id = searchParams.get('trainer_id');
  const hours = searchParams.get('hours');
  const amountParam = searchParams.get('amount');
  const trainer_name = searchParams.get('trainer_name');
  const { success, error } = useNotification();

  const [formData, setFormData] = useState({
    amount: amountParam || "",
    payment_method: "",
    payment_for: paymentFor,
    trainer_id: trainer_id || "",
    hours: hours || "",
    trainer_name: trainer_name || "",
    pricing_id: pricing_id || "",
    plan_id: plan_id || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [trainerRate, setTrainerRate] = useState(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [originalPriceOrRegular, setOriginalPriceOrRegular] = useState(0);
const [discountedPrice, setDiscountedPrice] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const preparePayment = async () => {
      try {
        if (amountParam) {
          setFormData(prev => ({
            ...prev,
            amount: amountParam,
            payment_for: paymentFor,
            trainer_id: trainer_id || '',
            hours: hours || '',
            trainer_name: trainer_name || '',
            pricing_id: pricing_id || '',
            plan_id: plan_id || ''
          }));
          
          
          // Fetch trainer rate for breakdown if trainer-booking
          if (paymentFor === 'trainer-booking' && trainer_id) {
            setLoadingBreakdown(true);
            try {
              const trainerResponse = await api.get(`/trainers/${trainer_id}`);
              console.log("Trainer Response:", trainerResponse.data);
              const rate = trainerResponse.data.rate || trainerResponse.data.data?.rate || 0;
              setTrainerRate(rate);
            } catch (err) {
              console.error("Error fetching trainer rate:", err);
              // Use amountParam as fallback rate
              setTrainerRate(parseFloat(amountParam) || 0);
            } finally {
              setLoadingBreakdown(false);
            }
          }
          return;
        }

        const result = await api.get("/auth/me");
        const data = result.data;
        
        let price = 0;

        if (paymentFor === "daily_pass") {
          const pricingResponse = await api.get(`/pricing/${pricing_id}`);
          const pricingData = pricingResponse.data

          if (!pricingData) {
            throw new Error("Pricing not found");
          }

          if(data.membership?.status === "active") {
           const planResponse = await api.get(`/pricing/plan/${plan_id}`);
           const planData = planResponse.data.pricing;
            const regularPricing = planData.find(
                pricing => pricing.type === "regular"
            );
            const discountedPricing = planData.find(
                pricing => pricing.type === "discounted"
            );
            const regularPrice = regularPricing?.price ?? pricingData.price;
           const discountPrice = discountedPricing?.price ?? regularPrice;
          setOriginalPriceOrRegular(regularPrice);
          setDiscountedPrice(discountPrice);

           price = pricingData.price - (pricingData.price * 0.2); // Apply 20% discount for active members
          } else if(data.user.is_discounted === true) {
            const planResponse = await api.get(`/pricing/plan/${plan_id}`);
            const pricingList = planResponse.data.pricing;

            const regularPricing = pricingList.find(
                pricing => pricing.type === "regular"
            );
            const discountedPricing = pricingList.find(
                pricing => pricing.type === "discounted"
            );

        const regularPrice = regularPricing?.price ?? pricingData.price;
        const discountPrice = discountedPricing?.price ?? regularPrice;

        setOriginalPriceOrRegular(regularPrice);
        setDiscountedPrice(discountPrice);
        price = discountPrice
          }
          else {
           price = pricingData.price ;
          }
          
        } else if (paymentFor === "trainer-booking") {
          price = parseFloat(amountParam) || 0;
        } else if (paymentFor === "membership") {
          const membershipResponse = await api.get(`/client/membership-config`);
          price = parseFloat(membershipResponse.data.fee) || 0;
          console.log("Membership Config Response:", membershipResponse.data.fee);
        } else {
          throw new Error("Invalid payment purpose");
        }



        setFormData(prev => ({
          ...prev,
          amount: price,
          payment_for: paymentFor || 'membership'
        }));

      } catch (err) {
        error("Failed to prepare payment.");
      }
    };

    preparePayment();
  }, [
    isAuthenticated,
    amountParam,
    paymentFor,
    pricing_id,
    trainer_id,
    hours,
    trainer_name
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.payment_method) {
      error("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post("/payments/create", formData);
      
      setPaymentSuccess(true);
      success("Payment initiated successfully! Redirecting...");
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 text-red-600 animate-spin" />
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="relative z-10 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/client/dashboard")}
            className="inline-flex items-center text-gray-400 hover:text-red-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            {paymentFor === 'trainer-booking' ? 'Trainer Booking Payment' : 
             paymentFor === 'daily_pass' ? 'Daily Pass Payment' : 
             'Complete Payment'}
          </h1>
          <p className="text-gray-400">
            {paymentFor === 'trainer-booking' 
              ? `Booking ${trainer_name ? decodeURIComponent(trainer_name) : 'trainer'} for ${hours || 0} hour(s)`
              : paymentFor === 'daily_pass'
              ? 'Secure your daily gym access'
              : 'Secure your gym membership with a quick and easy payment'}
          </p>
        </div>

        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-900/30 border border-green-600 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Payment Initiated!</h3>
                <p className="text-gray-300">Your payment has been initiated. You will be redirected to complete the payment.</p>
              </div>
            </div>
          </motion.div>
        )}

        {!paymentSuccess && (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-red-600/30 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-red-500" />
              Payment Details
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Amount (PHP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₱</span>
                <input
                  type="text"
                  value={formData.amount ? `₱${parseFloat(formData.amount).toLocaleString('en-US')}` : '₱0.00'}
                  readOnly
                  className="w-full bg-zinc-800 border border-red-600/30 rounded-xl pl-8 pr-4 py-4 text-white font-semibold"
                />
              </div>

              {/* Payment Breakdown for Trainer Booking */}
              {paymentFor === 'trainer-booking' && (trainerRate || formData.amount) && (
                <div className="mt-4 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <Calculator className="w-4 h-4" />
                    Payment Breakdown
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trainer</span>
                      <span className="text-white">{trainer_name ? decodeURIComponent(trainer_name) : 'Selected Trainer'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Hourly Rate</span>
                      <span className="text-white">₱{trainerRate ? trainerRate.toLocaleString('en-US') : '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Hours</span>
                      <span className="text-white">{hours || 1} hr(s)</span>
                    </div>
                    <div className="border-t border-zinc-700/50 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total Amount</span>
                        <span className="text-white font-bold text-lg">₱{formData.amount ? parseFloat(formData.amount).toLocaleString('en-US') : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Breakdown for Daily Pass */}
              {paymentFor === 'daily_pass' && pricing_id && (
                <div className="mt-4 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <Calculator className="w-4 h-4" />
                    Payment Breakdown
                  </div>

                  <div className="space-y-2">
                    {/* Original Regular Price */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Original Price</span>
                      <span className="text-white">
                        ₱{Number(originalPriceOrRegular).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>

                    {/* Client Discounted & Membership Discount: 20% of the applicable price */}
                    {(user?.user?.is_discounted === true && user?.membership?.status === 'active') && (
                      <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Discounted Price</span>
                        <span className="text-green-500">
                          ₱{Number(
                             discountedPrice
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        </div>
                        <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Membership Discount (20%)</span>
                        <span className="text-green-500">
                          - ₱{Number(
                            (user.user?.is_discounted === true
                              ? discountedPrice
                              : originalPriceOrRegular) * 0.2
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      </>
                    )}

                    {/* Special Discounted Price */}
                    {user?.is_discounted === true && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Discounted Price</span>
                        <span className="text-green-500">
                          ₱{Number(
                             discountedPrice
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    )}

                    {/* Membership Discount: 20% of the applicable price */}
                    {(user?.is_discounted === false && user?.membership?.status === 'active') && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Membership Discount (20%)</span>
                        <span className="text-green-500">
                          - ₱{Number(
                            (user?.is_discounted === true
                              ? discountedPrice
                              : originalPriceOrRegular) * 0.2
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    )}

                    {/* Final Amount */}
                    <div className="border-t border-zinc-700/50 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Final Amount</span>
                        <span className="text-white font-bold text-lg">
                          ₱{Number(formData.amount  || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
               {user?.membership?.status === 'active' && (
                    <div className="mt-3 px-3 py-2 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <p className="text-green-400 text-sm text-center font-medium">
                        🎉 You saved 20% with your active membership!
                      </p>
                    </div>
                  )}

            <div className="my-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    formData.payment_method === "gcash"
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-red-600/30 hover:border-red-500 bg-black/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gcash"
                    checked={formData.payment_method === "gcash"}
                    onChange={() =>
                    setFormData(prev => ({ ...prev, payment_method: "gcash" }))
                    }
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">GCash</span>
                </label>

                <label
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    formData.payment_method === "paymaya"
                      ? "border-blue-600 bg-blue-900/20"
                      : "border-red-600/30 hover:border-red-500 bg-black/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="paymaya"
                    checked={formData.payment_method === "paymaya"}
                    onChange={() =>
                        setFormData(prev => ({ ...prev, payment_method: "paymaya" }))
                    }
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold">PayMaya</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.payment_method}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isSubmitting ||  !formData.payment_method
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pay ₱{formData.amount ? parseFloat(formData.amount).toLocaleString('en-US') : "0.00"}
                </span>
              )}
            </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🔒 Your payment is secured by Xendit</p>
          <p className="mt-2">Need help? Contact us at <span className="text-red-500">info@6packironcity.com</span></p>
        </div>
      </motion.div>
      </div>
    </div>
  );
}