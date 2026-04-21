import SectionBadge from "../shared/SectionBadge";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    quote: "Omar didn't just train our dog — he trained US. Our whole family dynamic changed.",
    name: "The Martinez Family",
    location: "Merritt Island",
  },
  {
    quote: "I was ready to rehome my rescue. Omar showed me the problem wasn't my dog — it was my energy.",
    name: "Sarah K.",
    location: "Cocoa Beach",
  },
  {
    quote: "PoopPatrol is a LIFESAVER. 3 dogs, crazy schedule. Best $60 I spend every month.",
    name: "Mike T.",
    location: "Viera",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-card border-y border-border py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <SectionBadge>Real Results</SectionBadge>
          <h2 className="font-heading text-3xl md:text-4xl">Transformations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map(({ quote, name, location }, i) => (
            <div
              key={i}
              className="bg-background rounded-xl p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="italic text-sm leading-relaxed mb-5 text-muted-foreground">
                "{quote}"
              </p>
              <div className="font-bold text-sm">{name}</div>
              <div className="text-xs text-muted-foreground">{location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}