import { useCallback } from 'react';
import { IconFileDownload, IconMail } from 'twenty-ui/display';
import { type ActionMenuEntry } from '@/action-menu/types/ActionMenuEntry';
import { ActionViewType } from '@/action-menu/actions/types/ActionViewType';
import { useDownloadInvoicePdf } from '../hooks/useDownloadInvoicePdf';

export const useInvoiceActions = (invoiceId: string) => {
  const { downloadPdf } = useDownloadInvoicePdf();

  const handleDownloadPdf = useCallback(async () => {
    await downloadPdf(invoiceId);
  }, [invoiceId, downloadPdf]);

  const actions: ActionMenuEntry[] = [
    {
      key: 'download-invoice-pdf',
      label: 'Download PDF',
      position: 1,
      Icon: IconFileDownload,
      onClick: handleDownloadPdf,
      availableOn: [ActionViewType.SHOW_PAGE],
      shouldBeRegistered: () => true,
    },
    {
      key: 'email-invoice',
      label: 'Send via Email',
      position: 2,
      Icon: IconMail,
      onClick: () => {
        // TODO: Integrate with email composer (Story 2.5)
        console.log('Email invoice:', invoiceId);
      },
      availableOn: [ActionViewType.SHOW_PAGE],
      shouldBeRegistered: () => true,
    },
  ];

  return actions;
};
