import React, { useState, useRef } from "react";

export interface FeatureItem {
    icon: React.ReactNode;
    title: string;
    desc: string;
    gradient: string;
}

export const InteractiveFeatureCard: React.FC<{ feature: FeatureItem }> = ({ feature }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePosition({ x, y });

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (cardRef.current) {
            cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
        }
    };

    return (
        <div
            ref={cardRef}
            className="group relative bg-[#1b1b24] p-8 rounded-2xl border-2 border-[#24cfa6] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                transformStyle: "preserve-3d",
                transition: isHovered ? "none" : "transform 0.5s ease-out",
            }}
        >
            {/* Cursor Light Effect */}
            {isHovered && (
                <div
                    className="absolute pointer-events-none z-20"
                    style={{
                        left: mousePosition.x - 25,
                        top: mousePosition.y - 25,
                        width: "50px",
                        height: "50px",
                        background:
                            "radial-gradient(circle, rgba(36, 207, 166, 0.6) 0%, rgba(36, 207, 166, 0.3) 40%, transparent 70%)",
                        borderRadius: "50%",
                        filter: "blur(2px)",
                    }}
                />
            )}

            {/* Glow Border */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-10 rounded-2xl`}></div>
            </div>

            {/* Icon */}
            <div
                className={`relative w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}
                style={{ transform: "translateZ(30px)" }}
            >
                <div className="text-white">{feature.icon}</div>
            </div>

            {/* Text */}
            <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
                <h4 className="text-xl font-semibold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {feature.title}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.desc}
                </p>
            </div>
        </div>
    );
};
