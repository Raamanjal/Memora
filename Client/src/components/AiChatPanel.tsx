import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export function AiChatPanel({ onSave }: { onSave: () => void }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/ai/chat`, { message }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (response.data.action === "save") {
        setMessage("");
        onSave();
      } else {
        // Fallback for Q&A action
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process message.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="ai-chat" className="text-sm font-medium text-slate-700">
          Ask Brainly AI
        </label>
        <div className="flex gap-2">
          <input
            id="ai-chat"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Save this video about Rags https://youtube.com/..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
        {error && <p className="text-sm text-violet-600">{error}</p>}
      </form>
    </div>
  );
}