import { motion } from "framer-motion";
import { TradeOff } from "@/types/api";
import { Scale, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tradeoffs: TradeOff[];
}

const severityConfig = {
  high: {
    icon: ShieldAlert,
    colorClass: "text-red-400",
    bgClass: "bg-red-400/10",
    borderClass: "border-red-400/30",
    label: "High Impact"
  },
  medium: {
    icon: AlertTriangle,
    colorClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/30",
    label: "Moderate"
  },
  low: {
    icon: AlertCircle,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "border-blue-400/30",
    label: "Minor"
  }
};

export function TradeoffPanel({ tradeoffs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tradeoffs.map((tradeoff, i) => {
        const config = severityConfig[tradeoff.severity];

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="card-base group hover:-translate-y-1 hover:shadow-card transition-all overflow-hidden relative border border-border/30 bg-card/60"
          >
            {/* Visual Severity Indicator Bar */}
            <div className={cn("absolute top-0 left-0 w-full h-1", config.bgClass, config.colorClass && config.colorClass.replace('text', 'bg'))} />
            
            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <h4 className="font-display font-semibold text-lg text-foreground/90">{tradeoff.dimension}</h4>
              </div>
              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", config.bgClass, config.colorClass, config.borderClass)}>
                {config.label}
              </div>
            </div>
            
            <div className="neu-inset p-4 rounded-xl">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {tradeoff.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
