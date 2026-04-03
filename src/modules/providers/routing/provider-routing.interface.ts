export interface ProviderRouteCandidate {
  provider: string;
  priority: number;
  cost: number;
}

export interface ProviderRoutingContext {
  countryCode: string;
  tenantId?: string;
}

export interface ProviderRoutingStrategy {
  pickPrimary(context: ProviderRoutingContext): ProviderRouteCandidate;
  pickFallback(context: ProviderRoutingContext, failedProvider: string): ProviderRouteCandidate | null;
}
