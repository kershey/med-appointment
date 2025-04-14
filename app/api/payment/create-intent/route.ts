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
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, doctor:doctors(*), payment:payments(*)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to access this appointment
    if (appointment.patient_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this appointment' },
        { status: 403 }
      );
    }

    // Check if payment is required
    if (!appointment.payment || appointment.payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'No pending payment for this appointment' },
        { status: 400 }
      );
    }

    // Create payment intent with PayMongo
    const amount = Math.round(appointment.payment.amount * 100); // Convert to cents
    const paymentIntent = await paymongoService.createPaymentIntent(
      amount,
      `Payment for appointment on ${appointment.appointment_date}`,
      {
        appointment_id: appointmentId,
        patient_id: userData.user.id,
      }
    );

    // Update payment reference in database
    const paymentIntentId = paymentIntent.data.id;
    await supabase
      .from('payments')
      .update({
        payment_reference: paymentIntentId,
      })
      .eq('id', appointment.payment.id);

    return NextResponse.json({
      clientKey: paymentIntent.data.attributes.client_key,
      paymentIntentId,
      amount: appointment.payment.amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
