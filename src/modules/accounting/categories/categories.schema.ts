import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;
@Schema({
  timestamps: true,
})
export class Category {
  @Prop({ required: true, trim: true, lowercase: true, index: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true, enum: ['income', 'expense'] })
  type: 'income' | 'expense';

  @Prop({ required: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
// Unique constraint: Category name must be unique per company and type
CategorySchema.index({ name: 1, companyId: 1, type: 1 }, { unique: true });
// Company ve type bazlı sorgular için
CategorySchema.index({ companyId: 1, type: 1, isActive: 1 });
// Active categories için hızlı sorgu
CategorySchema.index({ companyId: 1, isActive: 1 });
// Created at index (pagination için)
CategorySchema.index({ createdAt: -1 });
