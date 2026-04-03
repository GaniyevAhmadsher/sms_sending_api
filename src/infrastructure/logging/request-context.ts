import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  correlationId: string;
  userId?: string;
  apiKeyId?: string;
  tenantId?: string;
  paymentId?: string;
  smsId?: string;
  jobId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function updateRequestContext(values: Partial<RequestContextStore>) {
  const current = requestContext.getStore();
  if (!current) return;

  Object.assign(current, values);
}
