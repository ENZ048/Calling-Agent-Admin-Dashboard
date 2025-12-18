"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, PhoneCall, Loader2, Music, RefreshCw } from "lucide-react";
import { formatCredits, formatDuration } from "@/lib/utils";
import { fetchCallLogDetail, CallLogDetail, fetchRecording, downloadRecording } from "@/lib/api";
import { AudioPlayer } from "@/components/calls/AudioPlayer";
import { useToast } from "@/lib/toast";

export default function CallDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const toast = useToast();

  const [call, setCall] = useState<CallLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingRecording, setFetchingRecording] = useState(false);

  useEffect(() => {
    if (id) {
      loadCall(id);
    }
  }, [id]);

  const loadCall = async (callId: string) => {
    try {
      setLoading(true);
      const data = await fetchCallLogDetail(callId);
      setCall(data);
    } catch (error: any) {
      console.error("Error loading call:", error);
      toast.error(error.message || "Failed to load call details");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRecording = async () => {
    if (!id) return;

    try {
      setFetchingRecording(true);
      const { recordingUrl: fetchedUrl } = await fetchRecording(id);

      if (fetchedUrl && call) {
        setCall({ ...call, recordingUrl: fetchedUrl });
        toast.success("Recording fetched successfully!");
      } else {
        toast.warning("Recording not available yet. It may still be processing.");
      }
    } catch (error: any) {
      console.error("Error fetching recording:", error);
      const message = error.response?.data?.message || error.message || "Failed to fetch recording";
      toast.error(message);
    } finally {
      setFetchingRecording(false);
    }
  };

  const handleDownloadRecording = async () => {
    if (!id) return;

    try {
      const blob = await downloadRecording(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recording downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading recording:", error);
      toast.error(error.message || "Failed to download recording");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/calls"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to calls
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">Call not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/calls"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to calls
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <PhoneCall className="h-3 w-3" />
            <span>Call detail</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Call {call.sessionId || call.id}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {call.phone} · {call.callType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500 mb-1">Status</p>
          <p className="text-sm font-semibold">{call.outcome || call.status}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500 mb-1">Duration</p>
          <p className="text-sm font-semibold">{formatDuration(call.durationSec)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500 mb-1">Credits</p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatCredits(call.credits)}
          </p>
        </div>
      </div>

      {/* Recording Player */}
      {call.recordingUrl && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Music className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-semibold tracking-tight">Call Recording</h2>
          </div>
          <AudioPlayer
            src={call.recordingUrl}
            onDownload={handleDownloadRecording}
          />
        </div>
      )}

      {/* Fetch Recording Button */}
      {!call.recordingUrl && (call.status === "completed" || call.status === "user-ended" || call.status === "agent-ended") && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <button
            onClick={handleFetchRecording}
            disabled={fetchingRecording}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {fetchingRecording ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Fetch Recording
              </>
            )}
          </button>
        </div>
      )}

      {/* Transcript */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight">Transcript</h2>
          {call.recordingUrl && (
            <button
              onClick={handleDownloadRecording}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100"
            >
              Download recording
            </button>
          )}
        </div>
        {call.transcript && call.transcript.length > 0 ? (
          <div className="space-y-2 text-xs text-zinc-700">
            {call.transcript.map((entry, index) => (
              <p key={index}>
                <span className="font-semibold text-zinc-900">{entry.speaker}:</span> {entry.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-zinc-500">
            No transcript available
          </div>
        )}
      </div>
    </div>
  );
}


