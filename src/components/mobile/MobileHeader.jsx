import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === "/";

  // Map routes to titles
  const titles = {
    "/": "Omar's Dog Training",
    "/services": "Services",
    "/shop": "Shop",
    "/booking": "Book Class",
    "/mason": "Mason Chat",
    "/apply": "Apply",
    "/my-dashboard": "My Dashboard",
    "/trainer": "Trainer Hub",
    "/get-started": "Get Started",
    "/account": "Account Settings",
    "/leads": "Leads",
    "/dashboard": "Dashboard",
    "/contact": "Contact",
    "/pricing": "Pricing",
  };

  const title = titles[location.pathname] || "Back";

  return (
    <motion.div
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border md:hidden select-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 flex items-center justify-between px-4 gap-3">
        {!isRoot && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors active:bg-accent/70 select-none"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="font-bold text-sm flex-1 truncate text-center">
          {title}
        </h1>
        <div className="w-10" />
      </div>
    </motion.div>
  );
}