import { gql } from '@apollo/client';

export const CREATE_QUOTE = gql`
  mutation CreateQuote($input: QuoteCreateInput!) {
    createQuote(data: $input) {
      id
      quoteNumber
      quoteDate
      expirationDate
      status
      discountPercentage
      taxPercentage
      notes
      terms
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
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_QUOTE_LINE_ITEM = gql`
  mutation CreateQuoteLineItem($input: QuoteLineItemCreateInput!) {
    createQuoteLineItem(data: $input) {
      id
      description
      quantity
      unitPrice {
        amountMicros
        currencyCode
      }
      serviceCategory
      sortOrder
      quote {
        id
      }
    }
  }
`;

export const CREATE_QUOTE_WITH_LINE_ITEMS = gql`
  mutation CreateQuoteWithLineItems(
    $quoteInput: QuoteCreateInput!
    $lineItemsInput: [QuoteLineItemCreateInput!]!
  ) {
    createQuote(data: $quoteInput) {
      id
      quoteNumber
      quoteDate
      expirationDate
      status
      discountPercentage
      taxPercentage
      subtotal {
        amountMicros
        currencyCode
      }
      discountAmount {
        amountMicros
        currencyCode
      }
      taxAmount {
        amountMicros
        currencyCode
      }
      total {
        amountMicros
        currencyCode
      }
      notes
      terms
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
      lineItems {
        edges {
          node {
            id
            description
            quantity
            unitPrice {
              amountMicros
              currencyCode
            }
            serviceCategory
            sortOrder
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;
