"use client";

import { ToolLayout } from "@/components/tools/ToolLayout";
import { useState } from "react";
import { Download, Trash2, ImageIcon, AlertCircle } from "lucide-react";

export default function Base64ToImagePage() {
    const [base64Input, setBase64Input] = useState("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [error, setError] = useState("");

    const convertToImage = () => {
        if (!base64Input.trim()) {
            setError("Please enter a Base64 string");
            setImageUrl("");
            return;
        }

        try {
            // Clean up the input
            let cleanBase64 = base64Input.trim().replace(/\s/g, "");

            // If it already has data URL prefix, use as is
            if (cleanBase64.startsWith("data:image/")) {
                setImageUrl(cleanBase64);
                setError("");
                return;
            }

            // Try to decode to validate
            try {
                atob(cleanBase64);
            } catch {
                setError("Invalid Base64 string. Please check your input.");
                setImageUrl("");
                return;
            }

            // Create data URL
            setImageUrl(`data:image/png;base64,${cleanBase64}`);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to convert. Please check your Base64 string.");
            setImageUrl("");
        }
    };

    const downloadImage = () => {
        if (!imageUrl) return;
        const link = document.createElement("a");
        link.download = `image-${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
    };

    const clearAll = () => {
        setBase64Input("");
        setImageUrl("");
        setError("");
    };

    const loadSample = () => {
        // A colorful gradient square
        const sample = "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAA60lEQVRoQ+2ZMQ6AIBAE5f8fpVfYGCW7wJU2NhaEPbYYmB3QSgKAnAF4AfBYEIi7O4/W+pF0Z3dPdQGwJHlNukuSpySP7j7qe4iZfQDYAjgB2LkxJHlOMg3gDmCf5DjJGsAdwC3J6R+HAHZJ7t09RLIA8ATwneSS5AXAK8ltkgeAO4DbJA9JzgBukzyBmFF+AdyT3CW5T/L4z4HkBuA+yQPJ4/9GkhuAxyR/AMdJrt19SPIC4Cnp7puYYJDkI8BLkusknwDuktwnuSe5T/JIcpvkMckdwE2SI4CHJHdJHpLcJ/kL4F9Oki+c8gIzAAAAAElFTkSuQmCC";
        setBase64Input(sample);
        // Auto-convert
        setImageUrl(`data:image/png;base64,${sample}`);
        setError("");
    };

    return (
        <ToolLayout
            title="Base64 to Image Converter"
            description="Convert Base64 encoded strings to PNG images. Paste your Base64 code and download the image."
            category="Developer Tools"
        >
            <div className="max-w-4xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                                    Base64 Input
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={loadSample}
                                        className="px-3 py-1.5 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors"
                                    >
                                        Load Sample
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={base64Input}
                                onChange={(e) => setBase64Input(e.target.value)}
                                placeholder="Paste your Base64 encoded image string here..."
                                rows={10}
                                className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            />

                            <button
                                onClick={convertToImage}
                                className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Convert to Image
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">Image Preview</h3>

                            <div className="bg-[#111] border border-white/5 rounded-xl p-4 min-h-[280px] flex items-center justify-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt="Converted from Base64"
                                        className="max-w-full max-h-[300px] object-contain"
                                        onError={() => setError("Could not display image. Invalid image data.")}
                                    />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>Click &quot;Convert to Image&quot; to see preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={downloadImage}
                            disabled={!imageUrl}
                            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download as PNG
                        </button>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
