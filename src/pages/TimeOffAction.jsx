import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function TimeOffAction() {
  const [status, setStatus] = useState("loading"); // loading | success | denied | already_processed | error
  const [message, setMessage] = useState("");
  const [requestInfo, setRequestInfo] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");
    const action = params.get("action");

    if (!requestId || !action) {
      setStatus("error");
      setMessage("Missing required parameters.");
      return;
    }

    processAction(requestId, action);
  }, []);

  const processAction = async (requestId, action) => {
    const response = await base44.functions.invoke("processTimeOffAction", {
      requestId,
      action,
    });

    const result = response.data;

    if (result.already_processed) {
      setStatus("already_processed");
      setMessage(`This request was already ${result.current_status}.`);
      setRequestInfo(result.request);
    } else if (result.success) {
      setStatus(action === "approve" ? "success" : "denied");
      setRequestInfo(result.request);
    } else {
      setStatus("error");
      setMessage(result.error || "Something went wrong.");
    }
  };

  const configs = {
    loading: {
      icon: <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />,
      bg: "bg-blue-50",
      title: "Processing...",
      subtitle: "Please wait while we update this request.",
    },
    success: {
      icon: <CheckCircle2 className="h-10 w-10 text-green-600" />,
      bg: "bg-green-50",
      title: "Request Approved ✅",
      subtitle: requestInfo
        ? `${requestInfo.first_name} ${requestInfo.last_name}'s time-off (${requestInfo.start_date} → ${requestInfo.end_date}) has been approved, added to the calendar, and the employee has been notified.`
        : "",
    },
    denied: {
      icon: <XCircle className="h-10 w-10 text-red-600" />,
      bg: "bg-red-50",
      title: "Request Denied ❌",
      subtitle: requestInfo
        ? `${requestInfo.first_name} ${requestInfo.last_name}'s time-off request has been denied and the employee has been notified.`
        : "",
    },
    already_processed: {
      icon: <AlertCircle className="h-10 w-10 text-yellow-600" />,
      bg: "bg-yellow-50",
      title: "Already Processed ⚠️",
      subtitle: message,
    },
    error: {
      icon: <XCircle className="h-10 w-10 text-red-600" />,
      bg: "bg-red-50",
      title: "Error",
      subtitle: message,
    },
  };

  const cfg = configs[status];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 ${cfg.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {cfg.icon}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{cfg.title}</h1>
        <p className="text-gray-500 text-sm leading-relaxed">{cfg.subtitle}</p>
        <p className="text-gray-400 text-xs mt-8">You can close this tab.</p>
      </div>
    </div>
  );
}