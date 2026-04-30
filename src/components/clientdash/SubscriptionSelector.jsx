import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

const TIERS = [
  {
    name: "Basic",
    priceId: "price_basic",
    monthlyPrice: 99,
    features: [
      "1 training session/week",
      "Email homework support",
      "Weekly progress reports",
      "Access to resource library",
      "Chat with Omar",
    ],
  },
  {
    name: "Pro",
    priceId: "price_pro",
    monthlyPrice: 249,
    features: [
      "2 training sessions/week",
      "Personalized training plan",
      "Video feedback on practice",
      "Priority email support",
      "Monthly strategy calls",
      "Everything in Basic",
    ],
    popular: true,
  },
  {
    name: "Elite",
    priceId: "price_elite",
    monthlyPrice: 499,
    features: [
      "Unlimited training sessions",
      "One-on-one coaching",
      "Daily video feedback",
      "24/7 priority support",
      "Custom behavior protocols",
      "Lifetime access & updates",
      "Everything in Pro",
    ],
  },
];

export default function SubscriptionSelector({ currentTier, clientEmail, onSubscriptionChange }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectTier = async (tier) => {
    // Check if in iframe
    if (window.self !== window.top) {
      toast.error("Subscriptions only work from a published app. Please visit the live site.");
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, you'd map tier names to actual Stripe price IDs
      // For now, we'll use placeholder IDs that should be replaced with real ones
      const priceMap = {
        Basic: "price_1TS2HzDFarLTcYHMzLiW62vq",
        Pro: "price_1TS2HzDFarLTcYHMX4LQGpIZ",
        Elite: "price_1TS2HyDFarLTcYHMbrHXbZr2",
      };

      const res = await base44.functions.invoke("createSubscriptionCheckout", {
        priceId: priceMap[tier.name],
        tier: tier.name,
      });

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (error) {
      toast.error("Checkout failed: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-1">Choose Your Training Plan</h3>
        <p className="text-sm text-muted-foreground">Upgrade anytime. Cancel anytime. No long-term commitment required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl overflow-hidden transition-all border-2 ${
              tier.popular
                ? "border-primary shadow-lg scale-105 md:scale-100 md:shadow-xl"
                : "border-border hover:border-primary/50"
            } ${currentTier === tier.name.toLowerCase() ? "ring-2 ring-green-500" : ""}`}
          >
            {tier.popular && (
              <div className="bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">MOST POPULAR</span>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-xl mb-1">{tier.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary">${tier.monthlyPrice}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectTier(tier)}
                disabled={loading || currentTier === tier.name.toLowerCase()}
                variant={tier.popular ? "default" : "outline"}
                className={`w-full rounded-full font-bold gap-2 ${tier.popular ? "" : ""}`}
              >
                {loading && selectedTier === tier.name ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === tier.name.toLowerCase() ? (
                  <>
                    <Check className="w-4 h-4" />
                    Current Plan
                  </>
                ) : (
                  `Select ${tier.name}`
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 text-sm text-blue-900">
        <p className="font-semibold mb-1">💳 All plans include:</p>
        <ul className="text-xs space-y-0.5 text-blue-800">
          <li>• Full dashboard access with real-time progress tracking</li>
          <li>• Behavioral logging and AI-generated weekly summaries</li>
          <li>• Achievement badges and level system</li>
          <li>• 30-day money-back guarantee</li>
        </ul>
      </div>
    </div>
  );
}