import { ReactElement } from "react";

interface ButtonProps {
    variant: "primary" | "secondary";
    text: string;
    startIcon?: ReactElement;
    onClick?: () => void;
    fullWidth?: boolean;
    loading?: boolean;
}

const variantClasses = {
    "primary": "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95",
    "secondary": "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 border border-indigo-200/50",
};

const defaultStyles = "px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1";


export function Button({variant, text, startIcon, onClick, fullWidth, loading}: ButtonProps) {
    return <button onClick={onClick} className={variantClasses[variant] + " " + defaultStyles + `${fullWidth ? " w-full flex justify-center items-center" : ""} ${loading ? "opacity-50 cursor-wait" : ""}`} disabled={loading}>
        {startIcon && <div className="pr-2">{startIcon}</div>}
        {text}
    </button>
}
