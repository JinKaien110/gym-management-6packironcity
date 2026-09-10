import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import ucfirst from "../../utils/ucfirst.js";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Filter,
  RefreshCw,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Archive,
  Download
} from "lucide-react";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import { TableSkeleton, EmptyState } from "../../components/UIEnhancements.jsx";

export default function Cients() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const [clients, setclients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedclient, setSelectedclient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clientQrCode, setclientQrCode] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    medical_condition: "",
    training_type: "",
    experience_level: "",
    days_per_week: "",
    session_minutes: "",
    emergency_name: "",
    emergency_contact: "",
    emergency_relationship: ""
  });
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  });
  
  const [saving, setSaving] = useState(false);

  const fetchclients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await api.get(`/admin/clients?${params.toString()}`);

      setclients(response.data.clients || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchclients();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (pagination.page === 1) {
        fetchclients();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-600/20 text-green-500",
      inactive: "bg-gray-600/20 text-gray-400",
      archived: "bg-red-600/20 text-red-500",
      pending: "bg-yellow-600/20 text-yellow-500"
    };
    return styles[status] || styles.inactive;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };


  const handleAddclient = (client) => {
    setAddForm({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || ""
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Normalize the form data
      const normalizedForm = {
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim()
      };
      console.log("Submitting new client:", normalizedForm);
      
await api.post("/admin/clients", normalizedForm);
      setShowAddModal(false);
      fetchclients();
      // Reset form
      setAddForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
      });
      success("Client added successfully");
      // Reset form
      setAddForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
      });
      const response = await api.post("/admin/clients", addForm);
      success(response.data?.result || "client added successfully");
      fetchclients();
    } catch (err) {
      console.error("Error adding client:", err);
      error(err.response?.data?.message || "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit
  const handleEditClick = (client) => {
    setSelectedclient(client);
    setEditForm({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      gender: client.gender || "",
      date_of_birth: client.date_of_birth ? client.date_of_birth.split('T')[0] : "",
      address: client.address || "",
      medical_condition: client.medical_condition || "",
      training_type: client.training_type || "",
      experience_level: client.experience_level || "",
      days_per_week: client.days_per_week || "",
      session_minutes: client.session_minutes || "",
      emergency_name: client.emergency_name || "",
      emergency_contact: client.emergency_contact || "",
      emergency_relationship: client.emergency_relationship || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Normalize the form data
      const normalizedForm = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        address: editForm.address?.trim() || null,
        gender: editForm.gender?.trim() || null,
        date_of_birth: editForm.date_of_birth || null,
        fitness_goal: [],
        medical_condition: editForm.medical_condition?.trim() || null,
        training_type: editForm.training_type?.trim() || null,
        experience_level: editForm.experience_level?.trim() || null,
        days_per_week: editForm.days_per_week?.trim() || null,
        session_minutes: editForm.session_minutes?.trim() || null,
        emergency_name: editForm.emergency_name?.trim() || null,
        emergency_contact: editForm.emergency_contact?.trim() || null,
        emergency_relationship: editForm.emergency_relationship?.trim() || null
      };
      
      await api.patch(`/admin/clients/${selectedclient._id}`, normalizedForm);
      success("Client updated successfully");
      setShowEditModal(false);
      fetchclients();
    } catch (err) {
      console.error("Error updating client:", err);
      error(err.response?.data?.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete (Status Change)
  const handleStatusChange = async (client, newStatus) => {
    try {
      await api.patch(`/admin/clients/${client._id}/status`, { status: newStatus });
      success("Client status updated successfully");
      fetchclients();
    } catch (err) {
      console.error("Error changing status:", err);
      error(err.response?.data?.message || "Failed to update client status");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clients Management</h1>
          <p className="text-slate-400 text-sm">Manage gym clients and their memberships</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <motion.button 
            onClick={fetchclients}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-700/60 backdrop-blur-sm hover:bg-slate-600/80 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
          <motion.button 
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-red-500/25"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">+</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* clients Table */}
      <div className="fluid-card bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 flex flex-col">
        <div className="table-wrapper overflow-auto flex-1 min-h-0">
          <table className="w-full table-sticky-header table-row-animated">
            <thead className="bg-slate-700/30 backdrop-blur-sm shadow-sm">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <TableSkeleton rows={8} columns={5} />
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8">
                    <EmptyState
                      icon={Users}
                      title="No Clients Found"
                      description={search || statusFilter ? "Try adjusting your search or filter criteria." : "Get started by adding your first gym client."}
                      action={!search && !statusFilter ? "Add client" : undefined}
                      onAction={() => setShowAddModal(true)}
                    />
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <motion.tr
                    key={client._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-700/30"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium text-sm">
                          {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-white">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-400 md:hidden">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-slate-300">{client.email}</div>
                      <div className="text-sm text-slate-400">{client.phone || "No phone"}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.status)}`}>
                        {ucfirst(client.status) || "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden sm:table-cell">
                      {formatDate(client.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedclient(client);
                            setclientQrCode(client.qr_code || null);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(client)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(client, "archived")}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-lg transition"
                          title="Archive client"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-2 sm:px-3 py-1 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">&lt;</span>
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
                <span className="sm:hidden">&gt;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* client Detail Modal */}
      {showDetailModal && selectedclient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">client Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* client Info with QR Code */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-white text-xl font-medium">
                    {selectedclient.first_name?.charAt(0)}{selectedclient.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedclient.first_name} {selectedclient.last_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedclient.status)}`}>
                      {ucfirst(selectedclient.status) || "Inactive"}
                    </span>
                  </div>
                </div>
                {clientQrCode && (
                  <div className="bg-white p-2 rounded-lg">
                      <QRCodeCanvas
    value={clientQrCode}
    size={80}
  />
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Email</label>
                  <p className="text-white">{selectedclient.email || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Contact Number</label>
                  <p className="text-white">{selectedclient.phone || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Gender</label>
                  <p className="text-white capitalize">{selectedclient.gender || "N/A"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Date of Birth</label>
                  <p className="text-white">{formatDate(selectedclient.date_of_birth)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">client Type</label>
                  <p className="text-white">{ucfirst(selectedclient.client_type) || "No Plan"}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <label className="text-xs text-slate-400 uppercase">Joined Date</label>
                  <p className="text-white">{formatDate(selectedclient.createdAt)}</p>
                </div>
                {selectedclient.fitness_goal && Array.isArray(selectedclient.fitness_goal) && (
                  <div className="bg-slate-700/30 rounded-xl p-4 md:col-span-2">
                    <label className="text-xs text-slate-400 uppercase">Fitness Goals</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedclient.fitness_goal.map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-600 text-white text-sm rounded-lg capitalize">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditClick(selectedclient);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Edit client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit client Modal */}
      {showEditModal && selectedclient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit client</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
<input
                     type="tel"
                     value={editForm.phone}
                     onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                     placeholder="+639171234567 (mobile) or +6321234567 (landline)"
                     maxLength="14"
                   />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Medical Condition</label>
                  <input
                    type="text"
                    value={editForm.medical_condition}
                    onChange={(e) => setEditForm({...editForm, medical_condition: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Medical condition (if any)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Training Type</label>
                  <select
                    value={editForm.training_type}
                    onChange={(e) => setEditForm({...editForm, training_type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select training type</option>
                    <option value="one_on_one">One on One</option>
                    <option value="group">Group</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Experience Level</label>
                  <select
                    value={editForm.experience_level}
                    onChange={(e) => setEditForm({...editForm, experience_level: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Select experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Days Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={editForm.days_per_week}
                    onChange={(e) => setEditForm({...editForm, days_per_week: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="1-7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Session Minutes</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={editForm.session_minutes}
                    onChange={(e) => setEditForm({...editForm, session_minutes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="15, 30, 45, 60..."
                  />
                </div>
              </div>
              
              {/* Emergency Contact Section */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <h3 className="text-lg font-medium text-white mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.emergency_name}
                      onChange={(e) => setEditForm({...editForm, emergency_name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={editForm.emergency_contact}
                      onChange={(e) => setEditForm({...editForm, emergency_contact: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="Emergency phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editForm.emergency_relationship}
                      onChange={(e) => setEditForm({...editForm, emergency_relationship: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add New client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({...addForm, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({...addForm, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
<input
                     type="tel"
                     value={addForm.phone}
                     onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                     placeholder="+639171234567 (mobile) or +6321234567 (landline)"
                     maxLength="14"
                   />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
