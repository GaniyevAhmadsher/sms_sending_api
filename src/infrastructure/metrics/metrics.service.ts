import { Injectable } from '@nestjs/common';

type Labels = Record<string, string>;

class CounterLike {
  private values = new Map<string, number>();
  constructor(private readonly name: string) {}
  inc(labels: Labels = {}, amount = 1) {
    const key = JSON.stringify(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + amount);
  }
  render() {
    if (this.values.size === 0) return `${this.name} 0`;
    return Array.from(this.values.entries()).map(([key, value]) => {
      const labels = JSON.parse(key) as Labels;
      const serialized = Object.keys(labels).length
        ? `{${Object.entries(labels).map(([k,v]) => `${k}="${v}"`).join(',')}}`
        : '';
      return `${this.name}${serialized} ${value}`;
    }).join('\n');
  }
  labels(labels: string) { return { inc: (amount = 1) => this.inc({ queue: labels }, amount), set: () => undefined }; }
}

class GaugeLike extends CounterLike {
  private gvalues = new Map<string, number>();
  set(labels: Labels = {}, value = 0) { this.gvalues.set(JSON.stringify(labels), value); }
  override render() {
    if (this.gvalues.size === 0) return '';
    return Array.from(this.gvalues.entries()).map(([key, value]) => {
      const labels = JSON.parse(key) as Labels;
      const serialized = Object.keys(labels).length
        ? `{${Object.entries(labels).map(([k,v]) => `${k}="${v}"`).join(',')}}`
        : '';
      return `${(this as any).name}${serialized} ${value}`;
    }).join('\n');
  }
  labels(label: string) { return { set: (value: number) => this.set({ queue: label }, value) }; }
}

class HistogramLike {
  private count = new CounterLike('tmp_count');
  constructor(private readonly name: string) {}
  observe(_labels: Labels, value: number) { this.count.inc({}, value); }
  startTimer(labels: Labels) {
    const start = Date.now();
    return () => this.observe(labels, (Date.now() - start) / 1000);
  }
  labels(method: string, route: string, status: string) {
    return { observe: (value: number) => this.observe({ method, route, status }, value) };
  }
  render() { return `${this.name}_sum ${this.count.render().split(' ').pop() ?? 0}`; }
}

@Injectable()
export class MetricsService {
  readonly smsSendTotal = new CounterLike('sms_send_total');
  readonly smsSuccessTotal = new CounterLike('sms_success_total');
  readonly smsFailedTotal = new CounterLike('sms_failed_total');
  readonly paymentTopupTotal = new CounterLike('payment_topup_total');
  readonly paymentFailedTotal = new CounterLike('payment_failed_total');
  readonly queueRetryTotal = new CounterLike('queue_retry_total');
  readonly rateLimitHits = new CounterLike('rate_limit_hits');
  readonly webhookLatency = new HistogramLike('webhook_latency');
  readonly providerLatency = new HistogramLike('provider_latency');
  readonly providerFailureRate = new CounterLike('provider_failure_rate');
  readonly apiRequestDuration = new HistogramLike('api_request_duration');
  readonly queueDepth = new GaugeLike('queue_depth');
  readonly dlqSize = new GaugeLike('dlq_size');

  async getMetrics() {
    return [
      this.smsSendTotal.render(),
      this.smsSuccessTotal.render(),
      this.smsFailedTotal.render(),
      this.paymentTopupTotal.render(),
      this.paymentFailedTotal.render(),
      this.queueRetryTotal.render(),
      this.rateLimitHits.render(),
      this.providerFailureRate.render(),
      this.queueDepth.render(),
      this.dlqSize.render(),
      this.apiRequestDuration.render(),
      this.webhookLatency.render(),
      this.providerLatency.render(),
    ].filter(Boolean).join('\n');
  }
}
