import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, BrainCircuit } from "lucide-react";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";

import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { InputPanel } from "@/components/features/InputPanel";
import { LoadingSection } from "@/components/features/LoadingSection";
import { CompetitorCard, VerdictCard } from "@/components/features/Insights";
import { MotionSection } from "@/components/layout/MotionSection";

// --- Subcomponent: Xebia Style Preloader ---
function Preloader() {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center flex-col gap-6"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-2xl border-2 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center"
        >
          <BrainCircuit className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <div className="absolute inset-0 bg-emerald-500/10 blur-3xl animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1">
         <h2 className="text-sm font-mono font-black text-emerald-400 uppercase tracking-[0.5em]">Visioneers</h2>
         <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Engaging RAG Pipeline...</p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const { status, result } = useAnalyzeStore();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "loading" && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }, [status]);

  const hasCompetitors = result && result.competitors && result.competitors.length > 0;
  const hasInsight = result && result.market_insight;

  return (
    <div className="relative min-h-screen font-sans bg-black text-white selection:bg-emerald-500/30">
      <AnimatePresence>
        {!isLoaded && <Preloader key="preloader" />}
      </AnimatePresence>

      {/* Backdrop (Back and visible) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedBackground />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        
        {/* Branding & Single Frame Action */}
        <MotionSection direction="down" className="w-full max-w-4xl space-y-10">
           <header className="flex flex-col items-center text-center gap-6">
              {/* Event Pill */}
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] font-black shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>XEBIA PROMPTAHON</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-tight text-white">
                  Visioneers <span className="text-emerald-400">Product AI</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium tracking-tight">
                  Autonomous market deconstruction & strategic synthesis.
                </p>
              </div>
           </header>

           <InputPanel />
        </MotionSection>

        {/* Dynamic Display */}
        <section ref={resultsRef} className="w-full mt-24 space-y-24 min-h-[50vh] scroll-mt-20">
          
          <AnimatePresence mode="popLayout">
             {status === "loading" && <LoadingSection key="global-loader" />}

             {(hasCompetitors || status === "success") && (
               <motion.div 
                 key="results-grid"
                 initial={{ opacity: 0, y: 30 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-32"
               >
                 <div className="space-y-12">
                   <div className="flex flex-col items-center gap-4">
                      <h2 className="text-3xl md:text-4xl font-display font-black text-white/90">
                         {status === "loading" ? "Identifying" : "Direct"} <span className="text-emerald-400">Market</span>
                      </h2>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {(result?.competitors || []).map((comp, i) => (
                        <CompetitorCard key={`comp-${i}`} competitor={comp} index={i} />
                      ))}
                      
                      {status === "loading" && (result?.competitors?.length || 0) < 3 && 
                        [...Array(3 - (result?.competitors?.length || 0))].map((_, i) => (
                          <div key={`ghost-skel-${i}`} className="card-base neu h-[460px] rounded-[2.5rem] p-8 border border-white/5 opacity-20 animate-pulse flex flex-col gap-6">
                             <div className="w-12 h-12 rounded-xl bg-white/10" />
                             <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                             <div className="mt-auto space-y-4">
                                <div className="h-3 w-full bg-white/5 rounded-full" />
                                <div className="h-3 w-full bg-white/5 rounded-full" />
                             </div>
                          </div>
                        ))
                      }
                   </div>
                 </div>

                 {hasInsight && (
                    <VerdictCard />
                 )}
               </motion.div>
             )}
          </AnimatePresence>

        </section>

        {status === "idle" && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="pt-24"
           >
              <ChevronDown className="w-5 h-5 text-white/10 animate-bounce" />
           </motion.div>
        )}

      </main>
    </div>
  );
}
