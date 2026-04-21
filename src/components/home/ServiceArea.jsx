import { AREAS } from "@/lib/constants";
import SectionBadge from "../shared/SectionBadge";
import { MapPin, Globe } from "lucide-react";

export default function ServiceArea() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 text-center">
      <SectionBadge>Service Area</SectionBadge>
      <h2 className="font-heading text-3xl md:text-4xl mb-8">
        All of <span className="italic text-primary">Brevard County</span>
      </h2>

      <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl mx-auto">
        {AREAS.map((area) => (
          <span
            key={area}
            className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-4 py-2.5 text-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {area}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 bg-secondary/5 border border-secondary/15 text-secondary rounded-full px-4 py-2.5 text-sm font-semibold">
          <Globe className="w-3.5 h-3.5" />
          Virtual: Nationwide
        </span>
      </div>
    </section>
  );
}