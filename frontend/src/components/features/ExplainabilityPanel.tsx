import { motion } from "framer-motion";
import { Terminal, Brain, CheckCircle2 } from "lucide-react";

interface ExplainabilityPanelProps {
  logs: string[];
  confidenceScore: number;
  explainabilitySummary: string;
}

export function ExplainabilityPanel({ logs, confidenceScore, explainabilitySummary }: ExplainabilityPanelProps) {
  const percentageScore = Math.round(confidenceScore * 100);
  
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-neu border border-white/5 space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Brain className="w-6 h-6 text-emerald-400" aria-hidden="true" />
        <h2 className="font-display text-xl font-semibold text-white tracking-wide">
          Intelligence Engine
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Context */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Engine Confidence
            </span>
            <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {percentageScore}%
            </span>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 p-full h-full bg-gradient-to-b from-emerald-400 to-teal-400" />
            <p className="text-sm text-foreground/80 leading-relaxed font-body pl-2">
              {explainabilitySummary}
            </p>
          </div>
        </div>

        {/* Action Tracing Log */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Execution Trace
          </span>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-emerald-400/80 space-y-2 h-[1r80px] overflow-y-auto border border-emerald-900/30 custom-scrollbar">
            {logs.length === 0 ? (
              <span className="text-white/30 italic">No execution logs written.</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-white/30">{`[${index.toString().padStart(2, '0')}]`}</span>
                  <span className="tracking-tight">{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
