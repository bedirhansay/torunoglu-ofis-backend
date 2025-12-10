import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;
@Schema({
  timestamps: true,
})
export class Customer {
  @Prop({ required: true, trim: true, lowercase: true, index: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
// Unique constraint: Customer name must be unique per company
CustomerSchema.index({ name: 1, companyId: 1 }, { unique: true });
// Company bazlı sorgular için
CustomerSchema.index({ companyId: 1 });
// Name search için (case-insensitive search için)
CustomerSchema.index({ companyId: 1, name: 1 });
// Created at index (pagination için)
CustomerSchema.index({ createdAt: -1 });
