"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Plus,
  User,
  Trash2,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/lib/toast";
import {
  fetchPhones,
  fetchAgents,
  importPhoneAPI,
  assignAgentToPhoneAPI,
  unassignAgentFromPhoneAPI,
  deletePhoneAPI,
  updatePhoneConcurrentLimitAPI,
  Phone as PhoneType,
  BackendAgent,
  ImportPhoneRequest,
} from "@/lib/api";

export default function PhonesPage() {
  const toast = useToast();
  const [phones, setPhones] = useState<PhoneType[]>([]);
  const [agents, setAgents] = useState<BackendAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<PhoneType | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [phonesData, agentsData] = await Promise.all([
        fetchPhones().catch(() => []),
        fetchAgents(1, 100).catch(() => ({ data: [] })),
      ]);
      setPhones(Array.isArray(phonesData) ? phonesData : []);
      setAgents(agentsData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load phone numbers");
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = async () => {
    setShowImportModal(false);
    await loadData();
  };

  const handleAssignAgent = (phone: PhoneType) => {
    setSelectedPhone(phone);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = async () => {
    setShowAssignModal(false);
    setSelectedPhone(null);
    await loadData();
  };

  const handleUnassign = async (phoneId: string) => {
    toast.confirm({
      message: "Are you sure you want to unassign the agent from this phone number?",
      confirmText: "Yes, Unassign",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await unassignAgentFromPhoneAPI(phoneId);
          toast.success("Agent unassigned successfully");
          await loadData();
        } catch (err: any) {
          console.error("Error unassigning agent:", err);
          toast.warning(err.message || "Failed to unassign agent");
        }
      },
    });
  };

  const handleDelete = async (phoneId: string) => {
    toast.confirm({
      message: "Are you sure you want to delete this phone number?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deletePhoneAPI(phoneId);
          toast.success("Phone number deleted successfully");
          await loadData();
        } catch (err: any) {
          console.error("Error deleting phone:", err);
          toast.warning(err.message || "Failed to delete phone number");
        }
      },
    });
  };

  const getAgentName = (phone: PhoneType): string => {
    if (!phone.agentId) return "Not assigned";
    if (typeof phone.agentId === "string") {
      const agent = agents.find((a) => a.id === phone.agentId);
      return agent?.name || "Unknown";
    }
    return (phone.agentId as any).name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-zinc-600">Loading phone numbers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phone Numbers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your Exotel phone numbers and agent assignments
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Plus className="h-4 w-4" />
          Import Phone Number
        </button>
      </div>

      {/* Phone Numbers List */}
      {phones.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Phone className="text-emerald-600" size={32} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 mb-2">
            No Phone Numbers Yet
          </h3>
          <p className="text-zinc-600 mb-6 max-w-md mx-auto">
            Import your first Exotel phone number to start receiving calls and assigning them to agents.
          </p>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Plus className="h-4 w-4" />
            Import Phone Number
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phones.map((phone) => (
            <motion.div
              key={phone._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">
                      {phone.number}
                    </h3>
                    {phone.country && (
                      <span className="text-xs text-zinc-500 uppercase">
                        {phone.country}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(phone._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete phone number"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Agent Assignment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Assigned Agent:</span>
                  {phone.agentId ? (
                    <span className="font-medium text-zinc-900">
                      {getAgentName(phone)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Not assigned</span>
                  )}
                </div>

                {phone.agentId ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAssignAgent(phone)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      <User className="h-3.5 w-3.5" />
                      Change Agent
                    </button>
                    <button
                      onClick={() => handleUnassign(phone._id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                      title="Unassign agent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAssignAgent(phone)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600"
                  >
                    <User className="h-3.5 w-3.5" />
                    Assign Agent
                  </button>
                )}
              </div>

              {/* Tags */}
              {phone.tags && phone.tags.length > 0 && (
                <div className="pt-3 border-t border-zinc-200">
                  <div className="flex flex-wrap gap-2">
                    {phone.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-[10px] rounded-full bg-emerald-100 text-emerald-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="pt-3 border-t border-zinc-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Status:</span>
                  <span
                    className={`px-2 py-1 text-[10px] font-medium rounded-full ${
                      phone.status === "active" || phone.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {phone.status || (phone.isActive ? "active" : "inactive")}
                  </span>
                </div>
              </div>

              {/* Concurrent Limit */}
              <ConcurrentLimitInput
                phone={phone}
                onUpdate={loadData}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Import Phone Modal */}
      {showImportModal && (
        <ImportPhoneModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && selectedPhone && (
        <AssignAgentModal
          phone={selectedPhone}
          agents={agents}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedPhone(null);
          }}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}

// Import Phone Modal Component
function ImportPhoneModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ImportPhoneRequest>({
    number: "",
    country: "IN",
    exotelConfig: {
      apiKey: "",
      apiToken: "",
      sid: "",
      subdomain: "",
      appId: "",
    },
    tags: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      if (!formData.number.match(/^\+?[1-9]\d{1,14}$/)) {
        toast.warning("Invalid phone number format. Use E.164 format (e.g., +919876543210)");
        setLoading(false);
        return;
      }

      await importPhoneAPI(formData);
      toast.success("Phone number imported successfully");
      onSuccess();
    } catch (err: any) {
      console.error("Error importing phone:", err);
      const errorMessage = err.message || "Failed to import phone number";
      toast.warning(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ImportPhoneRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExotelConfigChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      exotelConfig: {
        ...prev.exotelConfig,
        [field]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Phone className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Import Phone Number</h2>
              <p className="text-xs text-zinc-500">Add Exotel phone number to your account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Phone Number Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Phone Number Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="+919876543210"
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Use E.164 format with country code (e.g., +91 for India)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Country Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300 uppercase"
                  placeholder="IN"
                  maxLength={2}
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  2-letter code (e.g., IN, US)
                </p>
              </div>
            </div>
          </div>

          {/* Exotel Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Exotel Credentials</h3>
              <p className="text-xs text-zinc-500">
                Enter your Exotel API credentials. You can find these in your Exotel dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exotelConfig.apiKey}
                  onChange={(e) => handleExotelConfigChange("apiKey", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="Enter your Exotel API Key"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  API Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.exotelConfig.apiToken}
                  onChange={(e) => handleExotelConfigChange("apiToken", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="Enter your Exotel API Token"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Account SID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exotelConfig.sid}
                  onChange={(e) => handleExotelConfigChange("sid", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="Enter your Exotel SID"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.exotelConfig.subdomain}
                  onChange={(e) => handleExotelConfigChange("subdomain", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="e.g., api.exotel.com"
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Usually api.exotel.com or your custom subdomain
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  App ID (Voicebot)
                </label>
                <input
                  type="text"
                  value={formData.exotelConfig.appId || ""}
                  onChange={(e) => handleExotelConfigChange("appId", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                  placeholder="Enter your Exotel Voicebot App ID"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Required for making outbound calls. Find this in your Exotel dashboard under Applets.
                </p>
              </div>
            </div>
          </div>

          {/* Tags (Optional) */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              onChange={(e) => {
                const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                handleChange("tags", tags);
              }}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
              placeholder="sales, support, customer-service (comma separated)"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Add tags to organize your phone numbers
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Phone Number"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Assign Agent Modal Component
function AssignAgentModal({
  phone,
  agents,
  onClose,
  onSuccess,
}: {
  phone: PhoneType;
  agents: BackendAgent[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    typeof phone.agentId === "string" ? phone.agentId : (phone.agentId as any)?._id || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAgentId) {
      toast.warning("Please select an agent");
      return;
    }

    setLoading(true);

    try {
      await assignAgentToPhoneAPI(phone._id, selectedAgentId);
      toast.success("Agent assigned successfully");
      onSuccess();
    } catch (err: any) {
      console.error("Error assigning agent:", err);
      const errorMessage = err.message || "Failed to assign agent";
      toast.warning(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const activeAgents = agents.filter((agent) => agent.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Assign Agent</h2>
              <p className="text-xs text-zinc-500">
                Assign an agent to {phone.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeAgents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <User className="text-zinc-400" size={32} />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 mb-2">
                No Active Agents
              </h3>
              <p className="text-sm text-zinc-600 mb-4">
                You need to create and activate at least one agent before you can assign it to a phone number.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-3">
                  Select Agent <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activeAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAgentId === agent.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-semibold text-zinc-900">{agent.name}</h4>
                            {agent.isActive && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700">
                                Active
                              </span>
                            )}
                          </div>
                          {agent.description && (
                            <p className="text-xs text-zinc-600 line-clamp-2">
                              {agent.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-[11px] text-zinc-500">
                            <span>Model: {agent.config?.llm?.model || "N/A"}</span>
                            <span>Voice: {agent.config?.voice?.provider || "N/A"}</span>
                            <span>Language: {agent.config?.language || "N/A"}</span>
                          </div>
                        </div>
                        {selectedAgentId === agent.id && (
                          <div className="ml-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="text-white" size={14} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  {activeAgents.length} active agent{activeAgents.length !== 1 ? "s" : ""} available
                </p>
              </div>

              {/* Warning if agent is already assigned */}
              {phone.agentId && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs">
                  <strong>Note:</strong> This phone number is already assigned to an agent.
                  Assigning a new agent will replace the current assignment.
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  disabled={loading || !selectedAgentId}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Agent"
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}

// Concurrent Limit Input Component
function ConcurrentLimitInput({
  phone,
  onUpdate,
}: {
  phone: PhoneType;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(phone.concurrentLimit || 1);

  const handleSave = async () => {
    if (value < 1) {
      toast.warning("Concurrent limit must be at least 1");
      return;
    }

    setLoading(true);
    try {
      await updatePhoneConcurrentLimitAPI(phone._id, value);
      toast.success(`Concurrent limit updated to ${value}`);
      setIsEditing(false);
      await onUpdate();
    } catch (err: any) {
      console.error("Error updating concurrent limit:", err);
      toast.warning(err.message || "Failed to update concurrent limit");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(phone.concurrentLimit || 1);
    setIsEditing(false);
  };

  return (
    <div className="pt-3 border-t border-zinc-200">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-zinc-600">Concurrent Calls:</span>
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">{phone.concurrentLimit || 2}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-emerald-600 hover:text-emerald-700 text-[10px] underline"
            >
              Edit
            </button>
          </div>
        ) : null}
      </div>

      {isEditing && (
        <div className="space-y-2">
          <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
            placeholder="Enter concurrent limit"
            disabled={loading}
          />
          <p className="text-[10px] text-zinc-500">
            Maximum number of simultaneous calls for this phone number (min: 1)
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

