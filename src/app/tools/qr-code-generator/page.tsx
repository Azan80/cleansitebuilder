"use client";

import { ToolLayout } from "@/components/tools/ToolLayout";
import { useState, useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";

export default function QRCodeGeneratorPage() {
    const [text, setText] = useState("https://cleansitebuilder.com");
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [imageUrl, setImageUrl] = useState("");
    const [imageKey, setImageKey] = useState(0);

    // Generate QR code URL using goqr.me API (free, no CORS issues)
    useEffect(() => {
        if (!text.trim()) {
            setImageUrl("");
            return;
        }

        const encodedText = encodeURIComponent(text);
        const fg = fgColor.replace("#", "");
        const bg = bgColor.replace("#", "");

        // Using goqr.me API - reliable and free
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${fg}&bgcolor=${bg}&format=png`;

        setImageUrl(url);
    }, [text, size, fgColor, bgColor, imageKey]);

    const downloadQR = async () => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.download = `qrcode-${Date.now()}.png`;
            link.href = url;
            link.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: open in new tab
            window.open(imageUrl, "_blank");
        }
    };

    const regenerate = () => {
        setImageKey(prev => prev + 1);
    };

    return (
        <ToolLayout
            title="QR Code Generator"
            description="Generate QR codes for URLs, text, and more. Customize colors and size. Download as PNG."
            category="Developer Tools"
        >
            <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">Content</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        URL or Text
                                    </label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Enter URL or text..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">Customization</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Size: {size}px
                                    </label>
                                    <input
                                        type="range"
                                        min="128"
                                        max="512"
                                        step="32"
                                        value={size}
                                        onChange={(e) => setSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-[#111] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Foreground Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                                            />
                                            <input
                                                type="text"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Background Color
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                                            />
                                            <input
                                                type="text"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">Download</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadQR}
                                    disabled={!imageUrl}
                                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PNG
                                </button>
                                <button
                                    onClick={regenerate}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4">Preview</h3>
                            <div
                                className="flex items-center justify-center p-8 rounded-xl min-h-[300px]"
                                style={{ backgroundColor: bgColor }}
                            >
                                {imageUrl ? (
                                    <img
                                        key={imageKey}
                                        src={imageUrl}
                                        alt="QR Code"
                                        width={size}
                                        height={size}
                                        className="max-w-full h-auto"
                                        style={{ imageRendering: "pixelated" }}
                                    />
                                ) : (
                                    <div className="text-gray-500 text-center">
                                        <p>Enter text or URL to generate QR code</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 text-center mt-4">
                                {size} × {size} pixels • Scan with any QR reader
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
