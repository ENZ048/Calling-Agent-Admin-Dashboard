export interface DashboardOverviewResponse {
  overview: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    inProgressCalls: number;
    successRate: number;
    averageDuration: number;
    totalDuration: number;
    callsPerHour: number;
    byStatus: Record<string, number>;
    byDirection: {
      inbound: number;
      outbound: number;
    };
  };
  voicemail: {
    costSaved: number;
  };
  trends: {
    callsOverTime: { labels: string[]; data: number[] };
  };
  cost: {
    estimatedCosts: {
      total: number;
    };
  };
  campaigns: {
    totalCreated: number;
  };
  scheduling: {
    totalScheduled: number;
  };
}

export interface SystemStatusResponse {
  timestamp: string;
  campaigns: {
    active: number;
  };
  contacts: {
    currentlyCalling: number;
  };
  queue: {
    waiting: number;
    active: number;
    failed: number;
  };
  redis: {
    status: string;
    isConnected: boolean;
    lastError?: string;
  };
}

export interface LiveCall {
  id: string;
  sessionId: string;
  fromPhone: string;
  toPhone: string;
  campaignName?: string;
  agentName?: string;
  startedAt: string;
  status: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface RecentCampaign {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "queued" | "active" | "paused" | "completed" | "cancelled" | "failed";
  userName: string;
  totalContacts: number;
  completedCalls: number;
  failedCalls: number;
  activeCalls: number;
  progress: number;
  successRate: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RecentCampaignsResponse {
  success: boolean;
  data: RecentCampaign[];
}

export interface CampaignListItem {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "queued" | "active" | "paused" | "completed" | "cancelled" | "failed";
  userName: string;
  totalContacts: number;
  completedCalls: number;
  failedCalls: number;
  activeCalls: number;
  progress: number;
  successRate: number;
  totalMinutes: number;
  totalCredits: number;
  totalDurationSec: number; // Exact seconds for precise formatting
  totalCalls: number;
  phoneNumbers: string[]; // Contact phone numbers belonging to this campaign
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CampaignsListResponse {
  success: boolean;
  data: CampaignListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CampaignDetail {
  id: string;
  name: string;
  description: string;
  status: "draft" | "scheduled" | "queued" | "active" | "paused" | "completed" | "cancelled" | "failed";
  userName: string;
  totalContacts: number;
  completedCalls: number;
  failedCalls: number;
  activeCalls: number;
  voicemailCalls: number;
  queuedCalls: number;
  progress: number;
  successRate: number;
  totalMinutes: number;
  totalCredits: number;
  totalDurationSec: number; // Exact seconds for precise formatting
  totalCalls: number;
  reattemptedCalls: number;
  phoneNumbers: string[]; // Contact phone numbers belonging to this campaign
  settings?: {
    retryFailedCalls: boolean;
    maxRetryAttempts: number;
    retryDelayMinutes: number;
    excludeVoicemail: boolean;
    priorityMode: string;
    concurrentCallsLimit: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: CampaignDetail;
}

import { API_BASE_URL } from './config';

/**
 * Get authentication token from localStorage
 * Checks both 'authToken' and 'token' keys for compatibility
 * @returns JWT token or null if not found
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
}

/**
 * Handle authentication errors - clears token and redirects to login
 */
function handleAuthError(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
}

/**
 * Login and store token
 * @param email - User email
 * @param password - User password
 * @returns Auth response with user and tokens
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  data: {
    user: any;
    tokens: {
      access: string;
      refresh: string;
    };
  };
}> {
  console.log("[Login] Attempting login to:", `${API_BASE_URL}/api/v1/auth/login`);
  console.log("[Login] Email:", email);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("[Login] Response status:", response.status);
    console.log("[Login] Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Login] Error response:", errorText);
      let errorMessage = "Invalid credentials";
      try {
        const errorObj = JSON.parse(errorText);
        // Handle various backend error formats
        // Backend sends: { success: false, error: { code, message } }
        errorMessage = errorObj.error?.message || errorObj.message || errorObj.error || errorObj.msg || "Invalid credentials";
        // If the message is still an object, stringify it
        if (typeof errorMessage !== "string") {
          errorMessage = "Invalid credentials";
        }
      } catch {
        errorMessage = errorText || "Login failed";
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("[Login] Success response:", {
      success: result.success,
      hasTokens: !!result.data?.tokens,
      hasToken: !!result.data?.token
    });

    // Handle both token formats:
    // Format 1: { data: { tokens: { access, refresh } } }
    // Format 2: { data: { token, refreshToken } }
    if (result.success && result.data) {
      const accessToken = result.data.tokens?.access || result.data.token;
      const refreshToken = result.data.tokens?.refresh || result.data.refreshToken;

      if (accessToken) {
        localStorage.setItem("authToken", accessToken);
        console.log("[Login] Token stored in localStorage");
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      if (!accessToken) {
        console.warn("[Login] No access token found in response:", result);
      }
    } else {
      console.warn("[Login] No data in response:", result);
    }

    return result;
  } catch (error: any) {
    console.error("[Login] Exception:", error.message);
    throw error;
  }
}

/**
 * Create fetch options with authentication headers
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/overview`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch dashboard overview: ${response.statusText}`);
  }
  return response.json();
}

// Admin Settings types and functions
export interface WhatsAppWelcomeConfig {
  enabled: boolean;
  apiKey?: string;
  organizationSlug?: string;
  campaignName?: string;
  templateName?: string;
  apiBaseUrl?: string;
  sendMode?: 'immediate' | 'delay';
  delayMinutes?: number;
}

export interface AdminSettings {
  _id: string;
  userId: string;
  defaultTtsProvider: 'deepgram' | 'elevenlabs' | 'google';
  ttsProviders: any;
  whatsappWelcomeConfig?: WhatsAppWelcomeConfig;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const response = await fetch(`${API_BASE_URL}/api/v1/settings`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch settings' }));
    throw new Error(error.message || `Failed to fetch settings: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function updateAdminSettings(
  data: Partial<Pick<AdminSettings, 'defaultTtsProvider' | 'ttsProviders' | 'whatsappWelcomeConfig'>>
): Promise<AdminSettings> {
  const response = await fetch(`${API_BASE_URL}/api/v1/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to update settings' }));
    throw new Error(error.message || `Failed to update settings: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/system-status`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch system status: ${response.statusText}`);
  }
  return response.json();
}

export interface LiveCallResponse {
  id: string;
  phone: string;
  userName: string;
  campaignName: string;
  agentName: string;
  campaignId: string | null;
  durationSec: number;
  status: string;
  startedAt: string;
}

export interface LiveCallsResponse {
  success: boolean;
  data: LiveCallResponse[];
}

export async function fetchLiveCalls(): Promise<LiveCallsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/live-calls`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch live calls: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRecentCampaigns(limit: number = 10): Promise<RecentCampaign[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/recent-campaigns?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch recent campaigns: ${response.statusText}`);
  }
  const result: RecentCampaignsResponse = await response.json();
  return result.data;
}

export interface CampaignsListFilters {
  name?: string;
  userName?: string;
  date?: string;
  status?: string;
}

export async function fetchCampaignsList(
  page: number = 1,
  limit: number = 10,
  filters?: CampaignsListFilters
): Promise<CampaignsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.name) params.append('name', filters.name);
  if (filters?.userName && filters.userName !== 'all') params.append('userName', filters.userName);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/campaigns-list?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch campaigns list: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCampaignDetail(id: string): Promise<CampaignDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/campaign/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch campaign detail: ${response.statusText}`);
  }
  const result: CampaignDetailResponse = await response.json();
  return result.data;
}

// Call Logs types and functions
export interface CallLogListItem {
  id: string;
  sessionId: string;
  phone: string;
  campaignId: string | null;
  campaignName: string;
  direction: "inbound" | "outbound";
  callType: "Incoming" | "Outgoing";
  status: string;
  outcome: string;
  durationSec: number;
  credits: number;
  hasTranscript: boolean;
  hasRecording: boolean;
  failureReason?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface CallLogsListResponse {
  success: boolean;
  data: CallLogListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
  language?: string;
}

export interface CallLogDetail {
  id: string;
  sessionId: string;
  phone: string;
  fromPhone: string;
  toPhone: string;
  campaignId: string | null;
  campaignName: string;
  direction: "inbound" | "outbound";
  callType: "Incoming" | "Outgoing";
  status: string;
  outcome: string;
  durationSec: number;
  credits: number;
  transcript: TranscriptEntry[];
  recordingUrl: string | null;
  s3RecordingKey: string | null;
  summary: string | null;
  failureReason?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface CallLogDetailResponse {
  success: boolean;
  data: CallLogDetail;
}

export interface CallLogsFilters {
  search?: string;
  campaignName?: string;
  callType?: string;
  fromDate?: string;
  toDate?: string;
}

export async function fetchCallLogs(
  page: number = 1,
  limit: number = 50,
  filters?: CallLogsFilters
): Promise<CallLogsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.search) params.append('search', filters.search);
  if (filters?.campaignName && filters.campaignName !== 'all') params.append('campaignName', filters.campaignName);
  if (filters?.callType && filters.callType !== 'all') params.append('callType', filters.callType);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/call-logs?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch call logs: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCallLogDetail(id: string): Promise<CallLogDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/call-logs/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch call log detail: ${response.statusText}`);
  }
  const result: CallLogDetailResponse = await response.json();
  return result.data;
}

// Users types and functions
export interface BackendUser {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  role: 'user' | 'admin' | 'super_admin';
  credits: number;
  isActive: boolean;
  expiryDate?: string;
  phoneCount?: number;
  phoneNumbers?: string[]; // Array of phone numbers assigned to this user
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  success: boolean;
  data: {
    users: BackendUser[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Fetch users list from backend API
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 100)
 * @param search - Optional search query for name, email, or company
 * @param role - Optional role filter
 * @param plan - Optional plan filter
 * @param isActive - Optional active status filter
 * @returns Users list with pagination
 * @throws Error if request fails or if authentication is required but token is missing
 */
export async function fetchUsers(
  page: number = 1,
  limit: number = 100,
  search?: string,
  role?: string,
  plan?: string,
  isActive?: boolean
): Promise<UsersListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (role) params.append('role', role);
  if (plan) params.append('plan', plan);
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new user
 * @param userData - User data to create
 * @returns Created user and email status
 */
export async function createUserAPI(userData: {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  mobileNumber?: string;
  plan?: 'free' | 'basic' | 'professional' | 'enterprise';
  role?: 'user' | 'admin' | 'super_admin';
  credits?: number;
  isActive?: boolean;
  expiryDate?: string;
  sendWelcomeEmailFlag?: boolean;
  emailTemplate?: {
    subject: string;
    body: string;
  };
}): Promise<{ user: BackendUser; emailSent?: boolean; emailError?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create user' }));
    throw new Error(error.message || `Failed to create user: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data?.user) {
    return {
      user: result.data.user,
      emailSent: result.data.emailSent,
      emailError: result.data.emailError,
    };
  }
  throw new Error('Invalid response from server');
}

/**
 * Update an existing user
 * @param userId - User ID (MongoDB _id)
 * @param userData - User data to update
 * @returns Updated user
 */
export async function updateUserAPI(
  userId: string,
  userData: Partial<{
    name: string;
    email: string;
    password?: string;
    companyName?: string;
    plan?: 'free' | 'basic' | 'professional' | 'enterprise';
    role?: 'user' | 'admin' | 'super_admin';
    credits?: number;
    isActive?: boolean;
    expiryDate?: string;
  }>
): Promise<BackendUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
    throw new Error(error.message || `Failed to update user: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data?.user) {
    return result.data.user;
  }
  throw new Error('Invalid response from server');
}

/**
 * Delete a user
 * @param userId - User ID (MongoDB _id)
 */
export async function deleteUserAPI(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(error.message || `Failed to delete user: ${response.statusText}`);
  }
}

/**
 * Add credits to a user's account
 * @param userId - User ID (MongoDB _id)
 * @param amount - Amount of credits to add (must be positive)
 * @param reason - Reason for adding credits (e.g., "admin_grant", "purchase")
 * @returns Updated balance and transaction record
 */
export async function addCreditsAPI(
  userId: string,
  amount: number,
  reason?: string
): Promise<{ newBalance: number; transaction: BackendCreditTransaction }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/credits/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, reason: reason || 'admin_grant' }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to add credits' }));
    throw new Error(error.message || `Failed to add credits: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    return {
      newBalance: result.data.newBalance,
      transaction: result.data.transaction,
    };
  }
  throw new Error('Invalid response from server');
}

/**
 * Remove credits from a user's account
 * @param userId - User ID (MongoDB _id)
 * @param amount - Amount of credits to remove (must be positive)
 * @param reason - Reason for removing credits (e.g., "admin_removal", "refund")
 * @returns Updated balance and transaction record
 */
export async function removeCreditsAPI(
  userId: string,
  amount: number,
  reason?: string
): Promise<{ newBalance: number; transaction: BackendCreditTransaction }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/credits/remove`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount, reason: reason || 'admin_removal' }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to remove credits' }));
    throw new Error(error.message || `Failed to remove credits: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    return {
      newBalance: result.data.newBalance,
      transaction: result.data.transaction,
    };
  }
  throw new Error('Invalid response from server');
}

// Credit History types and functions
export interface BackendCreditTransaction {
  _id: string;
  userId: string | {
    _id: string;
    name: string;
    email: string;
  };
  amount: number; // Negative for deduction, positive for addition
  balance: number; // User's credit balance after this transaction
  type: 'deduction' | 'addition' | 'refund';
  reason: string;
  callLogId?: any;
  campaignId?: string | {
    _id: string;
    name: string;
  };
  adminId?: string | {
    _id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransactionsResponse {
  success: boolean;
  data: {
    transactions: BackendCreditTransaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Fetch all credit transactions across all users
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 100)
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param userId - Optional user ID filter
 * @returns Credit transactions with pagination
 */
export async function fetchCreditTransactions(
  page: number = 1,
  limit: number = 100,
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<CreditTransactionsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: ((page - 1) * limit).toString(),
  });

  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (userId) params.append('userId', userId);

  const response = await fetch(`${API_BASE_URL}/api/v1/users/credits/transactions/all?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch credit transactions: ${response.statusText}`);
  }

  return response.json();
}

// Agent types and functions
export interface AgentConfig {
  prompt: string;
  persona?: string;
  greetingMessage: string;
  endCallPhrases?: string[];
  inboundConfig?: {
    greetingMessage?: string;
    prompt?: string;
    persona?: string;
  };
  outboundConfig?: {
    greetingMessage?: string;
    prompt?: string;
    persona?: string;
  };
  voice?: {
    provider: 'elevenlabs' | 'deepgram' | 'sarvam' | 'google';
    voiceId: string;
    model?: string;
    settings?: Record<string, any>;
  };
  language?: string;
  enableAutoLanguageDetection?: boolean;
  sttProvider?: 'deepgram' | 'sarvam' | 'azure';
  llm?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  transferSettings?: {
    enabled: boolean;
    humanAgentNumber: string;
    detectionKeywords: string[];
    confirmationQuestion: string;
    confirmationKeywords: string[];
    negativeKeywords: string[];
    confirmationMessage: string;
    failureMessage?: string;
    confirmationTimeoutMs?: number;
    ringTimeoutSeconds?: number;
    fallbackBehavior?: 'continue' | 'hangup' | 'voicemail';
  };
  voicemailDetection?: {
    enabled: boolean;
    keywords?: string[];
  };
  leadKeywords?: string[];  // Keywords to identify leads from call transcripts
  followUpKeywords?: string[];  // Keywords to identify calls requiring follow-up
}

export interface BackendAgent {
  id: string;
  name: string;
  description: string;
  gender?: 'male' | 'female';
  role: string;
  virtualNumber: string;
  userName: string;
  userId: string;
  successRate: number;
  totalCalls: number;
  totalDurationSec: number;
  isActive: boolean;
  useDirectionSpecificKnowledgeBase?: boolean;
  config: AgentConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentsListResponse {
  success: boolean;
  data: BackendAgent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AgentDetailResponse {
  success: boolean;
  data: BackendAgent;
}

/**
 * Fetch agents list from dashboard API
 */
export async function fetchAgents(page: number = 1, limit: number = 100): Promise<AgentsListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/agents?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
    cache: 'no-store', // Disable caching to always fetch fresh data
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch single agent detail
 */
export async function fetchAgentDetail(id: string): Promise<BackendAgent> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/agents/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch agent detail: ${response.statusText}`);
  }

  const result: AgentDetailResponse = await response.json();
  return result.data;
}

/**
 * Create a new agent via dashboard API
 */
export async function createAgentAPI(agentData: {
  name: string;
  description?: string;
  gender?: 'male' | 'female';
  config: {
    prompt: string;
    greetingMessage: string;
    voice: {
      provider: 'elevenlabs' | 'cartesia' | 'deepgram' | 'sarvam' | 'google';
      voiceId: string;
    };
    language: string;
    llm: {
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
    endCallPhrases?: string[];
    sttProvider?: string;
    enableAutoLanguageDetection?: boolean;
    inboundConfig?: {
      greetingMessage?: string;
      prompt?: string;
    };
    outboundConfig?: {
      greetingMessage?: string;
      prompt?: string;
    };
  };
}): Promise<BackendAgent> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/agents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to create agent' }));
    throw new Error(error.message || error.error || `Failed to create agent: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    const agent = result.data;
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      gender: agent.gender,
      role: agent.description?.split(' ')[0] || 'Custom',
      virtualNumber: '',
      userName: '',
      userId: '',
      successRate: 0,
      totalCalls: 0,
      totalDurationSec: 0,
      isActive: agent.isActive,
      config: agent.config,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
  throw new Error('Invalid response from server');
}

/**
 * Update an existing agent via dashboard API
 */
export async function updateAgentAPI(
  agentId: string,
  agentData: Partial<{
    name: string;
    description: string;
    gender: 'male' | 'female';
    config: Partial<AgentConfig>;
  }>
): Promise<BackendAgent> {
  // DEBUG: Log what we're sending to the server
  console.log('========== UPDATE AGENT API CALL ==========');
  console.log('Agent ID:', agentId);
  console.log('Agent Data:', JSON.stringify(agentData, null, 2));
  console.log('Gender being sent:', agentData.gender);
  console.log('URL:', `${API_BASE_URL}/api/v1/dashboard/agents/${agentId}`);
  console.log('============================================');

  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/agents/${agentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to update agent' }));
    throw new Error(error.message || error.error || `Failed to update agent: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    const agent = result.data;
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || '',
      gender: agent.gender,
      role: agent.description?.split(' ')[0] || 'Custom',
      virtualNumber: '',
      userName: '',
      userId: '',
      successRate: 0,
      totalCalls: 0,
      totalDurationSec: 0,
      isActive: agent.isActive,
      config: agent.config,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
  throw new Error('Invalid response from server');
}

/**
 * Delete an agent via dashboard API
 */
export async function deleteAgentAPI(agentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/agents/${agentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to delete agent' }));
    throw new Error(error.message || error.error || `Failed to delete agent: ${response.statusText}`);
  }
}

// Voice types and functions
export interface VoiceOption {
  id: string;
  provider: 'elevenlabs' | 'deepgram' | 'sarvam' | 'google';
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  description?: string;
}

export interface VoicesListResponse {
  success: boolean;
  data: VoiceOption[];
}

/**
 * Fetch available voices, optionally filtered by provider
 */
export async function fetchVoices(provider?: string): Promise<VoiceOption[]> {
  const params = new URLSearchParams();
  if (provider) {
    params.append('provider', provider);
  }

  const url = `${API_BASE_URL}/api/v1/dashboard/voices${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  const result: VoicesListResponse = await response.json();
  return result.data;
}

// Knowledge Base types and functions
export interface KnowledgeBaseDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileSize: number;
  status: 'processing' | 'ready' | 'failed';
  callDirection: 'inbound' | 'outbound' | 'both';
  totalChunks: number;
  totalTokens: number;
  totalCharacters: number;
  uploadedAt: string;
  processedAt?: string;
  error?: string;
}

export interface KnowledgeBaseListResponse {
  success: boolean;
  data: {
    documents: KnowledgeBaseDocument[];
    stats: {
      totalDocuments: number;
      totalChunks: number;
      readyCount: number;
      processingCount: number;
      failedCount: number;
    };
  };
}

/**
 * Upload a knowledge base document for an agent
 */
export async function uploadKnowledgeBaseDocument(
  agentId: string,
  file: File,
  callDirection: 'inbound' | 'outbound' | 'both' = 'both'
): Promise<{ documentId: string; fileName: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agentId', agentId);
  formData.append('callDirection', callDirection);

  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-base/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to upload document' }));
    throw new Error(error.message || error.error || `Failed to upload document: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * List knowledge base documents for an agent
 */
export async function listKnowledgeBaseDocuments(agentId: string): Promise<KnowledgeBaseListResponse['data']> {
  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-base/${agentId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch knowledge base documents: ${response.statusText}`);
  }

  const result: KnowledgeBaseListResponse = await response.json();
  return result.data;
}

/**
 * Delete a knowledge base document
 */
export async function deleteKnowledgeBaseDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-base/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to delete document' }));
    throw new Error(error.message || error.error || `Failed to delete document: ${response.statusText}`);
  }
}

// Phone and Call types and functions
export interface Phone {
  _id: string;
  number: string;
  country?: string;
  provider?: string;
  userId?: string | { _id: string; name: string; email?: string };
  agentId?: string | { _id: string; name: string };
  tags?: string[];
  status?: 'active' | 'inactive';
  isActive?: boolean;
  concurrentLimit?: number;  // DEPRECATED - kept for backward compatibility
  inboundConcurrentLimit?: number;  // Maximum concurrent incoming calls
  outboundConcurrentLimit?: number;  // Maximum concurrent outgoing calls
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportPhoneRequest {
  number: string;
  country: string;
  exotelConfig: {
    apiKey: string;
    apiToken: string;
    sid: string;
    subdomain: string;
    appId?: string;
  };
  tags?: string[];
}

export interface PhoneListResponse {
  success: boolean;
  data: Phone[] | {
    phones: Phone[];
    total: number;
    page: number;
    totalPages: number;
  };
}

/**
 * Get all phone numbers, optionally filtered by agentId
 */
export async function fetchPhones(agentId?: string): Promise<Phone[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/phones`);
  if (agentId) {
    url.searchParams.append('agentId', agentId);
  }
  // Set a high limit to get all phones for the agent
  url.searchParams.append('limit', '100');

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch phones: ${response.statusText}`);
  }

  const result: PhoneListResponse = await response.json();
  // Ensure we always return an array
  if (result.success && result.data) {
    // Handle both direct array and paginated response
    if (Array.isArray(result.data)) {
      return result.data;
    } else if (result.data.phones && Array.isArray(result.data.phones)) {
      return result.data.phones;
    }
  }
  return [];
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<{ _id: string; email: string; name: string; role: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to get current user: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.user || result.data;
}

/**
 * Initiate an outbound test call
 */
export async function initiateOutboundCall(data: {
  phoneNumber: string;
  phoneId: string;
  agentId: string;
  userId?: string;
  metadata?: any;
}): Promise<{ success: boolean; callLogId: string; message: string }> {
  // If userId not provided, get it from current user
  let userId = data.userId;
  if (!userId) {
    try {
      const user = await getCurrentUser();
      userId = user._id;
    } catch (err) {
      throw new Error('Failed to get user ID. Please try again.');
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/calls/outbound`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      userId
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    
    // Try to extract error message from response
    let errorMessage = `Failed to initiate call: ${response.statusText}`;
    try {
      const errorData = await response.json();
      // Handle different error response formats
      errorMessage = errorData.error?.message
        || errorData.data?.error?.message
        || errorData.message
        || errorData.error
        || (typeof errorData === 'string' ? errorData : errorMessage);
    } catch {
      // If JSON parsing fails, use default message
    }
    
    // Ensure we always throw a string, not an object
    const finalMessage = typeof errorMessage === 'string' ? errorMessage : `Failed to initiate call: ${response.statusText}`;
    throw new Error(finalMessage);
  }

  const result = await response.json();
  return {
    success: result.success,
    callLogId: result.data?.callLogId || result.data?.callLog?._id || '',
    message: result.message || result.data?.message || 'Call initiated successfully'
  };
}

// Phone Management API functions
/**
 * Import a new phone number
 */
export async function importPhoneAPI(data: ImportPhoneRequest): Promise<Phone> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to import phone number' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to import phone number: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.phone || result.data;
}

/**
 * Assign agent to phone
 */
export async function assignAgentToPhoneAPI(phoneId: string, agentId: string): Promise<Phone> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}/assign`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ agentId }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to assign agent' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to assign agent: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.phone || result.data;
}

/**
 * Unassign agent from phone
 */
export async function unassignAgentFromPhoneAPI(phoneId: string): Promise<Phone> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}/assign`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to unassign agent' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to unassign agent: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.phone || result.data;
}

