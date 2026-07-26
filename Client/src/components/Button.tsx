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
    "primary": "bg-violet-600 text-white shadow-sm hover:bg-violet-700",
    "secondary": "bg-violet-100 text-violet-700 hover:bg-violet-200",
};

const defaultStyles = "px-4 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-300";


export function Button({variant, text, startIcon, onClick, fullWidth, loading}: ButtonProps) {
    return <button onClick={onClick} className={variantClasses[variant] + " " + defaultStyles + `${fullWidth ? " w-full flex justify-center items-center" : ""} ${loading ? "opacity-45	" : ""}`} disabled={loading}>
        <div className="pr-2">
            {startIcon}
        </div>
        {text}
    </button>
}
