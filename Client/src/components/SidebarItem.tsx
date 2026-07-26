import { ReactElement } from "react";

export function SidebarItem({text, icon, active = false, onClick}: {
    text: string;
    icon: ReactElement;
    active?: boolean;
    onClick: () => void;
}) {
    return <button type="button" onClick={onClick} aria-pressed={active} className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`}>
        <div className={`pr-3 ${active ? "text-violet-700" : "text-slate-500"}`}>
            {icon}
        </div>
        <div>
         {text}
        </div>
    </button>
}
