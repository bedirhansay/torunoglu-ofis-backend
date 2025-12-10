import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Date, required: true })
  operationDate: Date;

  @Prop({ type: String, required: false })
  description?: string;
}
export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Compound indexes for better query performance
// En sık kullanılan query: companyId + customerId + operationDate
PaymentSchema.index({ companyId: 1, customerId: 1, operationDate: -1 });
// Date range queries için
PaymentSchema.index({ companyId: 1, operationDate: -1 });
// Customer bazlı tüm ödemeler için
PaymentSchema.index({ customerId: 1, operationDate: -1 });
// Created at index (pagination için)
PaymentSchema.index({ createdAt: -1 });
