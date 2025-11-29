"use client";

import { create } from "zustand";
import { fetchCreditTransactions, BackendCreditTransaction } from "./api";

export type CreditHistoryItem = {
  id: string;
  userId: number;
  name: string;
  email: string;
  number: string;
  type: "add" | "remove";
  amount: number;
  previousCredit: number;
  newCredit: number;
  description: string;
  createdAt: string;
};

type CreditHistoryState = {
  items: CreditHistoryItem[];
  loading: boolean;
  error: string | null;
  loadCreditHistory: () => Promise<void>;
  addEntry: (entry: Omit<CreditHistoryItem, "id" | "createdAt">) => void;
  clear: () => void;
};

/**
 * Map backend credit transaction to frontend format
 */
function mapBackendTransactionToHistory(
  transaction: BackendCreditTransaction
): CreditHistoryItem {
  // Handle populated user data (could be object or just ID string)
  const user = typeof transaction.userId === 'object' && transaction.userId !== null
    ? transaction.userId
    : { _id: String(transaction.userId), name: 'Unknown', email: '' };
  
  const isAddition = transaction.type === 'addition' || transaction.type === 'refund';
  const amount = Math.abs(transaction.amount);
  
  // Calculate previous credit (balance - amount for additions, balance + amount for deductions)
  const previousCredit = isAddition 
    ? transaction.balance - amount 
    : transaction.balance + amount;

  // Get description from reason or admin name
  let description = transaction.reason || 'Credit transaction';
  if (transaction.adminId && typeof transaction.adminId === 'object') {
    const adminName = transaction.adminId.name || transaction.adminId.email || 'Admin';
    description = `${adminName} - ${description}`;
  }
  if (transaction.campaignId && typeof transaction.campaignId === 'object' && transaction.campaignId.name) {
    description = `${description} (Campaign: ${transaction.campaignId.name})`;
  }

  // Generate numeric ID from MongoDB _id
  const userIdStr = typeof user._id === 'string' ? user._id : String(user._id);
  let numericUserId = 0;
  for (let i = 0; i < userIdStr.length; i++) {
    numericUserId = ((numericUserId << 5) - numericUserId) + userIdStr.charCodeAt(i);
    numericUserId = numericUserId & numericUserId; // Convert to 32-bit integer
  }
  numericUserId = Math.abs(numericUserId);

  return {
    id: transaction._id,
    userId: numericUserId,
    name: user.name || 'Unknown',
    email: user.email || '',
    number: '', // Phone numbers are stored separately
    type: isAddition ? "add" : "remove",
    amount: amount,
    previousCredit: previousCredit,
    newCredit: transaction.balance,
    description: description,
    createdAt: transaction.createdAt,
  };
}

export const useCreditHistoryStore = create<CreditHistoryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  loadCreditHistory: async () => {
    set({ loading: true, error: null });
    try {
      // First, fetch page 1 to get total count and pagination info
      const firstPage = await fetchCreditTransactions(1, 1000);
      if (!firstPage.success) {
        set({ error: "Failed to load credit history", loading: false });
        return;
      }

      const allTransactions = [...firstPage.data.transactions];
      const totalPages = firstPage.data.pagination.pages;

      // Fetch all remaining pages if there are more
      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const pagePromises = remainingPages.map(page => fetchCreditTransactions(page, 1000));
        const pageResults = await Promise.all(pagePromises);
        
        pageResults.forEach(result => {
          if (result.success) {
            allTransactions.push(...result.data.transactions);
          }
        });
      }

      const mappedItems = allTransactions.map(mapBackendTransactionToHistory);
      set({ items: mappedItems, loading: false, error: null });
    } catch (error) {
      console.error("Error loading credit history:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load credit history";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  addEntry: (entry) =>
    set((state) => ({
      items: [
        {
          id: `${Date.now()}-${state.items.length + 1}`,
          createdAt: new Date().toISOString(),
          ...entry,
        },
        ...state.items,
      ],
    })),
  clear: () => set({ items: [] }),
}));


