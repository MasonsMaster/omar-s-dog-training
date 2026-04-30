import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionBadge from "@/components/shared/SectionBadge";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

const SERVICES = [
  "Saturday Training ($399)",
  "Behavioral Program ($3,500)",
  "Private Session ($250)",
  "PoopPatrol™",
  "Walk & Talks™",
  "Virtual Training",
  "Puppy Package ($149)",
  "Not sure yet",
];

const CONTACT_INFO = [
  { icon: Phone, label: "Phone", value: "(321) 830-6272", href: "tel:3218306272" },
  { icon: Mail, label: "Email", value: "info@omarsdogtraining.com", href: "mailto:info@omarsdogtraining.com" },
  { icon: MapPin, label: "Location", value: "Brevard County, FL", href: null },
  { icon: Clock, label: "Response Time", value: "Within 24 hours", href: null },
];

export default function Contact() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    services_interested: [],
    situation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const toggleService = (s) => {
    setForm((p) => ({
      ...p,
      services_interested: p.services_interested.includes(s)
        ? p.services_interested.filter((x) => x !== s)
        : [...p.services_interested, s],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.email) {
      toast.error("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    await base44.entities.Lead.create({ ...form, source: "Contact Page", status: "new" });
    setDone(true);
    toast.success("Message received! Omar will be in touch within 24 hours. 🐾");
    setSubmitting(false);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <SectionBadge>Get In Touch</SectionBadge>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Let's <span className="italic">Talk Dogs</span>
          </h1>
          <p className="text-background/60 max-w-md mx-auto">
            Tell us about your dog and situation. Omar personally reviews every inquiry.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Contact info sidebar */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-heading text-2xl mb-2">Reach Us Directly</h2>
            <p className="text-muted-foreground text-sm">
              Prefer to talk? Omar answers his own phone. No call centers, no runaround.
            </p>
          </div>

          <div className="space-y-4">
            {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-0.5">{label}</div>
                  {href ? (
                    <a href={href} className="font-semibold text-sm hover:text-primary transition-colors">{value}</a>
                  ) : (
                    <div className="font-semibold text-sm">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
            <div className="font-bold text-sm mb-1">💬 Try Mason AI</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Need an immediate answer? Mason, our AI coach, is available 24/7 to answer questions and walk you through our programs.
            </p>
            <a href="/mason" className="inline-block mt-3 text-xs font-bold text-primary hover:underline">
              Chat with Mason →
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          {done ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🐾</div>
              <h3 className="font-heading text-2xl mb-2">Message Received!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Omar personally reads every inquiry. Expect a response within 24 hours — usually much sooner.
              </p>
              <Button variant="outline" onClick={() => setDone(false)}>Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
              <h3 className="font-bold text-lg">Tell Us About Your Dog</h3>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">First Name *</label>
                  <Input
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) => update("first_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Last Name</label>
                  <Input
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) => update("last_name", e.target.value)}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone</label>
                  <Input
                    type="tel"
                    placeholder="(321) 000-0000"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  What are you interested in? (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                        form.services_interested.includes(s)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Situation */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Tell us about your dog & situation
                </label>
                <Textarea
                  placeholder="Dog's name, breed, age, what issues you're dealing with, any context that helps..."
                  value={form.situation}
                  onChange={(e) => update("situation", e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-xl font-bold gap-2">
                {submitting ? "Sending..." : <><Send className="w-4 h-4" /> Send Message</>}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                By submitting, you agree to our Privacy Policy. We never spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}