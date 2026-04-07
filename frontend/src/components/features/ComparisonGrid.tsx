import { motion } from "framer-motion";
import { ProductSummary, Competitor } from "@/types/api";
import { formatPrice, scoreColor, truncateUrl } from "@/lib/utils";
import { Star, TrendingDown, TrendingUp, ExternalLink } from "lucide-react";

interface Props {
  product: ProductSummary;
  competitors: Competitor[];
}

export function ComparisonGrid({ product, competitors }: Props) {
  // Sort competitors by score descending
  const sortedComps = [...competitors].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full overflow-x-auto pb-6 scroll-smooth scrollbar-thin hide-scrollbar-mobile mt-4">
      <div className="flex gap-6 min-w-max pb-4 px-2">
        
        {/* Main Product Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-80 shrink-0 card-base border border-emerald-500/40 shadow-glow-emerald bg-emerald-950/20 relative"
        >
          <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">
            Target Product
          </div>
          
          <div className="flex flex-col h-full space-y-6 pt-4">
            <div className="space-y-1 border-b border-border/50 pb-4">
              <h3 className="font-display font-bold text-xl leading-tight line-clamp-2">{product.name}</h3>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                {product.brand}
              </p>
              <div className="mt-2 text-2xl font-mono text-emerald-400 font-semibold">
                {formatPrice(product.price_usd)}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <span className="text-label text-muted-foreground mb-2 block">Key Features</span>
                <ul className="space-y-2">
                  {product.key_features.slice(0, 5).map((f, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 bg-black/20 p-2 rounded-md border border-border/20">
                      <Star className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
          </div>
        </motion.div>

        {/* Competitor Columns */}
        {sortedComps.map((comp, idx) => {
          // Calculate price diff text roughly
          const priceDiff = (product.price_usd !== null && comp.price_usd !== null) ? (product.price_usd - comp.price_usd) : null;
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + (idx * 0.1) }}
              className="w-80 shrink-0 card-base border border-border/40 hover:border-border/80 transition-all bg-card/40 flex flex-col group relative"
            >
              
              {/* Score Badge */}
              <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full border flex items-center justify-center font-mono font-bold text-sm bg-background shadow-lg shadow-black/50 ${scoreColor(comp.score)} border-${scoreColor(comp.score).replace('text-', '')}/30`}>
                 {comp.score.toFixed(1)}
              </div>

              <div className="space-y-1 border-b border-border/50 pb-4 h-32 flex flex-col justify-between">
                 <div>
                   <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 group-hover:text-teal-300 transition-colors">{comp.name}</h3>
                   <a href={comp.url} target="_blank" rel="noreferrer" className="text-muted-foreground/60 text-xs hover:text-teal-400 flex items-center gap-1 mt-1 transition-colors w-fit">
                     {truncateUrl(comp.url, 30)} <ExternalLink className="w-3 h-3" />
                   </a>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xl font-mono text-foreground/90 font-semibold">{formatPrice(comp.price_usd)}</span>
                    {priceDiff !== null && Math.abs(priceDiff) > 1 && (
                      <span className={`text-[10px] uppercase font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${priceDiff > 0 ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                        {priceDiff > 0 ? <TrendingDown className="w-3 h-3"/> : <TrendingUp className="w-3 h-3"/>}
                        {formatPrice(Math.abs(priceDiff))}
                      </span>
                    )}
                 </div>
              </div>

              <div className="flex-1 space-y-5 pt-4">
                 {/* Strengths */}
                 {comp.strengths.length > 0 && (
                   <div>
                     <span className="text-label text-emerald-400/70 mb-2 block">Strengths vs Target</span>
                     <ul className="space-y-1.5">
                       {comp.strengths.map((s, i) => (
                         <li key={i} className="text-sm flex items-start gap-1.5 text-foreground/80">
                           <span className="text-emerald-500 font-bold mt-[-2px]">+</span> {s}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
                 
                 {/* Weaknesses */}
                 {comp.weaknesses.length > 0 && (
                   <div>
                     <span className="text-label text-red-400/70 mb-2 block">Weaknesses vs Target</span>
                     <ul className="space-y-1.5">
                       {comp.weaknesses.map((w, i) => (
                         <li key={i} className="text-sm flex items-start gap-1.5 text-foreground/80">
                           <span className="text-red-500 font-bold mt-[-2px]">-</span> {w}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
