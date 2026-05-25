import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Create account_performance table (atomic via transaction).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.createTable(
      'account_performance',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: 'Unique identifier for the performance snapshot',
        },
        account_id: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: 'Reference to the trading account',
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Timestamp of the performance snapshot',
        },
        balance: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Account balance',
        },
        equity: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Account equity (balance + unrealized PnL)',
        },
        margin_used: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Margin currently used by open positions',
        },
        margin_available: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Margin available for new positions',
        },
        margin_level: {
          type: DataTypes.DECIMAL(10, 4),
          allowNull: false,
          comment: 'Margin level percentage (equity / margin_used * 100)',
        },
        unrealized_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Unrealized profit and loss from open positions',
        },
        realized_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Realized profit and loss from closed positions',
        },
        total_pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Total profit and loss (realized + unrealized)',
        },
        drawdown: {
          type: DataTypes.DECIMAL(10, 4),
          allowNull: false,
          comment: 'Current drawdown percentage from peak equity',
        },
        last_updated: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp of last update (managed by trigger)',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp when the record was created',
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: 'Timestamp when the record was last updated',
        },
      },
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE account_performance
       ADD CONSTRAINT account_performance_margin_level_check
       CHECK (margin_level >= 0 AND margin_level <= 1000)`,
      { transaction: t },
    );

    await queryInterface.addIndex('account_performance', {
      fields: ['account_id', { name: 'last_updated', order: 'DESC' }],
      name: 'idx_account_perf_account_last_updated',
      transaction: t,
    });

    await queryInterface.addIndex('account_performance', {
      fields: ['account_id', { name: 'timestamp', order: 'DESC' }],
      name: 'idx_account_perf_account_timestamp',
      transaction: t,
    });

    await queryInterface.addIndex('account_performance', {
      fields: [{ name: 'timestamp', order: 'DESC' }],
      name: 'idx_account_perf_timestamp',
      transaction: t,
    });
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('account_performance', { transaction: t });
  });
}
