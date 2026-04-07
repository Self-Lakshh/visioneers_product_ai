import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Settings2, ShieldCheck, ArrowRight, TrendingUp } from "lucide-react";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

export function InputPanel() {
  const { 
    idea, setIdea, depth, setDepth, 
    includeCompetitors, setIncludeCompetitors,
    status, errorMessage, analyze 
  } = useAnalyzeStore();

  const [localIdea, setLocalIdea] = useState(idea);
  const debouncedIdea = useDebounce(localIdea, 500);

  useEffect(() => {
    setIdea(debouncedIdea);
  }, [debouncedIdea, setIdea]);

  const isLoading = status === "loading";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localIdea) {
      analyze(() => {});
    }
  };

  return (
    <div className="card-base p-2 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 shadow-2xl backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
        
        {/* Main Idea Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <input
            type="text"
            required
            autoFocus
            value={localIdea}
            onChange={(e) => setLocalIdea(e.target.value)}
            placeholder="Deconstruct your next big idea..."
            className="w-full bg-black/60 border border-white/10 text-foreground placeholder:text-muted-foreground/20 rounded-[1.5rem] py-6 pl-16 pr-6 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-display font-black text-xl shadow-inner"
            disabled={isLoading}
          />
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between px-2">
          <div className="flex items-center gap-5">
            <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
               <Settings2 className="w-3.5 h-3.5" /> Intelligence Depth
            </span>
            <div className="flex bg-black/40 rounded-xl p-1.5 border border-white/5">
              {(["quick", "standard", "deep"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  disabled={isLoading}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider",
                    depth === d 
                      ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                      : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIncludeCompetitors(!includeCompetitors)}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-3 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border tracking-widest uppercase",
              includeCompetitors 
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-glow-emerald/5" 
                : "text-muted-foreground/30 border-white/5 hover:border-white/10"
            )}
          >
            <ShieldCheck className={cn("w-4 h-4", includeCompetitors ? "text-emerald-500" : "text-white/10")} />
            <span>Benchmark Landscape</span>
          </button>
        </div>

        {/* Action Button: Emerald/Green Focus */}
        <motion.button
          type="submit"
          disabled={isLoading || !localIdea}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full py-6 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-300 font-display font-black text-sm uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden",
            isLoading || !localIdea 
              ? "bg-zinc-800 text-white/20 border border-white/5" 
              : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_50px_rgba(16,185,129,0.4)]"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-4">
               <Loader2 className="w-6 h-6 animate-spin text-black/40" />
               <span>Synthesizing Intelligence...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
               <span>Initiate Analysis</span>
               <ArrowRight className="w-5 h-5 opacity-40" />
            </div>
          )}
          
          {/* Animated Stream Bar */}
          {isLoading && (
            <motion.div 
               className="absolute bottom-0 left-0 h-1 bg-black/20"
               initial={{ width: 0 }}
               animate={{ width: "100%" }}
               transition={{ duration: 30, ease: "linear" }}
            />
          )}
        </motion.button>

        {status === "error" && errorMessage && (
          <div className="text-center px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}
