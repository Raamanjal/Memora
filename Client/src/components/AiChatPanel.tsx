import { useState, useRef, useEffect } from "react";
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

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  sources?: SourceCitation[];
}

export function AiChatPanel({ onSave }: { onSave: () => void }) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading]);

  const toggleSources = (messageId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage && !selectedFile) return;

    // Build the user message for UI
    let userText = currentMessage;
    if (selectedFile) {
        userText = userText ? `[Attached: ${selectedFile.name}]\n${userText}` : `[Attached: ${selectedFile.name}]`;
    }

    const newUserMsg: ChatMessage = {
      id: Date.now().toString() + "_user",
      role: "user",
      content: userText
    };

    setChatHistory(prev => [...prev, newUserMsg]);
    setMessage("");
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

        removeFile();
        
        const aiResponse: ChatMessage = {
          id: Date.now().toString() + "_ai",
          role: "model",
          content: `🎉 Saved "${response.data.content?.title || selectedFile.name}" to your Brain! AI summary will be ready shortly.`
        };
        setChatHistory(prev => [...prev, aiResponse]);
        onSave();
      } else {
        // Format history for backend
        const formattedHistory = chatHistory.map(msg => ({
          role: msg.role,
          text: msg.content
        }));

        const response = await axios.post(
          `${BACKEND_URL}/api/v1/ai/chat`,
          { message: currentMessage, history: formattedHistory },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        if (response.data.action === "save") {
          const aiResponse: ChatMessage = {
            id: Date.now().toString() + "_ai",
            role: "model",
            content: `🎉 Saved "${response.data.title || "Content"}" to your Brain!`
          };
          setChatHistory(prev => [...prev, aiResponse]);
          onSave();
        } else if (response.data.action === "ask") {
          if (response.data.answer) {
            const aiResponse: ChatMessage = {
              id: Date.now().toString() + "_ai",
              role: "model",
              content: response.data.answer,
              sources: response.data.sources || []
            };
            setChatHistory(prev => [...prev, aiResponse]);
          } else {
            const aiResponse: ChatMessage = {
              id: Date.now().toString() + "_ai",
              role: "model",
              content: response.data.message || "I couldn't find any relevant content in your library."
            };
            setChatHistory(prev => [...prev, aiResponse]);
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
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200/90 transition-all flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <SparklesIcon className="size-3.5" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Memora AI</span>
        </div>
        <span className="text-xs text-slate-400">Ask questions, save links, or upload PDFs</span>
      </div>

      {/* Chat History Area */}
      {chatHistory.length > 0 && (
        <div className="flex-1 max-h-[60vh] min-h-[300px] overflow-y-auto p-5 space-y-6 scroll-smooth">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-sm rounded-tr-sm' 
                  : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-md">
                        <SparklesIcon className="size-3" /> Memora AI
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        title="Copy answer"
                      >
                        {copiedMessageId === msg.id ? <CheckIcon className="size-3.5 text-emerald-600" /> : <CopyIcon className="size-3.5" />}
                      </button>
                    </div>
                    
                    <div className="text-sm prose prose-sm prose-slate max-w-none">
                      <MarkdownRenderer content={msg.content} />
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>{expandedSources[msg.id] ? "Hide" : "Show"} Cited Sources ({msg.sources.length})</span>
                          <svg className={`size-3.5 transition-transform duration-200 ${expandedSources[msg.id] ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {msg.sources.map((source) => (
                              <div key={`${source.contentId}-${source.chunkIndex}`} className="flex flex-col justify-between rounded-xl bg-white p-3 text-xs border border-slate-200/80">
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                                      Source [{source.number}]
                                    </span>
                                    {source.score !== undefined && (
                                      <span className="text-[10px] font-medium text-slate-400">{(source.score * 100).toFixed(0)}% match</span>
                                    )}
                                  </div>
                                  {source.title && <h4 className="font-medium text-slate-900 truncate mb-1">{source.title}</h4>}
                                  <p className="text-slate-600 line-clamp-3 leading-relaxed">&ldquo;{source.preview}&rdquo;</p>
                                </div>
                                {source.link && (
                                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                                    <a href={source.link} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
                                      <span>Open source</span><span>↗</span>
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
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                 <svg className="animate-spin size-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-slate-500 font-medium">{selectedFile ? "Uploading..." : "Thinking..."}</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Selected File Chip */}
          {selectedFile && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200/80 px-3 py-2 w-max max-w-full">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
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

          {/* Feedback Toast */}
          {feedback && (
            <div className={`text-xs px-3 py-2 rounded-lg transition-all ${
              feedback.type === "error" ? "bg-red-50 text-red-700 border border-red-200"
              : feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
              : "bg-slate-50 text-slate-700 border border-slate-200 font-medium"
            }`}>
              {feedback.text}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <input
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
                className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach a PDF document"
                className={`absolute right-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedFile ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
              {selectedFile ? "Upload" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}