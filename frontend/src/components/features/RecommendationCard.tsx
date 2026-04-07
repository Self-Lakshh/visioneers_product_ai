import { motion } from "framer-motion";
import { Recommendation, ProductSummary, ScoreBreakdown } from "@/types/api";
import { Trophy, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Target, Activity, Tag } from "lucide-react";
import { cn, VERDICT_LABELS, VERDICT_COLORS, formatPrice, scoreColor } from "@/lib/utils";

interface Props {
  recommendation: Recommendation;
  product: ProductSummary;
  scores: ScoreBreakdown;
}

const getVerdictIcon = (verdict: string) => {
  switch (verdict) {
    case "strong_buy": return <Trophy className="w-8 h-8 text-emerald-400" />;
    case "buy": return <CheckCircle2 className="w-8 h-8 text-teal-400" />;
    case "hold": return <AlertTriangle className="w-8 h-8 text-amber-400" />;
    case "avoid": return <XCircle className="w-8 h-8 text-red-400" />;
    default: return null;
  }
};

export function RecommendationCard({ recommendation, product, scores }: Props) {
  return (
    <motion.div 
      className="card-base neu overflow-hidden relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative background glow based on verdict */}
      <div 
        className={cn(
          "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none",
          recommendation.verdict === "strong_buy" ? "bg-emerald-500" :
          recommendation.verdict === "buy" ? "bg-teal-500" :
          recommendation.verdict === "hold" ? "bg-amber-500" : "bg-red-500"
        )} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Core Product Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 text-muted-foreground/80 text-sm font-mono uppercase tracking-wider">
              {product.brand}
              <ChevronRight className="w-3 h-3" />
              {product.category}
            </div>
            <h3 className="text-2xl font-display font-bold leading-tight mb-2">{product.name}</h3>
            <div className="text-3xl font-mono text-gradient-emerald font-semibold drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              {formatPrice(product.price_usd)}
            </div>
          </div>

          <div className="neu-inset p-4 rounded-xl space-y-3">
            <h4 className="text-label text-emerald-400/80 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Who it's for
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {recommendation.target_audience}
            </p>
          </div>
        </div>

        {/* Center/Right Col: Verdict & Scores */}
        <div className="lg:col-span-2 space-y-8 flex flex-col justify-between">
          
          <div className={cn(
            "p-6 rounded-2xl border flex flex-col sm:flex-row gap-6 items-start sm:items-center backdrop-blur-md shadow-card transition-all",
            VERDICT_COLORS[recommendation.verdict]
          )}>
            <div className="p-4 rounded-full bg-black/20 shrink-0 shadow-inner">
              {getVerdictIcon(recommendation.verdict)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Final Verdict</span>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black mb-2 opacity-90 drop-shadow-md tracking-tight">
                {VERDICT_LABELS[recommendation.verdict]}
              </h2>
              <p className="text-base sm:text-lg opacity-90 font-medium leading-snug">
                {recommendation.summary}
              </p>
            </div>
            
            {/* Overall Score Circle */}
            <div className="sm:ml-auto w-24 h-24 shrink-0 rounded-full border-4 border-current/20 flex flex-col items-center justify-center bg-black/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
               <span className="text-3xl font-display font-black leading-none">{scores.overall.toFixed(1)}</span>
               <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mt-1">out of 10</span>
            </div>
          </div>

          {/* Mini Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries({
              "Value": scores.value_for_money,
              "Features": scores.feature_richness,
              "Market Fit": scores.market_positioning,
              "Reviews": scores.review_sentiment,
              "Edge": scores.competitive_edge
            }).map(([label, score]) => (
              <div key={label} className="neu-flat p-3 rounded-xl flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 group-hover:text-foreground transition-colors">{label}</span>
                <span className={cn("text-xl font-mono font-bold", scoreColor(score))}>{score.toFixed(1)}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
      
      {/* Alternatives strip */}
      {recommendation.alternatives.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Activity className="w-4 h-4"/> Noticeable Alternatives:</span>
          {recommendation.alternatives.map((alt) => (
             <span key={alt} className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground border border-secondary/20 shadow-sm flex items-center gap-1.5">
               <Tag className="w-3 h-3 opacity-70" />
               {alt}
             </span>
          ))}
        </div>
      )}

    </motion.div>
  );
}
