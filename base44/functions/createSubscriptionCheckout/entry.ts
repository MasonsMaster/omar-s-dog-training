import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, tier } = await req.json();

    if (!priceId || !tier) {
      return Response.json({ error: 'Missing priceId or tier' }, { status: 400 });
    }

    console.log(`Creating checkout for ${user.email}, tier: ${tier}, priceId: ${priceId}`);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/my-dashboard?subscription=success`,
      cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/my-dashboard?subscription=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        client_email: user.email,
        tier: tier,
      },
    });

    console.log(`✓ Checkout session created: ${session.id}`);

    return Response.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});