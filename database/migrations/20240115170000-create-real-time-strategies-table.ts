import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Create real_time_strategies table (atomic via transaction).
 *
 * Live strategy-monitoring table: single row per strategy (latest state).
 * Synchronization from `strategy_performance` is handled by a separate trigger.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.createTable(
      'real_time_strategies',
      {
        strategy_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          comment: 'Unique identifier for the strategy',
        },
        account_id: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: 'Reference to the trading account',
        },
        total_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          defaultValue: 0,
          comment: 'Total profit/loss for the strategy',
        },
        unrealized_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          defaultValue: 0,
          comment: 'Unrealized profit/loss from open positions',
        },
        current_drawdown: {
          type: DataTypes.DECIMAL(10, 4),
          allowNull: false,
          defaultValue: 0,
          comment: 'Current drawdown percentage for the strategy',
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

    await queryInterface.addIndex('real_time_strategies', {
      fields: ['account_id'],
      name: 'idx_rt_strategies_account',
      transaction: t,
    });
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('real_time_strategies', { transaction: t });
  });
}
