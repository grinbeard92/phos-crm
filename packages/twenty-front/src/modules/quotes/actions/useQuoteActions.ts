import { useCallback } from 'react';
import { IconFileDownload, IconMail } from 'twenty-ui/display';
import { type ActionMenuEntry } from '@/action-menu/types/ActionMenuEntry';
import { ActionViewType } from '@/action-menu/actions/types/ActionViewType';
import { useDownloadQuotePdf } from '../hooks/useDownloadQuotePdf';

export const useQuoteActions = (quoteId: string) => {
  const { downloadPdf } = useDownloadQuotePdf();

  const handleDownloadPdf = useCallback(async () => {
    await downloadPdf(quoteId);
  }, [quoteId, downloadPdf]);

  const actions: ActionMenuEntry[] = [
    {
      key: 'download-quote-pdf',
      label: 'Download PDF',
      position: 1,
      Icon: IconFileDownload,
      onClick: handleDownloadPdf,
      availableOn: [ActionViewType.SHOW_PAGE],
      shouldBeRegistered: () => true,
    },
    {
      key: 'email-quote',
      label: 'Send via Email',
      position: 2,
      Icon: IconMail,
      onClick: () => {
        // TODO: Integrate with email composer (Story 2.5)
        console.log('Email quote:', quoteId);
      },
      availableOn: [ActionViewType.SHOW_PAGE],
      shouldBeRegistered: () => true,
    },
  ];

  return actions;
};
