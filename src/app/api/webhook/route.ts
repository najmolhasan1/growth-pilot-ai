import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Note: To use Stripe Webhooks, install it and configure STRIPE_WEBHOOK_SECRET
// Stripe SDK imports are shown commented out below.

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  try {
    // In a live environment:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
    // let event;
    // try {
    //   event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    // } catch (err: any) {
    //   return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    // }
    //
    // if (event.type === 'checkout.session.completed') {
    //   const session = event.data.object;
    //   const userId = session.metadata?.userId;
    //   const plan = session.metadata?.plan;
    //   
    //   if (userId) {
    //     const supabase = getSupabaseServerClient();
    //     if (supabase) {
    //       // Update user metadata to Plus using Supabase admin service role
    //       const { error } = await supabase.auth.admin.updateUserById(userId, {
    //         user_metadata: { plan: 'Plus' }
    //       });
    //       if (error) throw error;
    //       console.log(`Successfully upgraded user ${userId} to plan: Plus via Webhook`);
    //     }
    //   }
    // }

    // Mock response for testing setup
    const body = JSON.parse(payload);
    console.log('Mock Webhook received event:', body.type || 'unknown');

    if (body.type === 'checkout.session.completed') {
      const session = body.data?.object;
      const userId = session?.metadata?.userId;

      if (userId) {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { plan: 'Plus' }
          });
          if (error) {
            console.error('Supabase admin update error:', error);
            throw error;
          }
          console.log(`Mock-webhook: Upgraded user ${userId} plan to Plus`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook signature verification or processing failed:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

