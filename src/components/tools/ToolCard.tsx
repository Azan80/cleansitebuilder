import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    category: string;
}

export const ToolCard = ({ title, description, href, icon: Icon, category }: ToolCardProps) => {
    return (
        <Link
            href={href}
            className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {category}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </Link>
    );
};
