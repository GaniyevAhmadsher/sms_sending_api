import { Injectable } from '@nestjs/common';

type Labels = Record<string, string>;

class CounterMetric {
  private readonly counts = new Map<string, number>();

  constructor(private readonly name: string) {}

  labels(labels: Labels = {}) {
    const key = JSON.stringify(labels);
    return {
      inc: (value = 1) => {
        this.counts.set(key, (this.counts.get(key) ?? 0) + value);
      },
    };
  }

  serialize() {
    const lines = [`# TYPE ${this.name} counter`];
    for (const [key, value] of this.counts.entries()) {
      const labels = JSON.parse(key) as Labels;
      const suffix = Object.keys(labels).length
        ? `{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      lines.push(`${this.name}${suffix} ${value}`);
    }
    return lines;
  }
}

class HistogramMetric {
  private readonly observations = new Map<string, number[]>();

  constructor(private readonly name: string) {}

  labels(labels: Labels = {}) {
    const key = JSON.stringify(labels);
    return {
      observe: (value: number) => {
        const existing = this.observations.get(key) ?? [];
        existing.push(value);
        this.observations.set(key, existing);
      },
    };
  }

  serialize() {
    const lines = [`# TYPE ${this.name} summary`];
    for (const [key, values] of this.observations.entries()) {
      const labels = JSON.parse(key) as Labels;
      const suffix = Object.keys(labels).length
        ? `{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      const total = values.reduce((acc, value) => acc + value, 0);
      lines.push(`${this.name}_count${suffix} ${values.length}`);
      lines.push(`${this.name}_sum${suffix} ${total}`);
    }
    return lines;
  }
}

class GaugeMetric {
  private readonly values = new Map<string, number>();

  constructor(private readonly name: string) {}

  labels(labels: Labels = {}) {
    const key = JSON.stringify(labels);
    return {
      set: (value: number) => {
        this.values.set(key, value);
      },
    };
  }

  serialize() {
    const lines = [`# TYPE ${this.name} gauge`];
    for (const [key, value] of this.values.entries()) {
      const labels = JSON.parse(key) as Labels;
      const suffix = Object.keys(labels).length
        ? `{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      lines.push(`${this.name}${suffix} ${value}`);
    }
    return lines;
  }
}

@Injectable()
export class MetricsService {
  readonly smsSendTotal = new CounterMetric('sms_send_total');
  readonly smsSuccessTotal = new CounterMetric('sms_success_total');
  readonly smsFailedTotal = new CounterMetric('sms_failed_total');
  readonly paymentTopupTotal = new CounterMetric('payment_topup_total');
  readonly paymentFailedTotal = new CounterMetric('payment_failed_total');
  readonly queueRetryTotal = new CounterMetric('queue_retry_total');
  readonly rateLimitHits = new CounterMetric('rate_limit_hits');
  readonly apiRequestDuration = new HistogramMetric('api_request_duration');
  readonly providerLatency = new HistogramMetric('provider_latency');
  readonly webhookLatency = new HistogramMetric('webhook_latency');
  readonly providerFailureRate = new GaugeMetric('provider_failure_rate');
  readonly queueDepth = new GaugeMetric('queue_depth');
  readonly dlqSize = new GaugeMetric('dlq_size');

  async serialize(): Promise<string> {
    return [
      ...this.smsSendTotal.serialize(),
      ...this.smsSuccessTotal.serialize(),
      ...this.smsFailedTotal.serialize(),
      ...this.paymentTopupTotal.serialize(),
      ...this.paymentFailedTotal.serialize(),
      ...this.queueRetryTotal.serialize(),
      ...this.rateLimitHits.serialize(),
      ...this.apiRequestDuration.serialize(),
      ...this.providerLatency.serialize(),
      ...this.webhookLatency.serialize(),
      ...this.providerFailureRate.serialize(),
      ...this.queueDepth.serialize(),
      ...this.dlqSize.serialize(),
    ].join('\n');
  }
}
