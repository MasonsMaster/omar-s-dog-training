import Stripe from "npm:stripe@14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { email, priceId, successUrl, cancelUrl } = await req.json();

    if (!email || !priceId) {
      return Response.json({ error: "Missing required fields: email, priceId" }, { status: 400 });
    }

    console.log(`Creating checkout session for ${email} with price ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${new URL(req.url).origin}/checkout-success`,
      cancel_url: cancelUrl || `${new URL(req.url).origin}/checkout-cancel`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
      },
    });

    console.log(`Checkout session created: ${session.id}`);

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});