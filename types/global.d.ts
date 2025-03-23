interface Window {
  PayMongo: {
    init: (config: { publicKey: string }) => PayMongoInstance;
  };
}

interface PayMongoInstance {
  createElement: (type: string) => PayMongoElement;
  createPaymentMethod: (
    options: PayMongoPaymentMethodOptions
  ) => Promise<PayMongoPaymentMethodResult>;
}

interface PayMongoElement {
  mount: (element: HTMLElement) => void;
  on: (event: string, callback: (event: PayMongoElementEvent) => void) => void;
}

interface PayMongoElementEvent {
  error?: {
    message: string;
  };
}

interface PayMongoPaymentMethodOptions {
  type: string;
  card: {
    billing_details?: {
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

interface PayMongoPaymentMethodResult {
  error?: {
    message: string;
  };
  paymentMethod?: {
    id: string;
  };
}
