import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Create real_time_accounts table (atomic via transaction).
 *
 * Live account-monitoring table: single row per account (latest state).
 * Synchronization from `account_performance` is handled by a separate trigger.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.createTable(
      'real_time_accounts',
      {
        account_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          comment: 'Unique identifier for the account',
        },
        balance: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Current account balance',
        },
        equity: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Current account equity (balance + unrealized PnL)',
        },
        margin_used: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Amount of margin currently used',
        },
        margin_available: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Amount of margin available for new positions',
        },
        margin_level: {
          type: DataTypes.DECIMAL(10, 4),
          allowNull: false,
          comment: 'Margin level percentage (equity / margin_used * 100)',
        },
        unrealized_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Unrealized profit/loss from open positions',
        },
        total_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Total profit/loss (realized + unrealized)',
        },
        last_updated: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp of last update (managed by trigger)',
        },
      },
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE real_time_accounts
       ADD CONSTRAINT real_time_accounts_margin_level_check
       CHECK (margin_level >= 0 AND margin_level <= 1000)`,
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('real_time_accounts', { transaction: t });
  });
}
