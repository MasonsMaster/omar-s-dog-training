import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, Loader2, Clock, MapPin } from "lucide-react";
import { format, parseISO, isPast, isToday, isTomorrow } from "date-fns";
import { toast } from "sonner";

export default function UpcomingSessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Fetch active schedules with start dates within next 60 days
      const schedules = await base44.entities.TrainingSchedule.filter({ status: "active" }, "-start_date", 100);
      
      const now = new Date();
      const sixtyDaysOut = new Date();
      sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60);

      const upcoming = schedules
        .filter(s => {
          if (!s.start_date) return false;
          const date = parseISO(s.start_date);
          return date >= now && date <= sixtyDaysOut;
        })
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 20);

      setSessions(upcoming);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load sessions");
    }
    setLoading(false);
  };

  const syncToCalendly = async (schedule) => {
    setSyncing(prev => ({ ...prev, [schedule.id]: true }));
    try {
      const res = await base44.functions.invoke('syncTrainingToCalendly', { schedule });
      if (res.data.success) {
        toast.success(`${res.data.scheduleName} added to Calendly`);
      } else {
        toast.error("Failed to sync to calendar");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync to calendar");
    }
    setSyncing(prev => ({ ...prev, [schedule.id]: false }));
  };

  const formatDateLabel = (date) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return "Today";
    if (isTomorrow(parsed)) return "Tomorrow";
    return format(parsed, "MMM d");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading upcoming sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
        <div className="font-bold text-sm mb-1">No upcoming sessions</div>
        <p className="text-xs text-muted-foreground max-w-xs">Active programs scheduled in the next 60 days will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => {
        const startDate = parseISO(session.start_date);
        const isPast_ = isPast(startDate);

        return (
          <div
            key={session.id}
            className={`bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 ${
              isPast_ ? "opacity-60" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{session.dog_name || "Program"}</span>
                <span className="text-xs text-muted-foreground">{session.program}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateLabel(session.start_date)} · {format(startDate, "h:mm a")}
                </div>
                {session.client_email && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {session.client_email}
                  </div>
                )}
              </div>
              {session.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{session.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPast_ && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Past
                </span>
              )}
              {!isPast_ && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncToCalendly(session)}
                  disabled={syncing[session.id]}
                  className="rounded-lg gap-1 text-xs whitespace-nowrap"
                >
                  {syncing[session.id] ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {syncing[session.id] ? "Syncing..." : "Sync to Cal"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}