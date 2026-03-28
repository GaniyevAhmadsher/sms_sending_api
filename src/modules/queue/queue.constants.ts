export const SMS_QUEUE = 'sms-queue';
export const SMS_DLQ = 'sms-queue-dlq';
export const SEND_SMS_JOB = 'send-sms';

export const BULLMQ_CONNECTION = Symbol('BULLMQ_CONNECTION');
export const SMS_BULLMQ_QUEUE = Symbol('SMS_BULLMQ_QUEUE');

export const PAYMENT_WEBHOOK_QUEUE = 'payment-webhook-queue';
export const PAYMENT_WEBHOOK_DLQ = 'payment-webhook-queue-dlq';
export const PROCESS_PAYMENT_WEBHOOK_JOB = 'process-payment-webhook';
