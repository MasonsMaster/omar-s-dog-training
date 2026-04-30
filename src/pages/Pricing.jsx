import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SectionBadge from "@/components/shared/SectionBadge";
import { Check, Zap, Shield, Star } from "lucide-react";

const PLANS = [
  {
    name: "Saturday Group Class",
    tag: "Most Popular",
    featured: true,
    icon: "🐕",
    desc: "Handler-focused group training at Animal Wellness World, Merritt Island.",
    oneTime: 399,
    monthly: null,
    unit: "per class",
    features: [
      "Max 6 dogs per session",
      "10:00 AM or 12:00 PM slot",
      "Handler technique coaching",
      "Real-world distraction training",
      "Session recap & homework",
    ],
    cta: "Book Your Spot",
    link: "/apply?service=Saturday Training ($399)",
  },
  {
    name: "Private Session",
    tag: null,
    featured: false,
    icon: "🎯",
    desc: "One-on-one in-home or on-location training tailored to your dog's needs.",
    oneTime: 250,
    monthly: null,
    unit: "per session",
    features: [
      "Your home or chosen location",
      "Customized training plan",
      "Any breed or behavior issue",
      "Follow-up support via text",
      "Flexible scheduling",
    ],
    cta: "Book Private",
    link: "/apply?service=Private ($250)",
  },
  {
    name: "Behavioral Program",
    tag: "Best Results",
    featured: false,
    icon: "🏆",
    desc: "Full transformation program for serious behavioral issues — aggression, anxiety, reactivity.",
    oneTime: 3500,
    monthly: 350,
    unit: "full program",
    monthlyUnit: "for 12 months",
    features: [
      "Multi-week intensive program",
      "Unlimited follow-up sessions",
      "Aggression & reactivity specialist",
      "Full household integration",
      "Lifetime email support",
      "100% satisfaction guarantee",
    ],
    cta: "Start Program",
    link: "/apply?service=Behavioral ($3,500)",
  },
  {
    name: "Puppy Package",
    tag: null,
    featured: false,
    icon: "🐾",
    desc: "Start your puppy right. Foundation skills, socialization, and bite inhibition.",
    oneTime: 149,
    monthly: null,
    unit: "package",
    features: [
      "Puppies 8 weeks – 6 months",
      "Sit, stay, come, leave it",
      "Crate & potty training guide",
      "Socialization framework",
      "Breeder referral network",
    ],
    cta: "Enroll Puppy",
    link: "/apply?service=Puppy Package ($149)",
  },
];

const MEMBERSHIPS = [
  {
    name: "Pup Pack",
    monthly: 99,
    icon: "🐶",
    features: ["1 group class/month", "Mason AI access", "10% product discount"],
  },
  {
    name: "Alpha Pack",
    monthly: 199,
    icon: "⚡",
    featured: true,
    features: ["2 group classes/month", "1 private session/month", "Mason AI priority", "15% product discount"],
  },
  {
    name: "Elite Pack",
    monthly: 349,
    icon: "👑",
    features: ["Unlimited group classes", "2 private sessions/month", "24/7 Mason AI", "20% discount + free shipping"],
  },
];

const ADDONS = [
  { name: "PoopPatrol™", price: "$60/mo", desc: "Weekly yard cleanup, up to 3 dogs" },
  { name: "Walk & Talks™", price: "$45/session", desc: "Training walk + owner coaching" },
  { name: "Virtual Session", price: "$75/hr", desc: "Zoom coaching, anywhere in the world" },
  { name: "Emergency Consult", price: "$500", desc: "Same-day crisis intervention" },
  { name: "Life Coaching", price: "$200/session", desc: "Human behavior + leadership coaching" },
  { name: "ODT Slip Lead", price: "$24.99", desc: "Handler tool used in every session" },
];

