import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as crypto from 'crypto';
import { BrokerAccount } from '../../database/models/broker-account.model';
import { LinkBrokerAccountDto } from './dto';

@Injectable()
export class BrokerAccountsService {
  private readonly logger = new Logger(BrokerAccountsService.name);
  private readonly encryptionKey = (process.env.ENCRYPTION_KEY || 'default-key-change-in-production').padEnd(32, '0').slice(0, 32);
  private readonly encryptionIv = (process.env.ENCRYPTION_IV || 'default-iv-change').padEnd(16, '0').slice(0, 16);

  constructor(
    @InjectModel(BrokerAccount)
    private readonly brokerAccountModel: typeof BrokerAccount,
  ) {}

  async linkBrokerAccount(userId: string, linkDto: LinkBrokerAccountDto): Promise<BrokerAccount> {
    // Check if account already linked
    const existingAccount = await this.brokerAccountModel.findOne({
      where: {
        userId,
        brokerName: linkDto.brokerName,
        accountNumber: linkDto.accountNumber,
      },
    });

    if (existingAccount) {
      throw new BadRequestException('Broker account already linked');
    }

    // Encrypt credentials
    const encryptedCredentials = this.encryptCredentials({
      login: linkDto.readOnlyLogin,
      password: linkDto.readOnlyPassword,
      server: linkDto.serverName,
    });

    // Create broker account
    const brokerAccount = await this.brokerAccountModel.create({
      userId,
      brokerName: linkDto.brokerName,
      accountNumber: linkDto.accountNumber,
      serverName: linkDto.serverName,
      encryptedCredentials,
      accountType: linkDto.accountType,
      status: 'pending',
    });

    this.logger.log(`Broker account linked: ${brokerAccount.id} for user ${userId}`);

    return brokerAccount;
  }

  async getBrokerAccountById(accountId: string): Promise<BrokerAccount> {
    const account = await this.brokerAccountModel.findByPk(accountId);

    if (!account) {
      throw new BadRequestException('Broker account not found');
    }

    return account;
  }

  async getUserBrokerAccounts(userId: string): Promise<BrokerAccount[]> {
    return this.brokerAccountModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async updateAccountStatus(
    accountId: string,
    status: 'linked' | 'pending' | 'inactive' | 'error',
    errorMessage?: string,
  ): Promise<BrokerAccount> {
    const account = await this.getBrokerAccountById(accountId);

    await account.update({
      status,
      errorMessage: errorMessage || null,
      lastSyncAt: new Date(),
    });

    this.logger.log(`Broker account status updated: ${accountId} -> ${status}`);

    return account;
  }

  async updateAccountBalance(accountId: string, balance: number, equity: number): Promise<BrokerAccount> {
    const account = await this.getBrokerAccountById(accountId);

    await account.update({
      balance,
      equity,
      lastSyncAt: new Date(),
    });

    return account;
  }

  async getDecryptedCredentials(accountId: string): Promise<{ login: string; password: string; server: string }> {
    const account = await this.getBrokerAccountById(accountId);

    return this.decryptCredentials(account.encryptedCredentials);
  }

  private encryptCredentials(credentials: { login: string; password: string; server: string }): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), Buffer.from(this.encryptionIv));
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptCredentials(encrypted: string): { login: string; password: string; server: string } {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), Buffer.from(this.encryptionIv));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async deleteBrokerAccount(accountId: string): Promise<void> {
    const account = await this.getBrokerAccountById(accountId);

    await account.destroy();

    this.logger.log(`Broker account deleted: ${accountId}`);
  }
}
