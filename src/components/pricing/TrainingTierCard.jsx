import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrainingTierCard({
  tier,
  price,
  duration,
  features,
  priceId,
  isPopular,
  onSelect,
  loading,
}) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        isPopular
          ? "border-primary bg-primary/5 shadow-lg scale-105 relative"
          : "border-border hover:border-primary/40"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-heading text-2xl font-bold mb-1">{tier}</h3>
          <p className="text-sm text-muted-foreground">{duration}</p>
        </div>

        {/* Price */}
        <div className="border-b border-border pb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">${(price / 100).toFixed(0)}</span>
            <span className="text-muted-foreground text-sm font-semibold">one-time</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPopular ? "text-primary" : "text-primary/60"}`} />
              <span className="text-sm leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          onClick={() => onSelect(priceId, tier)}
          disabled={loading}
          variant={isPopular ? "default" : "outline"}
          className={`w-full rounded-xl font-bold gap-2 mt-4 ${
            isPopular ? "" : "hover:border-primary"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Get Started
            </>
          )}
        </Button>
      </div>
    </div>
  );
}