/**
 * Delete phone number
 */
export async function deletePhoneAPI(phoneId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to delete phone number' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to delete phone number: ${response.statusText}`);
  }
}

/**
 * Get available phones (not assigned to any user)
 */
export async function getAvailablePhones(): Promise<Phone[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/available?limit=100`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to fetch available phones: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    if (Array.isArray(result.data)) {
      return result.data;
    } else if (result.data.phones && Array.isArray(result.data.phones)) {
      return result.data.phones;
    }
  }
  return [];
}

/**
 * Assign phone to user
 */
export async function assignPhoneToUserAPI(phoneId: string, userId: string): Promise<Phone> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}/assign-user`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to assign phone to user' }));
    const errorMessage = error.message || error.error || error.data?.message || `Failed to assign phone to user: ${response.statusText}`;
    
    // Check if phone is already assigned (409 Conflict or error message contains "already assigned")
    if (response.status === 409 || errorMessage.toLowerCase().includes('already assigned') || errorMessage.toLowerCase().includes('assigned to another')) {
      throw new Error('This phone number is already assigned to another user or agent');
    }
    
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data?.phone || result.data;
}

/**
 * Unassign phone from user
 */
export async function unassignPhoneFromUserAPI(phoneId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}/assign-user`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to unassign phone from user' }));
    const errorMessage = error.message || error.error || error.data?.message || `Failed to unassign phone from user: ${response.statusText}`;
    throw new Error(errorMessage);
  }
}

// User Permissions types and functions
export interface UserPermissions {
  dashboard: boolean;
  leads: boolean;
  campaigns: boolean;
  scheduledCalls: boolean;
  appointmentBooking: boolean;
  callLogs: boolean;
  callRecording: boolean;
  chatSummary: boolean;
  liveStatus: boolean;
  analytics: boolean;
  deliveryReports: boolean;
  creditHistory: boolean;
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  dashboard: true,
  leads: true,
  campaigns: true,
  scheduledCalls: true,
  appointmentBooking: true,
  callLogs: true,
  callRecording: true,
  chatSummary: true,
  liveStatus: true,
  analytics: true,
  deliveryReports: true,
  creditHistory: true,
};

/**
 * Get user permissions
 * @param userId - User ID (MongoDB _id)
 * @returns User permissions object
 */
export async function getUserPermissionsAPI(userId: string): Promise<{
  userId: string;
  name: string;
  email: string;
  permissions: UserPermissions;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/permissions`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch user permissions' }));
    throw new Error(error.message || `Failed to fetch user permissions: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error('Invalid response from server');
}

/**
 * Update user permissions
 * @param userId - User ID (MongoDB _id)
 * @param permissions - Permissions object to update
 * @returns Updated permissions
 */
export async function updateUserPermissionsAPI(
  userId: string,
  permissions: Partial<UserPermissions>
): Promise<{ userId: string; permissions: UserPermissions }> {
  console.log('[API] Updating permissions for user:', userId);
  console.log('[API] Request body:', JSON.stringify({ permissions }, null, 2));
  console.log('[API] URL:', `${API_BASE_URL}/api/v1/users/${userId}/permissions`);

  const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/permissions`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissions }),
  });

  console.log('[API] Response status:', response.status);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to update user permissions' }));
    console.error('[API] Error response:', error);
    throw new Error(error.message || `Failed to update user permissions: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('[API] Success response:', result);
  
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error('Invalid response from server');
}

/**
 * Update phone concurrent limit
 */
export async function updatePhoneConcurrentLimitAPI(
  phoneId: string,
  limits: {
    concurrentLimit?: number;
    inboundConcurrentLimit?: number;
    outboundConcurrentLimit?: number;
  }
): Promise<Phone> {
  const response = await fetch(`${API_BASE_URL}/api/v1/phones/${phoneId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(limits),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to update concurrent limit' }));
    const errorMessage = error.message || error.error || error.data?.message || `Failed to update concurrent limit: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.data?.phone || result.data || result;
}

// Recording API functions
/**
 * Get presigned URL for call recording from S3
 */
export async function getRecordingPresignedUrl(callId: string): Promise<{
  url: string;
  expiresIn: number;
  s3Key: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/exotel/calls/${callId}/recording/url`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to get recording URL' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to get recording URL: ${response.statusText}`);
  }

  const result = await response.json();
  const data = result.data;
  
  // Validate that we're not getting an Exotel URL from the backend
  if (data?.url && data.url.includes('recordings.exotel.com')) {
    console.error("ERROR: Backend returned Exotel URL instead of S3 URL:", data.url);
    throw new Error("Backend returned Exotel URL. Expected S3 presigned URL.");
  }
  
  return data;
}

