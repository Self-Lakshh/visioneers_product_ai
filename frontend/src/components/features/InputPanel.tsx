import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Link2, Settings2, ShieldCheck, Zap } from "lucide-react";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

export function InputPanel() {
  const { 
    url, setUrl, depth, setDepth, 
    includeCompetitors, setIncludeCompetitors,
    status, errorMessage, analyze 
  } = useAnalyzeStore();

  const [localUrl, setLocalUrl] = useState(url);
  const debouncedUrl = useDebounce(localUrl, 500);

  useEffect(() => {
    setUrl(debouncedUrl);
  }, [debouncedUrl, setUrl]);

  const isLoading = status === "loading";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localUrl) analyze();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="card-base neu w-full"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Main URL Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400 group-focus-within:text-emerald-300 transition-colors">
            <Link2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            type="url"
            required
            aria-label="Product URL to analyze"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="Paste product URL (Amazon, BestBuy, etc.) to analyze..."
            className="w-full bg-black/20 border border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl py-4 pl-12 pr-4 focus-ring focus:bg-black/40 transition-all font-medium text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
            disabled={isLoading}
          />
        </div>

        {/* Configuration Options */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 neu-inset rounded-xl">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Depth:</span>
            </div>
            
            <div className="flex bg-black/30 rounded-lg p-1 border border-border/30">
              {(["quick", "standard", "deep"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  disabled={isLoading}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all",
                    depth === d 
                      ? "bg-emerald-500/20 text-emerald-300 shadow-glow-emerald border border-emerald-500/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px sm:h-8 w-full sm:w-px bg-border/50" />

          <button
            type="button"
            onClick={() => setIncludeCompetitors(!includeCompetitors)}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border",
              includeCompetitors 
                ? "text-teal-300 border-teal-500/30 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.15)]" 
                : "text-muted-foreground border-transparent hover:bg-black/20"
            )}
          >
            <div className={cn("w-4 h-4 rounded flex items-center justify-center border", includeCompetitors ? "border-teal-400 bg-teal-500/20" : "border-muted-foreground")}>
              {includeCompetitors && <ShieldCheck className="w-3 h-3 text-teal-300" />}
            </div>
            Competitor Analysis
          </button>
        </div>

        {/* Error Display */}
        {status === "error" && errorMessage && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {errorMessage}
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !localUrl}
          className="relative overflow-hidden group w-full py-4 rounded-xl font-display font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neu bg-gradient-brand hover:shadow-glow-emerald active:scale-[0.98]"
        >
          {/* Animated gradient background sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-80 group-hover:opacity-100 group-hover:animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Intelligence Pipeline...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze Product</span>
              </>
            )}
          </div>
        </button>
      </form>
    </motion.div>
  );
}
