import { motion } from "framer-motion";

export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`card-base neu w-full shimmer overflow-hidden ${className}`}
    >
      <div className="flex flex-col gap-4 opacity-50 border-border/10 border p-6 h-full min-h-[300px]">
        {/* Title skeleton */}
        <div className="h-8 w-1/3 bg-muted rounded-md mb-4"></div>
        {/* Subtitle skeleton */}
        <div className="h-4 w-1/4 bg-muted rounded-md mb-8"></div>
        
        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded-md"></div>
          <div className="h-4 w-5/6 bg-muted rounded-md"></div>
          <div className="h-4 w-4/6 bg-muted rounded-md"></div>
        </div>
      </div>
    </motion.div>
  );
}
