import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SectionBadge from "@/components/shared/SectionBadge";
import { ArrowRight, Clock } from "lucide-react";

const MAX_SPOTS = 6; // max capacity per session

function SpotsBadge({ time }) {
  const { data: leads = [] } = useQuery({
    queryKey: ["booked-spots", time],
    queryFn: () => base44.entities.Lead.filter({ class_time: time, status: "booked" }),
    refetchInterval: 30000,
  });

  const booked = leads.length;
  const left = Math.max(0, MAX_SPOTS - booked);

  if (left === 0) {
    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
        FULL
      </span>
    );
  }
  if (left <= 2) {
    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
        🔥 {left} Spot{left > 1 ? "s" : ""} Left!
      </span>
    );
  }
  if (left <= 4) {
    return (
      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
        ⚡ {left} Spots Left
      </span>
    );
  }
  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
      {left} Open
    </span>
  );
}

const CLASSES = [
  { time: "10:00 AM", label: "Morning Session" },
  { time: "12:00 PM", label: "Midday Session" },
];

export default function BookingSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <SectionBadge>Saturday Group Classes</SectionBadge>
        <h2 className="font-heading text-3xl md:text-4xl">
          Book Your <span className="italic text-primary">Spot</span>
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          Animal Wellness World · Merritt Island · Max 6 dogs per class
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {CLASSES.map(({ time, label }) => (
          <div key={time} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">{label}</div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> {time}
                </div>
              </div>
              <SpotsBadge time={time} />
            </div>
            <div className="text-2xl font-black text-primary">$399</div>
            <Link to={`/apply?service=Saturday Training ($399)&time=${encodeURIComponent(time)}`}>
              <Button className="w-full rounded-lg font-bold gap-2">
                Book This Class <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}