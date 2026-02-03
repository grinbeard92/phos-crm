import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useEmailComposer } from '@/email-composer/hooks/useEmailComposer';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { isDefined } from 'twenty-shared/utils';

export const SendInvoiceEmailActionEffect = () => {
  const invoiceId = useSelectedRecordIdOrThrow();
  const { openEmailComposer } = useEmailComposer();

  const { record: invoice } = useFindOneRecord({
    objectNameSingular: 'invoice',
    objectRecordId: invoiceId,
  });

  const onClick = () => {
    if (!isDefined(invoice)) {
      return;
    }

    const company = invoice.company;
    const contact = invoice.person;
    const invoiceNumber = invoice.invoiceNumber || invoiceId;
    const totalAmount = invoice.totalAmount?.amountMicros
      ? `$${(invoice.totalAmount.amountMicros / 1000000).toFixed(2)}`
      : 'TBD';
    const balanceDue = invoice.balanceDue?.amountMicros
      ? `$${(invoice.balanceDue.amountMicros / 1000000).toFixed(2)}`
      : totalAmount;

    const pdfDownloadLink = `${window.location.origin}/pdf/invoices/${invoiceId}`;
    const paymentLink = invoice.stripePaymentLink || pdfDownloadLink;

    openEmailComposer({
      defaultTo: contact?.emails?.primaryEmail || company?.domainName || '',
      defaultSubject: `Invoice ${invoiceNumber} from ${company?.name || 'Phos Industries'}`,
      defaultBody: `
<p>Hi ${contact?.name?.firstName || 'there'},</p>

<p>Please find attached your invoice.</p>

<p><strong>Invoice Details:</strong></p>
<ul>
  <li>Invoice Number: ${invoiceNumber}</li>
  <li>Date: ${invoice.invoiceDate || new Date().toLocaleDateString()}</li>
  <li>Due Date: ${invoice.dueDate || 'N/A'}</li>
  <li>Amount Due: ${balanceDue}</li>
</ul>

<p><a href="${paymentLink}">Pay Invoice Now</a></p>
<p><a href="${pdfDownloadLink}">Download PDF Invoice</a></p>

<p>Thank you for your business!</p>

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