function PlanCard({ plan, showMonthly }) {
  const price = showMonthly && plan.monthly ? plan.monthly : plan.oneTime;
  const unit = showMonthly && plan.monthly ? plan.monthlyUnit : plan.unit;

  return (
    <div className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
      plan.featured
        ? "border-primary bg-primary text-primary-foreground shadow-2xl scale-[1.02]"
        : "border-border bg-card hover:shadow-lg"
    }`}>
      {plan.tag && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase px-4 py-1 rounded-full ${
          plan.featured ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
        }`}>
          {plan.tag}
        </div>
      )}

      <div className="text-3xl mb-3">{plan.icon}</div>
      <div className="font-bold text-lg mb-1">{plan.name}</div>
      <p className={`text-xs leading-relaxed mb-5 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {plan.desc}
      </p>

      <div className="mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={price}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-4xl font-black">${price?.toLocaleString()}</span>
            <span className={`text-xs ml-1 ${plan.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {unit}
            </span>
          </motion.div>
        </AnimatePresence>
        {showMonthly && plan.monthly && (
          <div className={`text-xs mt-1 ${plan.featured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
            or ${plan.oneTime?.toLocaleString()} one-time
          </div>
        )}
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.featured ? "text-primary-foreground" : "text-primary"}`} />
            {f}
          </li>
        ))}
      </ul>

      <Link to={plan.link}>
        <Button
          className={`w-full rounded-xl font-bold ${
            plan.featured
              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              : ""
          }`}
          variant={plan.featured ? "default" : "default"}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  );
}

export default function Pricing() {
  const [showMonthly, setShowMonthly] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <SectionBadge>Transparent Pricing</SectionBadge>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Invest in <span className="italic">Real Results</span>
          </h1>
          <p className="text-background/60 max-w-lg mx-auto text-sm">
            No hidden fees. No contracts (unless you want one). Military, first responder & teacher discount — 15% off everything.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-semibold ${!showMonthly ? "text-background" : "text-background/40"}`}>One-Time</span>
            <button
              onClick={() => setShowMonthly(!showMonthly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${showMonthly ? "bg-primary" : "bg-background/20"}`}
            >
              <motion.div
                animate={{ x: showMonthly ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-background shadow"
              />
            </button>
            <span className={`text-sm font-semibold ${showMonthly ? "text-background" : "text-background/40"}`}>
              Monthly Plans
              <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-black">SAVE</span>
            </span>
          </div>
        </div>
      </section>

      {/* Training Plans */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl">Training Programs</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} showMonthly={showMonthly} />
          ))}
        </div>
      </section>

      {/* Guarantee banner */}
      <section className="bg-secondary text-secondary-foreground py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
          <Shield className="w-8 h-8 flex-shrink-0" />
          <div>
            <div className="font-bold">Our Guarantee</div>
            <div className="text-sm text-secondary-foreground/80">
              No improvement in 3 sessions? Get an extra session FREE. No questions asked.
            </div>
          </div>
        </div>
      </section>

      {/* Memberships */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <SectionBadge>Monthly Plans</SectionBadge>
          <h2 className="font-heading text-2xl md:text-3xl">
            Join the <span className="italic text-primary">Pack</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2">Ongoing training + perks. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MEMBERSHIPS.map((m) => (
            <div key={m.name} className={`rounded-2xl border p-7 flex flex-col ${
              m.featured ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
            }`}>
              {m.featured && (
                <div className="text-[10px] font-black tracking-widest uppercase text-primary mb-3">⭐ Best Value</div>
              )}
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="font-bold text-lg mb-1">{m.name}</div>
              <div className="text-3xl font-black text-primary mb-1">${m.monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <ul className="mt-4 space-y-2 mb-6 flex-1">
                {m.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/apply?service=Membership">
                <Button variant={m.featured ? "default" : "outline"} className="w-full rounded-xl font-bold">
                  Join {m.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <SectionBadge>Add-Ons</SectionBadge>
            <h2 className="font-heading text-2xl md:text-3xl">
              Extra <span className="italic text-primary">Services</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ADDONS.map(({ name, price, desc }) => (
              <div key={name} className="bg-background border border-border rounded-xl p-5 flex items-start gap-4">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm">{name}</div>
                  <div className="text-primary font-black text-sm">{price}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Military discount */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4">🎖️</div>
        <h2 className="font-heading text-2xl md:text-3xl mb-3">Military, First Responders & Teachers</h2>
        <p className="text-muted-foreground text-sm mb-6">
          We honor your service. Mention it on your application and receive <strong>15% off</strong> any program.
        </p>
        <Link to="/apply">
          <Button size="lg" className="rounded-full font-bold px-10">Apply & Claim Discount</Button>
        </Link>
      </section>
    </div>
  );
}