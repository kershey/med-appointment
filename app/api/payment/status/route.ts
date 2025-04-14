import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import paymongoService from '@/lib/services/paymongo';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    // Check authentication
    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the payment intent ID from the query parameters
    const paymentIntentId =
      request.nextUrl.searchParams.get('payment_intent_id');
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Fetch payment intent from PayMongo
    const paymentIntent =
      await paymongoService.getPaymentIntent(paymentIntentId);

    // Check payment status
    const status = paymentIntent.data.attributes.status;
    const succeeded = status === 'succeeded';

    // If payment succeeded, update our database
    if (succeeded) {
      // Find the payment record associated with this payment intent
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('payment_reference', paymentIntentId)
        .single();

      // Update payment status if needed
      if (payment && payment.status !== 'paid') {
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            payment_method: paymentIntent.data.attributes.payment_method_used,
          })
          .eq('id', payment.id);
      }
    }

    return NextResponse.json({
      status,
      succeeded,
      paymentMethodUsed: paymentIntent.data.attributes.payment_method_used,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
