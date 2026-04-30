import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PRICE_ID = "price_1TS092DFarLTcYHM3bXHKRQg"; // AI Handler Coaching - Monthly

export default function SubscriptionCheckout({ email: initialEmail, onSuccess }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    // Check if running in iframe
    if (window.self !== window.top) {
      toast.error("Please open this app in a new tab to complete checkout");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        email: email.trim(),
        priceId: PRICE_ID,
        successUrl: `${window.location.origin}/checkout-success`,
        cancelUrl: `${window.location.origin}/checkout-cancel`,
      });

      if (!res.data?.url) {
        throw new Error("No checkout URL returned");
      }

      // Redirect to Stripe Checkout
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to create checkout session");
      toast.error("Checkout error: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Pricing Card */}
      <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center">
        <h3 className="font-bold text-2xl mb-2">AI Handler Coaching</h3>
        <p className="text-muted-foreground text-sm mb-6">Monthly subscription for personalized training guidance</p>
        
        <div className="mb-8">
          <div className="text-5xl font-black text-primary">$99</div>
          <div className="text-sm text-muted-foreground mt-1">/month, billed monthly</div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8 text-left text-sm">
          {[
            "1 consultation call per month",
            "AI-assisted training plans",
            "Email support within 24 hours",
            "Exclusive member content library",
            "Cancel anytime",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Form */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-2">Email Address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className="text-sm"
          />
        </div>

        {error && (
          <div className="flex gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <Button
          onClick={handleCheckout}
          disabled={loading || !email.trim()}
          size="lg"
          className="w-full rounded-full font-bold text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Secure payment powered by Stripe. No recurring charges until you confirm.
        </p>
      </div>
    </div>
  );
}