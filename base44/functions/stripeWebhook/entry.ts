import Stripe from "npm:stripe@14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe-signature header");
      return Response.json({ error: "No signature" }, { status: 400 });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
        console.log("✓ Subscription created:", event.data.object.id);
        // TODO: Record subscription in database
        break;

      case "customer.subscription.updated":
        console.log("✓ Subscription updated:", event.data.object.id);
        // TODO: Update subscription in database
        break;

      case "customer.subscription.deleted":
        console.log("✓ Subscription cancelled:", event.data.object.id);
        // TODO: Mark subscription as cancelled in database
        break;

      case "invoice.payment_succeeded":
        console.log("✓ Invoice paid:", event.data.object.id);
        // TODO: Send payment confirmation email
        break;

      case "invoice.payment_failed":
        console.log("⚠ Invoice payment failed:", event.data.object.id);
        // TODO: Send payment failure notification
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});