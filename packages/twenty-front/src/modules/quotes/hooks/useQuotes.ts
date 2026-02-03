import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type TargetRecordIdentifier } from '@/ui/layout/contexts/TargetRecordIdentifier';
import { useMemo } from 'react';

import { type Quote } from '../types/quote.types';

export const useQuotes = (targetRecord: TargetRecordIdentifier) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'quote',
  });

  // Build filter based on target record type
  // Note: relation field names are 'company', 'contact', etc. - filter uses fieldNameId
  const filter = useMemo(() => {
    if (!targetRecord?.targetObjectNameSingular || !targetRecord?.id) {
      console.warn('Invalid target record:', targetRecord);
      return {};
    }

    switch (targetRecord.targetObjectNameSingular) {
      case 'company':
        return { companyId: { eq: targetRecord.id } };
      case 'person':
        // Person relation field is called 'contact' in quotes
        return { contactId: { eq: targetRecord.id } };
      case 'opportunity':
        return { opportunityId: { eq: targetRecord.id } };
      case 'project':
        return { projectId: { eq: targetRecord.id } };
      default:
        console.warn('Unknown target object type:', targetRecord.targetObjectNameSingular);
        return {};
    }
  }, [targetRecord]);

  const {
    records: quotes,
    loading,
    totalCount: totalCountQuotes,
    fetchMoreRecords: fetchMoreQuotes,
    queryIdentifier,
  } = useFindManyRecords<Quote>({
    objectNameSingular: 'quote',
    filter,
    orderBy: [{ quoteDate: 'DescNullsLast' }],
    limit: 20,
  });

  const hasNextPage = quotes.length < totalCountQuotes;

  return {
    quotes,
    loading,
    totalCountQuotes,
    fetchMoreQuotes,
    hasNextPage,
    queryIdentifier,
  };
};
