import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toCanvas } from "html-to-image";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, CreditCard, DollarSign, 
  Calendar, Activity, RefreshCw, Download, Filter, Bot, Loader, Eye, FileText,
  ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle, Zap, ChevronDown
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import Modal from "../../components/Modal.jsx";

const COLORS = ["#dc2626", "#16a34a", "#2563eb", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  // Chart refs for html2canvas snapshot capture
  const revenueChartRef = useRef(null);
  const bookingsChartRef = useRef(null);
  const clientGrowthChartRef = useRef(null);
  const membershipStatusChartRef = useRef(null);
  const dailyPassChartRef = useRef(null);
  const membershipGrowthChartRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState("custom");
  const [monthFilter, setMonthFilter] = useState("");
  const [businessRecommendation, setBusinessRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState("1_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [plansForDropdown, setPlansForDropdown] = useState([]);
  const [pricingsForDropdown, setPricingsForDropdown] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/admin/plans?limit=100");
        setPlansForDropdown(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching plans for Analytics filter dropdown:", err);
      }
    };

    const fetchPricings = async () => {
      try {
        const response = await api.get("/admin/pricing?limit=1000");
        setPricingsForDropdown(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching pricing dropdown:", err);
      }
    };

    fetchPricings();
    fetchPlans();
  }, []);

  const [classFilter, setClassFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [fitnessGoalFilter, setFitnessGoalFilter] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [isDiscountedFilter, setIsDiscountedFilter] = useState("");
  const [trainingTypeFilter, setTrainingTypeFilter] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("");
  const [daysPerWeekFilter, setDaysPerWeekFilter] = useState("");
  const [sessionMinutesFilter, setSessionMinutesFilter] = useState("");
  const [medicalConditionFilter, setMedicalConditionFilter] = useState("");
  const [membershipStatusFilter, setMembershipStatusFilter] = useState("");
  const [membershipFrozenFilter, setMembershipFrozenFilter] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState("");
  const [pricingTypeFilter, setPricingTypeFilter] = useState("");
  const [paymentProviderFilter, setPaymentProviderFilter] = useState("");
  const [paymentReferenceFilter, setPaymentReferenceFilter] = useState("");
  const [referenceNoFilter, setReferenceNoFilter] = useState("");
  const [paymentAmountMinFilter, setPaymentAmountMinFilter] = useState("");
  const [paymentAmountMaxFilter, setPaymentAmountMaxFilter] = useState("");
  const [classStatusFilter, setClassStatusFilter] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("");
  const [trainerStatusFilter, setTrainerStatusFilter] = useState("");
  const [trainerSpecializationFilter, setTrainerSpecializationFilter] = useState("");
  const [trainerRateMinFilter, setTrainerRateMinFilter] = useState("");
  const [trainerRateMaxFilter, setTrainerRateMaxFilter] = useState("");
  const [discountRequestStatusFilter, setDiscountRequestStatusFilter] = useState("");
  const [reviewedByFilter, setReviewedByFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditEntityFilter, setAuditEntityFilter] = useState("");
  const [auditActorRoleFilter, setAuditActorRoleFilter] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState("");
  const [httpMethodFilter, setHttpMethodFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [updatedByFilter, setUpdatedByFilter] = useState("");
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [openFilterSection, setOpenFilterSection] = useState("clients");
  const [pricingFilter, setPricingFilter] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const buildFilterPayload = () => ({
    ...(dateRange && (dateRange === "this_year" ? { months: 0 } : { months: Number(dateRange) || 0 })),

    ...(monthFilter ? { month: monthFilter } : {}),
    ...(dateRange === "custom" && customStartDate ? { start_date: customStartDate } : {}),
    ...(dateRange === "custom" && customEndDate ? { end_date: customEndDate } : {}),

    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentMethodFilter ? { payment_method: paymentMethodFilter } : {}),
    ...(paymentStatusFilter ? { payment_status: paymentStatusFilter } : {}),
    ...(paymentTypeFilter ? { payment_for: paymentTypeFilter } : {}),
    // Memberships filter by plan_id (pricing correlates via plans -> pricing.plan_id on backend aggregations)
    ...(planFilter ? { plan_id: planFilter } : {}),
    ...(pricingFilter ? { pricing_id: pricingFilter } : {}),
    ...(classFilter ? { class_id: classFilter } : {}),
    ...(trainerFilter ? { trainer_id: trainerFilter } : {}),
    ...(specializationFilter ? { specialization: specializationFilter } : {}),
    ...(searchFilter ? { search: searchFilter } : {}),
    ...(genderFilter ? { gender: genderFilter } : {}),
    ...(fitnessGoalFilter ? { fitness_goal: fitnessGoalFilter } : {}),
    ...(discountTypeFilter ? { discount_type: discountTypeFilter } : {}),
    ...(requestTypeFilter ? { request_type: requestTypeFilter } : {}),
    ...(clientFilter ? { client_id: clientFilter } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(userTypeFilter ? { user_type: userTypeFilter } : {}),
    ...(isDiscountedFilter ? { is_discounted: isDiscountedFilter } : {}),
    ...(trainingTypeFilter ? { training_type: trainingTypeFilter } : {}),
    ...(experienceLevelFilter ? { experience_level: experienceLevelFilter } : {}),
    ...(daysPerWeekFilter ? { days_per_week: daysPerWeekFilter } : {}),
    ...(sessionMinutesFilter ? { session_minutes: sessionMinutesFilter } : {}),
    ...(medicalConditionFilter ? { medical_condition: medicalConditionFilter } : {}),
    ...(membershipStatusFilter ? { membership_status: membershipStatusFilter } : {}),
    ...(membershipFrozenFilter ? { membership_frozen: membershipFrozenFilter } : {}),
    ...(planStatusFilter ? { plan_status: planStatusFilter } : {}),
    ...(pricingTypeFilter ? { pricing_type: pricingTypeFilter } : {}),
    ...(paymentProviderFilter ? { payment_provider: paymentProviderFilter } : {}),
    ...(paymentReferenceFilter ? { payment_reference: paymentReferenceFilter } : {}),
    ...(referenceNoFilter ? { reference_no: referenceNoFilter } : {}),
    ...(paymentAmountMinFilter ? { payment_amount_min: paymentAmountMinFilter } : {}),
    ...(paymentAmountMaxFilter ? { payment_amount_max: paymentAmountMaxFilter } : {}),
    ...(classStatusFilter ? { class_status: classStatusFilter } : {}),
    ...(bookingTypeFilter ? { booking_type: bookingTypeFilter } : {}),
    ...(bookingStatusFilter ? { booking_status: bookingStatusFilter } : {}),
    ...(scheduleStatusFilter ? { schedule_status: scheduleStatusFilter } : {}),
    ...(trainerStatusFilter ? { trainer_status: trainerStatusFilter } : {}),
    ...(trainerSpecializationFilter ? { trainer_specialization: trainerSpecializationFilter } : {}),
    ...(trainerRateMinFilter ? { trainer_rate_min: trainerRateMinFilter } : {}),
    ...(trainerRateMaxFilter ? { trainer_rate_max: trainerRateMaxFilter } : {}),
    ...(discountRequestStatusFilter ? { discount_request_status: discountRequestStatusFilter } : {}),
    ...(reviewedByFilter ? { reviewed_by: reviewedByFilter } : {}),
    ...(auditActionFilter ? { audit_action: auditActionFilter } : {}),
    ...(auditEntityFilter ? { audit_entity: auditEntityFilter } : {}),
    ...(auditActorRoleFilter ? { audit_actor_role: auditActorRoleFilter } : {}),
    ...(auditStatusFilter ? { audit_status: auditStatusFilter } : {}),
    ...(httpMethodFilter ? { http_method: httpMethodFilter } : {}),
    ...(createdByFilter ? { created_by: createdByFilter } : {}),
    ...(updatedByFilter ? { updated_by: updatedByFilter } : {}),
  });

  const buildAnalyticsQueryParams = (filters = appliedFilters) => {
    const params = new URLSearchParams({
      filters: JSON.stringify(filters || buildFilterPayload()),
    });

    return params;
  };

  const fetchAnalytics = async (filtersToUse = appliedFilters) => {
    try {
      setLoading(true);
      const params = buildAnalyticsQueryParams(filtersToUse || buildFilterPayload());
      const response = await api.get(`/admin/analytics?${params.toString()}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async () => {
    const nextFilters = buildFilterPayload();
    setAppliedFilters(nextFilters);
    await fetchAnalytics(nextFilters);
    success("Analytics filters applied");
  };

  const handleResetFilters = async () => {
    setDateRange("");

    setMonthFilter("");
    setCustomStartDate("");
    setCustomEndDate("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setPaymentStatusFilter("");
    setPaymentTypeFilter("");
    setPlanFilter("");
    setClassFilter("");
    setTrainerFilter("");
    setSpecializationFilter("");
    setSearchFilter("");
    setGenderFilter("");
    setFitnessGoalFilter("");
    setDiscountTypeFilter("");
    setRequestTypeFilter("");
    setClientFilter("");
    setRoleFilter("");
    setUserTypeFilter("");
    setIsDiscountedFilter("");
    setTrainingTypeFilter("");
    setExperienceLevelFilter("");
    setDaysPerWeekFilter("");
    setSessionMinutesFilter("");
    setMedicalConditionFilter("");
    setMembershipStatusFilter("");
    setMembershipFrozenFilter("");
    setPlanStatusFilter("");
    setPricingTypeFilter("");
    setPaymentProviderFilter("");
    setPaymentReferenceFilter("");
    setReferenceNoFilter("");
    setPaymentAmountMinFilter("");
    setPaymentAmountMaxFilter("");
    setClassStatusFilter("");
    setBookingTypeFilter("");
    setBookingStatusFilter("");
    setScheduleStatusFilter("");
    setTrainerStatusFilter("");
    setTrainerSpecializationFilter("");
    setTrainerRateMinFilter("");
    setTrainerRateMaxFilter("");
    setDiscountRequestStatusFilter("");
    setReviewedByFilter("");
    setAuditActionFilter("");
    setAuditEntityFilter("");
    setAuditActorRoleFilter("");
    setAuditStatusFilter("");
    setHttpMethodFilter("");
    setCreatedByFilter("");
    setUpdatedByFilter("");

    const resetFilters = {};
    setAppliedFilters(resetFilters);
    await fetchAnalytics(resetFilters);
    success("Analytics filters reset");
  };

  useEffect(() => {
    fetchAnalytics();
    fetchRecommendationHistory();
  }, []);

  const fetchRecommendationHistory = async () => {
    try {
      const response = await api.get("/ai/workout-recommendation?type=business");
      const recommendations = response.data.data || response.data.result || [];
      setRecommendationHistory(recommendations);
    } catch (err) {
      console.error("Error fetching recommendation history:", err);
    }
  };


  const handleExportPDF = (recommendation) => {
    if (!recommendation) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Business Recommendation Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: #fff; }
    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 30px; }
    h2 { color: #1f2937; margin-top: 40px; margin-bottom: 20px; }
    h3 { color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
    .meta { color: #6b7280; margin-bottom: 30px; font-size: 14px; }
    .summary-box { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
    .summary-box p { font-size: 16px; line-height: 1.6; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .metric-card { background: #f9fafb; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb; }
    .metric-card .value { font-size: 28px; font-weight: bold; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .metric-card .trend-arrow { font-size: 20px; }
    .metric-card .trend-arrow.trend-up { color: #16a34a; }
    .metric-card .trend-arrow.trend-down { color: #dc2626; }
    .metric-card .trend-arrow.trend-neutral { color: #6b7280; }
    .metric-card .metric-value { color: #1f2937; }
    .metric-card .label { font-size: 13px; color: #6b7280; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin: 20px 0; }
    .highlight-card { padding: 20px; border-radius: 10px; }
    .highlight-card.positive { background: #dcfce7; border-left: 4px solid #16a34a; }
    .highlight-card.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .highlight-card.neutral { background: #f3f4f6; border-left: 4px solid #6b7280; }
    .highlight-card h4 { margin: 0 0 10px 0; color: #1f2937; font-size: 15px; }
    .highlight-card p { margin: 0; color: #4b5563; font-size: 14px; }
    .risks-section { margin: 25px 0; }
    .risk-card { display: flex; align-items: flex-start; gap: 15px; padding: 15px; background: #fef2f2; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #dc2626; }
    .risk-card .severity { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .risk-card .severity.high { background: #fecaca; color: #dc2626; }
    .risk-card .severity.medium { background: #fef3c7; color: #d97706; }
    .risk-card .severity.low { background: #d1fae5; color: #16a34a; }
    .risk-card h4 { margin: 0 0 5px 0; color: #1f2937; font-size: 14px; }
    .risk-card p { margin: 0; color: #6b7280; font-size: 13px; }
    .rec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0; }
    .rec-card { background: #f9fafb; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; }
    .rec-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .rec-card .score { padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
    .rec-card .score.high { background: #fecaca; color: #dc2626; }
    .rec-card .score.medium { background: #fef3c7; color: #d97706; }
    .rec-card .score.low { background: #d1fae5; color: #16a34a; }
    .rec-card .category { color: #6b7280; font-size: 12px; }
    .rec-card h4 { margin: 0 0 10px 0; color: #1f2937; font-size: 16px; }
    .rec-card .description { color: #4b5563; font-size: 14px; line-height: 1.5; }
    .rec-card .impact { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #16a34a; font-size: 13px; font-weight: 500; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
    @media print { body { padding: 20px; } .metrics-grid, .highlights-grid, .rec-grid { display: block; } .metric-card, .highlight-card, .rec-card { margin-bottom: 15px; page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Business Recommendation Report</h1>
  <div class="meta">
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p><strong>Date Range:</strong> ${recommendation.date_range || recommendation.range || 'N/A'}</p>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary-box">
    <p>${recommendation.analysis?.summary || 'No summary available.'}</p>
  </div>

  ${recommendation.analysis?.metrics && recommendation.analysis.metrics.length > 0 ? `
  <h2>Key Metrics</h2>
  <div class="metrics-grid">
    ${recommendation.analysis.metrics.map(m => `
    <div class="metric-card">
      <div class="value">${m.value}</div>
      <div class="label">${m.label}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${recommendation.analysis?.highlights && recommendation.analysis.highlights.length > 0 ? `
  <h2>Highlights</h2>
  <div class="highlights-grid">
    ${recommendation.analysis.highlights.map(h => `
    <div class="highlight-card ${h.type || 'neutral'}">
      <h4>${h.title}</h4>
      <p>${h.description}</p>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${recommendation.analysis?.risks && recommendation.analysis.risks.length > 0 ? `
  <h2>Risks & Concerns</h2>
  <div class="risks-section">
    ${recommendation.analysis.risks.map(r => `
    <div class="risk-card">
      <span class="severity ${r.severity || 'medium'}">${r.severity || 'MEDIUM'}</span>
      <div>
        <h4>${r.title}</h4>
        <p>${r.description}</p>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <h2>Strategic Recommendations</h2>
  <div class="rec-grid">
    ${recommendation.recommendations?.map(rec => `
    <div class="rec-card">
      <div class="header">
        <span class="score ${rec.priority_score >= 8 ? 'high' : rec.priority_score >= 5 ? 'medium' : 'low'}">
          Priority ${rec.priority_score || 5}/10
        </span>
        <span class="category">${rec.category || 'General'}</span>
      </div>
      <h4>${rec.title}</h4>
      <p class="description">${rec.description}</p>
      ${rec.impact ? `<div class="impact">Expected Impact: ${rec.impact}</div>` : ''}
    </div>
    `).join('') || '<p>No recommendations available.</p>'}
  </div>

  <div class="footer">
    <p>Gym Capstone - Analytics Dashboard | Business Recommendation Report</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = function() {
        printWindow.print();
      };
    }
  };

const handleExportAnalyticsPDF = async () => {
    try {
      if (!analytics) {
        error("No analytics data to export");
        return;
      }

      // Disable PieChart animations so they render in their final state immediately
      setIsExporting(true);

      // Small delay so React re-renders with animation disabled
      await new Promise(r => setTimeout(r, 100));

      success("Capturing chart snapshots...");

      // Capture charts directly from the current page where PieCharts are already fully animated
      const captureChart = async (ref, fallbackText) => {
        if (ref?.current) {
          try {
            const canvas = await toCanvas(ref.current, {
              backgroundColor: "#1e293b",
              pixelRatio: 2,
              cacheBust: true,
            });
            return canvas.toDataURL("image/jpeg", 0.92);
          } catch (e) {
            console.warn(`Failed to capture chart: ${fallbackText}`, e);
            return null;
          }
        }
        return null;
      };

      // All charts are on the current page — PieCharts are already fully animated
      const revenueChartImg = await captureChart(revenueChartRef, "Revenue Trend");
      const bookingsChartImg = await captureChart(bookingsChartRef, "Bookings by Type");
      const clientGrowthChartImg = await captureChart(clientGrowthChartRef, "Client Growth");
      const membershipStatusChartImg = await captureChart(membershipStatusChartRef, "Membership Status");
      const dailyPassChartImg = await captureChart(dailyPassChartRef, "Daily Pass Pricing");
      const membershipGrowthChartImg = await captureChart(membershipGrowthChartRef, "Membership Growth");

      const formatCurrency = (value) => `₱${(value || 0).toLocaleString()}`;
      const genDate = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      });

      // Build popular classes table rows
      console.log(analytics.classPopularity)
      const popularClassesRows = (analytics?.classPopularity || []).map((cls, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td>${cls.name}</td>
          <td class="value-cell">${cls.bookings} bookings</td>
        </tr>
      `).join("");

      // Build top trainers table rows
      const topTrainersRows = (analytics?.topTrainers || []).map((t, i) => `
        <tr>
          <td class="rank">${i + 1}</td>
          <td>${t.name}</td>
          <td class="value-cell">${t.count} sessions</td>
        </tr>
      `).join("");

      // Build daily pass table rows
      const dailyPassRows = (analytics?.dailyPassPricingDistribution || []).map(row => `
        <tr>
          <td>${row.name}</td>
          <td class="value-cell">${row.regular > 0 ? `₱${row.regular.toLocaleString()}` : "—"}</td>
          <td class="value-cell">${row.regularCount || 0}</td>
          <td class="value-cell">${row.discounted > 0 ? `₱${row.discounted.toLocaleString()}` : "—"}</td>
          <td class="value-cell">${row.discountedCount || 0}</td>
          <td class="value-cell">${(row.regularCount || 0) + (row.discountedCount || 0)}</td>
        </tr>
      `).join("");

      // Build membership growth table rows
      const membershipGrowthRows = (analytics?.membershipGrowthDistribution || []).map(row => `
        <tr>
          <td>${row.month}</td>
          <td class="value-cell">${row.memberships || 0}</td>
        </tr>
      `).join("");

      const metricCardsHtml = `
        <div class="metric-card"><div class="value">${analytics?.overview?.totalClients || 0}</div><div class="label">Total Clients</div></div>
        <div class="metric-card"><div class="value">${analytics?.overview?.activeMemberships || 0}</div><div class="label">Active Memberships</div></div>
        <div class="metric-card"><div class="value">${formatCurrency(analytics?.overview?.thisMonthRevenue)}</div><div class="label">Monthly Revenue</div></div>
        <div class="metric-card"><div class="value">${analytics?.overview?.activeClasses || 0}</div><div class="label">Active Classes</div></div>
        <div class="metric-card"><div class="value">${analytics?.overview?.totalBookings || 0}</div><div class="label">Total Bookings</div></div>
        <div class="metric-card"><div class="value">${analytics?.overview?.pendingRequests || 0}</div><div class="label">Pending Requests</div></div>
      `;

      const chartToImg = (imgData, title) => {
        if (!imgData) return `<div class="chart-fallback"><p>${title} — chart could not be captured</p></div>`;
        return `<div class="chart-container"><h3>${title}</h3><img src="${imgData}" alt="${title}" /></div>`;
      };

      const escapeHtml = (value) => String(value ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      let auditLogsHtml = "";
      try {
        const auditResponse = await api.get("/admin/analytics/export-pdf", {
          params: { collection: "audit_logs", limit: 50, page: 1 }
        });

        const auditLogs = Array.isArray(auditResponse?.data?.data)
          ? auditResponse.data.data
          : Array.isArray(auditResponse?.data?.items)
            ? auditResponse.data.items
            : [];

        const rows = (auditLogs || []).slice(0, 25).map((entry) => {
          const timestamp = entry?.timestamp ? new Date(entry.timestamp).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) : "—";
          const summary = escapeHtml(entry?.summary || "");

          return `
            <tr>
              <td>${timestamp}</td>
              <td>${escapeHtml(entry?.actor || "System")}</td>
              <td>${escapeHtml(entry?.role || "Unknown")}</td>
              <td>${escapeHtml(entry?.action || "Action")}</td>
              <td>${escapeHtml(entry?.entity || "N/A")}</td>
              <td>${escapeHtml(entry?.status || "success")}</td>
              <td>${summary ? summary.slice(0, 90) + (summary.length > 90 ? "..." : "") : "—"}</td>
            </tr>
          `;
        }).join("");

        auditLogsHtml = rows
          ? `
            <div class="section-label">AUDIT LOGS</div>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Status</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `
          : "<p style='color:#9ca3af;margin:15px 0;'>No audit log data available</p>";
      } catch (error) {
        console.warn("Unable to fetch audit logs for export:", error);
        auditLogsHtml = "<p style='color:#9ca3af;margin:15px 0;'>Audit logs were unavailable for this export.</p>";
      }

      let bookingsHtml = "";
      try {
        const bookingsResponse = await api.get("/admin/analytics/export-pdf", {
          params: { collection: "bookings", limit: 50, page: 1 }
        });

        const bookings = Array.isArray(bookingsResponse?.data?.data)
          ? bookingsResponse.data.data
          : Array.isArray(bookingsResponse?.data?.items)
            ? bookingsResponse.data.items
            : [];

        const bookingRows = (bookings || []).slice(0, 25).map((entry) => {
          const timestamp = entry?.createdAt ? new Date(entry.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) : "—";
          const joinedAt = entry?.joinedAt ? new Date(entry.joinedAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) : "—";
          const displayName = entry?.type === "trainer-booking"
            ? (entry?.trainerName || "—")
            : (entry?.clientName || "—");

          return `
            <tr>
              <td>${escapeHtml(entry?._id || "")}</td>
              <td>${escapeHtml(entry?.schedule_id || "")}</td>
              <td>${escapeHtml(displayName)}</td>
              <td>${escapeHtml(entry?.status || "pending")}</td>
              <td>${escapeHtml(entry?.type || "class")}</td>
              <td>${timestamp}</td>
              <td>${joinedAt}</td>
              <td>${escapeHtml(entry?.cancelledAt ? new Date(entry.cancelledAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")}</td>
              <td>${escapeHtml(entry?.cancelReason || "—")}</td>
            </tr>
          `;
        }).join("");

        bookingsHtml = bookingRows
          ? `
            <div class="section-label">BOOKINGS</div>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Schedule ID</th>
                  <th>Client / Trainer</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Joined</th>
                  <th>Cancelled</th>
                  <th>Cancel Reason</th>
                </tr>
              </thead>
              <tbody>${bookingRows}</tbody>
            </table>
          `
          : "<p style='color:#9ca3af;margin:15px 0;'>No booking data available</p>";
      } catch (error) {
        console.warn("Unable to fetch bookings for export:", error);
        bookingsHtml = "<p style='color:#9ca3af;margin:15px 0;'>Bookings were unavailable for this export.</p>";
      }

      let membershipsHtml = "";
      try {
        const membershipsResponse = await api.get("/admin/analytics/export-pdf", {
          params: { collection: "memberships", limit: 50, page: 1 }
        });

        const memberships = Array.isArray(membershipsResponse?.data?.data)
          ? membershipsResponse.data.data
          : Array.isArray(membershipsResponse?.data?.items)
            ? membershipsResponse.data.items
            : [];

        const membershipRows = (memberships || []).slice(0, 25).map((entry) => {
          const startDate = entry?.start_date ? new Date(entry.start_date).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          }) : "—";
          const endDate = entry?.end_date ? new Date(entry.end_date).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          }) : "—";
          const archivedAt = entry?.archivedAt ? new Date(entry.archivedAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          }) : "—";

          return `
            <tr>
              <td>${escapeHtml(entry?._id || "")}</td>
              <td>${escapeHtml(entry?.clientName || "—")}</td>
              <td>${escapeHtml(entry?.status || "pending")}</td>
              <td>${escapeHtml(entry?.is_frozen ? "Yes" : "No")}</td>
              <td>${startDate}</td>
              <td>${endDate}</td>
              <td>${escapeHtml(entry?.payment_id || "")}</td>
              <td>${archivedAt}</td>
            </tr>
          `;
        }).join("");

        membershipsHtml = membershipRows
          ? `
            <div class="section-label">MEMBERSHIPS</div>
            <table>
              <thead>
                <tr>
                  <th>Membership ID</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Frozen</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Payment ID</th>
                  <th>Archived</th>
                </tr>
              </thead>
              <tbody>${membershipRows}</tbody>
            </table>
          `
          : "<p style='color:#9ca3af;margin:15px 0;'>No membership data available</p>";
      } catch (error) {
        console.warn("Unable to fetch memberships for export:", error);
        membershipsHtml = "<p style='color:#9ca3af;margin:15px 0;'>Memberships were unavailable for this export.</p>";
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Analytics Report - Gym Capstone</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px 40px; max-width: 1100px; margin: 0 auto; background: #fff; color: #1f2937; }
    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px; font-size: 24px; }
    h2 { color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    h3 { color: #374151; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; line-height: 1.6; }
    .meta p { margin-bottom: 3px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 15px 0 25px; }
    .metric-card { background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
    .metric-card .value { font-size: 24px; font-weight: bold; color: #111827; }
    .metric-card .label { font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .chart-container { margin: 20px 0; page-break-inside: avoid; }
    .chart-container img { width: 100%; max-width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; }
    .chart-fallback { background: #f3f4f6; padding: 40px; text-align: center; border-radius: 8px; color: #9ca3af; margin: 20px 0; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0 25px; font-size: 13px; }
    th { background: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 10px 12px; border: 1px solid #e5e7eb; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { padding: 8px 12px; border: 1px solid #e5e7eb; color: #4b5563; }
    .rank { width: 30px; text-align: center; font-weight: bold; color: #dc2626; }
    .value-cell { text-align: right; font-weight: 500; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; }
    .section-label { background: #dc2626; color: white; display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 10px; letter-spacing: 1px; margin-bottom: 8px; }
    @media print { body { padding: 20px; } .charts-row { page-break-inside: avoid; } table { page-break-inside: avoid; } img { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Gym Capstone — Analytics Report</h1>
  <div class="meta">
    <p><strong>Generated:</strong> ${genDate}</p>
    <p><strong>Total Records Included:</strong> ${analytics?.reportData?.totalRecordsIncluded || 0}</p>
    <p><strong>Timeframe:</strong> ${analytics?.reportData?.timeframeLabel || "N/A"}</p>
    <p><strong>Applied Filters:</strong> ${analytics?.reportData?.appliedFiltersLabel || "None"}</p>
  </div>

  <div class="section-label">EXECUTIVE OVERVIEW</div>
  <div class="metrics-grid">${metricCardsHtml}</div>

  <div class="section-label">CHARTS &amp; VISUALIZATIONS</div>
  
  <div class="charts-row">
    ${chartToImg(revenueChartImg, "Revenue Trend")}
    ${chartToImg(bookingsChartImg, "Bookings by Type")}
  </div>
  <div class="charts-row">
    ${chartToImg(clientGrowthChartImg, "Client Growth")}
    ${chartToImg(membershipStatusChartImg, "Membership Status")}
  </div>
  
  ${chartToImg(dailyPassChartImg, "Daily Pass Pricing Distribution")}
  ${chartToImg(membershipGrowthChartImg, "Membership Growth Distribution")}

  <div class="section-label">POPULAR CLASSES</div>
  <table>
    <thead><tr><th>#</th><th>Class Name</th><th>Bookings</th></tr></thead>
    <tbody>${popularClassesRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;">No class data available</td></tr>'}</tbody>
  </table>

  <div class="section-label">TOP TRAINERS</div>
  <table>
    <thead><tr><th>#</th><th>Trainer Name</th><th>Sessions</th></tr></thead>
    <tbody>${topTrainersRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;">No trainer data available</td></tr>'}</tbody>
  </table>

  <div class="section-label">DAILY PASS PRICING DISTRIBUTION</div>
  ${dailyPassRows ? `
  <table>
    <thead><tr><th>Plan</th><th>Regular Price</th><th>Regular Sold</th><th>Discounted Price</th><th>Discounted Sold</th><th>Total Sold</th></tr></thead>
    <tbody>${dailyPassRows}</tbody>
  </table>
  ` : '<p style="color:#9ca3af;margin:15px 0;">No daily pass data available</p>'}

  <div class="section-label">MEMBERSHIP GROWTH</div>
  ${membershipGrowthRows ? `
  <table>
    <thead><tr><th>Month</th><th>Memberships</th></tr></thead>
    <tbody>${membershipGrowthRows}</tbody>
  </table>
  ` : '<p style="color:#9ca3af;margin:15px 0;">No membership growth data available</p>'}

  ${auditLogsHtml}
  ${bookingsHtml}
  ${membershipsHtml}

  <div class="footer">
    <p>Gym Capstone — Analytics Dashboard | ${genDate}</p>
  </div>
</body>
</html>`;
      // Open a blank tab in the background — user stays on this page
     const printWindow = window.open("", "_blank");

if (!printWindow || printWindow.closed) {
  // Popup blocked: download HTML as fallback
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analytics-report-${new Date().toISOString().split("T")[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  success("Analytics report downloaded. Open the HTML file and use Print (Ctrl+P) to save as PDF.");
  return;
}

// Write the HTML
printWindow.document.open();
printWindow.document.write(htmlContent);
printWindow.document.close();

// Wait for the window to finish loading
printWindow.onload = () => {
  // Give images/charts additional time to finish rendering
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    // Optional:
    // printWindow.close();
  }, 3000); // Wait 3 seconds
};

success("Analytics report ready in a new tab. Switch to it and use Print (Ctrl+P) to save as PDF.");
    } catch (err) {
      console.error("Error exporting analytics PDF:", err);
      error("Failed to export analytics PDF");
    } finally {
      setIsExporting(false);
    }
  };

  function getDateRange(range) {
  const end_date = new Date();
  const start_date = new Date();

  switch (range) {
    case "1_month":
      start_date.setMonth(start_date.getMonth() - 1);
      break;

    case "3_months":
      start_date.setMonth(start_date.getMonth() - 3);
      break;

    case "6_months":
      start_date.setMonth(start_date.getMonth() - 6);
      break;

    default:
      throw new Error("Invalid range selected");
  }

  return { start_date, end_date };
}

  const requestBusinessRecommendation = async () => {
    // Validate custom date range
    if (selectedRange === "custom") {
      if (!customStartDate || !customEndDate) {
        error("Please select both start and end dates for custom range");
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        error("Start date must be before end date");
        return;
      }
    }

    try {
      setRecommendationLoading(true);
      const body = {};
      
     const today = new Date();
    const currentYear = today.getFullYear();

    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;
    const todayString = today.toISOString().split("T")[0];

    if (selectedRange === "custom") {
      if (!customStartDate && !customEndDate) {
        // No dates selected -> whole current year
        body.start_date = startOfYear;
        body.end_date = endOfYear;
      } else if (customStartDate && !customEndDate) {
        // Start selected -> today (or endOfYear if preferred)
        body.start_date = customStartDate;
        body.end_date = todayString;
        // body.end_date = endOfYear;
      } else if (!customStartDate && customEndDate) {
        // End selected -> start of year
        body.start_date = startOfYear;
        body.end_date = customEndDate;
      } else {
        // Both selected
        body.start_date = customStartDate;
        body.end_date = customEndDate;
      }
    } else {
      const { start_date, end_date } = getDateRange(selectedRange);
      body.start_date = start_date;
      body.end_date = end_date;
    }
      
      const response = await api.post("/ai/business-recommendation", body);
      console.log("Business recommendation response:", response.data);
      setBusinessRecommendation(response.data);
      success("Business recommendation generated successfully!");
    } catch (err) {
      console.error("Error generating business recommendation:", err);
      error(err.response?.data?.message || "Failed to generate business recommendation");
    } finally {
      setRecommendationLoading(false);
    }
  };

  const formatCurrency = (value) => `₱${(value || 0).toLocaleString()}`;

  const activeFilterBadges = Object.entries(appliedFilters || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined).map(([key, value]) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    value: typeof value === "string" ? value : JSON.stringify(value)
  }));

  const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

  const metricCards = analytics ? [
    {
      title: "Total Clients",
      value: analytics.overview.totalClients,
      change: null,
      icon: Users,
      color: "bg-blue-600",
      description: "Total registered clients in the system"
    },
    {
      title: "Active Memberships",
      value: analytics.overview.activeMemberships,
      change: null,
      icon: CreditCard,
      color: "bg-green-600",
      description: "Currently active memberships"
    },
    {
      title: "This Month Revenue",
      value: formatCurrency(analytics.overview.thisMonthRevenue),
      change: analytics.overview.revenueGrowth,
      icon: DollarSign,
      color: "bg-red-600",
      description: analytics.overview.revenueGrowth >= 0 
        ? `${analytics.overview.revenueGrowth}% increase from last month`
        : `${Math.abs(analytics.overview.revenueGrowth)}% decrease from last month`
    },
    {
      title: "Active Classes",
      value: analytics.overview.activeClasses,
      change: null,
      icon: Calendar,
      color: "bg-purple-600",
      description: "Scheduled classes for today"
    },
    {
      title: "Total Bookings",
      value: analytics.overview.totalBookings,
      change: null,
      icon: Activity,
      color: "bg-orange-600",
      description: "All time class and trainer bookings"
    },
    {
      title: "Pending Requests",
      value: analytics.overview.pendingRequests,
      change: null,
      icon: Filter,
      color: "bg-yellow-600",
      description: "Discount requests awaiting approval"
    }
  ] : [];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-red-600 animate-spin" />
          <span className="text-slate-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Track performance metrics and trends</p>
        </div>
      <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            />
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="this_year">This year</option>
            <option value="last_3_months">Last 3 months</option>
            <option value="last_6_months">Last 6 months</option>
            <option value="last_12_months">Last 12 months</option>
            <option value="custom">Custom range</option>
          </select>

          {dateRange === "custom" && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">Start</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                <label className="text-xs uppercase tracking-wide text-slate-400">End</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-white focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Filters
          </button>
          <button
            onClick={handleExportAnalyticsPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
          >
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-slate-400 mb-1">{card.title}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-white">{card.value}</p>
              {card.change !== null && (
                <span className={`flex items-center text-xs ${card.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {card.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(card.change)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{card.description}</p>
          </motion.div>
        ))}
      </div>

      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilterBadges.map((filter) => (
            <span key={filter.key} className="rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-sm text-red-200">
              {filter.label}: {filter.value}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-white">Global Analytics Filters</h3>
        </div>
        <p className="text-sm text-slate-400 mb-6">Apply filters once. The dashboard metrics, charts, rankings, and the exported PDF all use the same filtered dataset.</p>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setOpenFilterSection(openFilterSection === "clients" ? "" : "clients")}
            >
              <span className="font-medium text-white">Clients</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "clients" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "clients" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Role</label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All roles</option>
                    <option value="client">Client</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </div>
              
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Discounted Only</label>
                  <select value={isDiscountedFilter} onChange={(e) => setIsDiscountedFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Search</label>
                  <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Name, email, phone" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Sex</label>
                  <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Fitness Goal</label>
                  <input value={fitnessGoalFilter} onChange={(e) => setFitnessGoalFilter(e.target.value)} placeholder="e.g. weight loss" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Training Type</label>
                  <input value={trainingTypeFilter} onChange={(e) => setTrainingTypeFilter(e.target.value)} placeholder="e.g. hiit" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Experience Level</label>
                  <input value={experienceLevelFilter} onChange={(e) => setExperienceLevelFilter(e.target.value)} placeholder="e.g. intermediate" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Days per Week</label>
                  <input value={daysPerWeekFilter} onChange={(e) => setDaysPerWeekFilter(e.target.value)} placeholder="e.g. 3" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Session Minutes</label>
                  <input value={sessionMinutesFilter} onChange={(e) => setSessionMinutesFilter(e.target.value)} placeholder="e.g. 60" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Medical Condition</label>
                  <input value={medicalConditionFilter} onChange={(e) => setMedicalConditionFilter(e.target.value)} placeholder="e.g. asthma" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Client ID</label>
                  <input value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} placeholder="Enter client id" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenFilterSection(openFilterSection === "memberships" ? "" : "memberships")}>
              <span className="font-medium text-white">Memberships and Plans/Pricing</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "memberships" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "memberships" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               <div>
  <label className="block text-sm text-slate-400 mb-2">
    Plan
  </label>

  <select
    value={pricingFilter}
    onChange={(e) => {
      const pricingId = e.target.value;
      const planId = e.target.selectedOptions[0].dataset.planId;

      setPricingFilter(pricingId);
      setPlanFilter(planId);
    }}
    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
  >
    <option value="">All Plans and Pricing</option>

    {pricingsForDropdown.map((pricing) => {
      const plan = plansForDropdown.find(
        (p) => String(p._id) === String(pricing.plan_id)
      );

      return (
        <option
          key={pricing._id}
          value={pricing._id}
          data-plan-id={pricing.plan_id}
        >
          {`${plan?.label || "Unknown Plan"} - ₱${Number(
            pricing.price
          ).toLocaleString("en-PH")} - ${pricing.type}`}
        </option>
      );
    })}
  </select>
</div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Membership Status</label>
                  <select value={membershipStatusFilter} onChange={(e) => setMembershipStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
               
              
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenFilterSection(openFilterSection === "payments" ? "" : "payments")}>
              <span className="font-medium text-white">Payments</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "payments" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "payments" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Status</label>
                  <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All payment statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Method</label>
                  <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All methods</option>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Provider</label>
                  <input value={paymentProviderFilter} onChange={(e) => setPaymentProviderFilter(e.target.value)} placeholder="e.g. gcash" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Type</label>
                  <input value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)} placeholder="e.g. membership" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Payment Reference</label>
                  <input value={paymentReferenceFilter} onChange={(e) => setPaymentReferenceFilter(e.target.value)} placeholder="Reference or external id" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Reference No</label>
                  <input value={referenceNoFilter} onChange={(e) => setReferenceNoFilter(e.target.value)} placeholder="Enter reference no" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Amount Min</label>
                  <input type="number" value={paymentAmountMinFilter} onChange={(e) => setPaymentAmountMinFilter(e.target.value)} placeholder="0" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Amount Max</label>
                  <input type="number" value={paymentAmountMaxFilter} onChange={(e) => setPaymentAmountMaxFilter(e.target.value)} placeholder="5000" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenFilterSection(openFilterSection === "classes" ? "" : "classes")}>
              <span className="font-medium text-white">Classes & Bookings</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "classes" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "classes" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Class ID</label>
                  <input value={classFilter} onChange={(e) => setClassFilter(e.target.value)} placeholder="Enter class id" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Class Status</label>
                  <select value={classStatusFilter} onChange={(e) => setClassStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Trainer ID</label>
                  <input value={trainerFilter} onChange={(e) => setTrainerFilter(e.target.value)} placeholder="Enter trainer id" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Trainer Status</label>
                  <select value={trainerStatusFilter} onChange={(e) => setTrainerStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Booking Type</label>
                  <input value={bookingTypeFilter} onChange={(e) => setBookingTypeFilter(e.target.value)} placeholder="e.g. class" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Booking Status</label>
                  <input value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)} placeholder="e.g. pending" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Schedule Status</label>
                  <input value={scheduleStatusFilter} onChange={(e) => setScheduleStatusFilter(e.target.value)} placeholder="e.g. open" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Specialization</label>
                  <input value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} placeholder="e.g. strength" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Trainer Specialization</label>
                  <input value={trainerSpecializationFilter} onChange={(e) => setTrainerSpecializationFilter(e.target.value)} placeholder="e.g. strength" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Trainer Rate Min</label>
                  <input type="number" value={trainerRateMinFilter} onChange={(e) => setTrainerRateMinFilter(e.target.value)} placeholder="0" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Trainer Rate Max</label>
                  <input type="number" value={trainerRateMaxFilter} onChange={(e) => setTrainerRateMaxFilter(e.target.value)} placeholder="1000" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenFilterSection(openFilterSection === "requests" ? "" : "requests")}>
              <span className="font-medium text-white">Requests & Discounts</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "requests" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "requests" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Discount Request Status</label>
                  <select value={discountRequestStatusFilter} onChange={(e) => setDiscountRequestStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Discount Type</label>
                  <input value={discountTypeFilter} onChange={(e) => setDiscountTypeFilter(e.target.value)} placeholder="e.g. student" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Reviewed By</label>
                  <input value={reviewedByFilter} onChange={(e) => setReviewedByFilter(e.target.value)} placeholder="Admin id" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Request Type</label>
                  <input value={requestTypeFilter} onChange={(e) => setRequestTypeFilter(e.target.value)} placeholder="e.g. freeze" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpenFilterSection(openFilterSection === "audit" ? "" : "audit")}>
              <span className="font-medium text-white">Audit Logs</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition ${openFilterSection === "audit" ? "rotate-180" : ""}`} />
            </button>
            {openFilterSection === "audit" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Search</label>
                  <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Action, user, details" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Audit Action</label>
                  <input value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)} placeholder="e.g. LOGIN_USER" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Audit Entity</label>
                  <input value={auditEntityFilter} onChange={(e) => setAuditEntityFilter(e.target.value)} placeholder="e.g. User" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Audit Actor Role</label>
                  <input value={auditActorRoleFilter} onChange={(e) => setAuditActorRoleFilter(e.target.value)} placeholder="e.g. admin" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Audit Status</label>
                  <select value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500">
                    <option value="">All statuses</option>
                    <option value="success">Success</option>
                    <option value="fail">Fail</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">HTTP Method</label>
                  <input value={httpMethodFilter} onChange={(e) => setHttpMethodFilter(e.target.value)} placeholder="GET/POST" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Created By</label>
                  <input value={createdByFilter} onChange={(e) => setCreatedByFilter(e.target.value)} placeholder="User id/name" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Updated By</label>
                  <input value={updatedByFilter} onChange={(e) => setUpdatedByFilter(e.target.value)} placeholder="User id/name" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
{/* Revenue Trend */}
        <div ref={revenueChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <p className="text-sm text-slate-400 mb-4">Monthly revenue over the last {dateRange} months</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.revenueByMonth || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₱${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#dc2626" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

{/* Bookings by Type */}
        <div ref={bookingsChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bookings by Type</h3>
          <p className="text-sm text-slate-400 mb-4">Class bookings vs Trainer sessions</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.bookingsByType || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={!isExporting}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(analytics?.bookingsByType || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth */}
        <div ref={clientGrowthChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Client Growth</h3>
          <p className="text-sm text-slate-400 mb-4">New client registrations over time</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.clientGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="clients" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

{/* Membership Status */}
        <div ref={membershipStatusChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Membership Status</h3>
          <p className="text-sm text-slate-400 mb-4">Current membership breakdown</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.membershipStatus || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                isAnimationActive={!isExporting}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(analytics?.membershipStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Pass Pricing Distribution */}
      <div ref={dailyPassChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Daily Pass Pricing Distribution</h3>
        <p className="text-sm text-slate-400 mb-4">Regular vs Discounted pricing per plan</p>

        {/* Summary Stat Cards */}
        {analytics?.dailyPassPricingDistribution && analytics.dailyPassPricingDistribution.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{analytics.dailyPassPricingDistribution.length}</p>
              <p className="text-xs text-slate-400 mt-1">Plans with Daily Pass</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {analytics.dailyPassPricingDistribution.reduce((sum, item) => sum + (item.regularCount || 0), 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Regular Passes Sold</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {analytics.dailyPassPricingDistribution.reduce((sum, item) => sum + (item.discountedCount || 0), 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Discounted Passes Sold</p>
            </div>
          </div>
        )}

        {analytics?.dailyPassPricingDistribution && analytics.dailyPassPricingDistribution.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={analytics.dailyPassPricingDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                        <p className="text-white font-medium text-sm mb-2">{data?.name || label}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-blue-500"></div>
                            <span className="text-xs text-slate-300">Regular:</span>
                            <span className="text-xs text-white font-semibold">₱{Number(data?.regular || 0).toLocaleString()}</span>
                            <span className="text-xs text-slate-500">({data?.regularCount || 0} sold)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
                            <span className="text-xs text-slate-300">Discounted:</span>
                            <span className="text-xs text-white font-semibold">₱{Number(data?.discounted || 0).toLocaleString()}</span>
                            <span className="text-xs text-slate-500">({data?.discountedCount || 0} sold)</span>
                          </div>
                        </div>
                        {data?.regular > 0 && data?.discounted > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-600">
                            <span className="text-xs text-emerald-400">
                              Savings: ₱{Number(data.regular - data.discounted).toLocaleString()} per pass
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend
                  formatter={(value) => value === "regular" ? "Regular" : "Discounted"}
                />
                <Bar dataKey="regular" fill="#3b82f6" radius={[4, 4, 0, 0]} name="regular" />
                <Bar dataKey="discounted" fill="#f59e0b" radius={[4, 4, 0, 0]} name="discounted" />
              </BarChart>
            </ResponsiveContainer>

            {/* Data Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Plan</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Regular Price</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Regular Sold</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Discounted Price</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Discounted Sold</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Total Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {analytics.dailyPassPricingDistribution.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20">
                      <td className="py-2.5 px-3 text-white font-medium">{row.name}</td>
                      <td className="py-2.5 px-3 text-right text-blue-400">
                        {row.regular > 0 ? `₱${row.regular.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{row.regularCount || 0}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {row.discounted > 0 ? `₱${row.discounted.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{row.discountedCount || 0}</td>
                      <td className="py-2.5 px-3 text-right text-white font-semibold">
                        {(row.regularCount || 0) + (row.discountedCount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <CreditCard className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm">No daily pass pricing data available</p>
            <p className="text-xs text-slate-600 mt-1">Daily passes need to be purchased first to see pricing distribution</p>
          </div>
        )}
      </div>

      {/* Membership Growth Distribution */}
      <div ref={membershipGrowthChartRef} className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Membership Growth Distribution</h3>
        <p className="text-sm text-slate-400 mb-4">New memberships acquired over time</p>

        {/* Summary Stat Cards */}
        {analytics?.membershipGrowthDistribution  && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{analytics.membershipGrowthDistribution.length}</p>
              <p className="text-xs text-slate-400 mt-1">Months Tracked</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {analytics.membershipGrowthDistribution.reduce((sum, item) => sum + (item.memberships || 0), 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total Memberships</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {Math.max(...analytics.membershipGrowthDistribution.map(item => item.memberships || 0))}
              </p>
              <p className="text-xs text-slate-400 mt-1">Highest Month</p>
            </div>
          </div>
        )}

        {analytics?.membershipGrowthDistribution && analytics.membershipGrowthDistribution.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.membershipGrowthDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => [value, "Memberships"]}
                />
                <Bar dataKey="memberships" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Memberships" />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Users className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm">No membership growth data available</p>
            <p className="text-xs text-slate-600 mt-1">Memberships need to be created first to see distribution</p>
          </div>
        )}
      </div>

      {/* Top Trainers & Popular Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Classes */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Popular Classes</h3>
          <p className="text-sm text-slate-400 mb-4">Top 10 booked classes</p>
          <div className="space-y-3">
            {(analytics?.classPopularity || []).length === 0 ? (
              <p className="text-slate-400">No class data available</p>
            ) : (
              analytics.classPopularity.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </span>
                    <span className="text-white">{cls.name}</span>
                  </div>
                  <span className="text-slate-400">{cls.bookings} bookings</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Trainers */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Trainers</h3>
          <p className="text-sm text-slate-400 mb-4">Trainers with most sessions</p>
          <div className="space-y-3">
            {(analytics?.topTrainers || []).length === 0 ? (
              <p className="text-slate-400">No trainer data available</p>
            ) : (
              analytics.topTrainers.map((trainer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </span>
                    <span className="text-white">{trainer.name}</span>
                  </div>
                  <span className="text-slate-400">{trainer.count} sessions</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Business Recommendation Section */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Business Recommendation</h3>
            <p className="text-sm text-slate-400">AI-powered business insights and recommendations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date Range</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="1_month">Last 1 Month</option>
              <option value="3_months">Last 3 Months</option>
              <option value="6_months">Last 6 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {selectedRange === "custom" && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-red-500 ${
                    !customStartDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-red-500 ${
                    !customEndDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
              </div>
            </>
          )}

          <button
            onClick={requestBusinessRecommendation}
            disabled={recommendationLoading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition disabled:opacity-50"
          >
            {recommendationLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Generate Recommendation
                <span className="text-purple-200 text-xs">
                  ({selectedRange === "custom" && customStartDate && customEndDate 
                    ? `${customStartDate} → ${customEndDate}`
                    : `Last ${selectedRange.replace('_', ' ')}`})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Business Recommendation Results */}
        {businessRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Analysis Section - New Format */}
            {businessRecommendation.analysis && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Executive Summary</h4>
                  <p className="text-slate-300 leading-relaxed">{businessRecommendation.analysis.summary}</p>
                </div>

                {/* Metrics Grid */}
                {businessRecommendation.analysis.metrics && businessRecommendation.analysis.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {businessRecommendation.analysis.metrics.map((metric, idx) => (
                      <div key={idx} className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                          metric.trend === 'up' ? 'text-green-400' : 
                          metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {metric.trend === 'up' && <ArrowUp className="w-5 h-5" />}
                          {metric.trend === 'down' && <ArrowDown className="w-5 h-5" />}
                          {metric.trend === 'neutral' && <Minus className="w-5 h-5" />}
                          {metric.value}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlights */}
                {businessRecommendation.analysis.highlights && businessRecommendation.analysis.highlights.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Highlights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {businessRecommendation.analysis.highlights.map((highlight, idx) => (
                        <div key={idx} className={`rounded-xl p-4 border-l-4 ${
                          highlight.type === 'positive' ? 'bg-green-500/10 border-green-500' :
                          highlight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                          'bg-slate-700/50 border-slate-500'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {highlight.type === 'positive' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {highlight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            {(!highlight.type || highlight.type === 'neutral') && <Minus className="w-4 h-4 text-slate-500" />}
                            <span className="text-sm font-medium text-white">{highlight.title}</span>
                          </div>
                          <p className="text-sm text-slate-400">{highlight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {businessRecommendation.analysis.risks && businessRecommendation.analysis.risks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Risks & Concerns</h4>
                    <div className="space-y-3">
                      {businessRecommendation.analysis.risks.map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-red-500/10 rounded-lg p-4 border-l-4 border-red-500">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            risk.severity === 'high' ? 'bg-red-600 text-white' :
                            risk.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {risk.severity?.toUpperCase() || 'MEDIUM'}
                          </span>
                          <div>
                            <h5 className="font-medium text-white">{risk.title}</h5>
                            <p className="text-sm text-slate-400">{risk.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section - New Format */}
            {businessRecommendation.recommendations && businessRecommendation.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Strategic Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessRecommendation.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          rec.priority_score >= 8 ? 'bg-red-600/20 text-red-400' :
                          rec.priority_score >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-green-600/20 text-green-400'
                        }`}>
                          Priority {rec.priority_score || 5}/10
                        </span>
                        <span className="text-xs text-slate-400 uppercase">{rec.category}</span>
                      </div>
                      <h5 className="font-medium text-white mb-2">{rec.title}</h5>
                      <p className="text-sm text-slate-400 mb-3">{rec.description}</p>
                      {rec.impact && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-600">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Impact: {rec.impact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Recommendation History Table */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Recommendation History</h3>
            <p className="text-sm text-slate-400">Past business recommendations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Summary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recommendationHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                    No recommendation history found
                  </td>
                </tr>
              ) : (
                recommendationHistory.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-white">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                   <td className="px-4 py-3 text-sm text-slate-300">
                  {formatDate(rec.start_date) || rec.range} - {formatDate(rec.end_date)}
                </td>
                    <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate">
                      {rec.analysis?.summary?.substring(0, 100) || "N/A"}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewRecommendation(rec)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(rec)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Export PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Recommendation Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Business Recommendation Details"
        size="lg"
      >
        {selectedRecommendation && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <p className="text-sm text-slate-400">Date Range</p>
                <p className="text-white">{selectedRecommendation.date_range || selectedRecommendation.range || "N/A"}</p>
              </div>
              <button
                onClick={() => handleExportPDF(selectedRecommendation)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                <FileText className="w-4 h-4" />
                Export
              </button>
            </div>

            {selectedRecommendation.analysis && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600">
                  <h4 className="text-lg font-semibold text-white mb-3">Executive Summary</h4>
                  <p className="text-slate-300 leading-relaxed">{selectedRecommendation.analysis.summary}</p>
                </div>

                {/* Metrics */}
                {selectedRecommendation.analysis.metrics && selectedRecommendation.analysis.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedRecommendation.analysis.metrics.map((m, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className={`text-xl font-bold flex items-center justify-center gap-1 ${
                          m.trend === 'up' ? 'text-green-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {m.trend === 'up' && <ArrowUp className="w-4 h-4" />}
                          {m.trend === 'down' && <ArrowDown className="w-4 h-4" />}
                          {m.trend === 'neutral' && <Minus className="w-4 h-4" />}
                          {m.value}
                        </div>
                        <div className="text-xs text-slate-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlights */}
                {selectedRecommendation.analysis.highlights && selectedRecommendation.analysis.highlights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRecommendation.analysis.highlights.map((h, i) => (
                      <div key={i} className={`rounded-lg p-3 border-l-4 ${
                        h.type === 'positive' ? 'bg-green-500/10 border-green-500' :
                        h.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                        'bg-slate-700/50 border-slate-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {h.type === 'positive' && <CheckCircle className="w-3 h-3 text-green-500" />}
                          {h.type === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                          <span className="text-xs font-medium text-white">{h.title}</span>
                        </div>
                        <p className="text-xs text-slate-400">{h.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risks */}
                {selectedRecommendation.analysis.risks && selectedRecommendation.analysis.risks.length > 0 && (
                  <div className="space-y-2">
                    {selectedRecommendation.analysis.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border-l-4 border-red-500">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          r.severity === 'high' ? 'bg-red-600 text-white' :
                          r.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-green-600 text-white'
                        }`}>{r.severity?.toUpperCase()}</span>
                        <div>
                          <div className="font-medium text-white text-sm">{r.title}</div>
                          <div className="text-xs text-slate-400">{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedRecommendation.recommendations && selectedRecommendation.recommendations.length > 0 && (
              <div className="space-y-4 mt-6">
                <h4 className="text-lg font-semibold text-white">Strategic Recommendations</h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedRecommendation.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          rec.priority_score >= 8 ? 'bg-red-600/20 text-red-400' :
                          rec.priority_score >= 5 ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-green-600/20 text-green-400'
                        }`}>Priority {rec.priority_score || 5}/10</span>
                        <span className="text-xs text-slate-400 uppercase">{rec.category}</span>
                      </div>
                      <h5 className="font-medium text-white mb-1">{rec.title}</h5>
                      <p className="text-sm text-slate-400 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Zap className="w-3 h-3" /> Impact: {rec.impact}
                        </div>
                      )}
                      {rec.expected_impact && (
                        <p className="text-xs text-green-400 mt-2">Expected Impact: {rec.expected_impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}