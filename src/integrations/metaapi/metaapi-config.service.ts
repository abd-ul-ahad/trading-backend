import { Injectable } from '@nestjs/common';

/**
 * Configuration service for MetaApi integration.
 *
 * Reads all required MetaApi environment variables at construction time
 * and exposes them as typed readonly properties. Throws immediately on
 * any missing variable so the application fails fast at startup.
 */
@Injectable()
export class MetaApiConfigService {
  readonly provisioningToken: string;
  readonly accountToken: string;
  readonly accountId?: string; // Optional - can be fetched dynamically from API
  readonly region: string;
  readonly provisioningBaseUrl: string;
  readonly tradingBaseUrl: string;

  constructor() {
    this.provisioningToken = this.require('METAAPI_PROVISIONING_TOKEN');
    this.accountToken = this.require('METAAPI_ACCOUNT_TOKEN');
    this.accountId = process.env.METAAPI_ACCOUNT_ID; // Optional
    this.region = this.require('METAAPI_REGION');
    this.provisioningBaseUrl = this.require('METAAPI_PROVISIONING_BASE_URL');
    this.tradingBaseUrl = this.require('METAAPI_TRADING_BASE_URL');
  }

  private require(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} environment variable is required`);
    }
    return value;
  }
}
