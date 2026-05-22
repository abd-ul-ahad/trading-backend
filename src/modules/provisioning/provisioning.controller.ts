import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateDemoAccountDto,
  CreateLiveAccountDto,
} from './dto';
import { MetaApiAccount } from '../../integrations/metaapi/interfaces';
@Controller('provisioning')
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Get('accounts')
  async listAccounts(): Promise<MetaApiAccount[]> {
    return this.provisioningService.listAccounts();
  }

  @Get('accounts/:accountId')
  async getAccount(
    @Param('accountId') accountId: string,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.getAccount(accountId);
  }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto): Promise<MetaApiAccount> {
    return this.provisioningService.createAccount(dto);
  }

  @Put('accounts/:accountId')
  async updateAccount(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.updateAccount(accountId, dto);
  }

  @Delete('accounts/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.deleteAccount(accountId);
  }

  @Post('accounts/:accountId/deploy')
  @HttpCode(HttpStatus.OK)
  async deployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.deployAccount(accountId);
  }

  @Post('accounts/:accountId/undeploy')
  @HttpCode(HttpStatus.OK)
  async undeployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.undeployAccount(accountId);
  }

  @Post('accounts/:accountId/redeploy')
  @HttpCode(HttpStatus.OK)
  async redeployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.redeployAccount(accountId);
  }

  @Post('profiles/:profileId/demo-accounts')
  @HttpCode(HttpStatus.CREATED)
  async createDemoAccount(
    @Param('profileId') profileId: string,
    @Body() dto: CreateDemoAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.createDemoAccount(profileId, dto);
  }

  @Post('live-accounts')
  @HttpCode(HttpStatus.CREATED)
  async createLiveAccount(
    @Body() dto: CreateLiveAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.createLiveAccount(dto);
  }
}
