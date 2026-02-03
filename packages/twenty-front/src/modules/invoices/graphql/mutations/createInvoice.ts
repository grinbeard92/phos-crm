import { gql } from '@apollo/client';

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceCreateInput!) {
    createInvoice(data: $input) {
      id
      invoiceNumber
      invoiceDate
      dueDate
      status
      discountPercentage
      taxPercentage
      amountPaid {
        amountMicros
        currencyCode
      }
      notes
      paymentTerms
      stripeInvoiceId
      stripePaymentLink
      company {
        id
        name
      }
      contact {
        id
        name {
          firstName
          lastName
        }
      }
      project {
        id
        name
      }
      quote {
        id
        quoteNumber
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_INVOICE_LINE_ITEM = gql`
  mutation CreateInvoiceLineItem($input: InvoiceLineItemCreateInput!) {
    createInvoiceLineItem(data: $input) {
      id
      description
      quantity
      unitPrice {
        amountMicros
        currencyCode
      }
      serviceCategory
      sortOrder
      invoice {
        id
      }
    }
  }
`;
