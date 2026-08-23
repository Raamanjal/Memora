import { useEffect, useRef, useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { BACKEND_URL } from "../config";
import axios from "axios";
import type { Tag } from "./Card";

enum ContentType {
  Youtube = "video",
  Twitter = "tweet",
  Image = "image",
  Article = "article",
  Pdf = "pdf",
  Audio = "audio",
}

const contentTypes = [
  { value: ContentType.Youtube, label: "YouTube" },
  { value: ContentType.Twitter, label: "Twitter / X" },
  { value: ContentType.Image, label: "Image" },
  { value: ContentType.Article, label: "Article" },
  { value: ContentType.Pdf, label: "PDF" },
  { value: ContentType.Audio, label: "Audio" },
];

export function CreateContentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState(ContentType.Youtube);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    axios.get(`${BACKEND_URL}/api/v1/tags`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((response) => setAvailableTags(response.data.tags)).catch(() => {
      setError("Unable to load your tags.");
    });
  }, [open]);

  if (!open) return null;

  async function addContent() {
    const title = titleRef.current?.value.trim() ?? "";
    const link = linkRef.current?.value.trim() ?? "";

    if (type === ContentType.Pdf && uploadedPdfFile) {
      if (!title) {
        setError("Please enter a title for the PDF.");
        return;
      }
    } else {
      if (!title || !link) {
        setError("Please add both a title and a link.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (type === ContentType.Pdf && uploadedPdfFile) {
        const formData = new FormData();
        formData.append("pdf", uploadedPdfFile);
        formData.append("title", title);
        formData.append("tags", JSON.stringify(selectedTagIds));

        await axios.post(`${BACKEND_URL}/api/v1/content/upload-pdf`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/v1/content`, { link, title, type, tags: selectedTagIds }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to add content. Check details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]);
  }

  async function createTag() {
    const title = newTagName.trim();
    if (!title) return;

    const matchingTag = availableTags.find((tag) => tag.title.toLowerCase() === title.toLowerCase());
    if (matchingTag) {
      if (!selectedTagIds.includes(matchingTag._id)) toggleTag(matchingTag._id);
      setNewTagName("");
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/tags`, { title }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const tag = response.data.tag as Tag;
      setAvailableTags((current) => [...current, tag].sort((a, b) => a.title.localeCompare(b.title)));
      setSelectedTagIds((current) => [...current, tag._id]);
      setNewTagName("");
    } catch {
      setError("Unable to create this tag. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-content-title">
      <div className="w-full max-w-md rounded-2xl glass-card bg-white/90 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">Memora</p>
            <h2 id="add-content-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Add content</h2>
            <p className="mt-1 text-sm text-slate-500">Save a useful link or document to revisit later.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add content dialog" className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <CrossIcon />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input ref={titleRef} placeholder="e.g. Learn TypeScript" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>

          {type === ContentType.Pdf ? (
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1.5">PDF Document</span>
              <div className="space-y-2">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadedPdfFile(file);
                    if (file && titleRef.current && !titleRef.current.value) {
                      titleRef.current.value = file.name.replace(/\.pdf$/i, "");
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-xs text-slate-400">or paste a link</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <input
                  ref={linkRef}
                  type="url"
                  disabled={Boolean(uploadedPdfFile)}
                  placeholder="https://drive.google.com/... or public PDF link"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:opacity-60"
                />
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Link</span>
              <input ref={linkRef} type="url" placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </label>
          )}

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Content type</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {contentTypes.map((contentType) => <button
                key={contentType.value}
                type="button"
                aria-pressed={type === contentType.value}
                onClick={() => {
                  setType(contentType.value);
                  setUploadedPdfFile(null);
                  if (pdfInputRef.current) pdfInputRef.current.value = "";
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${type === contentType.value ? "border-indigo-600 bg-indigo-600 text-white shadow-sm" : "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
              >
                {contentType.label}
              </button>)}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Tags</legend>
            <p className="mt-1 text-xs text-slate-500">Select existing tags or add a new one for future content.</p>
            {availableTags.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
              {availableTags.map((tag) => <button
                key={tag._id}
                type="button"
                aria-pressed={selectedTagIds.includes(tag._id)}
                onClick={() => toggleTag(tag._id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${selectedTagIds.includes(tag._id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
              >{tag.title}</button>)}
            </div>}
            <div className="mt-3 flex gap-2">
              <input
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createTag(); } }}
                placeholder="New tag, then Enter"
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button type="button" onClick={() => void createTag()} className="shrink-0 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">Add</button>
            </div>
          </fieldset>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={addContent} disabled={isSubmitting} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "Adding..." : "Add content"}</button>
        </div>
      </div>
    </div>
  );
}
