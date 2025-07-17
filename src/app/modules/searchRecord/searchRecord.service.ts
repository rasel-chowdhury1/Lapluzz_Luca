import SearchRecord from './searchRecord.model';
import { ISearchRecord } from './searchRecord.interface';
import QueryBuilder from '../../builder/QueryBuilder';

export const getAllSearchRecords = async (
  query: Record<string, unknown>
) => {
  const searchFields = ['keyword']; // you can also add 'userId' if needed

  const queryBuilder = new QueryBuilder<ISearchRecord>(
    SearchRecord.find().populate('userId', 'sureName name'),
    query
  )
    .search(searchFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const records = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return {
    meta,
    data: records,
  };
};
