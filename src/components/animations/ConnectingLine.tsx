"use client";

import { motion } from "framer-motion";

export const ConnectingLine = () => {
    return (
        <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-white/10">
            <motion.div
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-white/30"
            />
        </div>
    );
};
