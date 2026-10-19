import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  RefreshCw,
  Edit, 
  Plus,
  ToggleLeft,
  ToggleRight,
  Pause,
  Play,
  Eye,
  File,
  Calendar
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";

export default function memberships() {
  // Custom calendar picker styles
  const calendarStyles = `
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    input[type="date"]::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }
    input[type="date"]::-webkit-calendar-sheet {
      background-color: #1e293b;
    }
  `;

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [memberships, setmemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedmembership, setSelectedmembership] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showMedicalProof, setShowMedicalProof] = useState(false);
  const [selectedMedicalProof, setSelectedMedicalProof] = useState(null);
  const [freezemembershipId, setFreezemembershipId] = useState(null);
  const [freezeStartDate, setFreezeStartDate] = useState("");
  const [freezeEndDate, setFreezeEndDate] = useState("");
  const [medicalProof, setMedicalProof] = useState(null);
  const [freezing, setFreezing] = useState(false);

  const fetchmemberships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
   
      if (startDateFilter) params.append("start_date", startDateFilter);
      if (endDateFilter) params.append("end_date", endDateFilter);

      const response = await api.get(`/admin/memberships?${params.toString()}`);
      console.log("memberships response:", response.data);
      setmemberships(response.data.data || response.data.result || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || response.data.pages || 0
      }));
    } catch (err) {
      console.error("Error fetching memberships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchmemberships();
  }, [pagination.page, search, statusFilter, startDateFilter, endDateFilter]);



  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/membership/update-status/${id}`, { status: newStatus });
      success(response.data?.result || "membership status updated successfully");
      fetchmemberships();
    } catch (err) {
      console.error("Error updating membership status:", err);
      error(err.response?.data?.message || "Failed to update membership status");
    }
  };

  const handleFreeze = (id) => {
    setFreezemembershipId(id);
    setFreezeStartDate("");
    setFreezeEndDate("");
    setMedicalProof(null);
    setShowFreezeModal(true);
  };

  const submitFreeze = async () => {
    if (!freezeStartDate || !freezeEndDate) {
      error("Please select both start and end dates");
      return;
    }

    const start = new Date(freezeStartDate);
    const end = new Date(freezeEndDate);
    
    if (end <= start) {
      error("End date must be after start date");
      return;
    }

    try {
      setFreezing(true);
      
      const formData = new FormData();
      formData.append("freeze_start_date", freezeStartDate);
      formData.append("freeze_end_date", freezeEndDate);
      if (medicalProof) {
        formData.append("medical_proof_url", medicalProof);
      }

      const response = await api.patch(`/membership/freeze/${freezemembershipId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowFreezeModal(false);
      success(response.data?.message || "membership frozen successfully");
      fetchmemberships();
    } catch (err) {
      console.error("Error freezing membership:", err);
      error(err.response?.data?.message || "Failed to freeze membership");
    } finally {
      setFreezing(false);
    }
  };

  const handleUnfreeze = async (id) => {
    try {
      const response = await api.patch(`/membership/unfreeze/${id}`);
      success(response.data?.message);
      fetchmemberships();
    } catch (err) {
      console.error("Error unfreezing membership:", err);
      error(err.response?.data?.message || "Failed to unfreeze membership");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-600/20 text-green-400";
      case "inactive":
        return "bg-slate-600/20 text-slate-400";
      case "frozen":
        return "bg-blue-600/20 text-blue-400";
      case "expired":
        return "bg-red-600/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Memberships</h1>
          <p className="text-slate-400 mt-1">Manage active memberships</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/admin/membership/create")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition shadow-lg shadow-red-600/20"
          >
            <Plus className="w-5 h-5" />
            Create Membership
          </button>
          <button
            onClick={() => fetchmemberships()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/80 backdrop-blur-sm text-white rounded-lg transition border border-white/10"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="frozen">Frozen</option>
          <option value="expired">Expired</option>
        </select>
        
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Start Date From</label>
          <div className="relative">
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">End Date To</label>
          <div className="relative">
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200 [color-scheme:dark]"
            />
          </div>
        </div>
        {( startDateFilter || endDateFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
               
                setStartDateFilter("");
                setEndDateFilter("");
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-600/20"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20">
        <div className="table-wrapper overflow-auto">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">client</th>
             
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Start Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">End Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Loading memberships...
                    </div>
                  </td>
                </tr>
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No memberships found
                  </td>
                </tr>
              ) : (
                memberships.map((membership) => (
                  <motion.tr
                    key={membership._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                          {membership.client.first_name?.charAt(0)}{membership.client.last_name?.charAt(0)}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {membership.client.first_name} {membership.client.last_name}
                          </div>
                          <div className="text-xs text-slate-400">{membership.client.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${membership.is_frozen ? 'bg-blue-600/20 text-blue-400' : getStatusBadge(membership.status)}`}>
                        {membership.is_frozen ? 'Frozen' : membership.status?.charAt(0).toUpperCase() + membership.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden lg:table-cell">
                      {formatDate(membership.start_date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden lg:table-cell">
                      {formatDate(membership.end_date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedmembership(membership);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {membership.is_frozen ? (
                          <button
                            onClick={() => handleUnfreeze(membership._id)}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition"
                            title="Unfreeze"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : membership.status === "active" && (
                          <button
                            onClick={() => handleFreeze(membership._id)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition"
                            title="Freeze"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-3 sm:px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} memberships
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">{"<"}</span>
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 sm:px-3 py-1 rounded-lg transition text-xs sm:text-sm ${
                          pageNum === pagination.page
                            ? "bg-red-600 text-white"
                            : "bg-slate-700 text-white hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === pagination.page - 2 ||
                    pageNum === pagination.page + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">{">"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedmembership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">membership Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* client Info */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-2">client Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Name</p>
                    <p className="text-white">{selectedmembership.client.first_name} {selectedmembership.client.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-white">{selectedmembership.client.email || "N/A"}</p>
                  </div>
                </div>
              </div>

   



              {/* membership Status */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-2">membership Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedmembership.status)}`}>
                      {selectedmembership.status?.charAt(0).toUpperCase() + selectedmembership.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Is Frozen</p>
                    <p className="text-white">{selectedmembership.is_frozen ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Start Date</p>
                    <p className="text-white">{formatDate(selectedmembership.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">End Date</p>
                    <p className="text-white">{formatDate(selectedmembership.end_date)}</p>
                  </div>
                  {selectedmembership.is_frozen && (selectedmembership.frozen_from || selectedmembership.freeze_start_date) && (selectedmembership.frozen_til || selectedmembership.frozen_until || selectedmembership.freeze_end_date) && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">Frozen Period</p>
                      <p className="text-white">
                        {formatDate(selectedmembership.frozen_from || selectedmembership.freeze_start_date)} - {formatDate(selectedmembership.frozen_til || selectedmembership.frozen_until || selectedmembership.freeze_end_date)}
                      </p>
                    </div>
                  )}
                  {selectedmembership.is_frozen && (selectedmembership.memberships_request?.medical_proof_url || selectedmembership.medical_proof_url || selectedmembership.medical_proof) && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">Medical Proof</p>
                      <button
                        onClick={() => {
                          setSelectedMedicalProof(selectedmembership.memberships_request?.medical_proof_url || selectedmembership.medical_proof_url || selectedmembership.medical_proof);
                          setShowMedicalProof(true);
                        }}
                        className="mt-1 flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Medical Proof
                      </button>
                    </div>
                  )}
                  {selectedmembership.createdAt && (
                    <div>
                      <p className="text-xs text-slate-400">Created At</p>
                      <p className="text-white">{formatDate(selectedmembership.createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Freeze membership</h2>
              <button
                onClick={() => setShowFreezeModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm">
                Select the start and end dates for the membership freeze period.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={freezeStartDate}
                  onChange={(e) => setFreezeStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={freezeEndDate}
                  onChange={(e) => setFreezeEndDate(e.target.value)}
                  min={freezeStartDate}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Medical Proof (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setMedicalProof(e.target.files[0])}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
                />
                {medicalProof && (
                  <p className="mt-1 text-xs text-slate-400">Selected: {medicalProof.name}</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowFreezeModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFreeze}
                  disabled={freezing || !freezeStartDate || !freezeEndDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {freezing ? "Freezing..." : "Freeze"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Proof Modal */}
      {showMedicalProof && selectedMedicalProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Medical Proof</h2>
              <button
                onClick={() => {
                  setShowMedicalProof(false);
                  setSelectedMedicalProof(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedMedicalProof?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img 
                  src={selectedMedicalProof} 
                  alt="Medical Proof" 
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <iframe 
                  src={selectedMedicalProof} 
                  className="w-full h-96 rounded-lg"
                  title="Medical Proof"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
