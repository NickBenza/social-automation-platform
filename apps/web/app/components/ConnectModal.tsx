"use client";

import { useState } from "react";
import { X, ExternalLink, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface ConnectModalProps {
  platform: "threads" | "linkedin" | "x" | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const PLATFORM_CONFIG = {
  threads: {
    name: "Threads",
    icon: "🧵",
    color: "from-purple-500 to-pink-500",
    description: "Connect your Threads account to automate posts and engagement.",
    steps: [
      "Click 'Start Connection' below",
      "Sign in to your Meta/Instagram account",
      "Authorize the app to post on your behalf",
      "You'll be redirected back automatically"
    ],
    apiNote: "Uses Meta's official Threads API. Your credentials are never stored.",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    color: "from-blue-600 to-blue-800",
    description: "Connect your LinkedIn profile to share professional content.",
    steps: [
      "Click 'Start Connection' below",
      "Sign in to your LinkedIn account",
      "Allow posting permissions",
      "You'll be redirected back automatically"
    ],
    apiNote: "Uses LinkedIn's official API. Your credentials are never stored.",
  },
  x: {
    name: "X (Twitter)",
    icon: "𝕏",
    color: "from-gray-800 to-black",
    description: "Connect your X account to post and engage.",
    steps: [
      "Requires X API Basic tier ($100/month)",
      "Contact support to enable X integration",
      "We'll walk you through API key setup"
    ],
    apiNote: "X charges $100/month for API access. This integration is optional.",
  },
};

export function ConnectModal({ platform, isOpen, onClose, userId }: ConnectModalProps) {
  const [step, setStep] = useState<"intro" | "connecting" | "waiting" | "success" | "error" | "not-configured">("intro");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !platform) return null;

  const config = PLATFORM_CONFIG[platform];

  const startConnection = async () => {
    setStep("connecting");
    setError(null);

    try {
      // Call the API to get the OAuth URL
      const url = `/api/auth/${platform}?userId=${userId}`;
      console.log("[ConnectModal] Fetching:", url);
      
      const response = await fetch(url);
      console.log("[ConnectModal] Response status:", response.status);
      console.log("[ConnectModal] Content-Type:", response.headers.get("content-type"));
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[ConnectModal] Non-JSON response:", text.substring(0, 500));
        throw new Error(`Server returned ${response.status}. Check terminal console for details.`);
      }
      
      const data = await response.json();
      console.log("[ConnectModal] Response data:", data);

      if (!response.ok) {
        // Handle "not configured" error specially
        if (data.error?.includes("not configured")) {
          setStep("not-configured");
          setError(data.details || "Platform not configured");
          return;
        }
        throw new Error(data.error || data.details || "Failed to start connection");
      }

      if (data.authUrl) {
        // Open OAuth in popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.authUrl,
          `Connect ${config.name}`,
          `width=${width},height=${height},left=${left},top=${top},popup=1`
        );

        if (!popup) {
          // Popup blocked, redirect in same window
          window.location.href = data.authUrl;
          return;
        }

        setStep("waiting");

        // Listen for message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === "OAUTH_SUCCESS") {
            setStep("success");
            window.removeEventListener("message", handleMessage);
            // Refresh page after 2 seconds
            setTimeout(() => window.location.reload(), 2000);
          } else if (event.data?.type === "OAUTH_ERROR") {
            setStep("error");
            setError(event.data.error || "Connection failed");
            window.removeEventListener("message", handleMessage);
          }
        };

        window.addEventListener("message", handleMessage);

        // Check if popup closed without completing
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            if (step === "waiting") {
              setStep("intro");
            }
          }
        }, 1000);
      }
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center text-xl`}>
              {config.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connect {config.name}</h2>
              <p className="text-sm text-gray-500">Setup takes 30 seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "intro" && (
            <div className="space-y-6">
              <p className="text-gray-600">{config.description}</p>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">What happens:</h3>
                <ol className="space-y-2">
                  {config.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>{config.apiNote}</p>
              </div>

              <button
                onClick={startConnection}
                className={`w-full py-3 px-4 bg-gradient-to-r ${config.color} text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
              >
                <ExternalLink className="w-4 h-4" />
                Start Connection
              </button>
            </div>
          )}

          {step === "connecting" && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Preparing connection...</h3>
              <p className="text-sm text-gray-500">This will only take a moment</p>
            </div>
          )}

          {step === "waiting" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Complete in popup</h3>
              <p className="text-sm text-gray-500 mb-4">
                A window opened for you to authorize {config.name}.
                <br />
                Waiting for you to complete...
              </p>
              <button
                onClick={() => setStep("intro")}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel and try again
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connected!</h3>
              <p className="text-gray-600">Your {config.name} account is now linked.</p>
              <p className="text-sm text-gray-400 mt-4">Refreshing dashboard...</p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Connection failed</h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={() => setStep("intro")}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          )}

          {step === "not-configured" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {config.name} Not Configured
              </h3>
              <p className="text-gray-600 mb-4">
                This platform needs to be set up by the platform owner before customers can connect their accounts.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Platform Owner Setup Required:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Create a {config.name} Developer App</li>
                  <li>Get OAuth credentials (Client ID & Secret)</li>
                  <li>Add credentials to environment variables</li>
                  <li>Restart the server</li>
                </ol>
                <a 
                  href="https://github.com/NickBenza/social-automation-platform/blob/main/docs/API_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-3"
                >
                  View Setup Guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-gray-400">
                For demo purposes, this is expected behavior until OAuth is configured.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}