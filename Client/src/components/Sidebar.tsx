import { Logo } from "../icons/Logo";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { SidebarItem } from "./SidebarItem";
import { ImageIcon } from "../icons/ImageIcon";
import { PdfIcon } from "../icons/PdfIcon";
import { ArticleIcon } from "../icons/ArticleIcon";
import { AudioIcon } from "../icons/AudioIcon";
import type { ContentType } from "./Card";

export function Sidebar({ selectedType, onSelectType }: { selectedType: ContentType | null; onSelectType: (type: ContentType) => void }) {
    return <aside className="h-screen glass w-64 fixed left-0 top-0 px-5 py-8 flex flex-col z-10">
        <div className="flex text-2xl font-display font-bold text-slate-900 items-center px-2 mb-10">
            <div className="pr-3 text-indigo-600 drop-shadow-md">
                <Logo />
            </div>
            Memora
        </div>
        <nav className="flex-1 space-y-1.5">
            <SidebarItem text="Tweets" icon={<TwitterIcon />} active={selectedType === "tweet"} onClick={() => onSelectType("tweet")} />
            <SidebarItem text="Videos" icon={<YoutubeIcon />} active={selectedType === "video"} onClick={() => onSelectType("video")} />
            <SidebarItem text="Images" icon={<ImageIcon />} active={selectedType === "image"} onClick={() => onSelectType("image")} />
            <SidebarItem text="Articles" icon={<ArticleIcon />} active={selectedType === "article"} onClick={() => onSelectType("article")} />
            <SidebarItem text="PDFs" icon={<PdfIcon />} active={selectedType === "pdf"} onClick={() => onSelectType("pdf")} />
            <SidebarItem text="Audios" icon={<AudioIcon />} active={selectedType === "audio"} onClick={() => onSelectType("audio")} />
        </nav>
        <div className="mt-auto px-2">
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Pro Tip</p>
                <p className="text-sm text-slate-600">Use the AI chat to summarize and extract insights from your saved content.</p>
            </div>
        </div>
    </aside>
}
