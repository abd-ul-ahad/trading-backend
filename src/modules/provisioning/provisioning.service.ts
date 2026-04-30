import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { MetaApiConfigService } from '../../integrations/metaapi/metaapi-config.service';
import { handleHttpError } from '../../integrations/metaapi/metaapi-error.handler';
import {
  CreateAccountDto,
  CreateDemoAccountDto,
  CreateLiveAccountDto,
  MetaApiAccount,
  UpdateAccountDto,
} from '../../integrations/metaapi/interfaces';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: MetaApiConfigService,
  ) {}

  async listAccounts(): Promise<MetaApiAccount[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<MetaApiAccount[]>(
          `${this.config.provisioningBaseUrl}/users/current/accounts`,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getAccount(accountId: string): Promise<MetaApiAccount> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<MetaApiAccount>(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}`,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async createAccount(dto: CreateAccountDto): Promise<MetaApiAccount> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<MetaApiAccount>(
          `${this.config.provisioningBaseUrl}/users/current/accounts`,
          dto,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async updateAccount(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<MetaApiAccount> {
    try {
      const response = await firstValueFrom(
        this.httpService.put<MetaApiAccount>(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}`,
          dto,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}`,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async deployAccount(accountId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}/deploy`,
          {},
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async undeployAccount(accountId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}/undeploy`,
          {},
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async redeployAccount(accountId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.config.provisioningBaseUrl}/users/current/accounts/${accountId}/redeploy`,
          {},
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async createDemoAccount(
    profileId: string,
    dto: CreateDemoAccountDto,
  ): Promise<MetaApiAccount> {
    if (!profileId) {
      throw new BadRequestException('profileId is required');
    }
    if (
      !dto.name ||
      dto.balance == null ||
      dto.leverage == null ||
      !dto.serverName
    ) {
      throw new BadRequestException(
        'dto.name, dto.balance, dto.leverage, and dto.serverName are required',
      );
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post<MetaApiAccount>(
          `${this.config.provisioningBaseUrl}/users/current/provisioning-profiles/${profileId}/accounts/create-demo`,
          dto,
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async createLiveAccount(dto: CreateLiveAccountDto): Promise<MetaApiAccount> {
    if (
      !dto.name ||
      !dto.login ||
      !dto.password ||
      !dto.server ||
      !dto.provisioningProfileId
    ) {
      throw new BadRequestException(
        'dto.name, dto.login, dto.password, dto.server, and dto.provisioningProfileId are required',
      );
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post<MetaApiAccount>(
          `${this.config.provisioningBaseUrl}/users/current/accounts`,
          { ...dto, type: 'cloud' },
          { headers: { 'auth-token': this.config.provisioningToken } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }
}
