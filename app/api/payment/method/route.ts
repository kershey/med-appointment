import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import paymongoService from '@/lib/services/paymongo';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    // Check authentication
    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !['card', 'gcash', 'grabpay'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payment method type' },
        { status: 400 }
      );
    }

    // Create payment method
    const paymentMethod = await paymongoService.createPaymentMethod(
      type as 'card' | 'gcash' | 'grabpay'
    );

    return NextResponse.json({
      id: paymentMethod.data.id,
      type: paymentMethod.data.attributes.type,
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}
