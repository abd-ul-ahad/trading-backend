import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProvisioningService } from './src/modules/provisioning/provisioning.service';
import { TradingService } from './src/modules/trading/trading.service';

async function testMetaApi() {
  console.log('🚀 Starting MetaApi Integration Test...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const provisioningService = app.get(ProvisioningService);
    const tradingService = app.get(TradingService);

    // Test 1: List all accounts
    console.log('📋 Test 1: Fetching all accounts from Provisioning API...');
    const accounts = await provisioningService.listAccounts();
    console.log(`✅ Found ${accounts.length} account(s)\n`);

    if (accounts.length === 0) {
      console.log('⚠️  No accounts found. Please create an account first.');
      return;
    }

    // Display account details
    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1}:`);
      console.log(`  ID: ${account._id}`);
      console.log(`  Name: ${account.name}`);
      console.log(`  Login: ${account.login}`);
      console.log(`  Server: ${account.server}`);
      console.log(`  Type: ${account.type}`);
      console.log(`  State: ${account.state}`);
      console.log(`  Connection Status: ${account.connectionStatus}`);
      console.log(`  Region: ${account.region}`);
      console.log(`  Base Currency: ${account.baseCurrency}`);
      console.log('');
    });

    // Test 2: Get a specific account
    const firstAccount = accounts[0];
    console.log(`📄 Test 2: Fetching specific account (${firstAccount._id})...`);
    const accountDetails = await provisioningService.getAccount(firstAccount._id);
    console.log(`✅ Account retrieved: ${accountDetails.name}`);
    console.log(`   Created at: ${accountDetails.createdAt}`);
    console.log(`   Application: ${accountDetails.application}\n`);

    // Test 3: Get account information from Trading API (only if account is DEPLOYED)
    const deployedAccount = accounts.find(acc => acc.state === 'DEPLOYED' && acc.connectionStatus === 'CONNECTED');
    
    if (deployedAccount) {
      console.log(`💹 Test 3: Fetching trading account information for ${deployedAccount.name}...`);
      try {
        const accountInfo = await tradingService.getAccountInformation(deployedAccount._id);
        console.log('✅ Trading account information retrieved:');
        console.log(`   Balance: ${accountInfo.balance} ${accountInfo.currency}`);
        console.log(`   Equity: ${accountInfo.equity} ${accountInfo.currency}`);
        console.log(`   Margin: ${accountInfo.margin} ${accountInfo.currency}`);
        console.log(`   Free Margin: ${accountInfo.freeMargin} ${accountInfo.currency}`);
        console.log(`   Margin Level: ${accountInfo.marginLevel}%`);
        console.log(`   Leverage: 1:${accountInfo.leverage}\n`);
      } catch (error) {
        console.log(`⚠️  Could not fetch trading info: ${error.message}\n`);
      }

      // Test 4: Get positions
      console.log(`📊 Test 4: Fetching open positions for ${deployedAccount.name}...`);
      try {
        const positions = await tradingService.getPositions(deployedAccount._id);
        console.log(`✅ Found ${positions.length} open position(s)`);
        
        if (positions.length > 0) {
          positions.forEach((pos, index) => {
            console.log(`\nPosition ${index + 1}:`);
            console.log(`  ID: ${pos.id}`);
            console.log(`  Symbol: ${pos.symbol}`);
            console.log(`  Type: ${pos.type}`);
            console.log(`  Volume: ${pos.volume}`);
            console.log(`  Open Price: ${pos.openPrice}`);
            console.log(`  Current Price: ${pos.currentPrice}`);
            console.log(`  Profit: ${pos.profit}`);
            console.log(`  Swap: ${pos.swap}`);
          });
        }
        console.log('');
      } catch (error) {
        console.log(`⚠️  Could not fetch positions: ${error.message}\n`);
      }

      // Test 5: Get available symbols
      console.log(`🔤 Test 5: Fetching available trading symbols...`);
      try {
        const symbols = await tradingService.getSymbols(deployedAccount._id);
        console.log(`✅ Found ${symbols.length} available symbol(s)`);
        console.log(`   First 10 symbols: ${symbols.slice(0, 10).join(', ')}\n`);
      } catch (error) {
        console.log(`⚠️  Could not fetch symbols: ${error.message}\n`);
      }

      // Test 6: Get server time
      console.log(`⏰ Test 6: Fetching server time...`);
      try {
        const serverTime = await tradingService.getServerTime(deployedAccount._id);
        console.log(`✅ Server time: ${serverTime.time}`);
        console.log(`   Broker time: ${serverTime.brokerTime}\n`);
      } catch (error) {
        console.log(`⚠️  Could not fetch server time: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  No DEPLOYED and CONNECTED accounts found. Skipping Trading API tests.');
      console.log('   Please deploy an account first to test Trading API endpoints.\n');
    }

    console.log('✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    console.error('   Stack:', error.stack);
  } finally {
    await app.close();
  }
}

// Run the test
testMetaApi().catch(console.error);
