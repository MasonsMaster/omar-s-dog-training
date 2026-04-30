import { useState } from "react";
import { base44 } from "@/api/base44Client";
import TrainingTierCard from "./TrainingTierCard";
import { toast } from "sonner";

const TRAINING_TIERS = [
  {
    tier: "Basic",
    duration: "4-week program",
    price: 49900,
    priceId: "price_1TS2RsDFarLTcYHM7VWXSZdd",
    features: [
      "4 weekly training sessions",
      "Custom homework plan",
      "Email support",
      "Progress tracking",
      "Behavior log access",
    ],
  },
  {
    tier: "Pro",
    duration: "8-week program",
    price: 99900,
    priceId: "price_1TS2RsDFarLTcYHMS4PLGdAV",
    features: [
      "Bi-weekly training sessions",
      "Video feedback on practice",
      "Real-time messaging",
      "Weekly progress reports",
      "Behavior milestone tracking",
      "Behavior challenge support",
    ],
    isPopular: true,
  },
  {
    tier: "Elite",
    duration: "12-week program",
    price: 149900,
    priceId: "price_1TS2RsDFarLTcYHMtc5mmwPz",
    features: [
      "Weekly training sessions",
      "Unlimited messaging",
      "Advanced video analysis",
      "Monthly comprehensive reports",
      "Behavior mastery tracking",
      "Priority support",
      "XP & badge achievements",
    ],
  },
];

export default function TrainingPricingGrid({ clientEmail }) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (priceId, tierName) => {
    // Check if running in iframe
    if (window.self !== window.top) {
      toast.error(
        "Checkout only works from the published app. Please use the main app link."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        email: clientEmail,
        priceId,
        successUrl: `${window.location.origin}/my-dashboard?tier=${tierName}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Unable to process checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {TRAINING_TIERS.map((tier) => (
        <TrainingTierCard
          key={tier.tier}
          {...tier}
          onSelect={handleSelect}
          loading={loading}
        />
      ))}
    </div>
  );
}