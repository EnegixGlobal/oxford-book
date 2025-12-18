"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface BannerData {
    image: string;
    link: string;
    altText?: string;
    title?: string;
    description?: string;
    buttonText?: string;
}

const PromoBanner = () => {
    const [banner, setBanner] = useState<BannerData | null>(null);

    useEffect(() => {
        const loadBanner = async () => {
            try {
                const res = await fetch("/api/promo-banner", { cache: "no-store" });
                const data = await res.json();
                if (data?.success && data.data) {
                    setBanner(data.data);
                }
            } catch (error) {
                console.error("Failed to load promo banner:", error);
            }
        };
        loadBanner();
    }, []);

    if (!banner) return null;

    return (
        <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                >
                    <Link href={banner.link}>
                        <div className="relative group cursor-pointer overflow-hidden rounded-xl">
                            <img
                                src={banner.image}
                                alt={banner.altText || "Promotional banner"}
                                className="w-full object-cover"
                                style={{ aspectRatio: "1250/360" }}
                            />

                            {/* Left side content */}
                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-start px-4 sm:px-8 md:px-12 z-20 max-w-[60%] sm:max-w-md md:max-w-xl gap-1 sm:gap-3">

                                {banner.title && (
                                    <h3 className="text-lg sm:text-2xl md:text-5xl font-extrabold text-white leading-tight">
                                        {banner.title}
                                    </h3>
                                )}

                                {banner.description && (
                                    <p className="text-xs sm:text-base md:text-xl text-white leading-relaxed max-w-md hidden sm:block">
                                        {banner.description}
                                    </p>
                                )}

                                <button
                                    className="mt-1 sm:mt-4 inline-flex items-center justify-center px-3 py-1.5 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-base font-semibold rounded-lg transition-all duration-300 self-start"
                                >
                                    {banner.buttonText || "Click Here"}
                                </button>

                            </div>

                        </div>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default PromoBanner;

