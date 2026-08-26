import { useEffect, useState } from "react"
import { Button } from "../components/Button"
import { Card, type ContentType, type Tag } from "../components/Card"
import { CreateContentModal } from "../components/CreateContentModal"
import { PlusIcon } from "../icons/PlusIcon"
import { ShareIcon } from "../icons/ShareIcon"
import { useContent } from "../hooks/useContent"
import { BACKEND_URL } from "../config"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { LogoutIcon } from "../icons/LogoutIcon"
import { ShareBrainModal } from "../components/ShareBrainModal"
import { AiChatPanel } from "../components/AiChatPanel"
import { Logo } from "../icons/Logo"
import { TwitterIcon } from "../icons/TwitterIcon"
import { YoutubeIcon } from "../icons/YoutubeIcon"
import { ImageIcon } from "../icons/ImageIcon"
import { PdfIcon } from "../icons/PdfIcon"
import { ArticleIcon } from "../icons/ArticleIcon"
import { AudioIcon } from "../icons/AudioIcon"
import { GridIcon } from "../icons/GridIcon"

const filterOptions = [
  { type: null, label: "All", icon: <GridIcon className="size-4" /> },
  { type: "tweet", label: "Tweets", icon: <TwitterIcon className="size-4" /> },
  { type: "video", label: "Videos", icon: <YoutubeIcon className="size-4" /> },
  { type: "image", label: "Images", icon: <ImageIcon className="size-4" /> },
  { type: "article", label: "Articles", icon: <ArticleIcon className="size-4" /> },
  { type: "pdf", label: "PDFs", icon: <PdfIcon className="size-4" /> },
  { type: "audio", label: "Audios", icon: <AudioIcon className="size-4" /> },
] as const;

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const {contents, refresh} = useContent();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, [modalOpen])

  function logout() {
    localStorage.removeItem("token");
    navigate("/signin");
  }

  async function deleteContent(contentId: string) {
    await axios.delete(`${BACKEND_URL}/api/v1/content/${contentId}`, {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token"),
      },
    });
    refresh();
  }

  const filteredContents = selectedType
    ? contents.filter((content: { type: ContentType }) => content.type === selectedType)
    : contents;

  return <div className="min-h-screen bg-slate-50/50 flex flex-col">
    {/* Top Header replacing Sidebar logo area */}
    <header className="py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-10 sticky top-0">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-16 mx-auto w-full">
        <div className="flex text-2xl font-display font-bold text-slate-900 items-center">
            <div className="pr-3 text-indigo-600 drop-shadow-md">
                <Logo />
            </div>
            Memora
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShareModalOpen(true)} variant="secondary" text="Share" startIcon={<ShareIcon />}></Button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Add Content manually"
            aria-label="Add Content"
            className="rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-2.5 text-indigo-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <PlusIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-2.5 text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <LogoutIcon className="size-5" />
          </button>
        </div>
      </div>
    </header>

    <main className="flex-1 px-6 py-8 md:px-12 lg:px-16 mx-auto w-full">
      <CreateContentModal open={modalOpen} onClose={() => {
        setModalOpen(false);
      }} />
      <ShareBrainModal open={shareModalOpen} itemCount={contents.length} onClose={() => setShareModalOpen(false)} />
      
      <AiChatPanel onSave={refresh} />

      <div className="mt-8 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {filterOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setSelectedType(opt.type as ContentType | null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                selectedType === opt.type 
                  ? "bg-indigo-600 text-white shadow-md border-indigo-600" 
                  : "bg-white text-slate-600 border-slate-200/60 shadow-sm hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className={selectedType === opt.type ? "text-indigo-100" : "text-slate-400"}>
                {opt.icon}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="columns-1 gap-6 sm:columns-2 xl:columns-3 2xl:columns-4">
        {filteredContents.map(({ _id, type, link, title, tags, summary, isIndexed }: { _id: string; type: ContentType; link: string; title: string; tags: Tag[]; summary?: string; isIndexed?: boolean }) => <div key={_id} className="mb-6 break-inside-avoid">
          <Card
            contentId={_id}
            type={type}
            link={link}
            title={title}
            tags={tags}
            summary={summary}
            isIndexed={isIndexed}
            onDelete={deleteContent}
        /></div>)}
      </div>
      {filteredContents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 glass-card rounded-3xl mt-12">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-4">
            <PlusIcon />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">It's quiet here</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center">Get started by adding your first {selectedType ?? "piece of knowledge"}.</p>
          <Button onClick={() => setModalOpen(true)} variant="primary" text="Add Content" startIcon={<PlusIcon />} className="mt-6" />
        </div>
      )}
    </main>
  </div>
}
