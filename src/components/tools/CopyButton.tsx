"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
    text: string;
    className?: string;
    label?: string;
}

export const CopyButton = ({ text, className = "", label }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium ${className}`}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4" />
                    {label ? "Copied!" : <span>Copied!</span>}
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    {label && <span>{label}</span>}
                </>
            )}
        </button>
    );
};
