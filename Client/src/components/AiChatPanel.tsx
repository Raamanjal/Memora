import { useState, useRef } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { PaperclipIcon } from "../icons/PaperclipIcon";
import { PdfIcon } from "../icons/PdfIcon";

export function AiChatPanel({ onSave }: { onSave: () => void }) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFeedback({ type: "error", text: "Please select a valid PDF file." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setFeedback({ type: "error", text: "File size exceeds 20MB limit." });
      return;
    }

    setSelectedFile(file);
    setFeedback(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = e.clipboardData.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
        e.preventDefault();
        if (file.size > 20 * 1024 * 1024) {
          setFeedback({ type: "error", text: "File size exceeds 20MB limit." });
          return;
        }
        setSelectedFile(file);
        setFeedback(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      if (selectedFile) {
        // Handle PDF file upload via Multer + Cloudinary
        const formData = new FormData();
        formData.append("pdf", selectedFile);
        if (message.trim()) {
          formData.append("title", message.trim());
        }

        const response = await axios.post(`${BACKEND_URL}/api/v1/content/upload-pdf`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setMessage("");
        removeFile();
        setFeedback({
          type: "success",
          text: `🎉 Saved "${response.data.content?.title || selectedFile.name}" to your Brain! AI summary will be ready shortly.`,
        });
        onSave();
      } else {
        // Handle natural language chat / link save via AI tool calling
        const response = await axios.post(
          `${BACKEND_URL}/api/v1/ai/chat`,
          { message },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        if (response.data.action === "save") {
          setMessage("");
          setFeedback({
            type: "success",
            text: `🎉 Saved "${response.data.title || "Content"}" to your Brain!`,
          });
          onSave();
        } else {
          // Q&A action fallback
          setFeedback({
            type: "info",
            text: response.data.message,
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to process request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="ai-chat" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            Brainly AI
          </label>
          <span className="text-xs text-slate-400">Paste links, attach PDFs, or ask questions</span>
        </div>

        {/* Selected File Chip */}
        {selectedFile && (
          <div className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-200 px-3.5 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-red-100 text-red-600 shrink-0">
                <PdfIcon />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-violet-100 transition-colors"
              title="Remove file"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input & Action Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              id="ai-chat"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onPaste={handlePaste}
              disabled={isLoading}
              placeholder={
                selectedFile
                  ? "Add a custom title or notes (optional)..."
                  : "e.g. Save this video https://youtube.com/... or paste/attach a PDF"
              }
              className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Paperclip Button inside Input */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach a PDF document"
              className={`absolute right-2.5 p-1.5 rounded-lg transition-colors ${selectedFile
                ? "bg-violet-100 text-violet-700"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              <PaperclipIcon className="size-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!message.trim() && !selectedFile)}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{selectedFile ? "Uploading..." : "Thinking..."}</span>
              </>
            ) : (
              <span>{selectedFile ? "Upload" : "Send"}</span>
            )}
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <p
            className={`text-xs px-1 ${feedback.type === "error"
              ? "text-red-600"
              : feedback.type === "success"
                ? "text-emerald-600 font-medium"
                : "text-violet-600"
              }`}
          >
            {feedback.text}
          </p>
        )}
      </form>
    </div>
  );
}