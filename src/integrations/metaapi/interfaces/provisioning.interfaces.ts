export interface MetaApiAccount {
  _id: string; // MetaApi uses _id in responses
  name: string;
  login: string;
  server: string;
  type: string;
  state: string;
  magic: number;
  connectionStatus: string;
  region: string;
  baseCurrency: string;
  userId: string;
  application: string;
  createdAt: string;
  // Optional fields from API response
  provisioningProfileId?: string;
  platform?: string;
  accessToken?: string;
  symbol?: string;
  reliability?: string;
  tags?: string[];
  resourceSlots?: number;
  copyFactoryResourceSlots?: number;
  version?: number;
  hash?: number;
  copyFactoryRoles?: string[];
  metastatsApiEnabled?: boolean;
  riskManagementApiEnabled?: boolean;
  accountReplicas?: any[];
  primaryReplica?: boolean;
  connections?: Array<{
    application: string;
    region: string;
    zone: string;
  }>;
  quoteStreamingIntervalInSeconds?: number;
  [key: string]: unknown; // Allow additional fields
}

export interface CreateAccountDto {
  name: string;
  type: string;
  login: string;
  password: string;
  server: string;
  provisioningProfileId: string;
  magic?: number;
  platform?: string;
}

export interface UpdateAccountDto {
  name?: string;
  password?: string;
  server?: string;
  magic?: number;
}

export interface CreateDemoAccountDto {
  name: string;
  balance: number;
  leverage: number;
  serverName: string;
}

export interface CreateLiveAccountDto {
  name: string;
  login: string;
  password: string;
  server: string;
  provisioningProfileId: string;
  platform?: string;
}
