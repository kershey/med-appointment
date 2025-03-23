# PayMongo Integration Guide

This guide explains how to set up and use the PayMongo payment integration in the Medical Appointment Booking app. The integration supports credit/debit cards, GCash, and GrabPay payment methods.

## Prerequisites

Before using the payment feature, make sure you have:

1. Created a PayMongo account at [https://dashboard.paymongo.com/signup](https://dashboard.paymongo.com/signup)
2. Obtained your API keys from the PayMongo dashboard
3. Set up the environment variables correctly

## Environment Variables

The following environment variables must be set in your `.env.local` file:

```
# PayMongo credentials
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

- `PAYMONGO_SECRET_KEY`: Your PayMongo secret key (starts with `sk_`)
- `PAYMONGO_PUBLIC_KEY`: Your PayMongo public key (starts with `pk_`) for server-side operations
- `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY`: Same as the public key but accessible to client-side code

## Payment Flow

The payment flow works as follows:

1. When a patient books an appointment, a pending payment record is created
2. The patient can view their appointments and see which ones require payment
3. When clicking "Pay Now", the PaymentModal component is displayed
4. The patient selects a payment method (credit/debit card, GCash, GrabPay)
5. For card payments, the patient enters their card details directly in the form
6. For e-wallets, they are redirected to the wallet's payment page
7. After successful payment, the patient is redirected to the success page
8. The payment status is updated in the database

## Implementation Components

### API Routes

- `/api/payment/create-intent` - Creates a PayMongo payment intent
- `/api/payment/method` - Creates a payment method (card, GCash, GrabPay)
- `/api/payment/attach` - Attaches a payment method to a payment intent
- `/api/payment/status` - Checks the status of a payment
- `/api/payment/webhook` - Processes PayMongo webhooks

### Components

- `PaymentModal` - The main payment modal that collects payment information
- `PaymentSuccess` - The success page where users are redirected after payment

### Services

- `PayMongoService` - A service class that handles all PayMongo API calls

## Testing Payments

For testing, you can use the following test cards:

- **Visa (Successful)**: 4343434343434345
- **Mastercard (Successful)**: 5555555555554444
- **Card (3D Secure)**: 4123450131001381
- **Card (Declined)**: 4111111111111111

Use any future expiry date and any 3-digit CVC.

For e-wallets testing, follow the instructions provided on the PayMongo sandbox environment.

## Setting Up Webhooks

To handle asynchronous payment updates, you need to set up webhooks:

1. Go to your PayMongo dashboard > Developers > Webhooks
2. Add a new webhook with the URL: `https://your-domain.com/api/payment/webhook`
3. Select all event types related to payments
4. Save the webhook

## Going Live

When you're ready to go live:

1. Complete the PayMongo onboarding and verification process
2. Switch your API keys from test to live
3. Update your environment variables with the live keys
4. Test the live integration with real payments

## Troubleshooting

Common issues:

- **Payment not processing**: Check your API keys and ensure they are correctly set in environment variables
- **Webhook not receiving events**: Verify your webhook URL is publicly accessible and properly configured
- **Card payments failing**: Ensure you're using valid test cards in test mode

For more detailed information, refer to the [PayMongo API documentation](https://developers.paymongo.com/docs).
