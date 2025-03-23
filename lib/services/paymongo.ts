import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

// Card details type
interface CardDetails {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
}

// Payment method types
type PaymentMethodType = 'card' | 'gcash' | 'grabpay';

class PayMongoService {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    this.secretKey = process.env.PAYMONGO_SECRET_KEY || '';
    this.publicKey = process.env.PAYMONGO_PUBLIC_KEY || '';
  }

  /**
   * Create a payment intent
   * @param amount Amount in cents (PHP)
   * @param description Payment description
   * @param metadata Additional metadata for the payment
   * @returns PayMongo payment intent
   */
  async createPaymentIntent(
    amount: number,
    description: string,
    metadata: Record<string, string> = {}
  ) {
    try {
      const response = await axios.post(
        `${PAYMONGO_API_URL}/payment_intents`,
        {
          data: {
            attributes: {
              amount,
              payment_method_allowed: ['card', 'gcash', 'grabpay'],
              payment_method_options: {
                card: { request_three_d_secure: 'any' },
              },
              currency: 'PHP',
              description,
              metadata,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(this.secretKey).toString(
              'base64'
            )}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayMongo createPaymentIntent error:', error);
      throw error;
    }
  }

  /**
   * Attach a payment method to a payment intent
   * @param paymentIntentId The payment intent ID
   * @param paymentMethodId The payment method ID
   * @returns The updated payment intent
   */
  async attachPaymentMethod(paymentIntentId: string, paymentMethodId: string) {
    try {
      const response = await axios.post(
        `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
        {
          data: {
            attributes: {
              payment_method: paymentMethodId,
              return_url: `${
                process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              }/payment/success`,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(this.secretKey).toString(
              'base64'
            )}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayMongo attachPaymentMethod error:', error);
      throw error;
    }
  }

  /**
   * Create a payment method
   * @param type Payment method type: 'card', 'gcash', 'grabpay'
   * @param details Payment method details for card payments
   * @returns The created payment method
   */
  async createPaymentMethod(type: PaymentMethodType, details?: CardDetails) {
    try {
      const payload: {
        data: {
          attributes: {
            type: PaymentMethodType;
            details?: CardDetails;
          };
        };
      } = {
        data: {
          attributes: {
            type,
          },
        },
      };

      if (type === 'card' && details) {
        payload.data.attributes.details = details;
      }

      const response = await axios.post(
        `${PAYMONGO_API_URL}/payment_methods`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(this.publicKey).toString(
              'base64'
            )}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayMongo createPaymentMethod error:', error);
      throw error;
    }
  }

  /**
   * Get a payment intent by ID
   * @param paymentIntentId The payment intent ID
   * @returns The payment intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      const response = await axios.get(
        `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(this.secretKey).toString(
              'base64'
            )}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayMongo getPaymentIntent error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const paymongoService = new PayMongoService();

export default paymongoService;
