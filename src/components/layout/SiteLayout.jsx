import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingMason from "../shared/FloatingMason";
import CookieConsent from "../shared/CookieConsent";

export default function SiteLayout() {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingMason />
      <CookieConsent />
    </div>
  );
}