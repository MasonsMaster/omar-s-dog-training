import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionBadge from "../shared/SectionBadge";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const REVIEWS = [
  {
    quote: "Omar didn't just train our dog — he trained US. Our whole family dynamic changed.",
    name: "The Martinez Family",
    location: "Merritt Island",
    dog: "Bruno, German Shepherd",
    outcome: "Aggression resolved in 3 sessions",
  },
  {
    quote: "I was ready to rehome my rescue. Omar showed me the problem wasn't my dog — it was my energy.",
    name: "Sarah K.",
    location: "Cocoa Beach",
    dog: "Luna, Pit Mix",
    outcome: "Anxiety & leash reactivity gone",
  },
  {
    quote: "PoopPatrol is a LIFESAVER. 3 dogs, crazy schedule. Best $60 I spend every month.",
    name: "Mike T.",
    location: "Viera",
    dog: "3 Labs",
    outcome: "Ongoing PoopPatrol™ client",
  },
  {
    quote: "Our dog would bolt out the front door every time. After ONE session with Omar — completely fixed.",
    name: "Jessica & Tom R.",
    location: "Melbourne",
    dog: "Koda, Husky",
    outcome: "Door bolting eliminated in 1 session",
  },
  {
    quote: "Mason AI answered my questions at 11pm when I was panicking. Then Omar called me the next morning.",
    name: "Amanda L.",
    location: "Titusville",
    dog: "Rex, Rottweiler",
    outcome: "Behavioral program started within 48hrs",
  },
  {
    quote: "Military discount + the best training I've ever seen. Omar gets dogs AND people.",
    name: "Sgt. Daniel C.",
    location: "Palm Bay",
    dog: "Scout, Belgian Malinois",
    outcome: "Advanced obedience + protection work",
  },
];

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = (d) => {
    setDir(d);
    setIndex((i) => (i + d + REVIEWS.length) % REVIEWS.length);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [paused, index]);

  const review = REVIEWS[index];

  return (
    <section className="bg-card border-y border-border py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <SectionBadge>Real Results</SectionBadge>
          <h2 className="font-heading text-3xl md:text-4xl">Transformations</h2>
          <p className="text-muted-foreground text-sm mt-2">98% success rate · Brevard County</p>
        </div>

        <div
          className="relative bg-background rounded-2xl border border-border p-8 md:p-12 shadow-sm overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Decorative quote mark */}
          <div className="absolute top-6 left-8 text-7xl font-heading text-primary/10 leading-none select-none">"</div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="relative z-10"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="italic text-lg md:text-xl leading-relaxed text-foreground mb-6">
                "{review.quote}"
              </p>

              {/* Outcome badge */}
              <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 text-primary rounded-full px-4 py-1.5 text-xs font-bold mb-6">
                ✓ {review.outcome}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                  {review.name[0]}
                </div>
                <div>
                  <div className="font-bold text-sm">{review.name}</div>
                  <div className="text-xs text-muted-foreground">{review.dog} · {review.location}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <button
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === index ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}