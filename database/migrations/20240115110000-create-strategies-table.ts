import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Create strategies table.
 *
 * Atomic: entire up() and down() run in a single transaction so partial
 * failures roll back fully (PostgreSQL supports transactional DDL).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.createTable(
      'strategies',
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        account_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active',
        },
        initial_capital: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
          defaultValue: 0,
        },
      },
      { transaction: t },
    );

    await queryInterface.addIndex('strategies', {
      fields: ['account_id'],
      name: 'strategies_account_id',
      transaction: t,
    });

    await queryInterface.addIndex('strategies', {
      fields: ['status'],
      name: 'strategies_status',
      transaction: t,
    });
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('strategies', { transaction: t });
    // Drop the ENUM type that Postgres leaves behind after dropTable.
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_strategies_status"',
      { transaction: t },
    );
  });
}
