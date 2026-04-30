import Stripe from "npm:stripe@14.0.0";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Map tier names from metadata
function getTierFromPriceId(priceId, metadata) {
  const tierMap = {
    "price_1TS2HzDFarLTcYHMzLiW62vq": "Basic",
    "price_1TS2HzDFarLTcYHMX4LQGpIZ": "Pro",
    "price_1TS2HyDFarLTcYHMbrHXbZr2": "Elite",
  };
  return tierMap[priceId] || metadata?.tier || "Custom";
}

function getTierAmount(tier) {
  const amounts = { Basic: 99, Pro: 249, Elite: 499 };
  return amounts[tier] || 0;
}

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

    // Create SDK client for database operations
    const base44 = createClientFromRequest(req);

    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const clientEmail = subscription.metadata?.client_email || subscription.customer_email;
        const tier = getTierFromPriceId(subscription.items.data[0]?.price?.id, subscription.metadata);
        
        console.log(`✓ Subscription created for ${clientEmail}, tier: ${tier}`);
        
        // Create invoice record
        if (clientEmail) {
          const amount = getTierAmount(tier);
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);
          
          await base44.asServiceRole.entities.Invoice.create({
            client_email: clientEmail,
            program: `${tier} Training Plan`,
            amount: amount,
            status: "pending",
            due_date: dueDate.toISOString().split("T")[0],
            notes: `Stripe Subscription ID: ${subscription.id}`,
          });
          console.log(`✓ Invoice created for ${clientEmail}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const clientEmail = invoice.customer_email;
        
        console.log(`✓ Invoice paid: ${invoice.id} for ${clientEmail}`);
        
        // Update invoice status in database
        if (clientEmail) {
          const invoices = await base44.asServiceRole.entities.Invoice.filter({ 
            client_email: clientEmail,
            amount: invoice.amount_paid / 100
          });
          
          if (invoices.length > 0) {
            await base44.asServiceRole.entities.Invoice.update(invoices[0].id, {
              status: "paid",
              paid_date: new Date().toISOString().split("T")[0],
            });
            console.log(`✓ Invoice marked as paid`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const clientEmail = invoice.customer_email;
        
        console.log(`⚠ Invoice payment failed: ${invoice.id} for ${clientEmail}`);
        
        // Update invoice status to overdue
        if (clientEmail) {
          const invoices = await base44.asServiceRole.entities.Invoice.filter({ 
            client_email: clientEmail,
          });
          
          if (invoices.length > 0) {
            await base44.asServiceRole.entities.Invoice.update(invoices[0].id, {
              status: "overdue",
            });
            console.log(`✓ Invoice marked as overdue`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const clientEmail = subscription.metadata?.client_email || subscription.customer_email;
        
        console.log(`✓ Subscription cancelled for ${clientEmail}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});