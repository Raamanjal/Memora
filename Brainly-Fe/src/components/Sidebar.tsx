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
    return <aside className="h-screen bg-white border-r border-slate-200 w-56 fixed left-0 top-0 px-4 py-6">
        <div className="flex text-lg font-semibold text-slate-900 items-center px-1">
            <div className="pr-2 text-violet-600">
                <Logo />
            </div>
            Second Brain
        </div>
        <nav className="pt-9 space-y-1">
            <SidebarItem text="Tweets" icon={<TwitterIcon />} active={selectedType === "tweet"} onClick={() => onSelectType("tweet")} />
            <SidebarItem text="Videos" icon={<YoutubeIcon />} active={selectedType === "video"} onClick={() => onSelectType("video")} />
            <SidebarItem text="Images" icon={<ImageIcon />} active={selectedType === "image"} onClick={() => onSelectType("image")} />
            <SidebarItem text="Articles" icon={<ArticleIcon />} active={selectedType === "article"} onClick={() => onSelectType("article")} />
            <SidebarItem text="PDFs" icon={<PdfIcon />} active={selectedType === "pdf"} onClick={() => onSelectType("pdf")} />
            <SidebarItem text="Audios" icon={<AudioIcon />} active={selectedType === "audio"} onClick={() => onSelectType("audio")} />
        </nav>
    </aside>
}
