import { Suspense, lazy } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { InputPanel } from "@/components/features/InputPanel";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Lazy-loaded components for optimal bundle splitting
const RecommendationCard = lazy(() => import("@/components/features/RecommendationCard").then(m => ({ default: m.RecommendationCard })));
const ComparisonGrid = lazy(() => import("@/components/features/ComparisonGrid").then(m => ({ default: m.ComparisonGrid })));
const TradeoffPanel = lazy(() => import("@/components/features/TradeoffPanel").then(m => ({ default: m.TradeoffPanel })));
const ExplainabilityPanel = lazy(() => import("@/components/features/ExplainabilityPanel").then(m => ({ default: m.ExplainabilityPanel })));

function App() {
  const { status, result } = useAnalyzeStore();
  const { scrollY } = useScroll();

  // Parallax effects
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.8]);

  return (
    <div className="relative min-h-screen bg-app text-foreground overflow-hidden">
      {/* Background Parallax Elements */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-[60%] right-[10%] w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[40%] w-80 h-80 bg-accent/5 rounded-full blur-[80px]" />
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 page-container pt-20 pb-32">
        {/* Header / Input Section */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="mb-16 text-center"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6"
            aria-label="Visioneers Product AI"
          >
            Visioneers <br aria-hidden="true" />
            <span className="text-gradient-emerald">Product AI</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Deep intelligence and competitor analysis for any product. 
            Powered by advanced algorithms and web search.
          </motion.p>
        </motion.div>

        {/* Input Panel */}
        <div className="max-w-3xl mx-auto z-20 relative">
          <InputPanel />
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {status === "success" && result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-24 space-y-24"
            >
              <ErrorBoundary>
                <Suspense fallback={<SkeletonLoader />}>
                  {/* Top Recommendation */}
                  <section aria-labelledby="verdict-heading">
                    <h2 id="verdict-heading" className="text-3xl font-display font-semibold mb-8 text-center text-gradient-teal">Final Verdict</h2>
                    <RecommendationCard recommendation={result.recommendation} product={result.product} scores={result.scores} />
                  </section>

                  {/* Explainability Engine Context */}
                  {(result.explainability_log?.length > 0 || result.recommendation.confidence_score) && (
                    <section aria-labelledby="xai-heading" className="mt-16">
                      <ExplainabilityPanel 
                        logs={result.explainability_log || []} 
                        confidenceScore={result.recommendation.confidence_score} 
                        explainabilitySummary={result.recommendation.explainability_summary} 
                      />
                    </section>
                  )}

                  {/* Trade-offs */}
                  {result.trade_offs.length > 0 && (
                    <section aria-labelledby="tradeoffs-heading" className="mt-24">
                      <h2 id="tradeoffs-heading" className="text-3xl font-display font-semibold mb-8 text-center">Trade-Off Analysis</h2>
                      <TradeoffPanel tradeoffs={result.trade_offs} />
                    </section>
                  )}

                  {/* Competitor Grid */}
                  {result.competitors.length > 0 && (
                    <section aria-labelledby="market-heading" className="mt-24">
                      <h2 id="market-heading" className="text-3xl font-display font-semibold mb-8 text-center">Market Comparison</h2>
                      <ComparisonGrid product={result.product} competitors={result.competitors} />
                    </section>
                  )}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
