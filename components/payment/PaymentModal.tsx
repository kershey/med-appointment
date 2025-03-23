'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PaymentModalProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({
  appointmentId,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'card' | 'gcash' | 'grabpay'
  >('card');
  const router = useRouter();
  const [cardError, setCardError] = useState<string | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const paymongoInstanceRef = useRef<PayMongoInstance | null>(null);

  // Initialize payment intent when modal opens
  useEffect(() => {
    if (isOpen && appointmentId) {
      initializePayment();
    }
  }, [isOpen, appointmentId]);

  // Load PayMongo JS when needed
  useEffect(() => {
    if (clientKey) {
      const script = document.createElement('script');
      script.src = 'https://js.paymongo.com/v2/paymongo.js';
      script.async = true;
      script.onload = () => {
        if (window.PayMongo) {
          // Initialize PayMongo once loaded
          paymongoInstanceRef.current = window.PayMongo.init({
            publicKey: process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY,
          });
        }
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [clientKey]);

  // Setup card element when PayMongo is loaded and modal is open
  useEffect(() => {
    if (
      isOpen &&
      clientKey &&
      paymongoInstanceRef.current &&
      cardElementRef.current &&
      paymentMethod === 'card'
    ) {
      // Clear previous instances
      cardElementRef.current.innerHTML = '';
      setCardError(null);

      const cardElement = paymongoInstanceRef.current.createElement('card');
      cardElement.mount(cardElementRef.current);

      // Listen for errors
      cardElement.on('change', (event: PayMongoElementEvent) => {
        setCardError(event.error ? event.error.message || '' : '');
      });
    }
  }, [isOpen, clientKey, paymentMethod, paymongoInstanceRef.current]);

  const initializePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      setClientKey(data.clientKey);
      setPaymentIntentId(data.paymentIntentId);
      setAmount(data.amount);
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (method: 'card' | 'gcash' | 'grabpay') => {
    setPaymentMethod(method);
  };

  const processPayment = async () => {
    if (!clientKey || !paymentIntentId) {
      toast.error('Payment not initialized properly');
      return;
    }

    setLoading(true);
    try {
      let paymentMethodId;

      if (paymentMethod === 'card') {
        // For card payments, use PayMongo Elements
        if (!paymongoInstanceRef.current) {
          throw new Error('PayMongo not initialized');
        }

        // Create a payment method using the card element
        const paymentMethodResult =
          await paymongoInstanceRef.current.createPaymentMethod({
            type: 'card',
            card: {
              billing_details: {
                name: 'Patient Name', // Ideally get this from form input
                email: 'patient@example.com', // Ideally get this from form input or user profile
              },
            },
          });

        if (paymentMethodResult.error) {
          throw new Error(paymentMethodResult.error.message);
        }

        if (!paymentMethodResult.paymentMethod) {
          throw new Error('Failed to create payment method');
        }

        paymentMethodId = paymentMethodResult.paymentMethod.id;
      } else {
        // For e-wallets (GCash, GrabPay)
        const paymentMethodResponse = await fetch('/api/payment/method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: paymentMethod }),
        });

        if (!paymentMethodResponse.ok) {
          throw new Error('Failed to create payment method');
        }

        const paymentMethodData = await paymentMethodResponse.json();
        paymentMethodId = paymentMethodData.id;
      }

      // Attach payment method to payment intent
      const attachResponse = await fetch('/api/payment/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!attachResponse.ok) {
        throw new Error('Failed to process payment');
      }

      const attachData = await attachResponse.json();

      // For e-wallets, redirect to the wallet's payment page
      if (
        attachData.next_action &&
        attachData.next_action.type === 'redirect'
      ) {
        window.location.href = attachData.next_action.redirect.url;
        return;
      }

      // For direct payments, check status
      if (attachData.status === 'succeeded') {
        toast.success('Payment successful!');
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.info(
          'Payment is processing. You will be notified when completed.'
        );
      }

      onClose();
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Please select a payment method to complete your appointment booking.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Processing...</span>
          </div>
        ) : (
          <div className="py-4">
            <div className="mb-4">
              <p className="font-semibold">Amount: ₱{amount.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="font-medium">Select Payment Method</div>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => handlePaymentMethodChange('card')}
                    className="justify-start"
                  >
                    Credit/Debit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'gcash' ? 'default' : 'outline'}
                    onClick={() => handlePaymentMethodChange('gcash')}
                    className="justify-start"
                  >
                    GCash
                  </Button>
                  <Button
                    variant={
                      paymentMethod === 'grabpay' ? 'default' : 'outline'
                    }
                    onClick={() => handlePaymentMethodChange('grabpay')}
                    className="justify-start"
                  >
                    GrabPay
                  </Button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Card Details</div>
                  <div
                    ref={cardElementRef}
                    className="border p-3 rounded-md min-h-[40px]"
                  ></div>
                  {cardError && (
                    <p className="text-sm text-red-500 mt-1">{cardError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={processPayment} disabled={loading || !clientKey}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
