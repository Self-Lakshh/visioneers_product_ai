import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// --- Subcomponent: Floating Neon Blob ---
function FloatingBlob({ color, size, delay, xRange = [0, 100], yRange = [0, 100] }: any) {
  return (
    <motion.div
      initial={{ x: xRange[0], y: yRange[0], scale: 1 }}
      animate={{
        x: [xRange[0], xRange[1], xRange[0]],
        y: [yRange[0], yRange[1], yRange[0]],
        scale: [1, 1.3, 0.8, 1],
      }}
      transition={{ 
        duration: 25 + Math.random() * 10, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay
      }}
      className={`absolute rounded-full blur-[120px] opacity-[0.12] ${color} shadow-[0_0_80px_rgba(16,185,129,0.1)]`}
      style={{ width: size, height: size }}
    />
  );
}

export function AnimatedBackground() {
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 2000], [0, 300]);

  // Pure CSS Noise Pattern (Base64) to avoid 403 external assets
  const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <div className="fixed inset-0 -z-50 bg-[#020202] overflow-hidden pointer-events-none">
      
      {/* ─── NEON BLOBS LAYER ─── */}
      <motion.div style={{ y: yParallax }} className="absolute inset-0">
         <FloatingBlob color="bg-emerald-500" size="40vw" delay={0} xRange={[-100, 500]} yRange={[-100, 100]} />
         <FloatingBlob color="bg-teal-500" size="35vw" delay={5} xRange={[600, -100]} yRange={[200, -50]} />
         <FloatingBlob color="bg-emerald-600" size="30vw" delay={10} xRange={[100, 800]} yRange={[600, 200]} />
      </motion.div>

      {/* ─── HI-TECH SQUARE GRID LAYER ─── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* ─── SECONDARY SMALL GRID ─── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98103_1px,transparent_1px),linear-gradient(to_bottom,#10b98103_1px,transparent_1px)] bg-[size:192px_192px]" />

      {/* ─── EMBEDDED NOISE OVERLAY ─── */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
        style={{ backgroundImage: noiseUrl }}
      />
      
      {/* Soft Bottom Vignette */}
      <div className="absolute inset-x-0 bottom-0 h-[50vh] bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent" />
    </div>
  );
}
