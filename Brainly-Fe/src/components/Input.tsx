import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  reference?: React.RefObject<HTMLInputElement | null>;
}

export function Input({ label, reference, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>}
      <input
        ref={reference as any}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 ${className}`}
        {...props}
      />
    </div>
  );
}