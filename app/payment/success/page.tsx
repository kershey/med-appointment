'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      setStatus('error');
      return;
    }

    // Check payment status
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/payment/status?payment_intent_id=${paymentIntentId}`
        );

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();

        if (data.succeeded) {
          setStatus('success');
          setPaymentMethod(data.paymentMethodUsed || '');
          toast.success('Payment completed successfully!');
        } else {
          setStatus('error');
          toast.error('Payment was not successful. Please try again.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        toast.error('Failed to verify payment status');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleViewAppointments = () => {
    router.push('/patient/appointments');
  };

  const handleTryAgain = () => {
    router.push('/patient/appointments');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {status === 'loading'
              ? 'Verifying Payment'
              : status === 'success'
              ? 'Payment Successful'
              : 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading'
              ? 'Please wait while we verify your payment...'
              : status === 'success'
              ? 'Your appointment payment has been processed successfully.'
              : 'We encountered an issue processing your payment.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === 'loading' ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : status === 'success' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              {paymentMethod && (
                <p className="mt-4 text-sm text-gray-500">
                  Paid via{' '}
                  {paymentMethod.charAt(0).toUpperCase() +
                    paymentMethod.slice(1)}
                </p>
              )}
            </>
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {status === 'loading' ? (
            <p className="text-sm text-gray-500">
              This may take a few moments...
            </p>
          ) : status === 'success' ? (
            <Button onClick={handleViewAppointments}>
              View My Appointments
            </Button>
          ) : (
            <Button onClick={handleTryAgain} variant="destructive">
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
