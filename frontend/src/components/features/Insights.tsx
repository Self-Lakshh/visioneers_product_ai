import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  ExternalLink, 
  Zap, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  CheckCircle,
  Globe,
  Rocket,
  ShieldCheck
} from "lucide-react";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";
import { cn } from "@/lib/utils";

// --- Subcomponent: Logo Rendering (Hardened) ---
function CompetitorLogo({ domain, name }: { domain: string, name: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const initials = (name || "C").charAt(0).toUpperCase();

  const cleanDomain = domain ? domain.replace(/^(https?:\/\/)/, "").split('/')[0] : "";

  useEffect(() => {
    if (!cleanDomain) {
      setImgUrl(null);
      return;
    }
    if (errorCount === 0) setImgUrl(`https://logo.clearbit.com/${cleanDomain}`);
    else if (errorCount === 1) setImgUrl(`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`);
    else setImgUrl(null);
  }, [cleanDomain, errorCount]);

  if (!imgUrl || errorCount >= 2) {
    return (
      <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-emerald-400 font-display font-black text-2xl border border-emerald-500/10">
        {initials}
      </div>
    );
  }

  return (
    <div className="relative w-14 h-14">
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden neu-inset border border-white/5 flex items-center justify-center p-2 bg-black/20">
        <img src={imgUrl} alt={name} className="w-full h-full object-contain" onError={() => setErrorCount((prev) => prev + 1)} />
      </div>
    </div>
  );
}

// --- Competitor Card ---
export function CompetitorCard({ competitor, index }: { competitor: any, index: number }) {
  const { name, domain, tagline, strengths, market_gaps, strategic_risk } = competitor;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="neu rounded-[2.5rem] p-8 flex flex-col gap-6 relative border border-white/5 min-h-[540px]"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-5">
          <CompetitorLogo domain={domain} name={name} />
          <div className="space-y-1">
            <h4 className="text-2xl font-black font-display text-white italic uppercase tracking-tight">{name}</h4>
            <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-mono tracking-widest">
              <Globe className="w-3 h-3 text-emerald-500/50" />
              <span>{domain ? domain.replace(/^(https?:\/\/)/, "") : "INTERNAL_INTEL"}</span>
            </div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center font-display font-black text-xs text-muted-foreground border border-white/5">
          {index + 1}
        </div>
      </div>

      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">{tagline || "Competitive Benchmark"}</p>

      {/* PILLS: STRENGTHS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400/80 tracking-widest uppercase">
           <Trophy className="w-3 h-3" /> Strengths
        </div>
        <div className="flex flex-wrap gap-2">
           {(strengths || ["Market Scale", "Operations"]).map((s: string, i: number) => (
             <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-bold uppercase tracking-tight">{s}</span>
           ))}
        </div>
      </div>

      {/* PILLS: MARKET GAPS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-rose-400/80 tracking-widest uppercase">
           <Target className="w-3 h-3" /> Gaps
        </div>
        <div className="flex flex-wrap gap-2">
           {(market_gaps || ["Tech Debt", "UX Rigidity"]).map((g: string, i: number) => (
             <span key={i} className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 font-bold uppercase tracking-tight">{g}</span>
           ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 text-[11px] text-muted-foreground italic leading-tight flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
        <span>{strategic_risk || "Assessed at moderate competitive complexity."}</span>
      </div>

      <a
        href={domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : "#"}
        target="_blank" rel="noopener noreferrer"
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/5 text-[10px] text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/40 transition-all font-black uppercase tracking-widest"
      >
        <span>Platform Deep Dive</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </motion.div>
  );
}

// --- Verdict Card (Reliability Enhanced) ---
export function VerdictCard() {
  const { result } = useAnalyzeStore();
  if (!result || !result.market_insight) return null;

  const { market_insight } = result;

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto space-y-12">
      <div className="flex items-center gap-5">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-emerald-500/20" />
        <div className="flex items-center gap-3 text-emerald-400 font-display font-black uppercase tracking-[0.4em] text-lg italic">
           <Zap className="w-6 h-6 fill-emerald-500/20" /> Strategic Intelligence
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-emerald-500/20 to-emerald-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        
        {/* SCORE & VERDICT */}
        <div className="neu-inset rounded-[3rem] p-12 flex flex-col items-center text-center gap-10 border border-white/5 bg-black/20 relative">
           <div className="space-y-2">
             <div className="text-emerald-400/40 text-[10px] font-mono uppercase tracking-[0.4em] font-bold">Innovation Index</div>
             <div className="text-7xl font-black bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">{Number(market_insight.idea_score || 0).toFixed(1)}</div>
           </div>

           <div className="space-y-6 flex-1">
             <div className="inline-flex items-center px-10 py-3 rounded-2xl text-xl font-display font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                {market_insight.strategic_verdict || market_insight.verdict || "STABLE"}
             </div>
             <p className="text-xl font-medium text-white/90 leading-snug">"{market_insight.summary}"</p>
           </div>
           
           <div className="w-full flex items-center justify-center gap-12 pt-6 border-t border-white/5">
              <div className="text-center font-display">
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Market Fit</div>
                 <div className="text-2xl font-black text-emerald-400">HIGH</div>
              </div>
              <div className="h-10 w-[1px] bg-white/5" />
              <div className="text-center font-display">
                 <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Entry Risk</div>
                 <div className="text-2xl font-black text-rose-400">LOW</div>
              </div>
           </div>
        </div>

        {/* REFINED STRATEGY DIVS */}
        <div className="flex flex-col gap-6">
          
          {/* THE GAP (CRITICAL) */}
          <div className="neu-inset rounded-[2rem] p-8 border border-white/5 space-y-4 bg-emerald-500/[0.03]">
             <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                <Target className="w-4 h-4" /> Core Market Opportunity
             </div>
             <p className="text-lg text-white font-medium leading-relaxed italic">"{market_insight.key_gap || "Localization as a service for Tier 2 cities."}"</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            
            {/* KEY MOVES (The rocket icon) */}
            <div className="neu rounded-[2rem] p-8 border border-white/5 space-y-6">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  <Rocket className="w-5 h-5" /> Key Moves
               </div>
               <div className="space-y-4">
                  {(market_insight.key_moves || ["Aggressive MVP", "Localization", "Partnerships"]).slice(0, 3).map((move: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-white/90 font-bold group">
                       <ArrowRight className="w-3 h-3 text-emerald-400/30 group-hover:translate-x-1" /> {move}
                    </div>
                  ))}
               </div>
            </div>

            {/* STRATEGY / ALTERNATIVES */}
            <div className="neu rounded-[2rem] p-8 border border-white/5 space-y-6">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
                  <BrainCircuit className="w-5 h-5" /> Alternatives
               </div>
               <div className="flex flex-wrap gap-2">
                  {(market_insight.alternative_paths || market_insight.alternatives || ["B2B Integration", "Platform Pivot"]).slice(0, 3).map((path: string) => (
                    <span key={path} className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] text-muted-foreground border border-white/10 hover:border-emerald-500/20">
                      {path}
                    </span>
                  ))}
               </div>
            </div>

          </div>

          {/* SUMMARY */}
          <div className="neu rounded-[2rem] p-8 border border-white/5 bg-emerald-400/[0.01]">
             <div className="flex items-center gap-3 text-[10px] font-black text-emerald-400/40 tracking-[0.3em] uppercase mb-3">
                Strategic Context
             </div>
             <p className="text-sm text-white/50 leading-relaxed font-bold">
                {market_insight.market_summary || "Current market benchmarks show a significant opportunity for high-intent niche execution in localized contexts."}
             </p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
