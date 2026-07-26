import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, type ContentType, type Tag } from "../components/Card";
import { BACKEND_URL } from "../config";

interface SharedContent {
  _id: string;
  title: string;
  link: string;
  type: ContentType;
  tags: Tag[];
}

export function SharedBrain() {
  const { hash } = useParams();
  const [username, setUsername] = useState("");
  const [contents, setContents] = useState<SharedContent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");

  useEffect(() => {
    if (!hash) {
      setStatus("not-found");
      return;
    }

    axios.get(`${BACKEND_URL}/api/v1/brain/share/${hash}`)
      .then((response) => {
        setUsername(response.data.username);
        setContents(response.data.content);
        setStatus("ready");
      })
      .catch(() => setStatus("not-found"));
  }, [hash]);

  if (status === "loading") return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading shared brain…</main>;

  if (status === "not-found") return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-xl font-semibold text-slate-900">Shared brain not found</h1><p className="mt-2 text-sm text-slate-500">This link may be incorrect or sharing may have been turned off.</p></div></main>;

  return <main className="min-h-screen bg-slate-50 px-7 py-10 md:px-12">
    <header className="mb-8 border-b border-slate-200 pb-6">
      <p className="text-sm font-medium text-violet-700">Second Brain</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">{username}&apos;s shared collection</h1>
      <p className="mt-2 text-sm text-slate-500">Read-only view · {contents.length} {contents.length === 1 ? "item" : "items"}</p>
    </header>
    <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4">
      {contents.map((content) => <div key={content._id} className="mb-5 break-inside-avoid"><Card contentId={content._id} title={content.title} link={content.link} type={content.type} tags={content.tags} readOnly /></div>)}
    </div>
  </main>;
}
