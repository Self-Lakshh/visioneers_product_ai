import { useState, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  BarChart3, 
  Zap, 
  BrainCircuit, 
  Database
} from "lucide-react";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";
import { cn } from "@/lib/utils";

const STEP_ICONS = [BrainCircuit, Search, Database, BarChart3, Zap];

export const LoadingSection = forwardRef<HTMLDivElement>((_, ref) => {
  const { status, loadingMessage, progress, result } = useAnalyzeStore();
  const [currentIconIdx, setCurrentIconIdx] = useState(0);

  const hasData = result && (result.competitors.length > 0 || result.market_insight);

  useEffect(() => {
    if (status !== "loading") return;
    const interval = setInterval(() => {
      setCurrentIconIdx((prev) => (prev + 1) % STEP_ICONS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  const CurrentIcon = STEP_ICONS[currentIconIdx];

  if (status !== "loading") return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "w-full flex flex-col items-center gap-4 transition-all duration-700",
        hasData ? "mb-12" : "py-16"
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {!hasData && (
          <div className="relative">
            <motion.div
              key={currentIconIdx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="w-12 h-12 rounded-xl neu-inset flex items-center justify-center text-emerald-400"
            >
              <CurrentIcon className="w-6 h-6" />
            </motion.div>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-lg font-display font-black tracking-tight text-white/90">
            {loadingMessage}
          </h3>
          <div className="flex items-center justify-center gap-3">
             <div className="h-[1px] w-8 bg-white/10" />
             <span className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-widest">
                STREAMING {Math.round(progress)}%
             </span>
             <div className="h-[1px] w-8 bg-white/10" />
          </div>
        </div>

        <div className="w-full max-w-sm h-1.5 bg-black/60 rounded-full overflow-hidden relative border border-white/5 neu-inset">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 20 }}
          />
        </div>
      </div>
    </motion.div>
  );
});

LoadingSection.displayName = "LoadingSection";
