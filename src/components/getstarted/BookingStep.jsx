import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronLeft, ChevronRight, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useMoodWarning } from "@/hooks/useMoodWarning";

function groupByDate(slots) {
  return slots.reduce((acc, slot) => {
    const date = new Date(slot.start_time).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function BookingStep({ ownerName }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [booked, setBooked] = useState(false);

  const { user } = useAuth();
  const { flaggedDays, getWarning, hasData } = useMoodWarning(user?.email);

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendly-slots"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCalendlySlots", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const eventTypes = data?.event_types || [];
  const activeType = selectedType ? eventTypes.find(et => et.id === selectedType) : eventTypes[0];
  const grouped = activeType ? groupByDate(activeType.slots) : {};
  const dates = Object.keys(grouped);
  const visibleDates = dates.slice(dateOffset, dateOffset + 4);
  const slots = selectedDate ? (grouped[selectedDate] || []) : [];

  if (booked) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="font-heading text-2xl mb-2">You're all set{ownerName ? `, ${ownerName}` : ""}!</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          Omar will confirm your appointment and reach out before your session.
        </p>
        <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground max-w-xs mx-auto">
          Questions? Call or text Omar at{" "}
          <a href="tel:3218306272" className="font-bold text-primary hover:underline">(321) 830-6272</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading available times...</span>
      </div>
    );
  }

  if (error || eventTypes.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          Can't load live availability right now.
        </p>
        <a href="https://calendly.com/omarsdogtraining" target="_blank" rel="noopener noreferrer">
          <Button className="rounded-full font-bold gap-2">
            <ExternalLink className="w-4 h-4" /> Book on Calendly
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session type */}
      {eventTypes.length > 1 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">Session Type</h3>
          <div className="space-y-2">
            {eventTypes.map(et => (
              <button key={et.id}
                onClick={() => { setSelectedType(et.id); setSelectedDate(null); setDateOffset(0); }}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  activeType?.id === et.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}>
                <div className="font-bold text-sm">{et.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {et.duration} min
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date picker */}
      {activeType && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">Pick a Date</h3>
          {dates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available slots in the next 7 days.</p>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setDateOffset(Math.max(0, dateOffset - 4))} disabled={dateOffset === 0}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-2 flex-1">
                {visibleDates.map(date => {
                  const { weekday, day, month } = formatDay(date);
                  const dow = new Date(date).getDay();
                  const isFlagged = hasData && flaggedDays.has(dow);
                  return (
                    <button key={date} onClick={() => setSelectedDate(date)}
                      className={`flex-1 rounded-xl py-3 text-center border-2 transition-all relative ${
                        selectedDate === date
                          ? "border-primary bg-primary text-primary-foreground"
                          : isFlagged
                          ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                          : "border-border hover:border-primary/40 hover:bg-accent/30"
                      }`}>
                      <div className="text-[10px] font-bold uppercase">{weekday}</div>
                      <div className="text-xl font-black leading-tight">{day}</div>
                      <div className="text-[10px] font-medium opacity-70">{month}</div>
                      {isFlagged && selectedDate !== date && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setDateOffset(dateOffset + 4)} disabled={dateOffset + 4 >= dates.length}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mood warning banner */}
      {selectedDate && (() => {
        const warning = getWarning(new Date(selectedDate).toISOString());
        if (!warning) return null;
        return (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-800">Historically rough day for your dog</div>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Based on {warning.total} behavior logs, <strong>{warning.pct}%</strong> of {warning.day} sessions were logged as "very rough." 
                You can still book, but consider a different day for a smoother session.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">
            {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No times available on this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, i) => (
                <a key={i}
                  href={`${activeType.booking_url}?date=${encodeURIComponent(slot.start_time)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setBooked(true), 1500)}>
                  <div className="border-2 border-border hover:border-primary hover:bg-primary/5 rounded-xl py-3 text-center text-sm font-semibold transition-all cursor-pointer">
                    {formatTime(slot.start_time)}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && dates.length > 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" /> Select a date above to see available times.
        </p>
      )}

      {/* Fallback */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Powered by Calendly</span>
        <a href={activeType?.booking_url || "https://calendly.com/omarsdogtraining"} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs font-bold">
            <ExternalLink className="w-3 h-3" /> Open Full Calendar
          </Button>
        </a>
      </div>
    </div>
  );
}