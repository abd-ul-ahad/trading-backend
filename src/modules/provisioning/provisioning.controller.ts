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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProvisioningService } from './provisioning.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateDemoAccountDto,
  CreateLiveAccountDto,
} from './dto';
import { MetaApiAccount } from '../../integrations/metaapi/interfaces';

@ApiTags('Provisioning')
@Controller('provisioning')
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List all MetaAPI accounts' })
  @ApiResponse({
    status: 200,
    description: 'List of accounts retrieved successfully',
    type: [Object],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async listAccounts(): Promise<MetaApiAccount[]> {
    return this.provisioningService.listAccounts();
  }

  @Get('accounts/:accountId')
  @ApiOperation({ summary: 'Get a single MetaAPI account by ID' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Account retrieved successfully',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAccount(
    @Param('accountId') accountId: string,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.getAccount(accountId);
  }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new MetaAPI account' })
  @ApiBody({
    type: CreateAccountDto,
    description: 'Account creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createAccount(@Body() dto: CreateAccountDto): Promise<MetaApiAccount> {
    return this.provisioningService.createAccount(dto);
  }

  @Put('accounts/:accountId')
  @ApiOperation({ summary: 'Update an existing MetaAPI account' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiBody({
    type: UpdateAccountDto,
    description: 'Account update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateAccount(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.updateAccount(accountId, dto);
  }

  @Delete('accounts/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a MetaAPI account' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.deleteAccount(accountId);
  }

  @Post('accounts/:accountId/deploy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deploy a MetaAPI account' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deployed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.deployAccount(accountId);
  }

  @Post('accounts/:accountId/undeploy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Undeploy a MetaAPI account' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Account undeployed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async undeployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.undeployAccount(accountId);
  }

  @Post('accounts/:accountId/redeploy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeploy a MetaAPI account' })
  @ApiParam({
    name: 'accountId',
    description: 'The unique identifier of the account',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Account redeployed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async redeployAccount(@Param('accountId') accountId: string): Promise<void> {
    return this.provisioningService.redeployAccount(accountId);
  }

  @Post('profiles/:profileId/demo-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a demo account for a provisioning profile' })
  @ApiParam({
    name: 'profileId',
    description: 'The unique identifier of the provisioning profile',
    example: 'abc123def456',
  })
  @ApiBody({
    type: CreateDemoAccountDto,
    description: 'Demo account creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Demo account created successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createDemoAccount(
    @Param('profileId') profileId: string,
    @Body() dto: CreateDemoAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.createDemoAccount(profileId, dto);
  }

  @Post('live-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a live trading account' })
  @ApiBody({
    type: CreateLiveAccountDto,
    description: 'Live account creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Live account created successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createLiveAccount(
    @Body() dto: CreateLiveAccountDto,
  ): Promise<MetaApiAccount> {
    return this.provisioningService.createLiveAccount(dto);
  }
}
