import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const DEFAULT_API_PARAMS = {
  pageNumber: 1,
  pageSize: 10,
  beginDate: dayjs.utc().startOf('month').toISOString(),
  endDate: dayjs.utc().endOf('month').toISOString(),
};
