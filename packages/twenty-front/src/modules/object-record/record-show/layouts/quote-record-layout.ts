import { type RecordLayout } from '@/object-record/record-show/types/RecordLayout';

export const QUOTE_RECORD_LAYOUT: RecordLayout = {
  tabs: {
    // No additional tabs needed - the standard fields/timeline/tasks/notes will show
    // Line items will be shown via the lineItems relation field in the fields card
  },
};