/**
 * Get download URL for call recording (fallback if S3 not available)
 */
export function getRecordingDownloadUrl(callId: string): string {
  return `${API_BASE_URL}/api/v1/exotel/calls/${callId}/recording/download`;
}

/**
 * Fetch recording for a call (triggers fetch from Exotel)
 */
export async function fetchRecording(callId: string): Promise<{ recordingUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/exotel/calls/${callId}/recording/fetch`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch recording' }));
    throw new Error(error.message || error.error || error.data?.message || `Failed to fetch recording: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Download recording as blob
 */
export async function downloadRecording(callId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/exotel/calls/${callId}/recording/download`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    throw new Error(`Failed to download recording: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Appointment Booking API functions
 */

export interface DefaultKeywordGroup {
  language: string;
  label: string;
  keywords: string[];
}

export interface AppointmentBookingSettings {
  enabled: boolean;
  detectionKeywords: string[];
  defaultKeywords?: DefaultKeywordGroup[];
  questions: {
    nameQuestion: string;
    dateQuestion: string;
    timeQuestion: string;
    reasonQuestion: string;
    confirmationQuestion: string;
  };
  successMessage: string;
  slots: {
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    workingDays: number[];
  };
}

/**
 * Get appointment booking settings for an agent
 */
export async function getAppointmentSettings(agentId: string): Promise<AppointmentBookingSettings> {
  const response = await fetch(`${API_BASE_URL}/api/v1/appointments/settings/${agentId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to fetch appointment settings' }));
    throw new Error(error.message || error.error || `Failed to fetch appointment settings: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error('Invalid response format');
}

/**
 * Update appointment booking settings for an agent
 */
export async function updateAppointmentSettings(agentId: string, settings: AppointmentBookingSettings): Promise<void> {
  console.log('📤 UPDATE APPOINTMENT SETTINGS API CALL', {
    agentId,
    url: `${API_BASE_URL}/api/v1/appointments/settings/${agentId}`,
    settings
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/appointments/settings/${agentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  console.log('📥 UPDATE APPOINTMENT SETTINGS RESPONSE', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      throw new Error('Authentication required');
    }
    const error = await response.json().catch(() => ({ message: 'Failed to update appointment settings' }));
    console.error('❌ UPDATE APPOINTMENT SETTINGS ERROR', error);
    throw new Error(error.message || error.error || `Failed to update appointment settings: ${response.statusText}`);
  }

  const result = await response.json().catch(() => null);
  console.log('✅ UPDATE APPOINTMENT SETTINGS SUCCESS', result);
}