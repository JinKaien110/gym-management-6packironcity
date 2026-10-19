import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Search, User, X } from "lucide-react";
import api from "../../api/axios.js";
import { useNotification } from "../../context/NotificationContext.jsx";

const getClientName = (client) =>
  `${client.first_name || ""} ${client.last_name || ""}`.trim();

export default function MembershipCreate() {
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingClients(true);
        setSearchError("");
        const params = new URLSearchParams({
          page: "1",
          limit: "10"
        });
        if (query.trim()) params.set("search", query.trim());

        const response = await api.get(`/admin/clients?${params.toString()}`, {
          signal: controller.signal
        });
        const results = response.data?.clients || response.data?.data || [];
        setClients(Array.isArray(results) ? results : []);
        setHighlightedIndex(0);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Error searching clients:", err);
          setSearchError(err.response?.data?.message || "Failed to load clients");
          setClients([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingClients(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [dropdownOpen, query]);

  const selectClient = (client) => {
    setSelectedClient(client);
    setQuery(getClientName(client));
    setDropdownOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedClient?._id) {
      error("Please select a client");
      return;
    }

    try {
      setSaving(true);
      await api.post("/admin/membership/create", {
        client_id: selectedClient._id
      });
      success("Membership created successfully");
      navigate("/admin/memberships");
    } catch (err) {
      console.error("Error creating membership:", err);
      error(err.response?.data?.message || "Failed to create membership");
    } finally {
      setSaving(false);
    }
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "ArrowDown" && dropdownOpen && clients.length > 0) {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % clients.length);
    } else if (event.key === "ArrowUp" && dropdownOpen && clients.length > 0) {
      event.preventDefault();
      setHighlightedIndex((index) => (index - 1 + clients.length) % clients.length);
    } else if (event.key === "Enter" && dropdownOpen && clients[highlightedIndex]) {
      event.preventDefault();
      selectClient(clients[highlightedIndex]);
    } else if (event.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/memberships")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Back to memberships"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Membership</h1>
          <p className="text-slate-400 mt-1">Select a client to create a membership.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-2xl bg-slate-800/60 border border-white/10 p-5 sm:p-6 space-y-6"
      >
        <div>
          <label htmlFor="membership-client" className="block text-sm font-medium text-slate-300 mb-2">
            Client
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="membership-client"
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedClient(null);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search clients by name or email..."
                autoComplete="off"
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-controls="membership-client-options"
                aria-autocomplete="list"
                className="w-full pl-10 pr-20 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setQuery("");
                    setDropdownOpen(true);
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  aria-label="Clear selected client"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {dropdownOpen && (
              <div
                id="membership-client-options"
                role="listbox"
                className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl"
              >
                {loadingClients ? (
                  <div className="px-4 py-3 text-sm text-slate-400">Searching clients...</div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-sm text-red-300">{searchError}</div>
                ) : clients.length > 0 ? (
                  clients.map((client, index) => {
                    const name = getClientName(client) || "Unnamed client";
                    return (
                      <button
                        key={client._id}
                        type="button"
                        role="option"
                        aria-selected={selectedClient?._id === client._id}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectClient(client)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          highlightedIndex === index
                            ? "bg-red-600/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className="w-9 h-9 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                          <User className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{name}</span>
                          <span className="block truncate text-xs text-slate-400">{client.email || "No email"}</span>
                        </span>
                        {selectedClient?._id === client._id && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-400">
                    {query.trim() ? "No matching clients found" : "No clients available"}
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedClient && (
            <p className="mt-2 text-sm text-green-400">
              Selected: {getClientName(selectedClient)} ({selectedClient.email})
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => navigate("/admin/memberships")}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedClient || saving}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating..." : "Create Membership"}
          </button>
        </div>
      </form>
    </div>
  );
}
