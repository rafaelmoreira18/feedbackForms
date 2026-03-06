import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wider text-teal-dark font-sans">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={4}
        className={`
          w-full px-4 py-3 rounded-xl border-2 font-sans text-gray-400 text-base
          bg-white/80 transition-all duration-200 outline-none resize-none
          ${error
            ? "border-brand-red focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
            : "border-gray-200 focus:border-teal-base focus:ring-4 focus:ring-teal-base/10"
          }
          ${className ?? ""}
        `}
        {...props}
      />
      {error && <span className="text-xs text-brand-red font-sans font-medium">{error}</span>}
    </div>
  );
}
