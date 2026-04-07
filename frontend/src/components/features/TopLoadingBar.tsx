import { motion } from "framer-motion";
import { useAnalyzeStore } from "@/store/useAnalyzeStore";

export function TopLoadingBar() {
  const { status } = useAnalyzeStore();

  if (status !== "loading") return null;

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="fixed top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-50 pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.8)]"
    />
  );
}
