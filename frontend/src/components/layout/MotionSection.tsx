import React from "react";
import { motion } from "framer-motion";

interface MotionSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function MotionSection({ 
  children, 
  delay = 0, 
  className = "", 
  direction = "up" 
}: MotionSectionProps) {
  
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction],
        scale: 0.98
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        x: 0,
        scale: 1
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 1.2, 
        delay, 
        ease: [0.165, 0.84, 0.44, 1] // Apple-style fluid cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
