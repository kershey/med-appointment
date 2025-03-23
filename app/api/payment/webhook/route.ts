import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    const event = payload.data;

    // Skip processing if this is not a valid event
    if (!event || !event.type) {
      return NextResponse.json({ received: true });
    }

    console.log(`PayMongo webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event);
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event);
      case 'source.chargeable':
        return await handleSourceChargeable(event);
      default:
        // Return success for unhandled event types
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntentId = event.data.id;
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
  }

  const supabase = createClient();

  // Find the payment record associated with this payment intent
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_reference', paymentIntentId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment not found for payment intent:', paymentIntentId);
    return NextResponse.json(
      { error: 'Payment record not found' },
      { status: 404 }
    );
  }

  // Update payment status to paid
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      payment_date: new Date().toISOString(),
      payment_method: event.data.attributes.payment_method_used,
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Error updating payment:', updateError);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true, updated: true });
}

async function handlePaymentIntentFailed(event: any) {
  const paymentIntentId = event.data.id;
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
  }

  const supabase = createClient();

  // Find the payment record associated with this payment intent
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_reference', paymentIntentId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment not found for payment intent:', paymentIntentId);
    return NextResponse.json(
      { error: 'Payment record not found' },
      { status: 404 }
    );
  }

  // Update payment status to failed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Error updating payment:', updateError);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true, updated: true });
}

async function handleSourceChargeable(event: any) {
  // Handle source chargeable event (for GCash/GrabPay/etc)
  // This is where you would create a payment for a source
  // For now, just log it
  console.log('Source chargeable event received:', event.data.id);
  return NextResponse.json({ received: true });
}
