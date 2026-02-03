import { MultipleRecordsActionKeys } from '@/action-menu/actions/record-actions/multiple-records/types/MultipleRecordsActionKeys';
import { NoSelectionRecordActionKeys } from '@/action-menu/actions/record-actions/no-selection/types/NoSelectionRecordActionsKeys';
import { CreateStripeInvoiceAction } from '@/action-menu/actions/record-actions/single-record/invoice-actions/components/CreateStripeInvoiceAction';
import { DownloadInvoicePdfAction } from '@/action-menu/actions/record-actions/single-record/invoice-actions/components/DownloadInvoicePdfAction';
import { SendInvoiceEmailAction } from '@/action-menu/actions/record-actions/single-record/invoice-actions/components/SendInvoiceEmailAction';
import { InvoiceSingleRecordActionKeys } from '@/action-menu/actions/record-actions/single-record/invoice-actions/types/InvoiceSingleRecordActionKeys';
import { SingleRecordActionKeys } from '@/action-menu/actions/record-actions/single-record/types/SingleRecordActionsKey';
import { inheritActionsFromDefaultConfig } from '@/action-menu/actions/record-actions/utils/inheritActionsFromDefaultConfig';
import { ActionScope } from '@/action-menu/actions/types/ActionScope';
import { ActionType } from '@/action-menu/actions/types/ActionType';
import { ActionViewType } from '@/action-menu/actions/types/ActionViewType';
import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconDownload, IconMail, IconBrandStripe } from 'twenty-ui/display';

export const INVOICE_ACTIONS_CONFIG = inheritActionsFromDefaultConfig({
  config: {
    [InvoiceSingleRecordActionKeys.DOWNLOAD_INVOICE_PDF]: {
      key: InvoiceSingleRecordActionKeys.DOWNLOAD_INVOICE_PDF,
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
      component: <DownloadInvoicePdfAction />,
    },
    [InvoiceSingleRecordActionKeys.SEND_INVOICE_EMAIL]: {
      key: InvoiceSingleRecordActionKeys.SEND_INVOICE_EMAIL,
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
      component: <SendInvoiceEmailAction />,
    },
    [InvoiceSingleRecordActionKeys.CREATE_STRIPE_INVOICE]: {
      key: InvoiceSingleRecordActionKeys.CREATE_STRIPE_INVOICE,
      label: msg`Create Stripe Invoice`,
      shortLabel: msg`Stripe`,
      isPinned: false,
      position: 5,
      Icon: IconBrandStripe,
      type: ActionType.Standard,
      scope: ActionScope.RecordSelection,
      shouldBeRegistered: ({ selectedRecord }) =>
        isDefined(selectedRecord) &&
        !isDefined(selectedRecord?.deletedAt) &&
        !isDefined(selectedRecord?.stripeInvoiceId),
      availableOn: [ActionViewType.SHOW_PAGE],
      component: <CreateStripeInvoiceAction />,
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
      label: msg`Navigate to next invoice`,
    },
    [SingleRecordActionKeys.NAVIGATE_TO_PREVIOUS_RECORD]: {
      position: 1,
      label: msg`Navigate to previous invoice`,
    },
    [NoSelectionRecordActionKeys.CREATE_NEW_RECORD]: {
      position: 2,
      label: msg`Create new invoice`,
    },
    [SingleRecordActionKeys.DELETE]: {
      position: 5,
      label: msg`Delete invoice`,
    },
    [SingleRecordActionKeys.EXPORT_FROM_RECORD_SHOW]: {
      position: 6,
      label: msg`Export invoice`,
    },
    [SingleRecordActionKeys.ADD_TO_FAVORITES]: {
      position: 7,
    },
    [SingleRecordActionKeys.REMOVE_FROM_FAVORITES]: {
      position: 8,
    },
  },
});
