import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration to create strategies table
 * 
 * Creates the primary strategies table with:
 * - UUID primary key
 * - Strategy metadata (name, description)
 * - Account reference
 * - Status tracking
 * - Initial capital for return calculations
 * - Timestamps for audit tracking
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('strategies', {
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
  });

  // Create index on account_id for faster queries
  await queryInterface.addIndex('strategies', ['account_id']);
  
  // Create index on status for filtering
  await queryInterface.addIndex('strategies', ['status']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('strategies');
}
