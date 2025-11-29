"use client";

import { create } from "zustand";
import { useUsersStore } from "./users";
import { useCreditHistoryStore } from "./credit-history";
import { fetchLiveCalls, LiveCallResponse } from "./api";

export type CampaignStatus = "running" | "completed" | "paused" | "cancelled";

export type Campaign = {
  id: string;
  name: string;
  user: string;
  userId?: number;
  createdAt: string;
  status: CampaignStatus;
  progress: number;
  successRate: number;
  totalMinutes: number;
  totalCost: number;
  calls: number;
};

export type LiveCall = {
  id: string;
  phone: string;
  userName: string;
  campaignName: string;
  agentName: string;
  campaignId: string;
};

type CampaignsState = {
  campaigns: Campaign[];
  liveCalls: LiveCall[];
  loading: boolean;
  error: string | null;
  loadLiveCalls: () => Promise<void>;
  completeCampaign: (id: string) => void;
  stopCampaign: (id: string) => void;
  cancelCampaign: (id: string) => void;
};

const initialCampaigns: Campaign[] = [
  {
    id: "cmp-001",
    name: "Onboarding – New Signups",
    user: "Varun",
    userId: 1,
    createdAt: "2025-02-01",
    status: "running",
    progress: 78,
    successRate: 64,
    totalMinutes: 5400,
    totalCost: 182.4,
    calls: 1240,
  },
  {
    id: "cmp-002",
    name: "Renewals – Q2",
    user: "Hiral",
    userId: 2,
    createdAt: "2025-02-05",
    status: "running",
    progress: 42,
    successRate: 58,
    totalMinutes: 3100,
    totalCost: 96.3,
    calls: 640,
  },
  {
    id: "cmp-003",
    name: "Winback – Dormant Users",
    user: "Varun",
    userId: 1,
    createdAt: "2025-02-09",
    status: "cancelled",
    progress: 23,
    successRate: 51,
    totalMinutes: 1900,
    totalCost: 48.9,
    calls: 320,
  },
];

const initialLiveCalls: LiveCall[] = [
  {
    id: "call-1",
    phone: "+1 (555) 201‑001",
    userName: "Varun",
    campaignName: "Onboarding – New Signups",
    agentName: "Orbit-1",
    campaignId: "cmp-001",
  },
  {
    id: "call-2",
    phone: "+1 (555) 201‑002",
    userName: "Hiral",
    campaignName: "Onboarding – New Signups",
    agentName: "Orbit-2",
    campaignId: "cmp-001",
  },
  {
    id: "call-3",
    phone: "+1 (555) 201‑003",
    userName: "Varun",
    campaignName: "Renewals – Q2",
    agentName: "Orbit-3",
    campaignId: "cmp-002",
  },
  {
    id: "call-4",
    phone: "+1 (555) 201‑004",
    userName: "Hiral",
    campaignName: "Winback – Dormant Users",
    agentName: "Orbit-1",
    campaignId: "cmp-003",
  },
];

export const useCampaignsStore = create<CampaignsState>((set, get) => ({
  campaigns: initialCampaigns,
  liveCalls: [],
  loading: false,
  error: null,

  loadLiveCalls: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetchLiveCalls();
      if (response.success) {
        // Map backend format to frontend format
        // Always set the array, even if empty, to clear any stale data
        const mappedCalls: LiveCall[] = response.data.map((call: LiveCallResponse) => ({
          id: call.id,
          phone: call.phone,
          userName: call.userName,
          campaignName: call.campaignName || "Unknown Campaign",
          agentName: call.agentName || "Default Agent",
          campaignId: call.campaignId || "unknown",
        }));
        set({ liveCalls: mappedCalls, loading: false, error: null });
      } else {
        // On error, clear live calls to avoid showing stale data
        set({ liveCalls: [], error: "Failed to load live calls", loading: false });
      }
    } catch (error) {
      console.error("Error loading live calls:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load live calls";
      // On error, clear live calls to avoid showing stale data
      set({ liveCalls: [], error: errorMessage, loading: false });
    }
  },

  completeCampaign: (id) => {
    const { campaigns } = get();
    const target = campaigns.find((c) => c.id === id);
    if (!target || target.status === "completed") return;

    // 1) mark campaign as completed & remove its live calls
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, status: "completed", progress: 100 } : c,
      ),
      liveCalls: state.liveCalls.filter((lc) => lc.campaignId !== id),
    }));

    // 2) debit credits from linked user & record in credit history
    const usersStore = useUsersStore.getState();
    const user =
      (target.userId && usersStore.users.find((u) => u.id === target.userId)) ??
      usersStore.users.find((u) => u.fullName === target.user);
    if (!user) return;

    const debitAmount = Math.round(target.totalMinutes * 60);
    const history = useCreditHistoryStore.getState();

    const previousCredit = user.credit;
    const newCredit = Math.max(0, previousCredit - debitAmount);

    usersStore.updateUser(user.id, { credit: newCredit });

    history.addEntry({
      userId: user.id,
      name: user.fullName,
      email: user.email,
      number: user.mobile,
      type: "remove",
      amount: debitAmount,
      previousCredit,
      newCredit,
      description: `Campaign debit – ${target.name}`,
    });
  },

  stopCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, status: "paused" } : c,
      ),
      liveCalls: state.liveCalls.filter((lc) => lc.campaignId !== id),
    }));
  },

  cancelCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, status: "cancelled", progress: 0 } : c,
      ),
      liveCalls: state.liveCalls.filter((lc) => lc.campaignId !== id),
    }));
  },
}));


