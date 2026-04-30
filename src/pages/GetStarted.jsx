import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle2, Dog, User, Calendar, Star, Shield, Phone } from "lucide-react";
import { AREAS } from "@/lib/constants";
import BookingStep from "@/components/getstarted/BookingStep";

// ── Constants ─────────────────────────────────────────────────────────────────
const BEHAVIORAL_ISSUES = [
  "Leash Reactivity", "Aggression (dogs)", "Aggression (people)",
  "Jumping", "Pulling", "Excessive Barking", "Separation Anxiety",
  "Resource Guarding", "Recall / Running away", "Biting / Nipping",
  "Fearfulness", "Impulse Control", "Socialization", "General Obedience",
];

const TRAINING_EXPERIENCE = ["None", "Some YouTube/books", "Puppy classes", "Prior trainer", "Extensive training"];
const SOURCES = ["Google", "TikTok", "Instagram", "Referral", "Vet / AWW", "Nextdoor", "Other"];
const STEPS = [
  { id: "owner",   label: "About You",   icon: User },
  { id: "dog",     label: "Your Dog",    icon: Dog },
  { id: "history", label: "Background",  icon: Shield },
  { id: "book",    label: "Book a Call", icon: Calendar },
];

const EMPTY_FORM = {
  // owner
  first_name: "", last_name: "", email: "", phone: "", location: "", source: "",
  // dog
  dog_name: "", breed: "", age: "", weight: "", neutered: null, dog_photo_url: "",
  // history
  behavioral_issues: [], training_experience: "", situation: "", is_military: false,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary text-primary bg-primary/5" :
                "border-border text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide hidden sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-all ${i < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToggleChip({ label, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm border-2 transition-all font-medium ${
        selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
      }`}>
      {label}
    </button>
  );
}

function OwnerStep({ form, update }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl mb-1">Nice to meet you! 👋</h2>
        <p className="text-muted-foreground text-sm">Let's start with your basic info so Omar can reach you.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="First name *" value={form.first_name} onChange={e => update("first_name", e.target.value)} />
        <Input placeholder="Last name" value={form.last_name} onChange={e => update("last_name", e.target.value)} />
      </div>
      <Input placeholder="Email address *" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
      <Input placeholder="Phone number" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} />
      <div>
        <label className="text-sm font-semibold block mb-2">Where are you located?</label>
        <select value={form.location} onChange={e => update("location", e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">Select your area...</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          <option value="Outside Brevard">Outside Brevard</option>
        </select>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">How did you find us?</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(s => (
            <ToggleChip key={s} label={s} selected={form.source === s} onClick={() => update("source", s)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DogStep({ form, update }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl mb-1">Tell us about your dog 🐾</h2>
        <p className="text-muted-foreground text-sm">Omar reviews every dog profile personally before your first session.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Dog's name *" value={form.dog_name} onChange={e => update("dog_name", e.target.value)} />
        <Input placeholder="Breed" value={form.breed} onChange={e => update("breed", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1">Age</label>
          <Input placeholder="e.g. 2 years, 8 months" value={form.age} onChange={e => update("age", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Weight (approx.)</label>
          <Input placeholder="e.g. 45 lbs" value={form.weight} onChange={e => update("weight", e.target.value)} />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Is your dog neutered / spayed?</p>
        <div className="flex gap-2">
          {[{ v: true, l: "Yes" }, { v: false, l: "No" }, { v: null, l: "Not sure" }].map(({ v, l }) => (
            <ToggleChip key={l} label={l} selected={form.neutered === v} onClick={() => update("neutered", v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryStep({ form, update }) {
  const toggle = (field, val) => {
    update(field, form[field].includes(val)
      ? form[field].filter(x => x !== val)
      : [...form[field], val]
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl mb-1">Behavioral history 🧠</h2>
        <p className="text-muted-foreground text-sm">Be honest — there's no judgment here. This helps Omar prepare the right plan.</p>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Which behaviors are you dealing with? <span className="text-muted-foreground font-normal">(select all that apply)</span></p>
        <div className="flex flex-wrap gap-2">
          {BEHAVIORAL_ISSUES.map(b => (
            <ToggleChip key={b} label={b}
              selected={form.behavioral_issues.includes(b)}
              onClick={() => toggle("behavioral_issues", b)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Prior training experience?</p>
        <div className="flex flex-wrap gap-2">
          {TRAINING_EXPERIENCE.map(t => (
            <ToggleChip key={t} label={t}
              selected={form.training_experience === t}
              onClick={() => update("training_experience", t)} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold block mb-2">Describe your situation <span className="text-muted-foreground font-normal">(the more detail, the better)</span></label>
        <Textarea
          placeholder="e.g. My 3-year-old pit mix lunges and barks at other dogs on leash. She's never bitten but it's getting worse. We've tried a prong collar and it helped a little..."
          value={form.situation}
          onChange={e => update("situation", e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Military, first responder, or teacher?</p>
        <div className="flex gap-2">
          <ToggleChip label="Yes — 15% off 🎖️" selected={form.is_military === true} onClick={() => update("is_military", true)} />
          <ToggleChip label="No" selected={form.is_military === false} onClick={() => update("is_military", false)} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GetStarted() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validateStep = () => {
    if (step === 0 && (!form.first_name.trim() || !form.email.trim())) {
      toast.error("Please enter your name and email to continue.");
      return false;
    }
    if (step === 1 && !form.dog_name.trim()) {
      toast.error("Please enter your dog's name.");
      return false;
    }
    return true;
  };

  const next = async () => {
    if (!validateStep()) return;
    // On last form step (History), save lead then go to booking
    if (step === 2) {
      setSubmitting(true);
      await base44.entities.Lead.create({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        source: form.source,
        dog_name: form.dog_name,
        breed: form.breed,
        situation: [
          form.age && `Age: ${form.age}`,
          form.weight && `Weight: ${form.weight}`,
          form.neutered != null && `Neutered: ${form.neutered ? "Yes" : "No"}`,
          form.training_experience && `Prior training: ${form.training_experience}`,
          form.behavioral_issues.length && `Issues: ${form.behavioral_issues.join(", ")}`,
          form.situation,
        ].filter(Boolean).join(" | "),
        is_military: form.is_military,
        services_interested: ["First Consultation"],
        status: "new",
      });
      setSubmitting(false);
      setSubmitted(true);
    }
    setStep(s => s + 1);
  };

  const back = () => setStep(s => s - 1);

  // ── Hero + trust bar (shown above form) ───────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Hero banner */}
      <div
        className="relative bg-foreground text-background py-20 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(15,20,30,0.88), rgba(15,20,30,0.96)), url('https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1400&q=80')" }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-block text-[10px] font-black tracking-[0.25em] uppercase px-4 py-1.5 rounded-full border border-primary/40 text-primary mb-5">
            Free First Consultation
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
            Start Your Dog's <span className="italic text-primary">Transformation</span>
          </h1>
          <p className="text-background/60 text-base md:text-lg max-w-xl mx-auto">
            Fill out this quick profile and book a free intro call with Omar — Brevard County's most trusted dog trainer.
          </p>
          {/* Social proof strip */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
              <span className="text-background/70">5.0 · 200+ clients</span>
            </div>
            <div className="text-background/40 hidden sm:block">·</div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-background/70">
              <Shield className="w-4 h-4 text-primary" /> Fully Insured
            </div>
            <div className="text-background/40 hidden sm:block">·</div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-background/70">
              <Phone className="w-4 h-4 text-primary" /> (321) 830-6272
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-2xl mx-auto px-6 -mt-8 pb-20 relative z-10">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 md:p-10">
          <StepIndicator currentStep={step} />

          {/* Step 0: Owner */}
          {step === 0 && <OwnerStep form={form} update={update} />}

          {/* Step 1: Dog */}
          {step === 1 && <DogStep form={form} update={update} />}

          {/* Step 2: History */}
          {step === 2 && <HistoryStep form={form} update={update} />}

          {/* Step 3: Booking */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                {submitted && (
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                    <CheckCircle2 className="w-4 h-4" /> Profile submitted! Omar will follow up shortly.
                  </div>
                )}
                <h2 className="font-heading text-2xl mb-1">Book your free intro call 📅</h2>
                <p className="text-muted-foreground text-sm">Choose a session type and time that works for you.</p>
              </div>
              <BookingStep ownerName={form.first_name} />
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="outline" size="sm" onClick={back} className="gap-1.5 rounded-full">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
              ) : <div />}
              <Button onClick={next} disabled={submitting} className="gap-1.5 rounded-full font-bold px-6">
                {submitting ? "Saving..." : step === 2 ? "Save & Book →" : "Continue"}
                {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </div>

        {/* Footer reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          No spam. No pressure. Omar personally reviews every inquiry. Questions?{" "}
          <a href="tel:3218306272" className="text-primary font-semibold hover:underline">(321) 830-6272</a>
        </p>
      </div>
    </div>
  );
}