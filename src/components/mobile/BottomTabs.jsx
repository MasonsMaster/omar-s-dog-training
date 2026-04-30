import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  { id: "home", path: "/", label: "Home", icon: Home },
  { id: "services", path: "/services", label: "Services", icon: Compass },
  { id: "mason", path: "/mason", label: "Chat", icon: MessageCircle },
  { id: "portal", path: "/my-dashboard", label: "Portal", icon: User },
];

export default function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map(({ id, path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center gap-1 w-16 h-16 transition-colors user-select-none"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}