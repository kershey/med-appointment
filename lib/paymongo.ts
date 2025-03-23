import { Paymongo } from 'paymongo';

// Initialize PayMongo client
const createPaymongoClient = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'PayMongo secret key is not defined in environment variables'
    );
  }

  return new Paymongo(secretKey);
};

export default createPaymongoClient;

// PayMongo types for better type safety
export interface PaymentMethodData {
  attributes: {
    type: 'card' | 'gcash';
    details?: {
      card_number?: string;
      exp_month?: number;
      exp_year?: number;
      cvc?: string;
    };
    billing?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
  };
}

export interface PaymentIntentData {
  attributes: {
    amount: number; // Amount in cents
    payment_method_allowed: Array<'card' | 'gcash'>;
    payment_method_options?: {
      card?: {
        request_three_d_secure: 'any' | 'automatic' | 'never';
      };
    };
    description?: string;
    statement_descriptor?: string;
    currency: 'PHP';
    metadata?: Record<string, unknown>;
  };
}

export interface SourceData {
  attributes: {
    amount: number; // Amount in cents
    redirect: {
      success: string;
      failed: string;
    };
    type: 'gcash';
    currency: 'PHP';
    billing?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
}
