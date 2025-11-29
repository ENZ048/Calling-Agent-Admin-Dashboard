"use client";

import { create } from "zustand";

export type AgentRole = "Sales" | "Support" | "Collections" | "Custom";

export type Agent = {
  id: string;
  name: string;
  role: AgentRole | string;
  virtualNumber: string;
  successRate: number;
  totalCalls: number;
};

type AgentsState = {
  agents: Agent[];
  createAgent: (agent: Omit<Agent, "id" | "successRate" | "totalCalls">) => Agent;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
};

const initialAgents: Agent[] = [
  {
    id: "agt-001",
    name: "Orbit-1",
    role: "Sales",
    virtualNumber: "+1 (555) 201‑001",
    successRate: 72.4,
    totalCalls: 624,
  },
  {
    id: "agt-002",
    name: "Orbit-2",
    role: "Support",
    virtualNumber: "+1 (555) 201‑002",
    successRate: 68.1,
    totalCalls: 488,
  },
  {
    id: "agt-003",
    name: "Orbit-3",
    role: "Collections",
    virtualNumber: "+1 (555) 201‑003",
    successRate: 61.9,
    totalCalls: 352,
  },
];

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: initialAgents,
  createAgent: (payload) => {
    const id = `agt-${String(get().agents.length + 1).padStart(3, "0")}`;
    const agent: Agent = {
      id,
      name: payload.name,
      role: payload.role,
      virtualNumber: payload.virtualNumber,
      successRate: 0,
      totalCalls: 0,
    };
    set((state) => ({ agents: [agent, ...state.agents] }));
    return agent;
  },
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    })),
}));


