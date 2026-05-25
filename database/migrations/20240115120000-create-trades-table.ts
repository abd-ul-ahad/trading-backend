import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Create trades table (atomic via transaction).
 *
 * Historical trades table with all columns, indexes, and constraints
 * for the real-time-trading-performance-db design.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.createTable(
      'trades',
      {
        trade_id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: 'Unique identifier for the trade',
        },
        strategy_id: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: 'Reference to the trading strategy',
        },
        account_id: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: 'Reference to the trading account',
        },
        symbol: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'Trading symbol (e.g., AAPL, EURUSD)',
        },
        direction: {
          type: DataTypes.STRING(10),
          allowNull: false,
          comment: 'Trade direction: long or short',
        },
        entry_time: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Timestamp when the trade was entered',
        },
        entry_price: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Price at which the trade was entered',
        },
        exit_time: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Timestamp when the trade was exited (null for open trades)',
        },
        exit_price: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: true,
          comment: 'Price at which the trade was exited (null for open trades)',
        },
        quantity: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          comment: 'Quantity of the asset traded',
        },
        pnl: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: true,
          comment: 'Profit and loss for the trade (null for open trades)',
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'Trade status: open, closed, or cancelled',
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
      `ALTER TABLE trades
       ADD CONSTRAINT trades_direction_check
       CHECK (direction IN ('long', 'short'))`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE trades
       ADD CONSTRAINT trades_status_check
       CHECK (status IN ('open', 'closed', 'cancelled'))`,
      { transaction: t },
    );

    await queryInterface.addIndex('trades', {
      fields: ['account_id', 'status'],
      name: 'idx_trades_account_status',
      transaction: t,
    });

    await queryInterface.addIndex('trades', {
      fields: ['strategy_id', 'status'],
      name: 'idx_trades_strategy_status',
      transaction: t,
    });

    await queryInterface.addIndex('trades', {
      fields: [{ name: 'last_updated', order: 'DESC' }],
      name: 'idx_trades_last_updated',
      transaction: t,
    });

    await queryInterface.addIndex('trades', {
      fields: [{ name: 'entry_time', order: 'DESC' }],
      name: 'idx_trades_entry_time',
      transaction: t,
    });

    await queryInterface.addIndex('trades', {
      fields: ['symbol'],
      name: 'idx_trades_symbol',
      transaction: t,
    });
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('trades', { transaction: t });
  });
}
