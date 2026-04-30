import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MilestoneNotification({ clientEmail }) {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!clientEmail) return;

    const checkMilestones = async () => {
      try {
        const milestones = await base44.entities.BehaviorMilestone.filter(
          { client_email: clientEmail },
          "-earned_date",
          1
        );

        if (milestones.length > 0) {
          const latest = milestones[0];
          const lastShown = localStorage.getItem(
            `milestone-shown-${latest.id}`
          );

          if (!lastShown) {
            setNotification(latest);
            localStorage.setItem(`milestone-shown-${latest.id}`, "true");
            setTimeout(() => setNotification(null), 6000);
          }
        }
      } catch (error) {
        console.error("Error checking milestones:", error);
      }
    };

    // Check on mount
    checkMilestones();

    // Subscribe to new milestones
    const unsubscribe = base44.entities.BehaviorMilestone.subscribe((event) => {
      if (event.type === "create" && event.data.client_email === clientEmail) {
        setNotification(event.data);
        setTimeout(() => setNotification(null), 6000);
      }
    });

    return unsubscribe;
  }, [clientEmail]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-2xl p-4 shadow-lg text-foreground max-w-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Trophy className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-900" />
              <div>
                <h4 className="font-black text-sm">🎉 Milestone Unlocked!</h4>
                <p className="text-xs mt-1 text-amber-900">
                  {notification.description}
                </p>
                <p className="text-[10px] font-bold text-amber-800 mt-1">
                  +{notification.xp_earned} XP
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-amber-900 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}