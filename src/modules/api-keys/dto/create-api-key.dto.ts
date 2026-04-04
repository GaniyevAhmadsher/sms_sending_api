export class CreateApiKeyDto {
  label?: string;
  scopes?: string[];
  expiresInDays?: number;
}
