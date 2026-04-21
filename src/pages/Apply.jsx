import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft } from "lucide-react";
import SectionBadge from "@/components/shared/SectionBadge";
import { AREAS } from "@/lib/constants";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SOURCES = ["Google", "TikTok", "Instagram", "Referral", "AWW/Vet", "Other"];
const SERVICE_OPTIONS = [
  "Saturday Training ($399)", "Behavioral ($3,500)", "Private ($250)",
  "PoopPatrol™", "Walk & Talks™", "Slip Lead ($24.99)", "Virtual Training",
  "Emergency ($500)", "Membership", "Life Coaching ($200)", "Gift Card",
  "Puppy Package ($149)", "Not sure",
];
const PAYMENT_OPTIONS = ["Credit/Debit", "Zelle", "Venmo", "Cash App", "Apple Pay", "Cash", "Payment Plan"];
const URGENCY_OPTIONS = ["ASAP", "This week", "This month", "Exploring"];

export default function Apply() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    location: "", source: "", services_interested: [],
    dog_name: "", breed: "", situation: "", is_military: false,
    payment_preference: "", urgency: "", promo_code: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const toggleService = (s) => {
    setForm((p) => ({
      ...p,
      services_interested: p.services_interested.includes(s)
        ? p.services_interested.filter((x) => x !== s)
        : [...p.services_interested, s],
    }));
  };

  const submit = async () => {
    if (!form.first_name || !form.email) {
      toast.error("Please fill in your name and email");
      return;
    }
    setSubmitting(true);
    await base44.entities.Lead.create(form);
    toast.success("Application submitted! Omar will reach out within 24 hours.", {
      description: "📞 (321) 830-6272 · info@omarsdogtraining.com",
    });
    setSubmitting(false);
    setStep(0);
    setForm({
      first_name: "", last_name: "", email: "", phone: "",
      location: "", source: "", services_interested: [],
      dog_name: "", breed: "", situation: "", is_military: false,
      payment_preference: "", urgency: "", promo_code: "", notes: "",
    });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-12 md:py-20">
      <div className="text-center mb-8">
        <SectionBadge>Get Started</SectionBadge>
        <h1 className="font-heading text-3xl md:text-4xl">
          Join Our <span className="italic text-primary">Pack</span>
        </h1>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
        {/* Step indicators */}
        <div className="flex gap-2 justify-center mb-8">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "bg-primary w-12" : "bg-border w-8"
              }`}
            />
          ))}
        </div>

        {/* Step 0: About You */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-2">About You 👋</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name *" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
              <Input placeholder="Last name" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Input placeholder="Phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <Select value={form.location} onValueChange={(v) => update("location", v)}>
              <SelectTrigger><SelectValue placeholder="Where are you?" /></SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                <SelectItem value="Outside Brevard">Outside Brevard</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <p className="text-sm font-semibold mb-2">How did you find us?</p>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => update("source", s)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      form.source === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Needs */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-2">What Do You Need? 🐾</h3>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                    form.services_interested.includes(s) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Dog's name" value={form.dog_name} onChange={(e) => update("dog_name", e.target.value)} />
              <Input placeholder="Breed" value={form.breed} onChange={(e) => update("breed", e.target.value)} />
            </div>
            <Textarea
              placeholder="Tell us your situation..."
              value={form.situation}
              onChange={(e) => update("situation", e.target.value)}
              className="min-h-[80px]"
            />
            <div>
              <p className="text-sm font-semibold mb-2">Military, first responder, or teacher?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => update("is_military", true)}
                  className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                    form.is_military ? "border-primary bg-primary/5 text-primary" : "border-border"
                  }`}
                >
                  Yes — 15% off
                </button>
                <button
                  onClick={() => update("is_military", false)}
                  className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                    !form.is_military ? "border-primary bg-primary/5 text-primary" : "border-border"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Final */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-2">Almost Done! 🎉</h3>
            <div>
              <p className="text-sm font-semibold mb-2">Payment preference</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => update("payment_preference", s)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      form.payment_preference === s ? "border-primary bg-primary/5 text-primary" : "border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">When?</p>
              <div className="flex flex-wrap gap-2">
                {URGENCY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => update("urgency", s)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      form.urgency === s ? "border-primary bg-primary/5 text-primary" : "border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Input placeholder="Promo code? (MASON10, PACK50, etc.)" value={form.promo_code} onChange={(e) => update("promo_code", e.target.value)} />
            <Textarea placeholder="Anything else? Questions, referral name..." value={form.notes} onChange={(e) => update("notes", e.target.value)} className="min-h-[60px]" />
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-4">
              By submitting, I agree to the Terms of Service, Privacy Policy, and Cookie Policy. I understand Omar's Dog Training™ is fully insured and dog training involves inherent risks.
            </div>
            <Button
              onClick={submit}
              disabled={submitting}
              size="lg"
              className="w-full rounded-xl font-bold text-base h-14"
            >
              {submitting ? "Submitting..." : "Submit Application 🐾"}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : <div />}
          {step < 2 && (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}