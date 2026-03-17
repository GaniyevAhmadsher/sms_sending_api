export class SendSmsDto {
  to!: string;
  body!: string;
  idempotencyKey?: string;
}
