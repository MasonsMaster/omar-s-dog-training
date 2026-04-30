import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingMason from "../shared/FloatingMason";
import CookieConsent from "../shared/CookieConsent";
import MobileHeader from "../mobile/MobileHeader";
import BottomTabs from "../mobile/BottomTabs";
import { motion } from "framer-motion";

export default function SiteLayout() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Desktop navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content with mobile padding */}
      <main className="md:pt-0 pt-14 pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Desktop footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabs />

      <FloatingMason />
      <CookieConsent />
    </div>
  );
}