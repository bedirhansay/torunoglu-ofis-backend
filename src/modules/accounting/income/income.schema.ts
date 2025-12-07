import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IncomeDocument = Income & Document;

@Schema({ timestamps: true })
export class Income {
  @Prop({ type: Number, required: true, min: 0 })
  unitCount: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: Boolean, required: true, default: undefined })
  isPaid: boolean;

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({ type: Date, required: true, index: true })
  operationDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true }) customerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true }) categoryId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true }) companyId: Types.ObjectId;
}

export const IncomeSchema = SchemaFactory.createForClass(Income);

// Compound indexes for better query performance
// En sık kullanılan query: companyId + operationDate (date range queries)
IncomeSchema.index({ companyId: 1, operationDate: -1 });
// Customer bazlı sorgular için
IncomeSchema.index({ companyId: 1, customerId: 1, operationDate: -1 });
// Category bazlı sorgular için
IncomeSchema.index({ companyId: 1, categoryId: 1, operationDate: -1 });
// Payment status bazlı sorgular için
IncomeSchema.index({ companyId: 1, isPaid: 1, operationDate: -1 });
// Created at index (pagination için)
IncomeSchema.index({ createdAt: -1 });
