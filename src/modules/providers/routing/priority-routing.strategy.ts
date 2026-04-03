import { Injectable } from '@nestjs/common';
import { ProviderRouteCandidate, ProviderRoutingContext, ProviderRoutingStrategy } from './provider-routing.interface';

@Injectable()
export class PriorityRoutingStrategy implements ProviderRoutingStrategy {
  private readonly matrix: Record<string, ProviderRouteCandidate[]> = {
    default: [
      { provider: 'mock-primary', priority: 1, cost: 1 },
      { provider: 'mock-secondary', priority: 2, cost: 1.1 },
    ],
  };

  pickPrimary(context: ProviderRoutingContext): ProviderRouteCandidate {
    return this.routes(context)[0];
  }

  pickFallback(context: ProviderRoutingContext, failedProvider: string): ProviderRouteCandidate | null {
    return this.routes(context).find((item) => item.provider !== failedProvider) ?? null;
  }

  private routes(context: ProviderRoutingContext): ProviderRouteCandidate[] {
    return this.matrix[context.countryCode] ?? this.matrix.default;
  }
}
