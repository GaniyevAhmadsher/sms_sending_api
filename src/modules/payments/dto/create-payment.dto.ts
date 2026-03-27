export class CreatePaymentDto {
  amount!: number;
  provider!: 'click' | 'payme';
}
