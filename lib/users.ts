"use client";

import { create } from "zustand";
import { useAgentsStore } from "./agents";
import { useCreditHistoryStore } from "./credit-history";
import { fetchUsers, createUserAPI, updateUserAPI, deleteUserAPI, addCreditsAPI, removeCreditsAPI, BackendUser } from "./api";

export type UserStatus = "active" | "inactive";

export type DashboardUser = {
  id: number;
  fullName: string;
  userName: string;
  email: string;
  company: string;
  mobile: string;
  role: string;
  credit: number;
  status: UserStatus;
  virtualNumbers: string[];
  linkedAgents: string[]; // agent ids linked via virtual numbers
  backendId?: string; // MongoDB _id for API operations
  plan?: string; // Plan type (Starter, Pro, Enterprise)
  expiryDate?: string; // Account expiry date
};

type UsersState = {
  users: DashboardUser[];
  loading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  createUser: (
    user: Omit<DashboardUser, "id" | "linkedAgents"> & { password: string },
    options?: {
      sendWelcomeEmail?: boolean;
      emailTemplate?: { subject: string; body: string };
    }
  ) => Promise<{ user: DashboardUser; emailSent?: boolean; emailError?: string }>;
  updateUser: (id: number, updates: Partial<DashboardUser> & { password?: string }) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  assignVirtualNumber: (userId: number, num: string) => void;
  updateCredits: (params: {
    userId: number;
    amount: number;
    mode: "add" | "remove";
    description?: string;
  }) => Promise<void>;
};

/**
 * Convert backend role to display format
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    user: "User",
  };
  return roleMap[role.toLowerCase()] || role;
}

/**
 * Convert display role to backend format
 */
function parseRole(role: string): 'user' | 'admin' | 'super_admin' {
  const roleMap: Record<string, 'user' | 'admin' | 'super_admin'> = {
    "super admin": "super_admin",
    "admin": "admin",
    "user": "user",
  };
  return roleMap[role.toLowerCase()] || "user";
}

/**
 * Generate numeric ID from MongoDB _id (simple hash)
 */
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Map backend user to dashboard user format
 */
function mapBackendUserToDashboard(backendUser: BackendUser, index: number): DashboardUser {
  // Get phone numbers from backend
  const phoneNumbers = backendUser.phoneNumbers || [];

  return {
    id: hashId(backendUser._id),
    backendId: backendUser._id,
    fullName: backendUser.name,
    userName: backendUser.email.split("@")[0] || backendUser.name.toLowerCase().replace(/\s+/g, ""),
    email: backendUser.email,
    company: backendUser.companyName || "",
    mobile: phoneNumbers[0] || "", // Use first phone number as mobile
    role: formatRole(backendUser.role),
    credit: backendUser.credits || 0,
    status: backendUser.isActive ? "active" : "inactive",
    virtualNumbers: phoneNumbers, // Phone numbers from backend
    linkedAgents: [],
    expiryDate: backendUser.expiryDate || undefined,
  };
}

const initialUsers: DashboardUser[] = [
  {
    id: 1,
    fullName: "Varun",
    userName: "perfumery",
    email: "varun@troikatech.in",
    company: "Troikatech",
    mobile: "9865329637",
    role: "Super Admin",
    credit: 0,
    status: "active",
    virtualNumbers: [],
    linkedAgents: [],
  },
  {
    id: 2,
    fullName: "Hiral",
    userName: "sportiz",
    email: "hiral.sportiz@gmail.com",
    company: "Sportiz",
    mobile: "9702088848",
    role: "Admin",
    credit: 932908,
    status: "active",
    virtualNumbers: [],
    linkedAgents: [],
  },
];

