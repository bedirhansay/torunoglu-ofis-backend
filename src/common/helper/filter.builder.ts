import dayjs from 'dayjs';
import { Types } from 'mongoose';

export interface BaseFilterParams {
  companyId: string;
  search?: string;
  beginDate?: string;
  endDate?: string;
}

export interface IncomeFilterParams extends BaseFilterParams {
  isPaid?: boolean;
  customerId?: string;
}

export class FilterBuilder {
  static readonly DEFAULT_PAGE_SIZE = 10;
  static readonly MAX_PAGE_SIZE = 100;

  static buildBaseFilter(params: BaseFilterParams): Record<string, any> {
    const filter: Record<string, any> = {
      companyId: new Types.ObjectId(params.companyId),
    };

    return filter;
  }

  static validatePageNumber(pageNumber?: number): number {
    return Math.max(1, Math.floor(pageNumber ?? 1));
  }

  static validatePageSize(pageSize?: number): number {
    return Math.min(this.MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize ?? this.DEFAULT_PAGE_SIZE)));
  }

  static addDateRangeFilter(
    filter: Record<string, any>,
    beginDate?: string | Date,
    endDate?: string | Date,
    dateField: string = 'operationDate'
  ): void {
    console.log('---addDateRangeFilter---beginDate, endDate', beginDate, endDate);
    if (!beginDate && !endDate) return;

    filter[dateField] = {};
    if (beginDate) {
      filter[dateField].$gte = dayjs(beginDate).startOf('day').toDate();
    }
    if (endDate) {
      filter[dateField].$lte = dayjs(endDate).endOf('day').toDate();
    }
  }

  static buildIncomeFilter(params: IncomeFilterParams): Record<string, any> {
    const filter = this.buildBaseFilter(params);

    // Add date range filter using centralized method
    FilterBuilder.addDateRangeFilter(filter, params.beginDate, params.endDate);

    if (params.customerId) {
      filter.customerId = new Types.ObjectId(params.customerId);
    }

    if (params.isPaid !== undefined) {
      filter.isPaid = params.isPaid;
    }

    return filter;
  }

  static addSearchFilter(filter: Record<string, any>, search: string, searchFields: string[] = ['description']): void {
    if (!search) return;

    const searchConditions = searchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  static addCustomerSearchFilter(filter: Record<string, any>, search: string, customerIds: Types.ObjectId[]): void {
    if (!search) return;

    filter.$or = [{ description: { $regex: search, $options: 'i' } }, { customerId: { $in: customerIds } }];
  }
}
