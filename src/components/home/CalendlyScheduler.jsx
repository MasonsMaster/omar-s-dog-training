import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionBadge from "@/components/shared/SectionBadge";

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
  return { weekday: d.toLocaleDateString("en-US", { weekday: "short" }), day: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }) };
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function CalendlyScheduler() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendly-slots"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCalendlySlots", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const eventTypes = data?.event_types || [];

  const activeType = selectedType
    ? eventTypes.find(et => et.id === selectedType)
    : eventTypes[0];

  const grouped = activeType ? groupByDate(activeType.slots) : {};
  const dates = Object.keys(grouped);
  const visibleDates = dates.slice(dateOffset, dateOffset + 4);

  const slots = selectedDate ? (grouped[selectedDate] || []) : [];

  return (
    <section className="bg-card border-y border-border py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <SectionBadge>Book a Session</SectionBadge>
          <h2 className="font-heading text-3xl md:text-4xl">
            Schedule <span className="italic text-primary">Training</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2">Real-time availability — book instantly</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading available sessions...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Could not load availability. <a href="https://calendly.com/omarsdogtraining" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Book directly on Calendly →</a>
          </div>
        )}

        {!isLoading && !error && eventTypes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No active event types found on Calendly.</div>
        )}

        {!isLoading && eventTypes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event type selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">Session Type</h3>
              {eventTypes.map(et => (
                <button
                  key={et.id}
                  onClick={() => { setSelectedType(et.id); setSelectedDate(null); }}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    (activeType?.id === et.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  <div className="font-bold text-sm">{et.name}</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {et.duration} min
                  </div>
                  {et.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{et.description}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Date + time picker */}
            <div className="lg:col-span-2 space-y-5">
              {activeType && (
                <>
                  {/* Date row */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">Pick a Date</h3>
                    {dates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No available slots in the next 7 days.</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDateOffset(Math.max(0, dateOffset - 4))}
                          disabled={dateOffset === 0}
                          className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-2 flex-1">
                          {visibleDates.map(date => {
                            const { weekday, day, month } = formatDay(date);
                            return (
                              <button
                                key={date}
                                onClick={() => setSelectedDate(date)}
                                className={`flex-1 rounded-xl py-3 text-center border-2 transition-all ${
                                  selectedDate === date
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/40 hover:bg-accent/30"
                                }`}
                              >
                                <div className="text-[10px] font-bold uppercase">{weekday}</div>
                                <div className="text-xl font-black leading-tight">{day}</div>
                                <div className="text-[10px] font-medium opacity-70">{month}</div>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setDateOffset(dateOffset + 4)}
                          disabled={dateOffset + 4 >= dates.length}
                          className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-30 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">
                        Available Times — {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </h3>
                      {slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No times available on this date.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((slot, i) => (
                            <a
                              key={i}
                              href={`${activeType.booking_url}?date=${encodeURIComponent(slot.start_time)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <div className="border-2 border-border hover:border-primary hover:bg-primary/5 rounded-xl py-2.5 text-center text-sm font-semibold transition-all cursor-pointer">
                                {formatTime(slot.start_time)}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback CTA */}
                  {!selectedDate && dates.length > 0 && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Select a date above to see available times.</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Powered by Calendly</span>
                    <a href={activeType.booking_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs font-bold">
                        <ExternalLink className="w-3 h-3" /> Open Full Calendar
                      </Button>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}