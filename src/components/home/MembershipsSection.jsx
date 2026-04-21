import SectionBadge from "../shared/SectionBadge";
import MembershipCard from "./MembershipCard";
import { MEMBERSHIPS } from "@/lib/constants";

export default function MembershipsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <SectionBadge>Monthly Plans</SectionBadge>
        <h2 className="font-heading text-3xl md:text-4xl">
          Join The <span className="italic text-primary">Pack</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {MEMBERSHIPS.map((m) => (
          <MembershipCard key={m.name} membership={m} />
        ))}
      </div>
    </section>
  );
}