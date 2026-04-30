import { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    // Only listen if we're at the top of the scroll
    if (containerRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    setPullDistance(distance);

    if (distance > 60) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    setPulling(false);

    if (pullDistance > 60) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-y-auto"
    >
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: Math.min(pullDistance, 80) }}
            exit={{ height: 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <motion.div
              animate={{
                rotate: refreshing ? 360 : (pullDistance / 60) * 180,
              }}
              transition={{ duration: refreshing ? 1 : 0 }}
              className="text-primary"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}