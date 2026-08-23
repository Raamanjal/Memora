import { useState, useRef } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { PaperclipIcon } from "../icons/PaperclipIcon";
import { PdfIcon } from "../icons/PdfIcon";
import { SparklesIcon } from "../icons/SparklesIcon";
import { CopyIcon } from "../icons/CopyIcon";
import { CheckIcon } from "../icons/CheckIcon";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface SourceCitation {
  number: number;
  contentId: string;
  chunkIndex: number;
  title?: string;
  link?: string;
  type?: string;
  score?: number;
  preview: string;
}

interface RagResponse {
  question: string;
  answer: string;
  sources: SourceCitation[];
}

export function AiChatPanel({ onSave }: { onSave: () => void }) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [ragResponse, setRagResponse] = useState<RagResponse | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    if (!ragResponse?.answer) return;
    navigator.clipboard.writeText(ragResponse.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage && !selectedFile) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("pdf", selectedFile);
        if (currentMessage) {
          formData.append("title", currentMessage);
        }

        const response = await axios.post(`${BACKEND_URL}/api/v1/content/upload-pdf`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setMessage("");
        removeFile();
        setRagResponse(null);
        setFeedback({
          type: "success",
          text: `🎉 Saved "${response.data.content?.title || selectedFile.name}" to your Brain! AI summary will be ready shortly.`,
        });
        onSave();
      } else {
        const response = await axios.post(
          `${BACKEND_URL}/api/v1/ai/chat`,
          { message: currentMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        if (response.data.action === "save") {
          setMessage("");
          setRagResponse(null);
          setFeedback({
            type: "success",
            text: `🎉 Saved "${response.data.title || "Content"}" to your Brain!`,
          });
          onSave();
        } else if (response.data.action === "ask") {
          setMessage("");
          if (response.data.answer) {
            setRagResponse({
              question: currentMessage,
              answer: response.data.answer,
              sources: response.data.sources || [],
            });
            setShowSources(false);
            setFeedback(null);
          } else {
            setRagResponse(null);
            setFeedback({
              type: "info",
              text: response.data.message || "I couldn't find any relevant content in your library.",
            });
          }
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
    <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/90 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <SparklesIcon className="size-3.5" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Memora AI</span>
          </div>
          <span className="text-xs text-slate-400">Ask questions, save links, or upload PDFs</span>
        </div>

        {/* Selected File Chip */}
        {selectedFile && (
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200/80 px-3.5 py-2.5">
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
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-indigo-100 transition-colors"
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
                  : "Ask anything about your notes, or paste a link to save..."
              }
              className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 disabled:opacity-50"
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
              className={`absolute right-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${selectedFile
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
            >
              <PaperclipIcon className="size-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!message.trim() && !selectedFile)}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{selectedFile ? "Uploading..." : "Searching..."}</span>
              </>
            ) : (
              <span>{selectedFile ? "Upload" : "Ask / Save"}</span>
            )}
          </button>
        </div>

        {/* Feedback Toast / Status */}
        {feedback && (
          <div
            className={`text-xs px-3 py-2 rounded-lg transition-all ${feedback.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                  : "bg-slate-50 text-slate-700 border border-slate-200 font-medium"
              }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Polished AI Answer Card */}
        {ragResponse && (
          <div className="mt-2 rounded-xl bg-slate-50/70 border border-slate-200/90 p-4.5 transition-all">
            {/* Answer Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                  <SparklesIcon className="size-3" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 truncate">AI Answer</h3>
                  <p className="text-[11px] text-slate-500 truncate italic">&ldquo;{ragResponse.question}&rdquo;</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Copy answer text"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRagResponse(null)}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close answer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Rich Markdown Formatted AI Answer */}
            <div className="pt-3">
              <MarkdownRenderer content={ragResponse.answer} />
            </div>

            {/* Cited Sources Accordion */}
            {ragResponse.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
                >
                  <span>{showSources ? "Hide" : "Show"} Cited Sources ({ragResponse.sources.length})</span>
                  <svg
                    className={`size-3.5 transition-transform duration-200 ${showSources ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSources && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {ragResponse.sources.map((source) => (
                      <div
                        key={`${source.contentId}-${source.chunkIndex}`}
                        className="flex flex-col justify-between rounded-xl bg-white p-3 text-xs border border-slate-200/80 hover:border-slate-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                              Source [{source.number}]
                            </span>
                            {source.score !== undefined && (
                              <span className="text-[10px] font-medium text-slate-400">
                                {(source.score * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>

                          {source.title && (
                            <h4 className="font-medium text-slate-900 truncate mb-1" title={source.title}>
                              {source.title}
                            </h4>
                          )}

                          <p className="text-slate-600 line-clamp-3 leading-relaxed">
                            &ldquo;{source.preview}&rdquo;
                          </p>
                        </div>

                        {source.link && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                            <a
                              href={source.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Open source</span>
                              <span>↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}