"use client";

import { motion } from "framer-motion";

export const ProgressBar = () => {
    return (
        <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
        />
    );
};
