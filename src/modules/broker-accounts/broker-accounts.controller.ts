import { Body, Controller, Get, Post, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrokerAccountsService } from './broker-accounts.service';
import { LinkBrokerAccountDto } from './dto';
import { BrokerAccount } from '../../database/models/broker-account.model';

@ApiTags('Broker Accounts')
@Controller('broker-accounts')
export class BrokerAccountsController {
  constructor(private readonly brokerAccountsService: BrokerAccountsService) {}

  @Post('link')
  @ApiOperation({ summary: 'Link a broker account' })
  @ApiResponse({
    status: 201,
    description: 'Broker account linked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or account already linked',
  })
  async linkBrokerAccount(
    @Body() linkDto: LinkBrokerAccountDto,
    @Query('userId') userId: string,
  ): Promise<BrokerAccount> {
    return this.brokerAccountsService.linkBrokerAccount(userId, linkDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all broker accounts for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Broker accounts retrieved successfully',
  })
  async getUserBrokerAccounts(@Param('userId') userId: string): Promise<BrokerAccount[]> {
    return this.brokerAccountsService.getUserBrokerAccounts(userId);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get broker account by ID' })
  @ApiParam({
    name: 'accountId',
    description: 'Broker Account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Broker account retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Broker account not found',
  })
  async getBrokerAccountById(@Param('accountId') accountId: string): Promise<BrokerAccount> {
    return this.brokerAccountsService.getBrokerAccountById(accountId);
  }

  @Delete(':accountId')
  @ApiOperation({ summary: 'Delete broker account' })
  @ApiParam({
    name: 'accountId',
    description: 'Broker Account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Broker account deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Broker account not found',
  })
  async deleteBrokerAccount(@Param('accountId') accountId: string): Promise<{ message: string }> {
    await this.brokerAccountsService.deleteBrokerAccount(accountId);
    return { message: 'Broker account deleted successfully' };
  }
}
