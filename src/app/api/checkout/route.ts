import { NextResponse } from 'next/server';

// Note: To use Stripe, install it: npm install stripe
// And define STRIPE_SECRET_KEY in your .env.local

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, userId, userEmail } = body;

    if (!plan || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: plan or userId' },
        { status: 400 }
      );
    }

    // Map plans to prices
    const priceMap: Record<string, string> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
      lifetime: process.env.STRIPE_PRICE_LIFETIME || 'price_lifetime_placeholder',
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // In a live environment, you would instantiate Stripe:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   mode: plan === 'lifetime' ? 'payment' : 'subscription',
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
    //   metadata: { userId, plan },
    //   customer_email: userEmail,
    // });
    // return NextResponse.json({ url: session.url });

    console.log(`Mocking checkout session for ${userEmail} (ID: ${userId}) on plan: ${plan}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return a mock URL for checkout redirect in development
    return NextResponse.json({
      url: `/dashboard?payment_sim=true&plan=${plan}&userId=${userId}`,
      mock: true
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
