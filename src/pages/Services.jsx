import ServicesSection from "@/components/home/ServicesSection";
import MembershipsSection from "@/components/home/MembershipsSection";
import SectionBadge from "@/components/shared/SectionBadge";
import CheckItem from "@/components/shared/CheckItem";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { VIRTUAL } from "@/lib/constants";

export default function Services() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <SectionBadge>Full Service Menu</SectionBadge>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Every Service, <span className="italic">One Mission</span>
          </h1>
          <p className="text-background/60 max-w-lg mx-auto">
            Training, pet services, memberships, virtual coaching, and gear — all designed around The Handler Method™.
          </p>
        </div>
      </section>

      <ServicesSection />

      {/* Virtual Training */}
      <section className="bg-card border-y border-border py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionBadge variant="secondary">Virtual Training</SectionBadge>
            <h2 className="font-heading text-3xl md:text-4xl">
              Train From <span className="italic text-secondary">Anywhere</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VIRTUAL.map((v) => (
              <div
                key={v.name}
                className={`bg-background rounded-xl p-6 text-center transition-all hover:shadow-lg ${
                  v.feat ? "border-2 border-secondary shadow-md" : "border border-border"
                }`}
              >
                {v.tag && (
                  <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-secondary text-secondary-foreground mb-3">
                    {v.tag}
                  </span>
                )}
                <h3 className="font-bold text-lg">{v.name}</h3>
                <div className="text-xs text-muted-foreground mb-3">{v.mins}</div>
                <div className="text-3xl font-bold my-3">
                  <sup className="text-base">$</sup>{v.price}
                  <span className="text-sm text-muted-foreground font-normal">/mo</span>
                </div>
                <Link to="/apply">
                  <Button
                    className={`w-full rounded-lg gap-2 font-bold mt-2 ${
                      v.feat ? "bg-secondary hover:bg-secondary/90" : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MembershipsSection />

      {/* Vet CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-8 md:p-12">
          <h2 className="font-heading text-2xl md:text-3xl mb-3">🏥 Animal Wellness World</h2>
          <p className="text-muted-foreground mb-6">Dr. Kristy Pilkerton · Merritt Island · Our Veterinary Partner</p>
          <Button size="lg" className="bg-secondary hover:bg-secondary/90 rounded-full font-bold gap-2">
            Visit AWW <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}