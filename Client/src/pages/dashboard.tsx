import { useEffect, useState } from "react"
import { Button } from "../components/Button"
import { Card, type ContentType, type Tag } from "../components/Card"
import { CreateContentModal } from "../components/CreateContentModal"
import { PlusIcon } from "../icons/PlusIcon"
import { ShareIcon } from "../icons/ShareIcon"
import { Sidebar } from "../components/Sidebar"
import { useContent } from "../hooks/useContent"
import { BACKEND_URL } from "../config"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { LogoutIcon } from "../icons/LogoutIcon"
import { ShareBrainModal } from "../components/ShareBrainModal"
import { AiChatPanel } from "../components/AiChatPanel"

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

  function selectType(type: ContentType) {
    setSelectedType((current) => current === type ? null : type);
  }

  const filteredContents = selectedType
    ? contents.filter((content: { type: ContentType }) => content.type === selectedType)
    : contents;

  return <div className="min-h-screen bg-slate-50/50">
    <Sidebar selectedType={selectedType} onSelectType={selectType} />
    <main className="min-h-screen ml-64 px-7 py-8 md:px-12 max-w-7xl mx-auto">
      <CreateContentModal open={modalOpen} onClose={() => {
        setModalOpen(false);
      }} />
      <ShareBrainModal open={shareModalOpen} itemCount={contents.length} onClose={() => setShareModalOpen(false)} />
      
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 mt-4 glass px-6 py-4 rounded-2xl">
        <div>
          <p className="text-sm font-medium text-indigo-500/80 uppercase tracking-wider">Your personal library</p>
          <h1 className="mt-1 text-3xl font-display font-semibold tracking-tight text-slate-900">
            {selectedType ? `${selectedType[0].toUpperCase()}${selectedType.slice(1)}s` : "All Knowledge"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShareModalOpen(true)} variant="secondary" text="Share Knowledge" startIcon={<ShareIcon />}></Button>
          <Button onClick={() => {
            setModalOpen(true)
          }} variant="primary" text="Add Content" startIcon={<PlusIcon />}></Button>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-sm p-2.5 text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      <AiChatPanel onSave={refresh} />

      <div className="columns-1 gap-6 sm:columns-2 xl:columns-3 2xl:columns-4 mt-8">
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
