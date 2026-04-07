import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AmbientBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      {/* Subtle Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950/90 to-background opacity-90" />

      {/* Floating Neon Blobs inside the container */}
      <motion.div
        animate={{
          x: ["0%", "20%", "-10%", "5%", "0%"],
          y: ["0%", "-30%", "20%", "-10%", "0%"],
          scale: [1, 1.2, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[10%] left-[20%] w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full blur-[120px]"
      />

      <motion.div
        animate={{
          x: ["0%", "-30%", "15%", "-20%", "0%"],
          y: ["0%", "25%", "-15%", "10%", "0%"],
          scale: [1, 1.1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-[40%] right-[10%] w-[45rem] h-[45rem] bg-teal-500/10 rounded-full blur-[150px]"
      />

      <motion.div
        animate={{
          x: ["0%", "15%", "-25%", "20%", "0%"],
          y: ["0%", "-15%", "30%", "-5%", "0%"],
          scale: [1, 0.9, 1.3, 1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-[-10%] left-[30%] w-[30rem] h-[30rem] bg-lime-500/10 rounded-full blur-[100px] mix-blend-screen"
      />
    </div>
  );
}
