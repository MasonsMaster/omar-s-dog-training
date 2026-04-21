import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail } from "lucide-react";
import SectionBadge from "../shared/SectionBadge";
import { motion } from "framer-motion";

const STATS = [
  { value: "2,500+", label: "FAMILIES" },
  { value: "98%", label: "SUCCESS" },
  { value: "15+", label: "YEARS" },
  { value: "4.9★", label: "GOOGLE" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://media.base44.com/images/public/69e6d7ee9890194e50a63655/4737a375e_generated_87773f64.png"
          alt="Handler and dog walking in perfect heel at golden hour on Space Coast"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          <SectionBadge>Space Coast's #1 Dog Trainer</SectionBadge>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-background leading-[1.05] mb-6">
            Train the <span className="italic">Human.</span>
            <br />
            <span className="text-primary-foreground/70 text-3xl md:text-4xl lg:text-5xl">The dog will follow.</span>
          </h1>

          <p className="text-background/70 text-base md:text-lg leading-relaxed mb-8 max-w-md">
            We train <strong className="text-background">you</strong> to lead. Handler training, PoopPatrol™, Walk & Talks™, and Mason — your 24/7 AI coach. Serving all of Brevard County.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/apply">
              <Button size="lg" className="rounded-full gap-2 font-bold text-base h-14 px-8">
                Start Training <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="tel:3218306272">
              <Button size="lg" variant="outline" className="rounded-full gap-2 font-bold text-base h-14 px-8 bg-background/10 border-background/20 text-background hover:bg-background/20">
                <Phone className="w-4 h-4" /> Call Now
              </Button>
            </a>
            <a href="mailto:info@omarsdogtraining.com">
              <Button size="lg" variant="outline" className="rounded-full gap-2 font-bold text-base h-14 px-8 bg-background/10 border-background/20 text-background hover:bg-background/20">
                <Mail className="w-4 h-4" /> Email
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 md:gap-12 border-t border-background/15 pt-6">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-bold text-background">{value}</div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-primary-foreground/50">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}