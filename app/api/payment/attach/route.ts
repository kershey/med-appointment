import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import paymongoService from '@/lib/services/paymongo';

// Define explicit types for the database responses
interface Payment {
  id: string;
  appointment_id: string;
}

interface Appointment {
  id: string;
  patient_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: session } = await supabase.auth.getSession();

    // Check authentication
    if (!session.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment intent ID and payment method ID are required' },
        { status: 400 }
      );
    }

    // Get the payment with appointment_id field
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('id, appointment_id')
      .eq('payment_reference', paymentIntentId);

    if (paymentError || !payments || payments.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Now get the appointment to verify ownership
    const payment = payments[0] as Payment;
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id')
      .eq('id', payment.appointment_id)
      .single();

    const typedAppointment = appointment as Appointment;
    if (
      appointmentError ||
      !typedAppointment ||
      typedAppointment.patient_id !== session.session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to access this payment' },
        { status: 403 }
      );
    }

    // Attach payment method to payment intent
    const result = await paymongoService.attachPaymentMethod(
      paymentIntentId,
      paymentMethodId
    );

    return NextResponse.json({
      status: result.data.attributes.status,
      next_action: result.data.attributes.next_action,
    });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to attach payment method' },
      { status: 500 }
    );
  }
}
