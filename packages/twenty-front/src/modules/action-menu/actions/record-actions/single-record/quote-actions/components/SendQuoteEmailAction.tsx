import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useEmailComposer } from '@/email-composer/hooks/useEmailComposer';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { isDefined } from 'twenty-shared/utils';

export const SendQuoteEmailActionEffect = () => {
  const quoteId = useSelectedRecordIdOrThrow();
  const { openEmailComposer } = useEmailComposer();

  const { record: quote } = useFindOneRecord({
    objectNameSingular: 'quote',
    objectRecordId: quoteId,
  });

  const onClick = () => {
    if (!isDefined(quote)) {
      return;
    }

    const company = quote.company;
    const contact = quote.person;
    const quoteNumber = quote.quoteNumber || quoteId;
    const totalAmount = quote.totalAmount?.amountMicros
      ? `$${(quote.totalAmount.amountMicros / 1000000).toFixed(2)}`
      : 'TBD';

    const pdfDownloadLink = `${window.location.origin}/pdf/quotes/${quoteId}`;

    openEmailComposer({
      defaultTo: contact?.emails?.primaryEmail || company?.domainName || '',
      defaultSubject: `Quote ${quoteNumber} from ${company?.name || 'Phos Industries'}`,
      defaultBody: `
<p>Hi ${contact?.name?.firstName || 'there'},</p>

<p>Thank you for your interest! Please find our quote below.</p>

<p><strong>Quote Details:</strong></p>
<ul>
  <li>Quote Number: ${quoteNumber}</li>
  <li>Date: ${quote.quoteDate || new Date().toLocaleDateString()}</li>
  <li>Valid Until: ${quote.validUntil || 'N/A'}</li>
  <li>Total: ${totalAmount}</li>
</ul>

<p><a href="${pdfDownloadLink}">Download PDF Quote</a></p>

<p>Please review and let us know if you have any questions.</p>

<p>Best regards</p>
      `.trim(),
      context: {
        personFirstName: contact?.name?.firstName,
        personLastName: contact?.name?.lastName,
        personEmail: contact?.emails?.primaryEmail,
        companyName: company?.name,
      },
    });
  };

  return <Action onClick={onClick} />;
};
