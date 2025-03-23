declare module 'paymongo' {
  export class Paymongo {
    constructor(secretKey: string);

    createPaymentMethod(
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
    createPaymentIntent(
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
    createSource(
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
    retrievePaymentIntent(id: string): Promise<Record<string, unknown>>;
    attachPaymentIntent(
      paymentIntentId: string,
      paymentMethodId: string
    ): Promise<Record<string, unknown>>;
    createPayment(
      data: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
  }
}
