import { useState } from "react";
import { Button } from "@/components/ui/button";
import SectionBadge from "@/components/shared/SectionBadge";
import CheckItem from "@/components/shared/CheckItem";
import { Star, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["Black", "Red", "Navy", "Green", "Brown"];

const STEPS = [
  "Thread rope through brass O-ring",
  "Slide loop over dog's head — HIGH behind ears",
  "Adjust leather stopper — 2 finger gap",
  "Walk with purpose. Pull = tightens gently",
  "Loose leash = rewards good walking",
];

export default function Shop() {
  const [selColor, setSelColor] = useState("Black");

  const handleAdd = () => {
    toast.success(`Added: ODT Slip Lead (${selColor}) — $24.99`, {
      description: "Call (321) 830-6272 to complete your order",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Left — Product Images */}
        <div className="space-y-6">
          <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border">
            <img
              src="https://media.base44.com/images/public/69e6d7ee9890194e50a63655/8fa1efdfe_generated_94a6f0a8.png"
              alt="ODT Handler Slip Lead — premium braided nylon with brass O-ring"
              className="w-full h-full object-cover"
            />
          </div>

          {/* How to use */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-base mb-4">🎬 How to Put It On</h3>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4 flex items-center justify-center">
              <img
                src="https://media.base44.com/images/public/69e6d7ee9890194e50a63655/55029b79e_generated_e01ca5c3.png"
                alt="Handler demonstrating slip lead technique with Belgian Malinois"
                className="w-full h-full object-cover"
              />
            </div>
            <ol className="space-y-2 text-sm">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right — Product Details */}
        <div className="lg:sticky lg:top-28">
          <SectionBadge>Official Gear</SectionBadge>
          <h1 className="font-heading text-3xl md:text-4xl mb-3">ODT Handler Slip Lead — 3ft</h1>

          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.9 (127 reviews)</span>
          </div>

          <div className="text-4xl font-bold mb-2">$24.99</div>
          <div className="text-sm font-semibold text-secondary mb-6">
            ✓ In Stock · Free shipping over $50
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">
            The same 3ft slip lead Omar uses every day. Leash and collar in one — no harness, no clips. Premium braided nylon, brass O-ring, adjustable leather stopper.
          </p>

          <div className="space-y-1 mb-6">
            <CheckItem text="Same lead Omar uses daily" />
            <CheckItem text="Works on all breeds & sizes" />
            <CheckItem text="Includes FREE how-to video" />
            <CheckItem text="5 colors available" />
          </div>

          {/* Color picker */}
          <div className="flex flex-wrap gap-2 mb-6">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelColor(c)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                  selColor === c
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            onClick={handleAdd}
            className="w-full rounded-xl font-bold text-base h-14 gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Cart — $24.99
          </Button>

          {/* Bundle deal */}
          <div className="mt-5 bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
            <div className="font-bold">🏆 2 for $39.99 (save $10!)</div>
            <div className="text-sm text-muted-foreground mt-1">
              FREE with any training sign-up ($399+)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}