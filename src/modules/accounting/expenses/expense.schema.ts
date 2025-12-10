import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Date, required: true })
  operationDate: Date;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'relatedModel', required: false })
  relatedToId?: Types.ObjectId;

  @Prop({ type: String, enum: ['Vehicle', 'Employee', 'Other'], required: false })
  relatedModel?: 'Vehicle' | 'Employee' | 'Other';
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

// Compound indexes for better query performance
// En sık kullanılan query: companyId + operationDate (date range queries)
ExpenseSchema.index({ companyId: 1, operationDate: -1 });
// Category bazlı sorgular için
ExpenseSchema.index({ companyId: 1, categoryId: 1, operationDate: -1 });
// Related entity sorguları için
ExpenseSchema.index({ companyId: 1, relatedToId: 1, relatedModel: 1 });
// Created at index (pagination için)
ExpenseSchema.index({ createdAt: -1 });
