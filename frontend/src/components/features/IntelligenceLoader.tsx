import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Brain, BarChart, Server } from "lucide-react";

const LOADER_STEPS = [
  { text: "Executing secure knowledge fetch...", icon: Server },
  { text: "Analyzing contextual queries...", icon: Search },
  { text: "Benchmarking against real-time competitors...", icon: BarChart },
  { text: "Synthesizing deep heuristic scoring...", icon: Brain },
];

export function IntelligenceLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % LOADER_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = LOADER_STEPS[step].icon;

  return (
    <div className="w-full flex justify-center py-24">
      <motion.div 
        className="flex flex-col items-center max-w-md w-full gap-8 card-base neu pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
      >
        <div className="relative flex justify-center items-center w-24 h-24">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-b-2 border-l-2 border-emerald-400"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute w-12 h-12 rounded-full border-t-2 border-r-2 border-teal-400"
          />
          <div className="absolute">
             <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.8, opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="bg-black/50 p-2 rounded-full backdrop-blur-md"
               >
                 <CurrentIcon className="w-5 h-5 text-emerald-400" />
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

        <div className="w-full space-y-4 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-emerald-400/90 font-mono text-sm uppercase tracking-widest font-semibold h-4"
            >
              {LOADER_STEPS[step].text}
            </motion.p>
          </AnimatePresence>
          
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        
        {/* Skeleton UI blocks representing data forming */}
        <div className="w-full space-y-3 opacity-30">
          <div className="h-4 bg-muted rounded w-3/4 shimmer" />
          <div className="h-4 bg-muted rounded w-full shimmer" />
          <div className="h-4 bg-muted rounded w-5/6 shimmer" />
        </div>
      </motion.div>
    </div>
  );
}
