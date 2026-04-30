import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, Video, MapPin, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONNECTOR_ID = "69f0c9bf39998d128b643a8e";

export default function AppointmentsPanel() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getCalendlyEvents", {});
      setEvents(res.data?.events || []);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchEvents();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setEvents([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading appointments...
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center py-10">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="font-bold text-sm mb-1">Connect Your Calendly</div>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          Link your Calendly account to see your upcoming training appointments here.
        </p>
        <Button onClick={handleConnect} size="sm" className="rounded-full font-bold">
          Connect Calendly
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No upcoming appointments. <a href="/booking" className="text-primary font-semibold hover:underline">Book a session →</a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((evt) => {
        const start = new Date(evt.start_time);
        const end = new Date(evt.end_time);
        const isVirtual = evt.location?.type === "zoom" || evt.location?.type === "google_conference";
        return (
          <div key={evt.uri} className="border border-border rounded-xl p-4 flex gap-4 items-start hover:bg-accent/30 transition-colors">
            <div className="bg-primary/10 rounded-xl p-3 text-center min-w-[52px]">
              <div className="text-xs font-bold text-primary">{start.toLocaleDateString("en-US", { month: "short" })}</div>
              <div className="text-xl font-black text-primary leading-none">{start.getDate()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{evt.name}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
                {isVirtual
                  ? <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Virtual</span>
                  : evt.location?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location.location}</span>
                }
              </div>
              {evt.invitees?.[0] && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  with {evt.invitees[0].name || evt.invitees[0].email}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={handleDisconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-2">
        Disconnect Calendly
      </button>
    </div>
  );
}