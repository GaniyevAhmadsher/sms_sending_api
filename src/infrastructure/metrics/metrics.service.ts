import { Injectable } from '@nestjs/common';

type Labels = Record<string, string>;

class CounterMetric {
  private readonly values = new Map<string, number>();
  constructor(private readonly name: string, private readonly help: string) {}
  inc(labels: Labels = {}, value = 1) {
    const key = JSON.stringify(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }
  lines() {
    const rows = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [key, value] of this.values.entries()) {
      const labels = JSON.parse(key) as Labels;
      const labelText = Object.keys(labels).length
        ? `{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      rows.push(`${this.name}${labelText} ${value}`);
    }
    if (this.values.size === 0) rows.push(`${this.name} 0`);
    return rows;
  }
}

class GaugeMetric extends CounterMetric {
  set(labels: Labels = {}, value: number) {
    const key = JSON.stringify(labels);
    (this as any).values.set(key, value);
  }
  dec(labels: Labels = {}, value = 1) {
    this.inc(labels, -value);
  }
}

class HistogramMetric {
  private readonly values = new Map<string, number[]>();
  constructor(private readonly name: string, private readonly help: string) {}
  observe(labels: Labels = {}, value: number) {
    const key = JSON.stringify(labels);
    const list = this.values.get(key) ?? [];
    list.push(value);
    this.values.set(key, list);
  }
  lines() {
    const rows = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} summary`];
    for (const [key, values] of this.values.entries()) {
      const labels = JSON.parse(key) as Labels;
      const base = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      rows.push(`${this.name}_sum{${base}} ${sum}`);
      rows.push(`${this.name}_count{${base}} ${count}`);
    }
    if (this.values.size === 0) {
      rows.push(`${this.name}_sum{} 0`);
      rows.push(`${this.name}_count{} 0`);
    }
    return rows;
  }
}

@Injectable()
export class MetricsService {
  readonly smsSendTotal = new CounterMetric('sms_send_total', 'Total SMS send requests');
  readonly smsSuccessTotal = new CounterMetric('sms_success_total', 'Total SMS successful sends');
  readonly smsFailedTotal = new CounterMetric('sms_failed_total', 'Total SMS failed sends');
  readonly paymentTopupTotal = new CounterMetric('payment_topup_total', 'Successful topups');
  readonly paymentFailedTotal = new CounterMetric('payment_failed_total', 'Failed payment events');
  readonly queueDepth = new GaugeMetric('queue_depth', 'Current queue depth');
  readonly queueRetryTotal = new CounterMetric('queue_retry_total', 'Queue retries');
  readonly dlqSize = new GaugeMetric('dlq_size', 'Dead letter queue size');
  readonly webhookLatency = new HistogramMetric('webhook_latency', 'Webhook processing latency ms');
  readonly providerLatency = new HistogramMetric('provider_latency', 'Provider latency ms');
  readonly providerFailureRate = new CounterMetric('provider_failure_rate', 'Provider failures');
  readonly apiRequestDuration = new HistogramMetric('api_request_duration', 'API request duration ms');
  readonly rateLimitHits = new CounterMetric('rate_limit_hits', 'Rate limit rejections');

  async metrics() {
    return [
      ...this.smsSendTotal.lines(),
      ...this.smsSuccessTotal.lines(),
      ...this.smsFailedTotal.lines(),
      ...this.paymentTopupTotal.lines(),
      ...this.paymentFailedTotal.lines(),
      ...this.queueDepth.lines(),
      ...this.queueRetryTotal.lines(),
      ...this.dlqSize.lines(),
      ...this.webhookLatency.lines(),
      ...this.providerLatency.lines(),
      ...this.providerFailureRate.lines(),
      ...this.apiRequestDuration.lines(),
      ...this.rateLimitHits.lines(),
    ].join('\n');
  }
}
