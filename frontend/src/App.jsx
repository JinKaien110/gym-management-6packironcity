import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import ClassSchedules from "./pages/ClassSchedules.jsx";
import Trainers from "./pages/Trainers.jsx";
import FAQs from "./pages/FAQs.jsx";
import Contact from "./pages/Contact.jsx";
import Blog from "./pages/Blog.jsx";
import Gallery from "./pages/Gallery.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminClients from "./pages/admin/Clients.jsx";
import AdminMembershipRequests from "./pages/admin/MembershipRequests.jsx";
import AdminPlans from "./pages/admin/Plans.jsx";
import AdminPricing from "./pages/admin/Pricing.jsx";
import Adminmemberships from "./pages/admin/memberships.jsx";
import AdminPayments from "./pages/admin/Payments.jsx";
import AdminClasses from "./pages/admin/Classes.jsx";
import AdminSchedules from "./pages/admin/Schedules.jsx";
import AdminTrainers from "./pages/admin/Trainers.jsx";
import AdminBookings from "./pages/admin/Bookings.jsx";
import AdminDiscounts from "./pages/admin/Discounts.jsx";
import AdminAnalytics from "./pages/admin/Analytics.jsx";
import AdminAIRecommendations from "./pages/admin/AIRecommendations.jsx";
import AdminmembershipConfig from "./pages/admin/membershipConfig.jsx";
import AdminActivityLogs from "./pages/admin/ActivityLogs.jsx";
import PostRegistrationForm from "./pages/Post-Registrationform.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Notification from "./components/Notification.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import Dashboard from "./pages/client/Dashboard.jsx";
import EditProfile from "./pages/client/EditProfile.jsx";
import WorkoutRecommendation from "./pages/client/WorkoutRecommendation.jsx";
import MyWorkoutHistory from "./pages/client/MyWorkoutHistory.jsx";
import DiscountRequestForm from "./pages/client/DiscountRequestForm.jsx";
import PaymentForm from "./pages/client/PaymentForm.jsx";
import DailyPass from "./pages/client/DailyPass.jsx";
import Expired from "./pages/client/Expired.jsx";
import Membership from "./pages/client/Membership.jsx";
import PaymentHistory from "./pages/client/PaymentHistory.jsx";
import Progress from "./pages/client/Progress.jsx";
import Bookings from "./pages/client/Bookings.jsx";
import TrainerDashboard from "./pages/trainer/Dashboard.jsx";
import TrainerProfile from "./pages/trainer/Profile.jsx";

import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailed from "./pages/PaymentFailed.jsx";
import NotFound from "./pages/NotFound.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import { useFocusManagement } from "./hooks/useKeyboardNavigation.js";
import { useAdminKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.jsx";
import RequireProgress from "./guards/RequireProgress.jsx";
import PaymentGuard from "./guards/PaymentGuard.jsx";

function App() {
  const location = useLocation();
  
  // Initialize focus management for keyboard navigation
  useFocusManagement();
  
  // Initialize keyboard shortcuts for admin
  useAdminKeyboardShortcuts();

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Notification />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/about" element={<MainLayout><About /></MainLayout>} />
              <Route path="/schedules" element={<MainLayout><ClassSchedules /></MainLayout>} />
              <Route path="/trainers" element={<MainLayout><Trainers /></MainLayout>} />
              <Route path="/faqs" element={<MainLayout><FAQs /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              <Route path="/blog" element={<MainLayout><Blog /></MainLayout>} />
              <Route path="/gallery" element={<MainLayout><Gallery /></MainLayout>} />

              <Route element={
                <PublicRoute />}>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/admin/login' element={<AdminLogin />} />
              </Route>

              {/* Admin Routes with Sidebar Layout */}
              <Route element={
                <ProtectedRoute allowedUserTypes={["admin", "superadmin"]} allowedRoles={["admin", "superadmin", "staff"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="clients" element={<AdminClients />} />
                  <Route path="membership-requests" element={<AdminMembershipRequests />} />
                  <Route path="memberships" element={<Adminmemberships />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="classes" element={<AdminClasses />} />
                  <Route path="schedules" element={<AdminSchedules />} />
                  <Route path="trainers" element={<AdminTrainers />} />
                  <Route path="pricing" element={<AdminPricing />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="discounts" element={<AdminDiscounts />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="ai-recommendations" element={<AdminAIRecommendations />} />
                  <Route path="membership-config" element={<AdminmembershipConfig />} />
                  <Route path="activity-logs" element={<AdminActivityLogs />} />
                </Route>
              </Route>

              <Route element={
                <ProtectedRoute allowedUserTypes={["client"]} allowedRoles={["client"]} />}>
                  <Route path="/client/postform" element={<PostRegistrationForm />} />
                  <Route path="/client/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
                  <Route path="/client/profile" element={<EditProfile />} />
                <Route element={<RequireProgress />}>
                  
                  <Route path="/client/workout-recommendation" element={<WorkoutRecommendation />} />
                  <Route path="/client/my-workout-history" element={<MainLayout><MyWorkoutHistory /></MainLayout>} />
                  <Route path="/client/discount-request" element={<DiscountRequestForm />} />

                  <Route path="/client/payment" element={
                    <PaymentGuard>
                      <PaymentForm /> 
                    </PaymentGuard>} 
                  />

                   <Route path="/client/daily-pass" element={<MainLayout><DailyPass /></MainLayout>} />
                   <Route path="/client/bookings" element={<MainLayout><Bookings /></MainLayout>} />
                   <Route path="/client/expired" element={<Expired />} />
                   <Route path="/client/membership" element={<MainLayout><Membership /></MainLayout>} />
                  <Route path="/client/payments" element={<MainLayout><PaymentHistory /></MainLayout>} />
                  <Route path="/client/progress" element={<MainLayout><Progress /></MainLayout>} />
                  
                </Route>
                <Route path='/payment/success' element={<PaymentSuccess />} />
                  <Route path='/payment/failed' element={<PaymentFailed />} />
              </Route> 

               {/* Trainer Routes */}
               <Route element={
                 <ProtectedRoute allowedUserTypes={["trainer"]} allowedRoles={["trainer"]} />}>
                 <Route path="/trainer/dashboard" element={<MainLayout><TrainerDashboard /></MainLayout>} />
                 <Route path="/trainer/profile" element={<MainLayout><TrainerProfile /></MainLayout>} />
                 
               </Route>

               <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
    
  )

}

export default App
