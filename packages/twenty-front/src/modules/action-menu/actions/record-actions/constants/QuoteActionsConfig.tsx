import { MultipleRecordsActionKeys } from '@/action-menu/actions/record-actions/multiple-records/types/MultipleRecordsActionKeys';
import { NoSelectionRecordActionKeys } from '@/action-menu/actions/record-actions/no-selection/types/NoSelectionRecordActionsKeys';
import { ConvertQuoteToInvoiceAction } from '@/action-menu/actions/record-actions/single-record/quote-actions/components/ConvertQuoteToInvoiceAction';
import { DownloadQuotePdfAction } from '@/action-menu/actions/record-actions/single-record/quote-actions/components/DownloadQuotePdfAction';
import { SendQuoteEmailAction } from '@/action-menu/actions/record-actions/single-record/quote-actions/components/SendQuoteEmailAction';
import { QuoteSingleRecordActionKeys } from '@/action-menu/actions/record-actions/single-record/quote-actions/types/QuoteSingleRecordActionKeys';
import { SingleRecordActionKeys } from '@/action-menu/actions/record-actions/single-record/types/SingleRecordActionsKey';
import { inheritActionsFromDefaultConfig } from '@/action-menu/actions/record-actions/utils/inheritActionsFromDefaultConfig';
import { ActionScope } from '@/action-menu/actions/types/ActionScope';
import { ActionType } from '@/action-menu/actions/types/ActionType';
import { ActionViewType } from '@/action-menu/actions/types/ActionViewType';
import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconDownload, IconFileCheck, IconMail } from 'twenty-ui/display';

export const QUOTE_ACTIONS_CONFIG = inheritActionsFromDefaultConfig({
  config: {
    [QuoteSingleRecordActionKeys.DOWNLOAD_QUOTE_PDF]: {
      key: QuoteSingleRecordActionKeys.DOWNLOAD_QUOTE_PDF,
      label: msg`Download PDF`,
      shortLabel: msg`PDF`,
      isPinned: true,
      position: 3,
      Icon: IconDownload,
      type: ActionType.Standard,
      scope: ActionScope.RecordSelection,
      shouldBeRegistered: ({ selectedRecord }) =>
        isDefined(selectedRecord) && !isDefined(selectedRecord?.deletedAt),
      availableOn: [ActionViewType.SHOW_PAGE],
      component: <DownloadQuotePdfAction />,
    },
    [QuoteSingleRecordActionKeys.SEND_QUOTE_EMAIL]: {
      key: QuoteSingleRecordActionKeys.SEND_QUOTE_EMAIL,
      label: msg`Send via Email`,
      shortLabel: msg`Email`,
      isPinned: true,
      position: 4,
      Icon: IconMail,
      type: ActionType.Standard,
      scope: ActionScope.RecordSelection,
      shouldBeRegistered: ({ selectedRecord }) =>
        isDefined(selectedRecord) && !isDefined(selectedRecord?.deletedAt),
      availableOn: [ActionViewType.SHOW_PAGE],
      component: <SendQuoteEmailAction />,
    },
    [QuoteSingleRecordActionKeys.CONVERT_TO_INVOICE]: {
      key: QuoteSingleRecordActionKeys.CONVERT_TO_INVOICE,
      label: msg`Convert to Invoice`,
      shortLabel: msg`Convert`,
      isPinned: false,
      position: 5,
      Icon: IconFileCheck,
      type: ActionType.Standard,
      scope: ActionScope.RecordSelection,
      shouldBeRegistered: ({ selectedRecord }) =>
        isDefined(selectedRecord) &&
        !isDefined(selectedRecord?.deletedAt) &&
        (selectedRecord.status === 'ACCEPTED' ||
          selectedRecord.status === 'SENT'),
      availableOn: [ActionViewType.SHOW_PAGE],
      component: <ConvertQuoteToInvoiceAction />,
    },
  },
  actionKeys: [
    // Navigation
    SingleRecordActionKeys.NAVIGATE_TO_NEXT_RECORD,
    SingleRecordActionKeys.NAVIGATE_TO_PREVIOUS_RECORD,
    // CRUD
    SingleRecordActionKeys.ADD_TO_FAVORITES,
    SingleRecordActionKeys.REMOVE_FROM_FAVORITES,
    SingleRecordActionKeys.DELETE,
    SingleRecordActionKeys.DESTROY,
    SingleRecordActionKeys.RESTORE,
    // Multiple records
    MultipleRecordsActionKeys.DELETE,
    MultipleRecordsActionKeys.DESTROY,
    MultipleRecordsActionKeys.RESTORE,
    // No selection
    NoSelectionRecordActionKeys.CREATE_NEW_RECORD,
    NoSelectionRecordActionKeys.SEE_DELETED_RECORDS,
    NoSelectionRecordActionKeys.HIDE_DELETED_RECORDS,
    // Export
    SingleRecordActionKeys.EXPORT_FROM_RECORD_SHOW,
  ],
  propertiesToOverwrite: {
    [SingleRecordActionKeys.NAVIGATE_TO_NEXT_RECORD]: {
      position: 0,
      label: msg`Navigate to next quote`,
    },
    [SingleRecordActionKeys.NAVIGATE_TO_PREVIOUS_RECORD]: {
      position: 1,
      label: msg`Navigate to previous quote`,
    },
    [NoSelectionRecordActionKeys.CREATE_NEW_RECORD]: {
      position: 2,
      label: msg`Create new quote`,
    },
    [SingleRecordActionKeys.DELETE]: {
      position: 5,
      label: msg`Delete quote`,
    },
    [SingleRecordActionKeys.EXPORT_FROM_RECORD_SHOW]: {
      position: 6,
      label: msg`Export quote`,
    },
    [SingleRecordActionKeys.ADD_TO_FAVORITES]: {
      position: 7,
    },
    [SingleRecordActionKeys.REMOVE_FROM_FAVORITES]: {
      position: 8,
    },
  },
});
