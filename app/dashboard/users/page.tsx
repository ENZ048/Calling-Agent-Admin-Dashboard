"use client";

import { useState, useEffect } from "react";
import { Users, Plus, ToggleLeft, ToggleRight, Loader2, Shield } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useUsersStore } from "@/lib/users";
import { useToast } from "@/lib/toast";
import { fetchPhones, assignPhoneToUserAPI, unassignPhoneFromUserAPI, Phone, getUserPermissionsAPI, updateUserPermissionsAPI, UserPermissions, DEFAULT_USER_PERMISSIONS } from "@/lib/api";

export default function UsersPage() {
  const toast = useToast();
  const { users, loading, error, loadUsers, createUser, updateUser, deleteUser, updateCredits } =
    useUsersStore();

  // Fetch users on mount
  useEffect(() => {
    loadUsers();
    loadAvailablePhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailablePhones = async () => {
    try {
      setLoadingPhones(true);
      // Fetch ALL phones, not just available ones
      const phones = await fetchPhones();
      setAvailablePhones(phones);
    } catch (error: any) {
      console.error("Failed to load phones:", error);
      toast.error(error.message || "Failed to load phones");
    } finally {
      setLoadingPhones(false);
    }
  };

  const handleAssignPhone = async (userId: number, phoneId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || !user.backendId) {
      toast.error("User not found");
      return;
    }

    try {
      setAssigningPhoneUserId(userId);
      await assignPhoneToUserAPI(phoneId, user.backendId);
      toast.success("Phone number assigned successfully");
      // Reload users and available phones
      await loadUsers();
      await loadAvailablePhones();
    } catch (error: any) {
      console.error("Failed to assign phone:", error);
      const errorMessage = error.message || "Failed to assign phone number";
      if (errorMessage.includes("already assigned")) {
        toast.error("This phone number is already assigned to another user or agent");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAssigningPhoneUserId(null);
    }
  };

  const handleUnassignPhone = async (userId: number, phoneId: string) => {
    try {
      setAssigningPhoneUserId(userId);
      await unassignPhoneFromUserAPI(phoneId);
      toast.success("Phone number removed successfully");
      await loadUsers();
      await loadAvailablePhones();
    } catch (error: any) {
      console.error("Failed to unassign phone:", error);
      toast.error(error.message || "Failed to remove phone number");
    } finally {
      setAssigningPhoneUserId(null);
    }
  };

  const confirmPhoneAction = async () => {
    if (!pendingPhoneAction) return;

    const { userId, phoneId, action } = pendingPhoneAction;

    if (action === "remove") {
      await handleUnassignPhone(userId, phoneId);
    } else {
      // For assign or change, the phoneId is the new phone to assign
      await handleAssignPhone(userId, phoneId);
    }

    setPendingPhoneAction(null);
  };

  const cancelPhoneAction = () => {
    setPendingPhoneAction(null);
  };

  // Helper to get the phone ID for a user's current mobile number
  const getPhoneIdByNumber = (mobileNumber: string): string | null => {
    const phone = availablePhones.find((p) => p.number === mobileNumber);
    return phone?._id || null;
  };

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [plan, setPlan] = useState("Enterprise");
  const [role, setRole] = useState("Super Admin");
  const [isActive, setIsActive] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [creditsUserId, setCreditsUserId] = useState<number | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsMode, setCreditsMode] = useState<"add" | "remove">("add");
  const [availablePhones, setAvailablePhones] = useState<Phone[]>([]);
  const [assigningPhoneUserId, setAssigningPhoneUserId] = useState<number | null>(null);
  const [loadingPhones, setLoadingPhones] = useState(false);

  // Permissions modal state
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsUserId, setPermissionsUserId] = useState<number | null>(null);
  const [permissionsUserName, setPermissionsUserName] = useState("");
  const [currentPermissions, setCurrentPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // State for phone action confirmation
  const [pendingPhoneAction, setPendingPhoneAction] = useState<{
    userId: number;
    phoneId: string;
    action: "assign" | "change" | "remove";
    newPhoneNumber?: string;
  } | null>(null);

  const resetForm = () => {
    setFullName("");
    setUserName("");
    setEmail("");
    setPassword("");
    setMobile("");
    setCompany("");
    setCreditLimit("");
    setPlan("Enterprise");
    setRole("Super Admin");
    setIsActive(true);
    setConfirmPassword("");
    setExpiryDate("");
    setEditingUserId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.warning("Name and email are required");
      return;
    }

    // For new users, password is required
    if (editingUserId == null && !password) {
      toast.warning("Password is required for new users");
      return;
    }

    // Validate password confirmation for new users
    if (editingUserId == null && password !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }

    try {
      const baseUserName =
        userName ||
        (email ? email.split("@")[0] : "") ||
        fullName.toLowerCase().replace(/\s+/g, "");

      if (editingUserId == null) {
        await createUser({
          fullName,
          userName: baseUserName,
          email,
          company,
          mobile,
          role,
          plan: plan, // Include plan
          credit: Number(creditLimit || 0),
          status: isActive ? "active" : "inactive",
          virtualNumbers: [],
          password: password, // Required for creation
          expiryDate: expiryDate || undefined,
        });
        toast.success("User created successfully");
      } else {
        const updates: any = {
          fullName,
          userName: baseUserName || undefined,
          email,
          company,
          mobile,
          role,
          credit: creditLimit === "" ? undefined : Number(creditLimit),
          status: isActive ? "active" : "inactive",
          expiryDate: expiryDate || undefined,
        };
        // Only include password if it was changed
        if (password && password === confirmPassword) {
          updates.password = password;
        }
        await updateUser(editingUserId, updates);
        toast.success("User updated successfully");
      }

      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save user");
    }
  };

  const toggleStatus = (id: number, status: "active" | "inactive") => {
    updateUser(id, { status: status === "active" ? "inactive" : "active" });
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setUserName(user.userName);
    setEmail(user.email);
    setCompany(user.company);
    setMobile(user.mobile);
    setRole(user.role || "Super Admin");
    setCreditLimit(user.credit ? String(user.credit) : "");
    setIsActive(user.status === "active");
    setPassword("");
    setConfirmPassword("");
    // Format expiryDate for date input (YYYY-MM-DD)
    setExpiryDate(user.expiryDate ? user.expiryDate.split("T")[0] : "");
    setIsFormOpen(true);
  };

  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const openCreditsModal = (user: any, mode: "add" | "remove") => {
    setCreditsUserId(user.id);
    setCreditsMode(mode);
    setCreditsAmount("");
    setIsCreditsModalOpen(true);
  };

  const applyCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditsUserId) return;
    const amount = Number(creditsAmount || 0);
    if (!amount || Number.isNaN(amount)) {
      setIsCreditsModalOpen(false);
      return;
    }

    updateCredits({
      userId: creditsUserId,
      amount,
      mode: creditsMode,
      description: "Super Admin",
    });

    setIsCreditsModalOpen(false);
    setCreditsUserId(null);
    setCreditsAmount("");
  };

  // Permissions modal functions
  const openPermissionsModal = async (user: any) => {
    if (!user.backendId) {
      toast.error("User not found");
      return;
    }

    setPermissionsUserId(user.id);
    setPermissionsUserName(user.fullName);
    setLoadingPermissions(true);
    setIsPermissionsModalOpen(true);

    try {
      const result = await getUserPermissionsAPI(user.backendId);
      setCurrentPermissions(result.permissions);
    } catch (error: any) {
      console.error("Failed to load permissions:", error);
      toast.error(error.message || "Failed to load permissions");
      setCurrentPermissions(DEFAULT_USER_PERMISSIONS);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    setCurrentPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePermissions = async () => {
    if (!permissionsUserId) return;

    const user = users.find((u) => u.id === permissionsUserId);
    if (!user || !user.backendId) {
      toast.error("User not found");
      return;
    }

    console.log("Saving permissions for user:", user.backendId);
    console.log("Permissions to save:", currentPermissions);

    setSavingPermissions(true);
    try {
      const result = await updateUserPermissionsAPI(user.backendId, currentPermissions);
      console.log("Save result:", result);
      toast.success("Permissions updated successfully");
      setIsPermissionsModalOpen(false);
      setPermissionsUserId(null);
    } catch (error: any) {
      console.error("Failed to save permissions:", error);
      toast.error(error.message || "Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Permission labels for display
  const permissionLabels: Record<keyof UserPermissions, string> = {
    dashboard: "Dashboard",
    leads: "Leads",
    campaigns: "Campaigns",
    scheduledCalls: "Scheduled Calls",
    appointmentBooking: "Appointment Booking",
    callLogs: "Call Logs",
    callRecording: "Call Recording",
    chatSummary: "Chat Summary",
    liveStatus: "Live Status",
    analytics: "Analytics",
    deliveryReports: "Delivery Reports",
    creditHistory: "Credit History",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <Users className="h-3 w-3" />
            <span>Users</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create portal users and manage their credits.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>
      {/* Users table */}
      <div className="glass-panel overflow-visible relative">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
            Users
          </span>
        </div>
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            Loading users...
          </div>
        )}
        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Full Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email ID</th>
                  <th className="px-3 py-2 text-left font-medium">Company Name</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="px-3 py-2 text-left font-medium">Number</th>
                  <th className="px-3 py-2 text-left font-medium">Credit</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-100 last:border-0 text-xs"
                >
                  <td className="px-3 py-2 text-zinc-600">{idx + 1}.</td>
                  <td className="px-3 py-2 text-zinc-800">{u.fullName}</td>
                  <td className="px-3 py-2 text-zinc-700">{u.email}</td>
                  <td className="px-3 py-2 text-zinc-700">{u.company}</td>
                  <td className="px-3 py-2 text-zinc-700">{u.role}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    {u.mobile ? (
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            disabled={assigningPhoneUserId === u.id}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {u.mobile}
                            {assigningPhoneUserId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <span className="text-[9px]">▾</span>
                            )}
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            className="z-50 rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-800 shadow-lg min-w-[160px] py-1"
                          >
                            <DropdownMenu.Sub>
                              <DropdownMenu.SubTrigger className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none flex items-center justify-between">
                                Change Number
                                <span className="text-[9px] ml-2">▸</span>
                              </DropdownMenu.SubTrigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.SubContent
                                  sideOffset={4}
                                  className="z-50 rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-800 shadow-lg min-w-[180px] py-1 max-h-[200px] overflow-y-auto"
                                >
                                  {availablePhones
                                    .filter((phone) => phone.number !== u.mobile)
                                    .map((phone) => {
                                      const isAssigned = phone.userId || phone.agentId;
                                      return (
                                        <DropdownMenu.Item
                                          key={phone._id}
                                          className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                                          onSelect={() => {
                                            setPendingPhoneAction({
                                              userId: u.id,
                                              phoneId: phone._id,
                                              action: "change",
                                              newPhoneNumber: phone.number,
                                            });
                                          }}
                                        >
                                          {phone.number} {isAssigned ? "(Assigned)" : ""}
                                        </DropdownMenu.Item>
                                      );
                                    })}
                                  {availablePhones.filter((phone) => phone.number !== u.mobile).length === 0 && (
                                    <div className="px-3 py-1.5 text-zinc-400">No other numbers available</div>
                                  )}
                                </DropdownMenu.SubContent>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Sub>
                            <DropdownMenu.Item
                              className="px-3 py-1.5 cursor-pointer hover:bg-rose-50 text-rose-600 outline-none"
                              onSelect={() => {
                                const phoneId = getPhoneIdByNumber(u.mobile);
                                if (phoneId) {
                                  setPendingPhoneAction({
                                    userId: u.id,
                                    phoneId: phoneId,
                                    action: "remove",
                                  });
                                } else {
                                  toast.error("Could not find phone record for this number");
                                }
                              }}
                            >
                              Remove Number
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    ) : (
                      <div className="flex items-center gap-1">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const phone = availablePhones.find((p) => p._id === e.target.value);
                              setPendingPhoneAction({
                                userId: u.id,
                                phoneId: e.target.value,
                                action: "assign",
                                newPhoneNumber: phone?.number,
                              });
                            }
                          }}
                          disabled={assigningPhoneUserId === u.id || loadingPhones}
                          className="h-7 w-full min-w-[140px] rounded-md border border-zinc-200 bg-white px-2 text-[11px] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select number...</option>
                          {availablePhones.map((phone) => {
                            const isAssigned = phone.userId || phone.agentId;
                            return (
                              <option key={phone._id} value={phone._id}>
                                {phone.number} {isAssigned ? "(Assigned)" : ""}
                              </option>
                            );
                          })}
                        </select>
                        {assigningPhoneUserId === u.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{u.credit}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u.id, u.status)}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px]"
                    >
                      {u.status === "active" ? (
                        <>
                          <ToggleRight className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3 text-zinc-400" />
                          <span className="text-zinc-500">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
                        >
                          Actions ▾
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={6}
                          className="z-50 rounded-md border border-zinc-200 bg-white text-[11px] text-zinc-800 shadow-lg min-w-[9rem] py-1"
                        >
                          <DropdownMenu.Item
                            className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                            onSelect={() => openEditModal(u)}
                          >
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                            onSelect={() => deleteUser(u.id)}
                          >
                            Delete
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                            onSelect={() => openCreditsModal(u, "add")}
                          >
                            Add Credits
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                            onSelect={() => openCreditsModal(u, "remove")}
                          >
                            Remove Credits
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="px-3 py-1.5 cursor-pointer hover:bg-zinc-50 outline-none"
                            onSelect={() => openPermissionsModal(u)}
                          >
                            Permission
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User modal - Basic Info + Account Settings + Change Password + Assigned Numbers */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-16">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 mx-4 max-h-[calc(100vh-4rem)] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
                  {editingUserId ? "Update User" : "Create User"}
                </p>
                <p className="text-sm font-semibold text-zinc-900 mt-1">
                  {editingUserId ? "Edit User" : "Add User"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-6 text-xs flex-1 overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-900">Basic Information</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Company Name</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Number</label>
                    <input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="+91 98XXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-900">Account Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">
                      Plan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                    >
                      <option value="Starter">Starter</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Credits</label>
                    <input
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      type="number"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="e.g. 1426"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Status</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="user-status"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-3 w-3 rounded border border-zinc-300"
                        />
                        <label htmlFor="user-status" className="text-zinc-600">
                          Active
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className={`rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300 ${!expiryDate ? "text-transparent" : ""}`}
                        />
                        {!expiryDate && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">
                            Expiry date
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-900">Change Password</p>
                <p className="text-[11px] text-zinc-400">
                  Leave blank to keep current password.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Password</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-zinc-600">Confirm Password</label>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="flex justify-end border-t border-zinc-200 px-5 py-3 text-xs gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                {editingUserId ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isCreditsModalOpen && creditsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form
            onSubmit={applyCredits}
            className="w-full max-w-xs rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 mx-4 p-4 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">
                {creditsMode === "add" ? "Add credits" : "Remove credits"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCreditsModalOpen(false);
                  setCreditsUserId(null);
                  setCreditsAmount("");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              {creditsMode === "add"
                ? "Enter how many credits you want to add for this user. Existing credits will be increased."
                : "Enter how many credits you want to remove. We will subtract from existing credits, never going below 0."}
            </p>
            <input
              type="number"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
              placeholder="e.g. 500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreditsModalOpen(false);
                  setCreditsUserId(null);
                  setCreditsAmount("");
                }}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white hover:bg-emerald-600"
              >
                {creditsMode === "add" ? "Add credits" : "Remove credits"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phone Action Confirmation Modal */}
      {pendingPhoneAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">
                {pendingPhoneAction.action === "remove"
                  ? "Remove Phone Number"
                  : pendingPhoneAction.action === "change"
                  ? "Change Phone Number"
                  : "Assign Phone Number"}
              </p>
              <button
                type="button"
                onClick={cancelPhoneAction}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-600">
              {pendingPhoneAction.action === "remove" ? (
                <>Are you sure you want to remove the phone number from this user?</>
              ) : pendingPhoneAction.action === "change" ? (
                <>
                  Are you sure you want to change the phone number to{" "}
                  <span className="font-semibold text-emerald-600">
                    {pendingPhoneAction.newPhoneNumber}
                  </span>
                  ?
                </>
              ) : (
                <>
                  Are you sure you want to assign{" "}
                  <span className="font-semibold text-emerald-600">
                    {pendingPhoneAction.newPhoneNumber}
                  </span>{" "}
                  to this user?
                </>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelPhoneAction}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPhoneAction}
                disabled={assigningPhoneUserId !== null}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  pendingPhoneAction.action === "remove"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {assigningPhoneUserId !== null && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {pendingPhoneAction.action === "remove"
                  ? "Remove"
                  : pendingPhoneAction.action === "change"
                  ? "Change"
                  : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermissionsModalOpen && permissionsUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 mx-4">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">User Permissions</p>
                  <p className="text-[11px] text-zinc-500">{permissionsUserName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPermissionsModalOpen(false);
                  setPermissionsUserId(null);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-zinc-500 mb-4">
                Control which navigation items this user can see in their dashboard sidebar.
              </p>
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={currentPermissions[key]}
                        onChange={(e) => handlePermissionChange(key, e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-700 group-hover:text-zinc-900">
                        {permissionLabels[key]}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-zinc-200 px-5 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPermissions(DEFAULT_USER_PERMISSIONS)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Enable All
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPermissions({
                      dashboard: false,
                      leads: false,
                      campaigns: false,
                      scheduledCalls: false,
                      appointmentBooking: false,
                      callLogs: false,
                      callRecording: false,
                      chatSummary: false,
                      liveStatus: false,
                      analytics: false,
                      deliveryReports: false,
                      creditHistory: false,
                    })
                  }
                  className="text-[11px] text-zinc-500 hover:text-zinc-700 hover:underline"
                >
                  Disable All
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPermissionsModalOpen(false);
                    setPermissionsUserId(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePermissions}
                  disabled={savingPermissions || loadingPermissions}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPermissions && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


