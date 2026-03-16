export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SendSmsResult {
  provider: string;
  providerRef: string;
}

export interface SmsProvider {
  send(input: SendSmsInput): Promise<SendSmsResult>;
}