export const useUsersStore = create<UsersState>((set, get) => ({
  users: initialUsers,
  loading: false,
  error: null,

  loadUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetchUsers(1, 100);
      if (response.success) {
        const mappedUsers = response.data.users.map((backendUser, index) =>
          mapBackendUserToDashboard(backendUser, index)
        );
        set({ users: mappedUsers, loading: false, error: null });
      } else {
        set({ error: "Failed to load users", loading: false });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load users";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  createUser: async (payload, options) => {
    try {
      // Map frontend format to backend format
      const backendRole = parseRole(payload.role);
      
      // Map plan from frontend to backend format
      const planMap: Record<string, 'free' | 'basic' | 'professional' | 'enterprise'> = {
        "Starter": "free",
        "Pro": "professional",
        "Enterprise": "enterprise",
      };
      const backendPlan = planMap[payload.plan || "Enterprise"] || "enterprise";
      
      const backendData = {
        name: payload.fullName,
        email: payload.email,
        password: payload.password, // Required for creation
        companyName: payload.company || undefined,
        mobileNumber: payload.mobile || undefined,
        plan: backendPlan,
        role: backendRole,
        credits: payload.credit || 0,
        isActive: payload.status === "active",
        expiryDate: payload.expiryDate || undefined,
        sendWelcomeEmailFlag: options?.sendWelcomeEmail || false,
        emailTemplate: options?.emailTemplate,
      };

      const result = await createUserAPI(backendData);
      const mappedUser = mapBackendUserToDashboard(result.user, 0);
      
      // Reload users to get the latest list
      await get().loadUsers();
      
      return {
        user: mappedUser,
        emailSent: result.emailSent,
        emailError: result.emailError,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create user";
      set({ error: errorMessage });
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      const user = get().users.find((u) => u.id === id);
      if (!user || !user.backendId) {
        throw new Error("User not found");
      }

      // Map frontend format to backend format
      const backendUpdates: any = {};
      if (updates.fullName) backendUpdates.name = updates.fullName;
      if (updates.email) backendUpdates.email = updates.email;
      if (updates.password) backendUpdates.password = updates.password;
      if (updates.company !== undefined) backendUpdates.companyName = updates.company || undefined;
      if (updates.role) backendUpdates.role = parseRole(updates.role);
      if (updates.credit !== undefined) backendUpdates.credits = updates.credit;
      if (updates.status !== undefined) backendUpdates.isActive = updates.status === "active";
      if (updates.expiryDate !== undefined) backendUpdates.expiryDate = updates.expiryDate || null;

      await updateUserAPI(user.backendId, backendUpdates);
      
      // Reload users to get the latest data
      await get().loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update user";
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const user = get().users.find((u) => u.id === id);
      if (!user || !user.backendId) {
        throw new Error("User not found");
      }

      await deleteUserAPI(user.backendId);
      
      // Reload users to get the latest list
      await get().loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      set({ error: errorMessage });
      throw error;
    }
  },

  assignVirtualNumber: (userId, num) => {
    const clean = num.trim();
    if (!clean) return;

    const agentsStore = useAgentsStore.getState();
    const normalized = clean.replace(/\s+/g, "");
    const matchingAgents = agentsStore.agents.filter(
      (a) => a.virtualNumber.replace(/\s+/g, "") === normalized,
    );

    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              virtualNumbers: Array.from(new Set([...u.virtualNumbers, clean])),
              linkedAgents: Array.from(
                new Set([...u.linkedAgents, ...matchingAgents.map((a) => a.id)]),
              ),
            }
          : u,
      ),
    }));
  },

  updateCredits: async ({ userId, amount, mode, description }) => {
    const { users } = get();
    const target = users.find((u) => u.id === userId);
    if (!target || !amount || !target.backendId) return;

    try {
      const prev = target.credit;
      let result;

      // Call the backend API to add/remove credits
      if (mode === "add") {
        result = await addCreditsAPI(target.backendId, amount, description || "admin_grant");
      } else {
        result = await removeCreditsAPI(target.backendId, amount, description || "admin_removal");
      }

      const next = result.newBalance;

      // Update local state with the new balance from backend
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? { ...u, credit: next } : u)),
      }));

      // Also add to local credit history store for immediate UI update
      const history = useCreditHistoryStore.getState();
      history.addEntry({
        userId,
        name: target.fullName,
        email: target.email,
        number: target.mobile,
        type: mode,
        amount,
        previousCredit: prev,
        newCredit: next,
        description: description || "Admin update",
      });
    } catch (error) {
      console.error("Error updating credits:", error);
      throw error;
    }
  },
}));


