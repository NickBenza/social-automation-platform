/**
 * OAuth Callback Page for Threads
 * Handles the redirect from Meta after user authorizes the app
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ThreadsCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Threads...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is the userId
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Invalid callback parameters");
      return;
    }

    // Exchange code for token
    fetch("/api/auth/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(`Connected as @${data.username}`);
          // Redirect back to platforms page after 2 seconds
          setTimeout(() => router.push("/?tab=platforms"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to connect");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Connecting...</h1>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Connected!</h1>
            <p className="text-gray-500">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h1>
            <p className="text-gray-500">{message}</p>
            <button
              onClick={() => router.push("/?tab=platforms")}
              className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Back to Platforms
            </button>
          </>
        )}
      </div>
    </div>
  );
}