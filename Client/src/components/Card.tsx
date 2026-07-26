import { useState } from "react";
import { DeleteIcon } from "../icons/DeleteIcon";
import { ImageIcon } from "../icons/ImageIcon";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { PdfIcon } from "../icons/PdfIcon";
import { ArticleIcon } from "../icons/ArticleIcon";
import { AudioIcon } from "../icons/AudioIcon";

export type ContentType = "tweet" | "video" | "image" | "article" | "audio" | "pdf";

export interface Tag {
  _id: string;
  title: string;
}

interface CardProps {
  contentId: string;
  title: string;
  link: string;
  type: ContentType;
  tags?: Tag[];
  onDelete?: (contentId: string) => Promise<void>;
  readOnly?: boolean;
}

function ContentTypeIcon({ type }: { type: ContentType }) {
  const className = "size-4";
  if (type === "video") return <YoutubeIcon className={className} />;
  if (type === "tweet") return <TwitterIcon className={className} />;
  if (type === "pdf") return <PdfIcon className={className} />;
  if (type === "article") return <ArticleIcon className={className} />;
  if (type === "audio") return <AudioIcon className={className} />;
  return <ImageIcon className={className} />;
}

function getGoogleDriveFileId(link: string) {
  const filePathMatch = link.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  const queryMatch = link.match(/drive\.google\.com\/(?:open|uc)\?[^#]*\bid=([^&#]+)/);
  return filePathMatch?.[1] ?? queryMatch?.[1];
}

function getPdfPreviewUrl(link: string) {
  const fileId = getGoogleDriveFileId(link);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : link;
}

function getWebsiteDetails(link: string) {
  try {
    const url = new URL(link);
    return {
      hostname: url.hostname.replace(/^www\./, ""),
      favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`,
    };
  } catch {
    return { hostname: "Website", favicon: "" };
  }
}

export function Card({ contentId, title, link, type, tags = [], onDelete, readOnly = false }: CardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  function handleClick() {
    window.location.href = link;
  }

  function handlePreviewKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await onDelete?.(contentId);
      setConfirmDelete(false);
    } catch {
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  }

  const googleDriveFileId = type === "pdf" ? getGoogleDriveFileId(link) : undefined;
  const driveThumbnailUrl = googleDriveFileId ? `https://drive.google.com/thumbnail?id=${googleDriveFileId}&sz=w1000` : undefined;
  const website = type === "article" ? getWebsiteDetails(link) : undefined;

  return <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex justify-between gap-3">
      <div className="flex min-w-0 items-center text-sm font-medium text-slate-800">
        <div className="shrink-0 pr-2 text-slate-500" aria-hidden="true"><ContentTypeIcon type={type} /></div>
        <span className="truncate">{title}</span>
      </div>
      {!readOnly && onDelete && <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${title}`} title="Delete content" className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"><DeleteIcon /></button>}
    </div>

    <div className="pt-4">
      {type === "video" && <iframe className="aspect-video w-full rounded-lg" src={link.replace("watch", "embed").replace("?v=", "/")} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
      {type === "tweet" && <blockquote className="twitter-tweet"><a href={link.replace("x.com", "twitter.com")}></a></blockquote>}
      {type === "image" && <div role="link" tabIndex={0} onClick={handleClick} onKeyDown={handlePreviewKeyDown} className="cursor-pointer overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"><img className="aspect-video w-full object-cover transition duration-200 hover:scale-[1.02]" src={link} alt={title} /></div>}
      {type === "pdf" && <div role="link" tabIndex={0} onClick={handleClick} onKeyDown={handlePreviewKeyDown} className="group relative block aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label={`Open ${title}`}>
        {driveThumbnailUrl ? <img className="size-full object-cover transition duration-200 group-hover:scale-[1.02]" src={driveThumbnailUrl} alt={`First page of ${title}`} /> : <iframe className="pointer-events-none size-full border-0" src={`${getPdfPreviewUrl(link)}#page=1&zoom=page-width`} title={`${title} first page preview`} />}
        <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-3 py-2 text-xs font-medium text-white">Open PDF -&gt;</span>
      </div>}
      {type === "article" && <div role="link" tabIndex={0} onClick={handleClick} onKeyDown={handlePreviewKeyDown} className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-4 focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label={`Open ${title}`}>
        <div className="absolute -right-6 -top-8 size-28 rounded-full bg-violet-200/40 blur-2xl" />
        <div className="relative flex items-center gap-2 text-xs font-medium text-slate-500">{website?.favicon ? <img className="size-5 rounded" src={website.favicon} alt="" /> : <ArticleIcon className="size-5" />}<span className="truncate">{website?.hostname}</span></div>
        <p className="relative mt-5 line-clamp-2 text-base font-semibold leading-6 text-slate-800">{title}</p>
        <div className="relative mt-4 space-y-2" aria-hidden="true"><div className="h-2 w-full rounded bg-slate-200/80" /><div className="h-2 w-5/6 rounded bg-slate-200/80" /><div className="h-2 w-2/3 rounded bg-slate-200/80" /></div>
        <span className="relative mt-5 inline-flex text-xs font-medium text-violet-700 transition group-hover:text-violet-900">Open website -&gt;</span>
      </div>}
      {type === "audio" && <a href={link} target="_blank" rel="noreferrer" className="block rounded-lg bg-slate-100 p-4 text-sm text-violet-700 hover:bg-violet-50">Open source -&gt;</a>}
    </div>

    {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">{tags.map((tag) => <span key={tag._id} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{tag.title}</span>)}</div>}

    {confirmDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby={`delete-title-${contentId}`}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
        <h2 id={`delete-title-${contentId}`} className="text-base font-semibold text-slate-900">Delete this item?</h2>
        <p className="mt-2 text-sm leading-5 text-slate-600">This will permanently remove &ldquo;{title}&rdquo; from your Second Brain.</p>
        {deleteError && <p className="mt-3 text-sm text-red-600">Unable to delete this item. Please try again.</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDelete(false)} disabled={isDeleting} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">{isDeleting ? "Deleting..." : "Delete"}</button></div>
      </div>
    </div>}
  </article>;
}
