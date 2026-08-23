import { ReactElement } from "react";

export function SidebarItem({text, icon, active = false, onClick}: {
    text: string;
    icon: ReactElement;
    active?: boolean;
    onClick: () => void;
}) {
    return <button type="button" onClick={onClick} aria-pressed={active} className={`group flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-white/80 hover:shadow-sm hover:text-indigo-700"}`}>
        <div className={`pr-3 transition-colors ${active ? "text-indigo-100" : "text-slate-400 group-hover:text-indigo-500"}`}>
            {icon}
        </div>
        <div>
         {text}
        </div>
    </button>
}
