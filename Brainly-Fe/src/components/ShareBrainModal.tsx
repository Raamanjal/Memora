import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { CrossIcon } from "../icons/CrossIcon";
import { ShareIcon } from "../icons/ShareIcon";

interface ShareBrainModalProps {
  open: boolean;
  itemCount: number;
  onClose: () => void;
}

export function ShareBrainModal({ open, itemCount, onClose }: ShareBrainModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sharing" | "shared" | "error">("loading");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus("loading");
    setShareUrl("");
    setCopied(false);

    axios.get(`${BACKEND_URL}/api/v1/brain/share`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((response) => {
        if (response.data.shared && response.data.hash) {
          setShareUrl(`${window.location.origin}/share/${response.data.hash}`);
          setStatus("shared");
        } else {
          setStatus("idle");
        }
      })
      .catch(() => {
        setStatus("idle");
      });
  }, [open]);

  if (!open) return null;

  async function shareBrain() {
    setStatus("sharing");
    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/brain/share`, { share: true }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const url = `${window.location.origin}/share/${response.data.hash}`;
      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }

      setStatus("shared");
    } catch {
      setStatus("error");
    }
  }

  async function stopSharing() {
    setStatus("sharing");
    try {
      await axios.post(`${BACKEND_URL}/api/v1/brain/share`, { share: false }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShareUrl("");
      setCopied(false);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function regenerateLink() {
    setStatus("sharing");
    try {
      // First stop sharing to delete old hash
      await axios.post(`${BACKEND_URL}/api/v1/brain/share`, { share: false }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Then share again to get a new hash
      const response = await axios.post(`${BACKEND_URL}/api/v1/brain/share`, { share: true }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const url = `${window.location.origin}/share/${response.data.hash}`;
      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }

      setStatus("shared");
    } catch {
      setStatus("error");
    }
  }

  function handleCopy() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => setCopied(true));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="share-brain-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-brain-title" className="text-base font-semibold text-slate-900">
            {status === "shared" ? "Your Second Brain is shared" : "Share Your Second Brain"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close share dialog" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <CrossIcon />
          </button>
        </div>

        {status === "loading" ? (
          <p className="mt-5 text-sm text-slate-500 text-center py-6">Loading sharing details...</p>
        ) : status === "shared" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5">
              <p className="text-xs leading-4.5 font-medium text-amber-800">
                <strong>Warning:</strong> Sharing exposes your entire collection of notes, links, tags, and files to anyone who has this URL.
              </p>
            </div>
            
            <p className="text-sm leading-5 text-slate-600">
              {copied ? "Your public link has been copied to the clipboard!" : "Your public link is ready. Copy it below to share."}
            </p>

            <div className="flex gap-2">
              <input readOnly value={shareUrl} aria-label="Public share link" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none" onFocus={(event) => event.currentTarget.select()} />
              <button type="button" onClick={handleCopy} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 shrink-0">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button type="button" onClick={regenerateLink} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Regenerate link
              </button>
              <button type="button" onClick={stopSharing} className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2.5 text-sm font-medium hover:bg-red-100">
                Stop sharing
              </button>
            </div>

            <button type="button" onClick={onClose} className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700">Done</button>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm leading-5 text-slate-600">Share your entire collection of notes, documents, tweets, and videos with others. They&apos;ll be able to view your content in their own Second Brain.</p>
            <button type="button" onClick={shareBrain} disabled={status === "sharing"} className="mt-4 flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
              <span className="mr-2"><ShareIcon /></span>
              {status === "sharing" ? "Creating link..." : "Share Brain"}
            </button>
            {status === "error" && <p className="mt-3 text-center text-sm text-red-600">We couldn&apos;t update your share settings. Please try again.</p>}
            <p className="mt-3 text-center text-xs text-slate-500">{itemCount} {itemCount === 1 ? "item" : "items"} will be shared</p>
          </>
        )}
      </div>
    </div>
  );
}
