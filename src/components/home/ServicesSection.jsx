import SectionBadge from "../shared/SectionBadge";
import ServiceCard from "./ServiceCard";
import { SERVICES } from "@/lib/constants";

export default function ServicesSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <SectionBadge>Our Services</SectionBadge>
        <h2 className="font-heading text-3xl md:text-4xl">
          Everything Your Dog <span className="italic text-primary">Needs</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICES.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </section>
  );
}