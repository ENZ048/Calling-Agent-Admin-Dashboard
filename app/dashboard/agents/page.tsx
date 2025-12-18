"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  Phone,
  Sparkles,
  Info,
  User,
  PhoneForwarded,
  Bot,
  Settings,
  BookOpen,
  X,
  Loader2,
  Play,
  Pause,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  Mail,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/config";
import {
  fetchAgents,
  createAgentAPI,
  updateAgentAPI,
  deleteAgentAPI,
  fetchVoices,
  BackendAgent,
  VoiceOption,
  uploadKnowledgeBaseDocument,
  listKnowledgeBaseDocuments,
  deleteKnowledgeBaseDocument,
  fetchPhones,
  initiateOutboundCall,
  KnowledgeBaseDocument,
  Phone as PhoneType,
  getAppointmentSettings,
  updateAppointmentSettings,
} from "@/lib/api";

// Default voicemail keywords (matching backend defaults)
const DEFAULT_VOICEMAIL_KEYWORDS = [
  // Standard voicemail greetings
  'voicemail', 'leave a message', 'after the beep', 'after the tone', 'not available',
  'cannot take your call', 'please leave', 'mailbox', 'press pound', 'press hash', 'recording', 'beep',

  // User not answering / unavailable
  'not answering', 'unable to answer', 'unable to take', 'not able to answer',
  'unable to come to the phone', 'away from the phone', 'step away', 'not here right now', 'not in right now',

  // User busy on another call
  'busy', 'on another call', 'on the other line', 'another line', 'currently on a call',
  'currently busy', 'engaged', 'line is busy', 'subscriber is busy', 'subscriber busy',

  // Call declined / rejected
  'call has been declined', 'declined your call', 'rejected', 'not accepting calls', 'do not wish to talk',

  // Network/carrier messages
  'subscriber cannot be reached', 'cannot be reached', 'unreachable', 'out of coverage',
  'switched off', 'turned off', 'not reachable', 'temporarily unavailable',
  'the person you are calling', 'the number you are calling', 'the number you have dialed',
  'customer you have called', 'customer is not available',

  // Auto-response messages
  'please try again later', 'call back later', 'try your call again',

  // Indian Regional Languages - Hindi (Devanagari & Romanized)
  'ग्राहक उपलब्ध नहीं', 'उपलब्ध नहीं', 'व्यस्त', 'फोन बंद', 'स्विच ऑफ', 'कवरेज', 'संदेश छोड़ें', 'बाद में कॉल करें',
  'graahak uplabdh nahin', 'uplabdh nahin', 'vyast', 'phone band', 'switch off', 'sandesh chhodein',

  // Tamil
  'சந்தாதாரர்', 'கிடைக்கவில்லை', 'வசதி இல்லை', 'பணியில்', 'அழைப்பு நிராகரிக்கப்பட்டது',
  'தொலைபேசி அணைக்கப்பட்டுள்ளது', 'செய்தி விடவும்', 'பிறகு அழைக்கவும்',
  'santhaatharar', 'kidaikkavillai', 'tholaipesi anaikkappatullathu',

  // Telugu
  'చందాదారు', 'అందుబాటులో లేదు', 'బిజీ', 'నిరాకరించబడింది', 'ఫోన్ స్విచ్ ఆఫ్',
  'సందేశం పంపండి', 'తర్వాత కాల్ చేయండి', 'chandaadaaru', 'andubaatulo ledu', 'phone switch off',

  // Kannada
  'ಚಂದಾದಾರ', 'ಲಭ್ಯವಿಲ್ಲ', 'ಕಾರ್ಯನಿರತ', 'ಫೋನ್ ಸ್ವಿಚ್ ಆಫ್', 'ಸಂದೇಶ ಬಿಡಿ',
  'ನಂತರ ಕರೆ ಮಾಡಿ', 'chandaadaara', 'labhyavilla',

  // Malayalam
  'വരിക്കാരൻ', 'ലഭ്യമല്ല', 'തിരക്കിലാണ്', 'ഫോൺ സ്വിച്ച് ഓഫ്', 'സന്ദേശം അയയ്ക്കുക',
  'പിന്നീട് വിളിക്കുക', 'varikkaaran', 'labhyamalla',

  // Marathi
  'ग्राहक', 'उपलब्ध नाही', 'व्यस्त आहे', 'फोन बंद आहे', 'संदेश द्या', 'नंतर कॉल करा',
  'graahak', 'uplabdh naahi',

  // Bengali
  'গ্রাহক', 'উপলব্ধ নয়', 'ব্যস্ত', 'ফোন বন্ধ', 'বার্তা রাখুন', 'পরে কল করুন',
  'graahak', 'uplabdh noy',

  // Gujarati
  'ગ્રાહક', 'ઉપલબ્ધ નથી', 'વ્યસ્ત', 'ફોન બંધ', 'સંદેશ મૂકો', 'પછી કૉલ કરો',
  'graahak', 'uplabdh nathi',

  // Punjabi
  'ਗ੍ਰਾਹਕ', 'ਉਪਲਬਧ ਨਹੀਂ', 'ਰੁਝੇਵਿਆਂ', 'ਫੋਨ ਬੰਦ', 'ਸੁਨੇਹਾ ਛੱਡੋ', 'ਬਾਅਦ ਵਿੱਚ ਕਾਲ ਕਰੋ',
  'graahak', 'uplabadh nahin',

  // Common Hinglish/Mix phrases used by Indian carriers
  'aap dwara call kiya gaya', 'mobile band hai', 'mobile switch off hai',
  'coverage area ke bahar', 'network area ke bahar', 'sampark nahin ho sakta',
  'message chhod sakte hain', 'baad mein call karein', 'abhi call nahin utha sakte',
  'kripaya baad mein call karein'
];

