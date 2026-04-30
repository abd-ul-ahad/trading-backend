import {
  Model,
  Column,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  DataType,
} from 'sequelize-typescript';

/**
 * Abstract base model providing common fields for all database models
 *
 * Features:
 * - UUID primary key with automatic UUIDV4 generation
 * - Automatic timestamp management (createdAt, updatedAt)
 *
 * All models should extend this class to inherit these common fields
 *
 * Requirements: 3.1, 3.2, 4.1
 */
export abstract class BaseModel extends Model {
  /**
   * Primary key using UUID v4
   * Automatically generated on creation
   */
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  /**
   * Timestamp of record creation
   * Automatically set by Sequelize
   */
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  /**
   * Timestamp of last record update
   * Automatically updated by Sequelize
   */
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
