import { Injectable } from '@nestjs/common';

type Labels = Record<string, string | number | boolean>;

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly histograms = new Map<string, number[]>();

  increment(name: string, value = 1, labels?: Labels) {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  setGauge(name: string, value: number, labels?: Labels) {
    this.gauges.set(this.buildKey(name, labels), value);
  }

  observe(name: string, value: number, labels?: Labels) {
    const key = this.buildKey(name, labels);
    const current = this.histograms.get(key) ?? [];
    current.push(value);
    this.histograms.set(key, current.slice(-5000));
  }

  renderPrometheus(): string {
    const lines: string[] = [];

    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    for (const [key, values] of this.histograms.entries()) {
      if (values.length === 0) continue;
      const count = values.length;
      const sum = values.reduce((acc, item) => acc + item, 0);
      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_sum ${sum}`);
    }

    return lines.join('\n');
  }

  private buildKey(name: string, labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const pairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${String(value)}"`)
      .join(',');

    return `${name}{${pairs}}`;
  }
}
