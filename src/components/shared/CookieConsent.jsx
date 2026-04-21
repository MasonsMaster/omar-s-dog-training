import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("odt_cookies");
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const accept = (type) => {
    localStorage.setItem("odt_cookies", type);
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t-2 border-border shadow-2xl shadow-foreground/10 px-6 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          🍪 We use cookies for payments, analytics, and notifications.{" "}
          <Link to="/legal/cookies" className="text-primary underline">Cookie Policy</Link>
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => accept("all")} className="font-bold">
            Accept All
          </Button>
          <Button size="sm" variant="outline" onClick={() => accept("essential")}>
            Essential Only
          </Button>
        </div>
      </div>
    </div>
  );
}