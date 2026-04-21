import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SectionBadge from "../shared/SectionBadge";

const SLOTS = [
  { time: "10:00 AM", name: "Basic Obedience", spots: "6 Open" },
  { time: "12:00 PM", name: "Basic Obedience", spots: "6 Open" },
];

export default function BookingSection() {
  return (
    <section className="bg-card border-y border-border py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <SectionBadge>Book Now</SectionBadge>
          <h2 className="font-heading text-3xl md:text-4xl">
            Saturday Classes at <span className="italic text-primary">AWW</span>
          </h2>
        </div>

        <div className="bg-background rounded-xl border-2 border-primary p-6 md:p-8 shadow-md shadow-primary/5">
          <h3 className="text-center font-bold text-lg mb-6">🗓️ Saturday Schedule</h3>

          {SLOTS.map(({ time, name, spots }) => (
            <div
              key={time}
              className="flex items-center justify-between py-4 border-b border-border last:border-0"
            >
              <div>
                <div className="font-semibold">{time}</div>
                <div className="text-sm text-muted-foreground">{name}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  {spots}
                </span>
                <Link to="/apply">
                  <Button size="sm" className="rounded-full font-bold">
                    Book
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          <div className="mt-6 bg-primary/5 border border-primary/10 rounded-lg p-5 text-center">
            <div className="text-3xl font-bold">$399</div>
            <div className="text-sm text-muted-foreground mt-1">
              4 sessions · AWW Merritt Island · FREE slip lead!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}