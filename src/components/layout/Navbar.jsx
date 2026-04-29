import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Phone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/shop", label: "Shop" },
  { to: "/booking", label: "Book Class" },
  { to: "/mason", label: "Mason AI" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/leads", label: "🐾 Leads" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top announcement bars */}
      <div className="bg-secondary text-secondary-foreground text-center py-2 px-4 text-xs font-semibold tracking-wide">
        SERVING ALL OF BREVARD COUNTY · LAT 28.35° N
      </div>
      <div className="bg-primary text-primary-foreground text-center py-2.5 px-4 text-sm font-semibold">
        Saturday Training Enrolling — Only 6 Spots
        <Link to="/booking" className="underline ml-2 font-bold">Book $399 →</Link>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-background/97 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-sm">
              ODT
            </div>
            <div className="hidden sm:block">
              <div className="font-heading text-lg leading-tight">Omar's Dog Training</div>
              <div className="text-[9px] text-primary font-bold tracking-[0.2em] uppercase">
                Better Dogs Start With Better Leaders
              </div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === to
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <a href="tel:3218306272" className="hidden sm:flex">
              <Button size="sm" className="rounded-full gap-2 font-bold">
                <Phone className="w-3.5 h-3.5" />
                (321) 830-6272
              </Button>
            </a>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-md hover:bg-accent"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-border bg-background px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  location.pathname === to
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {label}
              </Link>
            ))}
            <a href="tel:3218306272" className="block px-4 py-3 text-sm font-bold text-primary">
              📞 (321) 830-6272
            </a>
          </div>
        )}
      </nav>
    </>
  );
}