export default function AgentsPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<BackendAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "update">("update");
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formPersona, setFormPersona] = useState("");
  const [formGreeting, setFormGreeting] = useState("");
  const [formEndCallPhrases, setFormEndCallPhrases] = useState("");
  const [formLeadKeywords, setFormLeadKeywords] = useState("");
  const [formFollowUpKeywords, setFormFollowUpKeywords] = useState("");
  const [formSelectedLanguages, setFormSelectedLanguages] = useState<string[]>(["en"]);
  const [formSttProvider, setFormSttProvider] = useState("deepgram");
  const [formLlmModel, setFormLlmModel] = useState("gpt-4o-mini");
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formMaxTokens, setFormMaxTokens] = useState(300);
  const [formVoiceProvider, setFormVoiceProvider] = useState("deepgram");
  const [formVoiceId, setFormVoiceId] = useState("aura-asteria-en");
  const [formGender, setFormGender] = useState<"male" | "female">("female");
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [formInboundGreeting, setFormInboundGreeting] = useState("");
  const [formInboundPrompt, setFormInboundPrompt] = useState("");
  const [formOutboundGreeting, setFormOutboundGreeting] = useState("");
  const [formOutboundPrompt, setFormOutboundPrompt] = useState("");

  // Call Transfer settings
  const [formTransferEnabled, setFormTransferEnabled] = useState(false);
  const [formHumanAgentNumber, setFormHumanAgentNumber] = useState("");
  const [formDetectionKeywords, setFormDetectionKeywords] = useState("human agent, real person, speak to someone, transfer me");
  const [formConfirmationQuestion, setFormConfirmationQuestion] = useState("Would you like me to transfer you to a human agent?");
  const [formConfirmationKeywords, setFormConfirmationKeywords] = useState("yes, sure, okay, please, yeah, yep");
  const [formNegativeKeywords, setFormNegativeKeywords] = useState("no, not now, cancel, never mind, nope");
  const [formConfirmationMessage, setFormConfirmationMessage] = useState("Transferring you now. Please hold.");
  const [formFailureMessage, setFormFailureMessage] = useState("I'm sorry, I couldn't connect you to an agent. Please try again later.");
  const [formConfirmationTimeout, setFormConfirmationTimeout] = useState(15);
  const [formRingTimeout, setFormRingTimeout] = useState(30);
  const [formFallbackBehavior, setFormFallbackBehavior] = useState<"continue" | "hangup" | "voicemail">("continue");

  // Email to Caller settings
  const [formEmailEnabled, setFormEmailEnabled] = useState(false);
  const [formEmailDetectionKeywords, setFormEmailDetectionKeywords] = useState("email me, send email, mail me, email, send me an email");
  const [formEmailConfirmationQuestion, setFormEmailConfirmationQuestion] = useState("What's your email address?");
  const [formEmailRequireConfirmation, setFormEmailRequireConfirmation] = useState(true);
  const [formEmailTemplates, setFormEmailTemplates] = useState<{
    id: string;
    name: string;
    isDefault: boolean;
    subject: string;
    body: string;
    senderName: string;
    successMessage: string;
    failureMessage: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    keywords: string;
  }[]>([{
    id: "default",
    name: "Default Email Template",
    isDefault: true,
    subject: "Information from {{agentName}}",
    body: "Hello {{callerName}},\n\nThank you for your call. Here is the information we discussed:\n\n{{callSummary}}\n\nBest regards",
    senderName: "AI Assistant",
    successMessage: "Email sent! Check your inbox.",
    failureMessage: "I'm sorry, I couldn't send the email.",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    keywords: "",
  }]);

  // WhatsApp Proposal Integration settings
  const [formWhatsAppEnabled, setFormWhatsAppEnabled] = useState(false);
  const [formWhatsAppTriggerKeywords, setFormWhatsAppTriggerKeywords] = useState("proposal, send proposal, send me proposal, send details, share details");
  const [formWhatsAppAutoSend, setFormWhatsAppAutoSend] = useState(true);
  const [formWhatsAppTemplates, setFormWhatsAppTemplates] = useState<{
    id: string;
    name: string;
    isDefault: boolean;
    templateName: string;
    templateLanguage: string;
    apiKey: string;
    partnerNumber: string;
    baseUrl: string;
    campaignName: string;
    keywords: string;
  }[]>([{
    id: "default",
    name: "Default WhatsApp Template",
    isDefault: true,
    templateName: "proposal_template",
    templateLanguage: "English",
    apiKey: "",
    partnerNumber: "919529945588",
    baseUrl: "https://backend.api-wa.co",
    campaignName: "client-campaign-name",
    keywords: "",
  }]);

  // Voicemail Detection settings
  const [formVoicemailEnabled, setFormVoicemailEnabled] = useState(true);
  const [formVoicemailKeywords, setFormVoicemailKeywords] = useState("");
  const [showDefaultKeywords, setShowDefaultKeywords] = useState(false);

  // Appointment Booking settings
  const [formAppointmentEnabled, setFormAppointmentEnabled] = useState(false);
  const [formAppointmentKeywords, setFormAppointmentKeywords] = useState<string[]>([]);
  const [formAppointmentNewKeyword, setFormAppointmentNewKeyword] = useState("");
  const [formAppointmentDefaultKeywords, setFormAppointmentDefaultKeywords] = useState<{ language: string; label: string; keywords: string[] }[]>([]);
  const [formAppointmentNameQuestion, setFormAppointmentNameQuestion] = useState("What's your name?");
  const [formAppointmentDateQuestion, setFormAppointmentDateQuestion] = useState("What date would you like to schedule the appointment?");
  const [formAppointmentTimeQuestion, setFormAppointmentTimeQuestion] = useState("What time works for you?");
  const [formAppointmentReasonQuestion, setFormAppointmentReasonQuestion] = useState("What is the reason for this appointment?");
  const [formAppointmentConfirmationQuestion, setFormAppointmentConfirmationQuestion] = useState("I've booked your appointment for [date] at [time]. Is this correct?");
  const [formAppointmentSuccessMessage, setFormAppointmentSuccessMessage] = useState("Great! Your appointment is confirmed for [date] at [time]. We'll see you then!");
  const [formAppointmentStartTime, setFormAppointmentStartTime] = useState("09:00");
  const [formAppointmentEndTime, setFormAppointmentEndTime] = useState("17:00");
  const [formAppointmentSlotDuration, setFormAppointmentSlotDuration] = useState(30);
  const [formAppointmentWorkingDays, setFormAppointmentWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loadingAppointmentSettings, setLoadingAppointmentSettings] = useState(false);
  const [savingAppointmentSettings, setSavingAppointmentSettings] = useState(false);

  // Knowledge Base state
  const [kbDocuments, setKbDocuments] = useState<any[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [useDirectionSpecificKB, setUseDirectionSpecificKB] = useState(false);

  // Test Call state
  const [phones, setPhones] = useState<PhoneType[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [callPhoneNumber, setCallPhoneNumber] = useState("");
  const [initiatingCall, setInitiatingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [step, setStep] = useState<
    "basic" | "persona" | "directions" | "voice" | "knowledge" | "settings" | "appointment" | "test"
  >("basic");

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Auto-refresh knowledge base when there are processing documents
  useEffect(() => {
    if (!selectedId) return;

    const hasProcessingDocs = kbDocuments.some(doc => doc.status === 'processing');

    if (hasProcessingDocs) {
      const interval = setInterval(() => {
        loadKnowledgeBase(selectedId);
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [selectedId, kbDocuments]);

  // Load voices when provider changes
  useEffect(() => {
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const voices = await fetchVoices(formVoiceProvider);
        setAvailableVoices(voices);
        // Auto-select first voice if current selection is not in the new list
        if (voices.length > 0 && !voices.find(v => v.id === formVoiceId)) {
          setFormVoiceId(voices[0].id);
        }
      } catch (err) {
        console.error("Failed to load voices:", err);
        setAvailableVoices([]);
      } finally {
        setLoadingVoices(false);
      }
    };
    loadVoices();
  }, [formVoiceProvider]);

  // Stop audio when modal closes or provider changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
    };
  }, [isOpen, formVoiceProvider]);

  // Play/pause voice preview
  const handlePlayVoice = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation(); // Prevent selecting the voice when clicking play

    // If already playing this voice, stop it
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Set loading state
    setLoadingVoiceId(voice.id);

    // For now, we'll use a simple TTS preview approach
    // Different providers have different preview URLs
    let previewUrl: string | null = null;

    // Sample text for preview
    const sampleText = "Hello! This is a sample of my voice. How can I help you today?";

    try {
      // Generate preview audio via backend API
      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/voices/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          voiceId: voice.id,
          provider: voice.provider,
          text: sampleText,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        previewUrl = URL.createObjectURL(blob);
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        toast.warning(errorData.error || errorData.message || "Voice preview not available");
        setLoadingVoiceId(null);
        return;
      }
    } catch (err) {
      console.error("Failed to generate voice preview:", err);
      toast.warning("Voice preview not available");
      setLoadingVoiceId(null);
      return;
    }

    // Clear loading state
    setLoadingVoiceId(null);

    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      setPlayingVoiceId(voice.id);

      audio.onended = () => {
        setPlayingVoiceId(null);
        URL.revokeObjectURL(previewUrl!);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        toast.warning("Failed to play voice preview");
      };

      audio.play().catch(() => {
        setPlayingVoiceId(null);
        toast.warning("Failed to play voice preview");
      });
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAgents(1, 100);
      setAgents(result.data);
      if (result.data.length > 0 && !selectedId) {
        setSelectedId(result.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPrompt("You are a helpful AI assistant.\n\nYour role:\n- Assist callers with their inquiries\n- Be professional and friendly\n- Provide accurate information");
    setFormPersona("");
    setFormGreeting("Hello! How can I help you today?");
    setFormEndCallPhrases("goodbye, bye, end call, thank you goodbye, talk to you later");
    setFormSelectedLanguages(["en"]);
    setFormSttProvider("deepgram");
    setFormLlmModel("gpt-4o-mini");
    setFormTemperature(0.7);
    setFormMaxTokens(300);
    setFormVoiceProvider("deepgram");
    setFormVoiceId("aura-asteria-en");
    setFormGender("female");
    setFormInboundGreeting("");
    setFormInboundPrompt("");
    setFormOutboundGreeting("");
    setFormOutboundPrompt("");
    // Reset transfer settings
    setFormTransferEnabled(false);
    setFormHumanAgentNumber("");
    setFormDetectionKeywords("human agent, real person, speak to someone, transfer me");
    setFormConfirmationQuestion("Would you like me to transfer you to a human agent?");
    setFormConfirmationKeywords("yes, sure, okay, please, yeah, yep");
    setFormNegativeKeywords("no, not now, cancel, never mind, nope");
    setFormConfirmationMessage("Transferring you now. Please hold.");
    setFormFailureMessage("I'm sorry, I couldn't connect you to an agent. Please try again later.");
    setFormConfirmationTimeout(15);
    setFormRingTimeout(30);
    setFormFallbackBehavior("continue");
    // Reset email settings
    setFormEmailEnabled(false);
    setFormEmailDetectionKeywords("email me, send email, mail me, email, send me an email");
    setFormEmailConfirmationQuestion("What's your email address?");
    setFormEmailRequireConfirmation(true);
    setFormEmailTemplates([{
      id: "default",
      name: "Default Email Template",
      isDefault: true,
      subject: "Information from {{agentName}}",
      body: "Hello {{callerName}},\n\nThank you for your call. Here is the information we discussed:\n\n{{callSummary}}\n\nBest regards",
      senderName: "AI Assistant",
      successMessage: "Email sent! Check your inbox.",
      failureMessage: "I'm sorry, I couldn't send the email.",
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      smtpUser: "",
      smtpPassword: "",
      keywords: "",
    }]);
    // Reset WhatsApp settings
    setFormWhatsAppEnabled(false);
    setFormWhatsAppTriggerKeywords("proposal, send proposal, send me proposal, send details, share details");
    setFormWhatsAppAutoSend(true);
    setFormWhatsAppTemplates([{
      id: "default",
      name: "Default WhatsApp Template",
      isDefault: true,
      templateName: "proposal_template",
      templateLanguage: "English",
      apiKey: "",
      partnerNumber: "919529945588",
      baseUrl: "https://backend.api-wa.co",
      campaignName: "client-campaign-name",
      keywords: "",
    }]);
    // Reset voicemail detection settings
    setFormVoicemailEnabled(true);
    setFormVoicemailKeywords("");
  };

  const loadAgentToForm = (agent: BackendAgent) => {
    const config = agent.config as any;
    console.log("========== LOADING AGENT TO FORM ==========");
    console.log("Agent:", agent);
    console.log("Agent Config:", config);
    console.log("Config keys:", Object.keys(config || {}));
    console.log("Config JSON:", JSON.stringify(config, null, 2));
    console.log("Lead Keywords:", config?.leadKeywords);
    console.log("Follow-Up Keywords:", config?.followUpKeywords);
    console.log("Type check - is array?", Array.isArray(config?.leadKeywords));
    console.log("===========================================");

    setFormName(agent.name);
    setFormDescription(agent.description || "");
    setFormPrompt(config?.prompt || "");
    setFormPersona(config?.persona || "");
    setFormGreeting(config?.greetingMessage || "");
    setFormEndCallPhrases(config?.endCallPhrases?.join(", ") || "");

    // Handle lead keywords
    const leadKeywords = config?.leadKeywords;
    if (Array.isArray(leadKeywords) && leadKeywords.length > 0) {
      setFormLeadKeywords(leadKeywords.join(", "));
    } else {
      setFormLeadKeywords("");
    }

    // Handle follow-up keywords
    const followUpKeywords = config?.followUpKeywords;
    if (Array.isArray(followUpKeywords) && followUpKeywords.length > 0) {
      setFormFollowUpKeywords(followUpKeywords.join(", "));
    } else {
      setFormFollowUpKeywords("");
    }
    // Load supported languages - use supportedLanguages if available, otherwise fallback to single language
    const supportedLangs = (agent.config as any)?.supportedLanguages;
    if (supportedLangs && Array.isArray(supportedLangs) && supportedLangs.length > 0) {
      setFormSelectedLanguages(supportedLangs);
    } else {
      setFormSelectedLanguages([agent.config?.language || "en"]);
    }
    setFormSttProvider(agent.config?.sttProvider || "deepgram");
    setFormLlmModel(agent.config?.llm?.model || "gpt-4o-mini");
    setFormTemperature(agent.config?.llm?.temperature ?? 0.7);
    setFormMaxTokens(agent.config?.llm?.maxTokens ?? 300);
    setFormVoiceProvider(agent.config?.voice?.provider || "deepgram");
    setFormVoiceId(agent.config?.voice?.voiceId || "aura-asteria-en");
    setFormGender(agent.gender || "female");
    setFormInboundGreeting(agent.config?.inboundConfig?.greetingMessage || "");
    setFormInboundPrompt(agent.config?.inboundConfig?.prompt || "");
    setFormOutboundGreeting(agent.config?.outboundConfig?.greetingMessage || "");
    setFormOutboundPrompt(agent.config?.outboundConfig?.prompt || "");
    // Load transfer settings
    const ts = agent.config?.transferSettings;
    console.log("🔍 LOADING TRANSFER SETTINGS:", {
      transferSettings: ts,
      enabled: ts?.enabled,
      enabledType: typeof ts?.enabled,
      willSet: ts?.enabled || false
    });
    setFormTransferEnabled(ts?.enabled || false);
    setFormHumanAgentNumber(ts?.humanAgentNumber || "");
    setFormDetectionKeywords(ts?.detectionKeywords?.join(", ") || "human agent, real person, speak to someone, transfer me");
    setFormConfirmationQuestion(ts?.confirmationQuestion || "Would you like me to transfer you to a human agent?");
    setFormConfirmationKeywords(ts?.confirmationKeywords?.join(", ") || "yes, sure, okay, please, yeah, yep");
    setFormNegativeKeywords(ts?.negativeKeywords?.join(", ") || "no, not now, cancel, never mind, nope");
    setFormConfirmationMessage(ts?.confirmationMessage || "Transferring you now. Please hold.");
    setFormFailureMessage(ts?.failureMessage || "I'm sorry, I couldn't connect you to an agent. Please try again later.");
    setFormConfirmationTimeout(ts?.confirmationTimeoutMs ? Math.round(ts.confirmationTimeoutMs / 1000) : 15);
    setFormRingTimeout(ts?.ringTimeoutSeconds || 30);
    setFormFallbackBehavior(ts?.fallbackBehavior || "continue");
    // Load voicemail detection settings
    const vmd = agent.config?.voicemailDetection;
    setFormVoicemailEnabled(vmd?.enabled ?? true);
    setFormVoicemailKeywords(vmd?.keywords?.join(", ") || "");
    // Load direction-specific KB toggle
    setUseDirectionSpecificKB(agent.useDirectionSpecificKnowledgeBase || false);
  };

  const openCreate = () => {
    setMode("create");
    setSelectedId(null);
    resetForm();
    setStep("basic");
    setIsOpen(true);
  };

  const openUpdate = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    setSelectedId(agentId);
    setMode("update");
    loadAgentToForm(agent);
    // Load appointment settings when opening agent
    loadAppointmentSettings(agentId);
    setStep("basic");
    setIsOpen(true);
    // Load knowledge base and phones when opening update
    if (agentId) {
      loadKnowledgeBase(agentId);
      loadPhones();
    }
  };

  // Delete agent handler
  const handleDeleteAgent = (agentId: string, agentName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from opening update modal
    toast.confirm({
      message: `Are you sure you want to delete "${agentName}"? This action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteAgentAPI(agentId);
          toast.success(`Agent "${agentName}" deleted successfully`);
          // Refresh agents list
          await loadAgents();
          // Close modal if the deleted agent was selected
          if (selectedId === agentId) {
            setIsOpen(false);
            setSelectedId(null);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to delete agent");
        }
      },
    });
  };

  // Knowledge Base functions
  const loadKnowledgeBase = async (agentId: string) => {
    try {
      setKbLoading(true);
      const result = await listKnowledgeBaseDocuments(agentId);
      setKbDocuments(result.documents || []);
    } catch (err: any) {
      console.error("Failed to load knowledge base:", err);
      toast.warning(err.message || "Failed to load knowledge base");
      setKbDocuments([]);
    } finally {
      setKbLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    callDirection: 'inbound' | 'outbound' | 'both' = 'both'
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Invalid file type. Only PDF, DOCX, and TXT files are allowed.");
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning("File size exceeds 100MB limit.");
      return;
    }

    try {
      setUploadingFile(true);
      
      // If in create mode and agent doesn't exist yet, create it first
      let agentId = selectedId;
      if (!agentId && mode === "create") {
        // Validate required fields
        if (!formName.trim()) {
          toast.warning("Please enter an agent name first");
          setUploadingFile(false);
          return;
        }

        // Create the agent with current form data
        const configData: any = {
          prompt: formPrompt.trim() || formPersona.trim() || "You are a helpful AI assistant.",
          greetingMessage: formGreeting.trim() || "Hello! How can I help you today?",
          voice: {
            provider: formVoiceProvider as any,
            voiceId: formVoiceId,
          },
          language: formSelectedLanguages[0] || "en",
          supportedLanguages: formSelectedLanguages,
          llm: {
            model: formLlmModel,
            temperature: formTemperature,
            maxTokens: formMaxTokens,
          },
          sttProvider: formSttProvider,
        };

        if (formEndCallPhrases.trim()) {
          configData.endCallPhrases = formEndCallPhrases.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formLeadKeywords.trim()) {
          configData.leadKeywords = formLeadKeywords.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formFollowUpKeywords.trim()) {
          configData.followUpKeywords = formFollowUpKeywords.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formInboundGreeting.trim() || formInboundPrompt.trim()) {
          configData.inboundConfig = {};
          if (formInboundGreeting.trim()) {
            configData.inboundConfig.greetingMessage = formInboundGreeting.trim();
          }
          if (formInboundPrompt.trim()) {
            configData.inboundConfig.prompt = formInboundPrompt.trim();
          }
        }

        if (formOutboundGreeting.trim() || formOutboundPrompt.trim()) {
          configData.outboundConfig = {};
          if (formOutboundGreeting.trim()) {
            configData.outboundConfig.greetingMessage = formOutboundGreeting.trim();
          }
          if (formOutboundPrompt.trim()) {
            configData.outboundConfig.prompt = formOutboundPrompt.trim();
          }
        }

        const newAgent = await createAgentAPI({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          gender: formGender,
          config: configData,
        });

        agentId = newAgent.id;
        setSelectedId(agentId);
        setMode("update");
        toast.success("Agent created successfully");
        await loadAgents();
        // Reload phones with new agentId for test call tab
        await loadPhones();
      }

      if (!agentId) {
        toast.warning("Please create the agent first");
        setUploadingFile(false);
        return;
      }

      await uploadKnowledgeBaseDocument(agentId, file, callDirection);
      toast.success("Document uploaded successfully! Processing in background...");
      await loadKnowledgeBase(agentId);
      event.target.value = '';
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toast.warning(err.message || "Failed to upload document");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    toast.confirm({
      message: "Are you sure you want to delete this document?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteKnowledgeBaseDocument(documentId);
          toast.success("Document deleted successfully");
          if (selectedId) {
            await loadKnowledgeBase(selectedId);
          }
        } catch (err: any) {
          console.error("Error deleting document:", err);
          toast.warning(err.message || "Failed to delete document");
        }
      },
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-400" />;
    }
  };

  // Helper function to check if a keyword is a default keyword
  const isDefaultKeyword = (keyword: string, defaultKeywords: { language: string; label: string; keywords: string[] }[]): boolean => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return defaultKeywords.some(group => 
      group.keywords.some(k => k.toLowerCase().trim() === normalizedKeyword)
    );
  };

  // Helper function to get all default keywords as a flat array
  const getAllDefaultKeywords = (defaultKeywords: { language: string; label: string; keywords: string[] }[]): string[] => {
    return defaultKeywords.flatMap(group => group.keywords);
  };

  // Appointment Booking functions
  const loadAppointmentSettings = async (agentId: string) => {
    try {
      setLoadingAppointmentSettings(true);
      console.log("📥 Loading appointment settings for agent:", agentId);
      const settings = await getAppointmentSettings(agentId);
      console.log("✅ Appointment settings loaded:", settings);
      setFormAppointmentEnabled(settings.enabled || false);
      
      // Get default keywords
      const defaultKeywords = settings.defaultKeywords || [];
      const allDefaultKeywords = getAllDefaultKeywords(defaultKeywords);
      
      // Merge existing keywords with default keywords (avoid duplicates)
      const existingKeywords = settings.detectionKeywords || [];
      const mergedKeywords = [...allDefaultKeywords];
      
      // Add existing keywords that are not defaults (case-insensitive check)
      existingKeywords.forEach(keyword => {
        if (!isDefaultKeyword(keyword, defaultKeywords)) {
          // Check if it's not already in mergedKeywords (case-insensitive)
          const normalized = keyword.toLowerCase().trim();
          if (!mergedKeywords.some(k => k.toLowerCase().trim() === normalized)) {
            mergedKeywords.push(keyword);
          }
        }
      });
      
      setFormAppointmentKeywords(mergedKeywords);
      setFormAppointmentDefaultKeywords(defaultKeywords);
      setFormAppointmentNameQuestion(settings.questions?.nameQuestion || "What's your name?");
      setFormAppointmentDateQuestion(settings.questions?.dateQuestion || "What date would you like to schedule the appointment? Our available hours are [timeRange].");
      setFormAppointmentTimeQuestion(settings.questions?.timeQuestion || "What time works for you? We're available from [startTime] to [endTime].");
      setFormAppointmentReasonQuestion(settings.questions?.reasonQuestion || "What is the reason for this appointment?");
      setFormAppointmentConfirmationQuestion(settings.questions?.confirmationQuestion || "I've booked your appointment for [date] at [time]. Is this correct?");
      setFormAppointmentSuccessMessage(settings.successMessage || "Great! Your appointment is confirmed for [date] at [time]. We'll see you then!");
      setFormAppointmentStartTime(settings.slots?.startTime || "09:00");
      setFormAppointmentEndTime(settings.slots?.endTime || "17:00");
      setFormAppointmentSlotDuration(settings.slots?.slotDurationMinutes || 30);
      setFormAppointmentWorkingDays(settings.slots?.workingDays || [1, 2, 3, 4, 5]);
    } catch (error: any) {
      console.error("❌ Error loading appointment settings:", error);
      // If settings don't exist yet, that's okay - use defaults
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        console.log("ℹ️ No appointment settings found, using defaults");
        // Settings will use default values already set in state
      } else {
        toast.error(error.message || "Failed to load appointment settings");
      }
    } finally {
      setLoadingAppointmentSettings(false);
    }
  };

  // Test Call functions
  const loadPhones = async () => {
    // Only fetch phones if we have an agentId - only phones assigned to this agent
    if (!selectedId) {
      setPhones([]);
      setSelectedPhone("");
      return;
    }

    try {
      // Fetch phones filtered by agentId - only phones assigned to this specific agent
      const phoneList = await fetchPhones(selectedId);
      // Ensure phoneList is always an array
      const phonesArray = Array.isArray(phoneList) ? phoneList : [];
      setPhones(phonesArray);
      if (phonesArray.length > 0 && !selectedPhone) {
        setSelectedPhone(phonesArray[0]._id);
      } else if (phonesArray.length === 0) {
        setSelectedPhone("");
      }
    } catch (err: any) {
      console.error("Error loading phones:", err);
      toast.warning(err.message || "Failed to load phone numbers");
      // Ensure phones is always an array even on error
      setPhones([]);
      setSelectedPhone("");
    }
  };

  const handleInitiateCall = async () => {
    if (!callPhoneNumber || !selectedPhone) {
      toast.warning("Please enter a phone number and select a phone");
      return;
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(callPhoneNumber)) {
      toast.warning("Please enter a valid phone number in E.164 format (e.g., +919876543210)");
      return;
    }

    try {
      setInitiatingCall(true);
      setCallStatus(null);

      // If in create mode and agent doesn't exist yet, create it first
      let agentId = selectedId;
      if (!agentId && mode === "create") {
        // Validate required fields
        if (!formName.trim()) {
          toast.warning("Please enter an agent name first");
          setInitiatingCall(false);
          return;
        }

        // Create the agent with current form data
        const configData: any = {
          prompt: formPrompt.trim() || formPersona.trim() || "You are a helpful AI assistant.",
          greetingMessage: formGreeting.trim() || "Hello! How can I help you today?",
          voice: {
            provider: formVoiceProvider as any,
            voiceId: formVoiceId,
          },
          language: formSelectedLanguages[0] || "en",
          supportedLanguages: formSelectedLanguages,
          llm: {
            model: formLlmModel,
            temperature: formTemperature,
            maxTokens: formMaxTokens,
          },
          sttProvider: formSttProvider,
        };

        if (formEndCallPhrases.trim()) {
          configData.endCallPhrases = formEndCallPhrases.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formLeadKeywords.trim()) {
          configData.leadKeywords = formLeadKeywords.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formFollowUpKeywords.trim()) {
          configData.followUpKeywords = formFollowUpKeywords.split(",").map((p: string) => p.trim()).filter(Boolean);
        }

        if (formInboundGreeting.trim() || formInboundPrompt.trim()) {
          configData.inboundConfig = {};
          if (formInboundGreeting.trim()) {
            configData.inboundConfig.greetingMessage = formInboundGreeting.trim();
          }
          if (formInboundPrompt.trim()) {
            configData.inboundConfig.prompt = formInboundPrompt.trim();
          }
        }

        if (formOutboundGreeting.trim() || formOutboundPrompt.trim()) {
          configData.outboundConfig = {};
          if (formOutboundGreeting.trim()) {
            configData.outboundConfig.greetingMessage = formOutboundGreeting.trim();
          }
          if (formOutboundPrompt.trim()) {
            configData.outboundConfig.prompt = formOutboundPrompt.trim();
          }
        }

        const newAgent = await createAgentAPI({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          gender: formGender,
          config: configData,
        });

        agentId = newAgent.id;
        setSelectedId(agentId);
        setMode("update");
        toast.success("Agent created successfully");
        await loadAgents();
        // Reload phones with new agentId for test call tab
        await loadPhones();
      }

      if (!agentId) {
        toast.warning("Please create the agent first");
        setInitiatingCall(false);
        return;
      }

      const result = await initiateOutboundCall({
        phoneNumber: callPhoneNumber,
        phoneId: selectedPhone,
        agentId: agentId,
        metadata: {
          initiatedFrom: 'admin-dashboard-agent-form'
        }
      });

      setCallStatus({
        success: true,
        message: `Call initiated successfully! Call Log ID: ${result.callLogId}`
      });

      toast.success("Call initiated successfully!");
      setCallPhoneNumber('');
    } catch (err: any) {
      console.error("Error initiating call:", err);
      // Extract error message properly, handling different error formats
      const errorMessage = err.response?.data?.error?.message
        || err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.message === 'string' ? err.message : null)
        || (typeof err === 'string' ? err : 'Failed to initiate call');
      
      const finalMessage = typeof errorMessage === 'string' ? errorMessage : 'Failed to initiate call';
      
      setCallStatus({
        success: false,
        message: finalMessage
      });
      toast.warning(finalMessage);
    } finally {
      setInitiatingCall(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.warning("Agent name is required");
      return;
    }
    if (!formPrompt.trim() || formPrompt.length < 10) {
      toast.warning("Agent prompt is required (minimum 10 characters)");
      return;
    }
    if (!formGreeting.trim() || formGreeting.length < 5) {
      toast.warning("Greeting message is required (minimum 5 characters)");
      return;
    }
    // Validate transfer settings if enabled
    if (formTransferEnabled) {
      if (!formHumanAgentNumber.trim()) {
        toast.warning("Human agent phone number is required when transfer is enabled");
        return;
      }
      // Validate E.164 format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formHumanAgentNumber.trim())) {
        toast.warning("Please enter a valid phone number in E.164 format (e.g., +919876543210)");
        return;
      }
    }

    setSaving(true);
    try {
      const endCallPhrasesArray = formEndCallPhrases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const configData: any = {
        prompt: formPrompt.trim(),
        greetingMessage: formGreeting.trim(),
        voice: {
          provider: formVoiceProvider as any,
          voiceId: formVoiceId,
        },
        language: formSelectedLanguages[0] || "en", // Primary language (fallback)
        supportedLanguages: formSelectedLanguages, // All supported languages
        llm: {
          model: formLlmModel,
          temperature: formTemperature,
          maxTokens: formMaxTokens || undefined,
        },
        endCallPhrases: endCallPhrasesArray,
        sttProvider: formSttProvider,
      };

      if (formPersona.trim()) {
        configData.persona = formPersona.trim();
      }

      if (formInboundGreeting.trim() || formInboundPrompt.trim()) {
        configData.inboundConfig = {};
        if (formInboundGreeting.trim()) {
          configData.inboundConfig.greetingMessage = formInboundGreeting.trim();
        }
        if (formInboundPrompt.trim()) {
          configData.inboundConfig.prompt = formInboundPrompt.trim();
        }
      }

      if (formOutboundGreeting.trim() || formOutboundPrompt.trim()) {
        configData.outboundConfig = {};
        if (formOutboundGreeting.trim()) {
          configData.outboundConfig.greetingMessage = formOutboundGreeting.trim();
        }
        if (formOutboundPrompt.trim()) {
          configData.outboundConfig.prompt = formOutboundPrompt.trim();
        }
      }

      // Add transfer settings
      configData.transferSettings = {
        enabled: formTransferEnabled,
        humanAgentNumber: formHumanAgentNumber.trim(),
        detectionKeywords: formDetectionKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        confirmationQuestion: formConfirmationQuestion.trim(),
        confirmationKeywords: formConfirmationKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        negativeKeywords: formNegativeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
        confirmationMessage: formConfirmationMessage.trim(),
        failureMessage: formFailureMessage.trim(),
        confirmationTimeoutMs: formConfirmationTimeout * 1000, // Convert seconds to ms
        ringTimeoutSeconds: formRingTimeout,
        fallbackBehavior: formFallbackBehavior,
      };

      // Add voicemail detection settings
      configData.voicemailDetection = {
        enabled: formVoicemailEnabled,
      };
      // Only add keywords if custom keywords are provided
      if (formVoicemailKeywords.trim()) {
        configData.voicemailDetection.keywords = formVoicemailKeywords.split(",").map((s) => s.trim()).filter(Boolean);
      }

      // Add lead and follow-up keywords
      configData.leadKeywords = formLeadKeywords.trim()
        ? formLeadKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [];

      configData.followUpKeywords = formFollowUpKeywords.trim()
        ? formFollowUpKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [];

      console.log("========== SAVING AGENT ==========");
      console.log("Form Lead Keywords:", formLeadKeywords);
      console.log("Form Follow-Up Keywords:", formFollowUpKeywords);
      console.log("Config Lead Keywords:", configData.leadKeywords);
      console.log("Config Follow-Up Keywords:", configData.followUpKeywords);
      console.log("Full Config Data:", configData);
      console.log("==================================");

      if (mode === "create") {
        const newAgent = await createAgentAPI({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          gender: formGender,
          useDirectionSpecificKnowledgeBase: useDirectionSpecificKB,
          config: configData,
        } as any);
        toast.success("Agent created successfully");
        // After creating, set the selected ID so knowledge base and test call tabs can work
        setSelectedId(newAgent.id);
        setMode("update");
        // Load knowledge base and phones for the newly created agent
        loadKnowledgeBase(newAgent.id);
        loadPhones();
      } else if (selectedId) {
        await updateAgentAPI(selectedId, {
          name: formName.trim(),
          description: formDescription.trim(),
          gender: formGender,
          useDirectionSpecificKnowledgeBase: useDirectionSpecificKB,
          config: configData,
        } as any);
        toast.success("Agent updated successfully");
        
        // Save appointment booking settings if agent was updated
        if (selectedId) {
          try {
            const appointmentSettings = {
              enabled: formAppointmentEnabled,
              detectionKeywords: formAppointmentKeywords,
              questions: {
                nameQuestion: formAppointmentNameQuestion,
                dateQuestion: formAppointmentDateQuestion,
                timeQuestion: formAppointmentTimeQuestion,
                reasonQuestion: formAppointmentReasonQuestion,
                confirmationQuestion: formAppointmentConfirmationQuestion,
              },
              successMessage: formAppointmentSuccessMessage,
              slots: {
                startTime: formAppointmentStartTime,
                endTime: formAppointmentEndTime,
                slotDurationMinutes: formAppointmentSlotDuration,
                workingDays: formAppointmentWorkingDays,
              },
            };
            console.log("💾 Saving appointment settings for agent:", selectedId, appointmentSettings);
            await updateAppointmentSettings(selectedId, appointmentSettings);
            console.log("✅ Appointment settings saved successfully");
          } catch (appointmentError: any) {
            console.error("❌ Error saving appointment settings:", appointmentError);
            // Don't fail the whole save if appointment settings fail
            toast.warning("Agent saved but appointment settings failed to save");
          }
        }
      }

      // Don't close modal automatically - let user continue with knowledge base/test call
      await loadAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-zinc-600">Loading agents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadAgents}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <Users className="h-3 w-3" />
            <span>Agent performance</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your AI agents. Click a card to update, or create a new one.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Sparkles className="h-4 w-4" />
          Add agent
        </button>
      </div>

      {/* Agent cards grid */}
      {agents.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Bot className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
          <p>No agents found. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const active = selectedId === agent.id && mode === "update";
            return (
              <motion.button
                key={agent.id}
                type="button"
                onClick={() => openUpdate(agent.id)}
                layout
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`flex flex-col items-stretch rounded-xl border px-4 py-3 text-left shadow-sm bg-white ${
                  active
                    ? "border-emerald-300 shadow-emerald-100"
                    : "border-zinc-200 hover:border-emerald-200 hover:shadow-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs text-zinc-500">Agent</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {agent.name} · {agent.role || "Custom"}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(agent.id);
                        toast.success("Agent ID copied to clipboard");
                      }}
                      className="text-[10px] text-zinc-400 font-mono mt-0.5 hover:text-emerald-600 cursor-pointer transition-colors"
                      title="Click to copy ID"
                    >
                      ID: {agent.id}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      {agent.successRate.toFixed(1)}% success
                    </span>
                    <button
                      onClick={(e) => handleDeleteAgent(agent.id, agent.name, e)}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <Phone className="h-3 w-3 text-emerald-500" />
                    <span className="font-mono">
                      {agent.virtualNumber || "No number"}
                    </span>
                  </div>
                  <span className="text-zinc-500">
                    {formatNumber(agent.totalCalls)} calls
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <BookOpen className="h-3 w-3 text-emerald-500" />
                  <span>
                    {agent.config?.language === "en"
                      ? "English"
                      : agent.config?.language || "English"}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Full-window modal for create / update */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-16">
          <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-black/10 mx-4 max-h-[calc(100vh-4rem)] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
                  {mode === "create" ? "Create agent" : "Update agent"}
                </p>
                <p className="text-sm font-semibold text-zinc-900 mt-1">
                  {mode === "create"
                    ? "Basic Information"
                    : `${selected?.name ?? ""} · ${selected?.role ?? "Custom"}`}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step tabs */}
            <div className="flex border-b border-zinc-200 px-4 overflow-x-auto text-xs">
              <StepTab
                icon={Info}
                label="Basic Info"
                active={step === "basic"}
                onClick={() => setStep("basic")}
              />
              <StepTab
                icon={User}
                label="Persona & Greeting"
                active={step === "persona"}
                onClick={() => setStep("persona")}
              />
              <StepTab
                icon={PhoneForwarded}
                label="Call Directions"
                active={step === "directions"}
                onClick={() => setStep("directions")}
              />
              <StepTab
                icon={Bot}
                label="AI & Voice"
                active={step === "voice"}
                onClick={() => setStep("voice")}
              />
              <StepTab
                icon={BookOpen}
                label="Knowledge Base"
                active={step === "knowledge"}
                onClick={() => {
                  setStep("knowledge");
                  if (selectedId) {
                    loadKnowledgeBase(selectedId);
                  }
                }}
              />
              <StepTab
                icon={Settings}
                label="Call Settings"
                active={step === "settings"}
                onClick={() => setStep("settings")}
              />
              <StepTab
                icon={Calendar}
                label="Appointment Booking"
                active={step === "appointment"}
                onClick={() => {
                  setStep("appointment");
                  if (selectedId) {
                    loadAppointmentSettings(selectedId);
                  }
                }}
              />
              <StepTab
                icon={Activity}
                label="Test Call"
                active={step === "test"}
                onClick={() => {
                  setStep("test");
                  loadPhones();
                }}
              />
            </div>

            {/* Modal body – scrollable */}
            <div className="px-5 py-4 space-y-4 text-xs flex-1 overflow-y-auto">
              {step === "basic" && (
                <>
                  <p className="text-sm font-semibold text-zinc-900 mb-1">
                    Basic Information
                  </p>
                  <p className="text-[11px] text-zinc-500 mb-3">
                    Define the name and purpose of your agent.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Agent name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        placeholder="e.g. Sales Agent, Support Bot"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        placeholder="Brief description of what this agent does for your business."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Optional · Max 500 characters
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                        Voice Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as "male" | "female")}
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Select the voice gender for multilingual calls. This ensures consistent voice gender across all supported languages.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {step === "persona" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        Default Persona &amp; Greeting
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] text-sky-700 flex items-start gap-2">
                    <span className="mt-0.5 h-3 w-3 rounded-full bg-sky-400" />
                    <p>
                      These are the default settings used for all calls. You can override
                      them for incoming/outgoing calls in the next section.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Default Agent Prompt <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={8}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      value={formPrompt}
                      onChange={(e) => setFormPrompt(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Default prompt used for all calls (minimum 10 characters).
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Default Greeting Message <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      value={formGreeting}
                      onChange={(e) => setFormGreeting(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Default greeting used for all calls (minimum 5 characters).
                    </p>
                  </div>
                </div>
              )}
              {step === "directions" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <PhoneForwarded className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        Call Direction Settings (Optional)
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] text-sky-700 flex items-start gap-2">
                    <span className="mt-0.5 h-3 w-3 rounded-full bg-sky-400" />
                    <p>
                      Override the default persona and greeting for incoming or outgoing calls.
                      Leave blank to use the defaults from the previous step.
                    </p>
                  </div>

                  {/* Incoming calls */}
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-3 space-y-3">
                    <p className="text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      Incoming Calls
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Inbound Greeting
                      </label>
                      <input
                        className="w-full rounded-md border border-emerald-100 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        value={formInboundGreeting}
                        onChange={(e) => setFormInboundGreeting(e.target.value)}
                        placeholder="Leave blank to use default"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Inbound Prompt
                      </label>
                      <textarea
                        rows={5}
                        className="w-full rounded-md border border-emerald-100 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        placeholder="Leave blank to use the default prompt above."
                        value={formInboundPrompt}
                        onChange={(e) => setFormInboundPrompt(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Outgoing calls */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 space-y-3">
                    <p className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
                      Outgoing Calls
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Outbound Greeting
                      </label>
                      <input
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        value={formOutboundGreeting}
                        onChange={(e) => setFormOutboundGreeting(e.target.value)}
                        placeholder="Leave blank to use default"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Outbound Prompt
                      </label>
                      <textarea
                        rows={5}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        placeholder="Leave blank to use the default prompt above."
                        value={formOutboundPrompt}
                        onChange={(e) => setFormOutboundPrompt(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              {step === "voice" && (
                <div className="space-y-4 text-xs">
                  {/* AI Model Settings */}
                  <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          AI Model Settings
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        LLM Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formLlmModel}
                        onChange={(e) => setFormLlmModel(e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      >
                        <option value="gpt-4o-mini">GPT‑4o Mini (Fastest)</option>
                        <option value="gpt-4o">GPT‑4o (Higher quality)</option>
                        <option value="gpt-4-turbo">GPT‑4 Turbo</option>
                        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      </select>
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-3 rounded-lg border border-zinc-200 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-zinc-900">Voice Settings</p>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                        Voice Provider <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formVoiceProvider}
                        onChange={(e) => setFormVoiceProvider(e.target.value)}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      >
                        <option value="deepgram">Deepgram (Fastest)</option>
                        <option value="elevenlabs">ElevenLabs</option>
                        <option value="sarvam">Sarvam (Indian languages)</option>
                        <option value="google">Google</option>
                      </select>
                    </div>

                    {/* Voice Selection */}
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 mb-2">
                        Select Voice <span className="text-red-500">*</span>
                      </label>
                      {loadingVoices ? (
                        <div className="flex items-center justify-center py-4 text-zinc-400">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading voices...</span>
                        </div>
                      ) : availableVoices.length === 0 ? (
                        <div className="text-center py-4 text-zinc-400">
                          No voices available for this provider
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                          {availableVoices.map((voice) => (
                            <div
                              key={voice.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setFormVoiceId(voice.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setFormVoiceId(voice.id);
                                }
                              }}
                              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${
                                formVoiceId === voice.id
                                  ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300"
                                  : "border-zinc-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 w-full">
                                {/* Play/Pause button - only show for selected voice */}
                                {formVoiceId === voice.id && (
                                  <button
                                    type="button"
                                    onClick={(e) => handlePlayVoice(e, voice)}
                                    disabled={loadingVoiceId === voice.id}
                                    className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full transition-colors ${
                                      playingVoiceId === voice.id
                                        ? "bg-emerald-500 text-white"
                                        : loadingVoiceId === voice.id
                                        ? "bg-zinc-200 text-zinc-400 cursor-wait"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-600"
                                    }`}
                                  >
                                    {loadingVoiceId === voice.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : playingVoiceId === voice.id ? (
                                      <Pause className="h-3 w-3" />
                                    ) : (
                                      <Play className="h-3 w-3 ml-0.5" />
                                    )}
                                  </button>
                                )}
                                <span className="text-xs font-medium text-zinc-900">
                                  {voice.name}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  voice.gender === 'female'
                                    ? 'bg-pink-100 text-pink-600'
                                    : voice.gender === 'male'
                                    ? 'bg-sky-100 text-sky-600'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  {voice.gender}
                                </span>
                                {voice.accent && (
                                  <span className="text-[10px] text-zinc-400 ml-auto">
                                    {voice.accent}
                                  </span>
                                )}
                              </div>
                              {voice.description && (
                                <p className="text-[10px] text-zinc-500 mt-0.5 ml-8 line-clamp-1">
                                  {voice.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {step === "knowledge" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Knowledge Base</p>
                      <p className="text-[11px] text-zinc-500">Upload documents to enhance your agent's knowledge</p>
                    </div>
                  </div>

                  {/* Direction-Specific Toggle */}
                  <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-900">Enable Call Direction-Specific Knowledge Base</p>
                          <p className="text-[11px] text-purple-700 mt-0.5">Upload different documents for incoming and outgoing calls</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={useDirectionSpecificKB}
                        onChange={(e) => setUseDirectionSpecificKB(e.target.checked)}
                        className="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  </div>

                  {/* Conditional Upload Sections */}
                  {!useDirectionSpecificKB ? (
                    /* Default Mode: Single Upload Section */
                    <div className="space-y-3">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                        <p className="font-medium mb-0.5">📚 Upload Documents</p>
                        <p>Upload PDF, DOCX, or TXT files (max 100MB) to provide your agent with specific knowledge. Documents are processed in the background (typically 10-60 seconds). The page will auto-refresh while processing. {!selectedId && mode === "create" && "The agent will be created automatically when you upload a document."}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors">
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-2" />
                              Upload Document
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => handleFileUpload(e, 'both')}
                            disabled={uploadingFile}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-zinc-500">
                          PDF, DOCX, or TXT (max 100MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Direction-Specific Mode: Separate Upload Sections */
                    <div className="space-y-4">
                      {/* Incoming Calls Section */}
                      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <span className="text-sm">📥</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-900">Incoming Calls Knowledge Base</p>
                            <p className="text-[11px] text-green-700">Documents for calls received by your agent</p>
                          </div>
                        </div>
                        <label className="inline-flex items-center justify-center rounded-full border border-green-300 bg-green-100 px-4 py-2 text-xs font-medium text-green-800 hover:bg-green-200 cursor-pointer transition-colors">
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-2" />
                              Upload for Incoming
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => handleFileUpload(e, 'inbound')}
                            disabled={uploadingFile}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Outgoing Calls Section */}
                      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <span className="text-sm">📤</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-900">Outgoing Calls Knowledge Base</p>
                            <p className="text-[11px] text-blue-700">Documents for calls initiated by your agent</p>
                          </div>
                        </div>
                        <label className="inline-flex items-center justify-center rounded-full border border-blue-300 bg-blue-100 px-4 py-2 text-xs font-medium text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors">
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-2" />
                              Upload for Outgoing
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => handleFileUpload(e, 'outbound')}
                            disabled={uploadingFile}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Document List */}
                  {selectedId && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-zinc-900 mb-3">
                        Uploaded Documents ({kbDocuments.length})
                      </p>

                      {kbLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400 mr-2" />
                          <span className="text-[11px] text-zinc-500">Loading documents...</span>
                        </div>
                      ) : kbDocuments.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                          <FileText className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                          <p className="text-xs text-zinc-600">No documents uploaded yet</p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Upload documents to enhance your agent's knowledge
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {kbDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-xs font-medium text-zinc-900 truncate">
                                      {doc.fileName}
                                    </p>
                                    {/* Direction Badge */}
                                    {doc.callDirection === 'inbound' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
                                        📥 Incoming
                                      </span>
                                    )}
                                    {doc.callDirection === 'outbound' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                        📤 Outgoing
                                      </span>
                                    )}
                                    {doc.callDirection === 'both' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        📞 Both
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3 mt-0.5 text-[10px] text-zinc-500">
                                    <span className="uppercase">{doc.fileType}</span>
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    {doc.totalChunks > 0 && (
                                      <span>{doc.totalChunks} chunks</span>
                                    )}
                                    {doc.processedAt && (
                                      <span>
                                        {new Date(doc.processedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {doc.error && (
                                    <p className="text-[10px] text-red-600 mt-0.5">
                                      Error: {doc.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1.5">
                                  {getStatusIcon(doc.status)}
                                  <span className={`text-[10px] font-medium ${
                                    doc.status === 'ready' ? 'text-emerald-600' :
                                    doc.status === 'processing' ? 'text-yellow-600 animate-pulse' :
                                    'text-red-600'
                                  }`}>
                                    {doc.status === 'ready' ? 'Ready' :
                                     doc.status === 'processing' ? 'Processing...' :
                                     'Failed'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {step === "settings" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/5 text-zinc-700">
                      <Settings className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Call Settings</p>
                    </div>
                  </div>

                  {/* Languages - Multi-select */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-2">
                      Languages <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-zinc-400 mb-3">Select languages the agent should support. Click to toggle.</p>

                    {/* International Languages */}
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">International Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { code: "en", label: "English" },
                          { code: "es", label: "Spanish" },
                          { code: "fr", label: "French" },
                          { code: "de", label: "German" },
                          { code: "pt", label: "Portuguese" },
                          { code: "it", label: "Italian" },
                          { code: "nl", label: "Dutch" },
                          { code: "ru", label: "Russian" },
                          { code: "ja", label: "Japanese" },
                          { code: "zh", label: "Chinese" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              if (formSelectedLanguages.includes(lang.code)) {
                                if (formSelectedLanguages.length > 1) {
                                  setFormSelectedLanguages(formSelectedLanguages.filter(l => l !== lang.code));
                                }
                              } else {
                                setFormSelectedLanguages([...formSelectedLanguages, lang.code]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                              formSelectedLanguages.includes(lang.code)
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Indian Languages */}
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Indian Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { code: "hi", label: "Hindi" },
                          { code: "bn", label: "Bengali" },
                          { code: "te", label: "Telugu" },
                          { code: "mr", label: "Marathi" },
                          { code: "ta", label: "Tamil" },
                          { code: "gu", label: "Gujarati" },
                          { code: "kn", label: "Kannada" },
                          { code: "ml", label: "Malayalam" },
                          { code: "pa", label: "Punjabi" },
                          { code: "or", label: "Odia" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              if (formSelectedLanguages.includes(lang.code)) {
                                if (formSelectedLanguages.length > 1) {
                                  setFormSelectedLanguages(formSelectedLanguages.filter(l => l !== lang.code));
                                }
                              } else {
                                setFormSelectedLanguages([...formSelectedLanguages, lang.code]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                              formSelectedLanguages.includes(lang.code)
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Languages Display */}
                    {formSelectedLanguages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-100">
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Selected Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {formSelectedLanguages.map((code) => {
                            const langMap: Record<string, { label: string; short: string }> = {
                              "en": { label: "English", short: "EN" },
                              "es": { label: "Spanish", short: "ES" },
                              "fr": { label: "French", short: "FR" },
                              "de": { label: "German", short: "DE" },
                              "pt": { label: "Portuguese", short: "PT" },
                              "it": { label: "Italian", short: "IT" },
                              "nl": { label: "Dutch", short: "NL" },
                              "ru": { label: "Russian", short: "RU" },
                              "ja": { label: "Japanese", short: "JA" },
                              "zh": { label: "Chinese", short: "ZH" },
                              "hi": { label: "Hindi", short: "HI" },
                              "bn": { label: "Bengali", short: "BN" },
                              "te": { label: "Telugu", short: "TE" },
                              "mr": { label: "Marathi", short: "MR" },
                              "ta": { label: "Tamil", short: "TA" },
                              "gu": { label: "Gujarati", short: "GU" },
                              "kn": { label: "Kannada", short: "KN" },
                              "ml": { label: "Malayalam", short: "ML" },
                              "pa": { label: "Punjabi", short: "PA" },
                              "or": { label: "Odia", short: "OR" },
                            };
                            const lang = langMap[code] || { label: code, short: code.toUpperCase() };
                            return (
                              <div
                                key={code}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200"
                              >
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  {lang.short}
                                </span>
                                <span className="text-[11px] text-emerald-700">{lang.label}</span>
                                {formSelectedLanguages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setFormSelectedLanguages(formSelectedLanguages.filter(l => l !== code))}
                                    className="ml-0.5 text-emerald-600 hover:text-red-500 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STT provider */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Speech‑to‑Text Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formSttProvider}
                      onChange={(e) => setFormSttProvider(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                    >
                      <option value="deepgram">Deepgram (Recommended)</option>
                      <option value="sarvam">Sarvam (Indian languages)</option>
                      <option value="azure">Azure Speech Services</option>
                    </select>
                  </div>

                  {/* End call phrases */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      End Call Phrases
                    </label>
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      value={formEndCallPhrases}
                      onChange={(e) => setFormEndCallPhrases(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Comma‑separated phrases that will automatically end the call.
                    </p>
                  </div>

                  {/* Lead Keywords */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Lead Keywords
                    </label>
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      value={formLeadKeywords}
                      onChange={(e) => setFormLeadKeywords(e.target.value)}
                      placeholder="interested, buy, purchase, quote, pricing, demo"
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Comma‑separated keywords to identify leads from call transcripts. Calls matching these keywords will appear in the Leads section.
                    </p>
                  </div>

                  {/* Follow-Up Keywords */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Follow-Up Keywords
                    </label>
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      value={formFollowUpKeywords}
                      onChange={(e) => setFormFollowUpKeywords(e.target.value)}
                      placeholder="callback, follow up, call back, remind me, later"
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Comma‑separated keywords to identify calls requiring follow-up. Calls matching these keywords will appear in the Follow-Ups section.
                    </p>
                  </div>

                  {/* Call Transfer to Human Agent Section */}
                  <div className="mt-6 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                          <PhoneForwarded className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Call Transfer to Human Agent</p>
                          <p className="text-[11px] text-zinc-500">Allow callers to request transfer to a human</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formTransferEnabled}
                          onChange={(e) => setFormTransferEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {formTransferEnabled && (
                      <div className="space-y-4 rounded-lg border border-orange-100 bg-orange-50/30 px-4 py-4">
                        {/* Human Agent Phone Number */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Human Agent Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formHumanAgentNumber}
                            onChange={(e) => setFormHumanAgentNumber(e.target.value)}
                            placeholder="+919876543210"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            E.164 format phone number to transfer calls to
                          </p>
                        </div>

                        {/* Detection Keywords */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Detection Keywords
                          </label>
                          <input
                            type="text"
                            value={formDetectionKeywords}
                            onChange={(e) => setFormDetectionKeywords(e.target.value)}
                            placeholder="human agent, real person, speak to someone"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Comma‑separated keywords that trigger transfer intent
                          </p>
                        </div>

                        {/* Confirmation Question */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Confirmation Question
                          </label>
                          <input
                            type="text"
                            value={formConfirmationQuestion}
                            onChange={(e) => setFormConfirmationQuestion(e.target.value)}
                            placeholder="Would you like me to transfer you to a human agent?"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Question asked to confirm transfer request
                          </p>
                        </div>

                        {/* Confirmation Keywords (Yes) */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Confirmation Keywords (Yes)
                          </label>
                          <input
                            type="text"
                            value={formConfirmationKeywords}
                            onChange={(e) => setFormConfirmationKeywords(e.target.value)}
                            placeholder="yes, sure, okay, please"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Comma‑separated positive confirmation keywords
                          </p>
                        </div>

                        {/* Negative Keywords (No) */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Negative Keywords (No)
                          </label>
                          <input
                            type="text"
                            value={formNegativeKeywords}
                            onChange={(e) => setFormNegativeKeywords(e.target.value)}
                            placeholder="no, not now, cancel, never mind"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Comma‑separated negative confirmation keywords
                          </p>
                        </div>

                        {/* Transfer Confirmation Message */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Transfer Confirmation Message
                          </label>
                          <input
                            type="text"
                            value={formConfirmationMessage}
                            onChange={(e) => setFormConfirmationMessage(e.target.value)}
                            placeholder="Transferring you now. Please hold."
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Message spoken before initiating transfer
                          </p>
                        </div>

                        {/* Transfer Failure Message */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Transfer Failure Message
                          </label>
                          <input
                            type="text"
                            value={formFailureMessage}
                            onChange={(e) => setFormFailureMessage(e.target.value)}
                            placeholder="I'm sorry, I couldn't connect you to an agent."
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Message spoken if transfer fails
                          </p>
                        </div>

                        {/* Timeouts Row */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Confirmation Timeout */}
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                              Confirmation Timeout (seconds)
                            </label>
                            <input
                              type="number"
                              min={5}
                              max={30}
                              value={formConfirmationTimeout}
                              onChange={(e) => setFormConfirmationTimeout(Number(e.target.value))}
                              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                              5-30 seconds
                            </p>
                          </div>

                          {/* Ring Timeout */}
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                              Ring Timeout (seconds)
                            </label>
                            <input
                              type="number"
                              min={10}
                              max={60}
                              value={formRingTimeout}
                              onChange={(e) => setFormRingTimeout(Number(e.target.value))}
                              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                              10-60 seconds
                            </p>
                          </div>
                        </div>

                        {/* Fallback Behavior */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Fallback Behavior
                          </label>
                          <select
                            value={formFallbackBehavior}
                            onChange={(e) => setFormFallbackBehavior(e.target.value as "continue" | "hangup" | "voicemail")}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          >
                            <option value="continue">Continue Conversation</option>
                            <option value="hangup">End Call</option>
                            <option value="voicemail">Go to Voicemail</option>
                          </select>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            What to do if transfer fails or is declined
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voicemail Detection Section */}
                  <div className="mt-6 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Voicemail Detection</p>
                          <p className="text-[11px] text-zinc-500">Automatically detect and terminate voicemail calls</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formVoicemailEnabled}
                          onChange={(e) => setFormVoicemailEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    {formVoicemailEnabled && (
                      <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/30 px-4 py-4">
                        {/* Info banner */}
                        <div className="rounded-md border border-purple-200 bg-purple-100/50 px-3 py-2 text-[11px] text-purple-700">
                          Voicemail detection uses keywords and audio patterns to identify voicemail greetings. When detected, the call is terminated immediately to save costs. Leave keywords empty to use default multi-lingual keywords.
                        </div>

                        {/* Custom Keywords */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Custom Keywords (Optional)
                          </label>
                          <input
                            type="text"
                            value={formVoicemailKeywords}
                            onChange={(e) => setFormVoicemailKeywords(e.target.value)}
                            placeholder="voicemail, leave a message, after the beep, not available"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Comma-separated keywords. Leave empty to use {DEFAULT_VOICEMAIL_KEYWORDS.length} default keywords in multiple languages
                          </p>
                        </div>

                        {/* Default Keywords Viewer */}
                        <div className="border-t border-purple-200 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowDefaultKeywords(!showDefaultKeywords)}
                            className="flex items-center gap-2 text-[11px] font-medium text-purple-700 hover:text-purple-800 transition-colors"
                          >
                            {showDefaultKeywords ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {showDefaultKeywords ? 'Hide' : 'View'} {DEFAULT_VOICEMAIL_KEYWORDS.length} Default Keywords
                          </button>

                          {showDefaultKeywords && (
                            <div className="mt-3 rounded-md border border-purple-200 bg-white p-3 max-h-64 overflow-y-auto">
                              <div className="flex flex-wrap gap-1.5">
                                {DEFAULT_VOICEMAIL_KEYWORDS.map((keyword, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700 border border-purple-200"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-200 pt-2">
                                These keywords are used when no custom keywords are specified. They include English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, and Hinglish phrases.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email to Caller Section */}
                  <div className="mt-6 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Email to Caller</p>
                          <p className="text-[11px] text-zinc-500">Send emails to callers during calls</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formEmailEnabled}
                          onChange={(e) => setFormEmailEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    {formEmailEnabled && (
                      <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/30 px-4 py-4">
                        {/* Info banner */}
                        <div className="rounded-md border border-blue-200 bg-blue-100/50 px-3 py-2 text-[11px] text-blue-700">
                          When enabled, the agent can send emails to callers when they request it during the conversation
                        </div>

                        {/* Detection Keywords */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Detection Keywords
                          </label>
                          <input
                            type="text"
                            value={formEmailDetectionKeywords}
                            onChange={(e) => setFormEmailDetectionKeywords(e.target.value)}
                            placeholder="email me, send email, mail me, email"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Comma‑separated keywords that trigger email intent detection
                          </p>
                        </div>

                        {/* Email Confirmation Question */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Email Confirmation Question
                          </label>
                          <input
                            type="text"
                            value={formEmailConfirmationQuestion}
                            onChange={(e) => setFormEmailConfirmationQuestion(e.target.value)}
                            placeholder="What's your email address?"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Question asked to collect caller's email address
                          </p>
                        </div>

                        {/* Require email confirmation checkbox */}
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={formEmailRequireConfirmation}
                            onChange={(e) => setFormEmailRequireConfirmation(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border border-zinc-300"
                          />
                          <div>
                            <p className="text-xs font-medium text-zinc-700">Require email confirmation (ask for email address)</p>
                            <p className="text-[11px] text-zinc-500">If disabled, will use phone number as fallback email</p>
                          </div>
                        </div>

                        {/* Email Templates Header */}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-xs font-semibold text-zinc-900">Email Templates</p>
                            <p className="text-[11px] text-zinc-500">Create multiple email templates with different content and SMTP credentials. Each template can have its own keywords for automatic selection.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newId = `email_${Date.now()}`;
                              setFormEmailTemplates([...formEmailTemplates, {
                                id: newId,
                                name: `Email Template ${formEmailTemplates.length + 1}`,
                                isDefault: false,
                                subject: "Information from {{agentName}}",
                                body: "Hello {{callerName}},\n\nThank you for your call. Here is the information we discussed:\n\n{{callSummary}}\n\nBest regards",
                                senderName: "AI Assistant",
                                successMessage: "Email sent! Check your inbox.",
                                failureMessage: "I'm sorry, I couldn't send the email.",
                                smtpHost: "smtp.gmail.com",
                                smtpPort: "587",
                                smtpUser: "",
                                smtpPassword: "",
                                keywords: "",
                              }]);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                            Add Template
                          </button>
                        </div>

                        {/* Email Templates List */}
                        <div className="space-y-4">
                          {formEmailTemplates.map((template, index) => (
                            <div key={template.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                              {/* Template Header */}
                              <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 border-b border-zinc-200">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={template.name}
                                    onChange={(e) => {
                                      const updated = [...formEmailTemplates];
                                      updated[index].name = e.target.value;
                                      setFormEmailTemplates(updated);
                                    }}
                                    className="text-xs font-medium text-zinc-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                                  />
                                  {template.isDefault && (
                                    <span className="rounded-md bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">DEFAULT</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!template.isDefault && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = formEmailTemplates.map(t => ({
                                            ...t,
                                            isDefault: t.id === template.id
                                          }));
                                          setFormEmailTemplates(updated);
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-700"
                                      >
                                        Set Default
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormEmailTemplates(formEmailTemplates.filter(t => t.id !== template.id));
                                        }}
                                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Template Fields */}
                              <div className="p-3 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Subject</label>
                                  <input
                                    type="text"
                                    value={template.subject}
                                    onChange={(e) => {
                                      const updated = [...formEmailTemplates];
                                      updated[index].subject = e.target.value;
                                      setFormEmailTemplates(updated);
                                    }}
                                    placeholder="Information from {{agentName}}"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Body</label>
                                  <textarea
                                    rows={4}
                                    value={template.body}
                                    onChange={(e) => {
                                      const updated = [...formEmailTemplates];
                                      updated[index].body = e.target.value;
                                      setFormEmailTemplates(updated);
                                    }}
                                    placeholder="Hello {{callerName}},&#10;&#10;Thank you for your call..."
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-mono outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Sender Name</label>
                                  <input
                                    type="text"
                                    value={template.senderName}
                                    onChange={(e) => {
                                      const updated = [...formEmailTemplates];
                                      updated[index].senderName = e.target.value;
                                      setFormEmailTemplates(updated);
                                    }}
                                    placeholder="AI Assistant"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">Success Message</label>
                                    <input
                                      type="text"
                                      value={template.successMessage}
                                      onChange={(e) => {
                                        const updated = [...formEmailTemplates];
                                        updated[index].successMessage = e.target.value;
                                        setFormEmailTemplates(updated);
                                      }}
                                      placeholder="Email sent! Check your inbox."
                                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">Failure Message</label>
                                    <input
                                      type="text"
                                      value={template.failureMessage}
                                      onChange={(e) => {
                                        const updated = [...formEmailTemplates];
                                        updated[index].failureMessage = e.target.value;
                                        setFormEmailTemplates(updated);
                                      }}
                                      placeholder="I'm sorry, I couldn't send the email."
                                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                    />
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-100">
                                  <p className="text-[11px] font-medium text-zinc-600 mb-2">SMTP Credentials (Per Template)</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">SMTP Host</label>
                                      <input
                                        type="text"
                                        value={template.smtpHost}
                                        onChange={(e) => {
                                          const updated = [...formEmailTemplates];
                                          updated[index].smtpHost = e.target.value;
                                          setFormEmailTemplates(updated);
                                        }}
                                        placeholder="smtp.gmail.com"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">SMTP Port</label>
                                      <input
                                        type="text"
                                        value={template.smtpPort}
                                        onChange={(e) => {
                                          const updated = [...formEmailTemplates];
                                          updated[index].smtpPort = e.target.value;
                                          setFormEmailTemplates(updated);
                                        }}
                                        placeholder="587"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">SMTP User</label>
                                      <input
                                        type="text"
                                        value={template.smtpUser}
                                        onChange={(e) => {
                                          const updated = [...formEmailTemplates];
                                          updated[index].smtpUser = e.target.value;
                                          setFormEmailTemplates(updated);
                                        }}
                                        placeholder="your-email@gmail.com"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">SMTP Password</label>
                                      <input
                                        type="password"
                                        value={template.smtpPassword}
                                        onChange={(e) => {
                                          const updated = [...formEmailTemplates];
                                          updated[index].smtpPassword = e.target.value;
                                          setFormEmailTemplates(updated);
                                        }}
                                        placeholder="Your SMTP password"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Keywords (Optional - comma-separated)</label>
                                  <input
                                    type="text"
                                    value={template.keywords}
                                    onChange={(e) => {
                                      const updated = [...formEmailTemplates];
                                      updated[index].keywords = e.target.value;
                                      setFormEmailTemplates(updated);
                                    }}
                                    placeholder="keyword1, keyword2"
                                    className="w-full rounded-md border border-zinc-200 bg-blue-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                                  />
                                  <p className="mt-1 text-[11px] text-zinc-400">
                                    If keywords match conversation, this template will be selected automatically
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Proposal Integration Section */}
                  <div className="mt-6 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">WhatsApp Proposal Integration</p>
                          <p className="text-[11px] text-zinc-500">Send WhatsApp proposals during calls</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formWhatsAppEnabled}
                          onChange={(e) => setFormWhatsAppEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    {formWhatsAppEnabled && (
                      <div className="space-y-4 rounded-lg border border-green-100 bg-green-50/30 px-4 py-4">
                        {/* Info banner */}
                        <div className="rounded-md border border-green-200 bg-green-100/50 px-3 py-2 text-[11px] text-green-700">
                          When enabled, the agent will automatically send WhatsApp proposal templates when users request proposals during calls
                        </div>

                        {/* Trigger Keywords */}
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                            Trigger Keywords (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formWhatsAppTriggerKeywords}
                            onChange={(e) => setFormWhatsAppTriggerKeywords(e.target.value)}
                            placeholder="proposal, send proposal, send me proposal, send details, share details"
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                          />
                          <p className="mt-1 text-[11px] text-zinc-400">
                            Keywords that trigger proposal detection. Comma-separated.
                          </p>
                        </div>

                        {/* Auto-Send checkbox */}
                        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-100/50 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={formWhatsAppAutoSend}
                            onChange={(e) => setFormWhatsAppAutoSend(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border border-green-400"
                          />
                          <div>
                            <p className="text-xs font-medium text-green-800">Auto-Send When Detected</p>
                            <p className="text-[11px] text-green-700">Automatically send proposal template when detected. If disabled, only mark as requested.</p>
                          </div>
                        </div>

                        {/* WhatsApp Templates Header */}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-xs font-semibold text-zinc-900">WhatsApp Templates</p>
                            <p className="text-[11px] text-zinc-500">Create multiple WhatsApp templates with different content and AI Sensy credentials. Each template can have its own keywords for automatic selection.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newId = `whatsapp_${Date.now()}`;
                              setFormWhatsAppTemplates([...formWhatsAppTemplates, {
                                id: newId,
                                name: `WhatsApp Template ${formWhatsAppTemplates.length + 1}`,
                                isDefault: false,
                                templateName: "proposal_template",
                                templateLanguage: "English",
                                apiKey: "",
                                partnerNumber: "919529945588",
                                baseUrl: "https://backend.api-wa.co",
                                campaignName: "client-campaign-name",
                                keywords: "",
                              }]);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                            Add Template
                          </button>
                        </div>

                        {/* WhatsApp Templates List */}
                        <div className="space-y-4">
                          {formWhatsAppTemplates.map((template, index) => (
                            <div key={template.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                              {/* Template Header */}
                              <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 border-b border-zinc-200">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={template.name}
                                    onChange={(e) => {
                                      const updated = [...formWhatsAppTemplates];
                                      updated[index].name = e.target.value;
                                      setFormWhatsAppTemplates(updated);
                                    }}
                                    className="text-xs font-medium text-zinc-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                                  />
                                  {template.isDefault && (
                                    <span className="rounded-md bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">DEFAULT</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!template.isDefault && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = formWhatsAppTemplates.map(t => ({
                                            ...t,
                                            isDefault: t.id === template.id
                                          }));
                                          setFormWhatsAppTemplates(updated);
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-700"
                                      >
                                        Set Default
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormWhatsAppTemplates(formWhatsAppTemplates.filter(t => t.id !== template.id));
                                        }}
                                        className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {/* Template Fields */}
                              <div className="p-3 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Template Name *</label>
                                  <input
                                    type="text"
                                    value={template.templateName}
                                    onChange={(e) => {
                                      const updated = [...formWhatsAppTemplates];
                                      updated[index].templateName = e.target.value;
                                      setFormWhatsAppTemplates(updated);
                                    }}
                                    placeholder="proposal_template"
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Template Language</label>
                                  <select
                                    value={template.templateLanguage}
                                    onChange={(e) => {
                                      const updated = [...formWhatsAppTemplates];
                                      updated[index].templateLanguage = e.target.value;
                                      setFormWhatsAppTemplates(updated);
                                    }}
                                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                  >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Portuguese">Portuguese</option>
                                  </select>
                                </div>
                                <div className="pt-2 border-t border-zinc-100">
                                  <p className="text-[11px] font-medium text-zinc-600 mb-2">AI Sensy Credentials (Per Template)</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">API Key (Encrypted) *</label>
                                      <input
                                        type="password"
                                        value={template.apiKey}
                                        onChange={(e) => {
                                          const updated = [...formWhatsAppTemplates];
                                          updated[index].apiKey = e.target.value;
                                          setFormWhatsAppTemplates(updated);
                                        }}
                                        placeholder="Leave empty to use .env default"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Partner Number *</label>
                                      <input
                                        type="text"
                                        value={template.partnerNumber}
                                        onChange={(e) => {
                                          const updated = [...formWhatsAppTemplates];
                                          updated[index].partnerNumber = e.target.value;
                                          setFormWhatsAppTemplates(updated);
                                        }}
                                        placeholder="919529945588"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Base URL</label>
                                      <input
                                        type="text"
                                        value={template.baseUrl}
                                        onChange={(e) => {
                                          const updated = [...formWhatsAppTemplates];
                                          updated[index].baseUrl = e.target.value;
                                          setFormWhatsAppTemplates(updated);
                                        }}
                                        placeholder="https://backend.api-wa.co"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                      />
                                      <p className="mt-1 text-[10px] text-zinc-400">API Key will be encrypted when saved. Leave empty to use .env defaults.</p>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-medium text-zinc-500 mb-1">Campaign Name</label>
                                      <input
                                        type="text"
                                        value={template.campaignName}
                                        onChange={(e) => {
                                          const updated = [...formWhatsAppTemplates];
                                          updated[index].campaignName = e.target.value;
                                          setFormWhatsAppTemplates(updated);
                                        }}
                                        placeholder="client-campaign-name"
                                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">Keywords (Optional - comma-separated)</label>
                                  <input
                                    type="text"
                                    value={template.keywords}
                                    onChange={(e) => {
                                      const updated = [...formWhatsAppTemplates];
                                      updated[index].keywords = e.target.value;
                                      setFormWhatsAppTemplates(updated);
                                    }}
                                    placeholder="keyword1, keyword2"
                                    className="w-full rounded-md border border-zinc-200 bg-green-50 px-3 py-2 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300"
                                  />
                                  <p className="mt-1 text-[11px] text-zinc-400">
                                    If keywords match conversation, this template will be selected automatically
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {step === "appointment" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Appointment Booking</p>
                      <p className="text-[11px] text-zinc-500">Configure appointment booking for this agent</p>
                    </div>
                  </div>

                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-900">Enable Appointment Booking</p>
                      <p className="text-[10px] text-zinc-500">When enabled, AI will detect appointment booking intent during calls</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormAppointmentEnabled(!formAppointmentEnabled)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        formAppointmentEnabled ? "bg-emerald-500" : "bg-zinc-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          formAppointmentEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {formAppointmentEnabled && (
                    <>
                      {/* Intent Keywords */}
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-2">
                          Intent Keywords
                        </label>
                        <p className="text-[11px] text-zinc-400 mb-2">
                          When user says any of these keywords, appointment booking will be triggered
                        </p>
                        {/* Separate Default and Custom Keywords */}
                        {(() => {
                          // Split keywords into default and custom
                          const defaultKeywordsList = formAppointmentDefaultKeywords.length > 0 
                            ? getAllDefaultKeywords(formAppointmentDefaultKeywords)
                            : [];
                          
                          const defaultKeywordsInList = formAppointmentKeywords.filter(k => 
                            isDefaultKeyword(k, formAppointmentDefaultKeywords)
                          );
                          
                          const customKeywords = formAppointmentKeywords.filter(k => 
                            !isDefaultKeyword(k, formAppointmentDefaultKeywords)
                          );

                          return (
                            <>
                              {/* Default Keywords Section */}
                              {defaultKeywordsInList.length > 0 && (
                                <div className="mb-4">
                                  <label className="block text-[11px] font-medium text-zinc-600 mb-2">
                                    Default Keywords (System) <span className="text-zinc-400 font-normal">- Cannot be removed</span>
                                  </label>
                                  <p className="text-[11px] text-zinc-400 mb-3">
                                    Pre-configured keywords in various Indian languages. These are automatically included and cannot be removed.
                                  </p>
                                  <div className="space-y-3 max-h-64 overflow-y-auto border border-zinc-200 rounded-md p-3 bg-zinc-50">
                                    {formAppointmentDefaultKeywords.map((group, groupIdx) => {
                                      const groupKeywords = group.keywords.filter(k => 
                                        defaultKeywordsInList.some(dk => 
                                          dk.toLowerCase().trim() === k.toLowerCase().trim()
                                        )
                                      );
                                      
                                      if (groupKeywords.length === 0) return null;
                                      
                                      return (
                                        <div key={groupIdx} className="border-b border-zinc-200 last:border-b-0 pb-2 last:pb-0">
                                          <p className="text-[10px] font-semibold text-zinc-500 mb-2 uppercase">
                                            {group.label}
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {groupKeywords.map((keyword, keywordIdx) => (
                                              <span
                                                key={keywordIdx}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200"
                                                title="Default keyword - cannot be removed"
                                              >
                                                {keyword}
                                                <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded">System</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Custom Keywords Section */}
                              <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-2">
                                  Custom Keywords
                                </label>
                                <p className="text-[11px] text-zinc-400 mb-2">
                                  Add your own custom keywords. These can be added or removed.
                                </p>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={formAppointmentNewKeyword}
                                    onChange={(e) => setFormAppointmentNewKeyword(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter" && formAppointmentNewKeyword.trim()) {
                                        const normalized = formAppointmentNewKeyword.trim().toLowerCase();
                                        if (!formAppointmentKeywords.some(k => k.toLowerCase().trim() === normalized)) {
                                          setFormAppointmentKeywords([...formAppointmentKeywords, formAppointmentNewKeyword.trim()]);
                                          setFormAppointmentNewKeyword("");
                                        }
                                      }
                                    }}
                                    placeholder="Enter custom keyword (e.g., 'book appointment')"
                                    className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (formAppointmentNewKeyword.trim()) {
                                        const normalized = formAppointmentNewKeyword.trim().toLowerCase();
                                        if (!formAppointmentKeywords.some(k => k.toLowerCase().trim() === normalized)) {
                                          setFormAppointmentKeywords([...formAppointmentKeywords, formAppointmentNewKeyword.trim()]);
                                          setFormAppointmentNewKeyword("");
                                        }
                                      }
                                    }}
                                    className="px-3 py-2 bg-emerald-500 text-white rounded-md text-xs font-medium hover:bg-emerald-600"
                                  >
                                    Add
                                  </button>
                                </div>
                                {customKeywords.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {customKeywords.map((keyword, idx) => (
                                      <span
                                        key={`custom-${keyword}-${idx}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[11px]"
                                      >
                                        {keyword}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Remove keyword (case-insensitive match, but keep the original case)
                                            const normalized = keyword.toLowerCase().trim();
                                            setFormAppointmentKeywords(
                                              formAppointmentKeywords.filter(k => 
                                                k.toLowerCase().trim() !== normalized
                                              )
                                            );
                                          }}
                                          className="text-emerald-600 hover:text-emerald-800"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {customKeywords.length === 0 && (
                                  <p className="text-[10px] text-zinc-400 italic mt-2">
                                    No custom keywords added yet. Add keywords above to customize detection.
                                  </p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        <p className="text-[11px] font-medium text-zinc-600">Customizable Questions</p>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Name Question</label>
                          <input
                            type="text"
                            value={formAppointmentNameQuestion}
                            onChange={(e) => setFormAppointmentNameQuestion(e.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Date Question</label>
                          <input
                            type="text"
                            value={formAppointmentDateQuestion}
                            onChange={(e) => setFormAppointmentDateQuestion(e.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[10px] text-zinc-400">Tip: Use [startTime], [endTime], or [timeRange] to show available hours</p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Time Question</label>
                          <input
                            type="text"
                            value={formAppointmentTimeQuestion}
                            onChange={(e) => setFormAppointmentTimeQuestion(e.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                          <p className="mt-1 text-[10px] text-zinc-400">Tip: Use [startTime], [endTime], or [timeRange] to show available hours</p>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Reason Question</label>
                          <input
                            type="text"
                            value={formAppointmentReasonQuestion}
                            onChange={(e) => setFormAppointmentReasonQuestion(e.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Confirmation Question</label>
                          <input
                            type="text"
                            value={formAppointmentConfirmationQuestion}
                            onChange={(e) => setFormAppointmentConfirmationQuestion(e.target.value)}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                        </div>
                      </div>

                      {/* Success Message */}
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">Success Message</label>
                        <input
                          type="text"
                          value={formAppointmentSuccessMessage}
                          onChange={(e) => setFormAppointmentSuccessMessage(e.target.value)}
                          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                        />
                        <p className="mt-1 text-[10px] text-zinc-400">Use placeholders: [name], [date], [time], [phone], [reason], [startTime], [endTime], [timeRange]</p>
                      </div>

                      {/* Slot Management */}
                      <div className="space-y-3">
                        <p className="text-[11px] font-medium text-zinc-600">Slot Management</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={formAppointmentStartTime}
                              onChange={(e) => setFormAppointmentStartTime(e.target.value)}
                              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-600 mb-1">End Time</label>
                            <input
                              type="time"
                              value={formAppointmentEndTime}
                              onChange={(e) => setFormAppointmentEndTime(e.target.value)}
                              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-1">Slot Duration (minutes)</label>
                          <input
                            type="number"
                            value={formAppointmentSlotDuration}
                            onChange={(e) => setFormAppointmentSlotDuration(parseInt(e.target.value) || 30)}
                            min={15}
                            max={120}
                            step={15}
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-600 mb-2">Working Days</label>
                          <div className="flex gap-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (formAppointmentWorkingDays.includes(idx)) {
                                    setFormAppointmentWorkingDays(formAppointmentWorkingDays.filter(d => d !== idx));
                                  } else {
                                    setFormAppointmentWorkingDays([...formAppointmentWorkingDays, idx].sort());
                                  }
                                }}
                                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                                  formAppointmentWorkingDays.includes(idx)
                                    ? "bg-emerald-500 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {step === "test" && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Test Call</p>
                      <p className="text-[11px] text-zinc-500">Initiate an outbound call to test this agent</p>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-[11px] text-green-700">
                    <p className="font-medium mb-0.5">📞 Test Your Agent</p>
                    <p>Make a test call to verify your agent's configuration and behavior. Select a phone number and enter the recipient's number. {!selectedId && mode === "create" && "The agent will be created automatically when you initiate a test call."}</p>
                  </div>

                  {/* Phone Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Select Phone Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPhone}
                      onChange={(e) => setSelectedPhone(e.target.value)}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      disabled={!Array.isArray(phones) || phones.length === 0}
                    >
                      {!Array.isArray(phones) || phones.length === 0 ? (
                        <option value="">No phone numbers available</option>
                      ) : (
                        phones.map((phone) => (
                          <option key={phone._id} value={phone._id}>
                            {phone.number} {phone.provider ? `(${phone.provider})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                    {(!Array.isArray(phones) || phones.length === 0) && (
                      <p className="mt-1 text-[11px] text-zinc-400">
                        No phone numbers available. Please add a phone number first.
                      </p>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                      Recipient Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={callPhoneNumber}
                      onChange={(e) => setCallPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                      disabled={initiatingCall || phones.length === 0}
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Enter phone number in E.164 format (e.g., +919876543210)
                    </p>
                  </div>

                  {/* Initiate Call Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleInitiateCall}
                      disabled={initiatingCall || !callPhoneNumber || !selectedPhone || !Array.isArray(phones) || phones.length === 0}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {initiatingCall ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Initiating Call...
                        </>
                      ) : (
                        <>
                          <Phone className="h-3.5 w-3.5 mr-2" />
                          Initiate Call
                        </>
                      )}
                    </button>
                  </div>

                  {/* Call Status Display */}
                  {callStatus && (
                    <div
                      className={`p-3 rounded-lg border-l-4 ${
                        callStatus.success
                          ? 'bg-emerald-50 border-emerald-500'
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <p
                        className={`text-xs ${
                          callStatus.success ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {callStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-between border-t border-zinc-200 px-5 py-3 text-xs">
              <button
                onClick={() => setIsOpen(false)}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Saving...
                  </>
                ) : mode === "create" ? (
                  "Create agent"
                ) : (
                  "Update agent"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Info;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] ${
        active
          ? "border-emerald-500 text-emerald-600"
          : "border-transparent text-zinc-500 hover:text-zinc-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
