import { Injectable } from '@nestjs/common';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { type Readable } from 'stream';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  type QuotePdfData,
  type InvoicePdfData,
} from '../types/pdf-data.types';
import { formatCurrency } from '../constants/currency.constants';

const createQuotePdfStyles = () =>
  StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    header: { marginBottom: 30 },
    title: { fontSize: 24, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
    subtitle: { fontSize: 12, color: '#666', marginBottom: 5 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
      color: '#333',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    column: { width: '48%' },
    text: { marginBottom: 4, lineHeight: 1.5 },
    table: { marginTop: 10, marginBottom: 20 },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
      padding: 8,
      fontFamily: 'Helvetica-Bold',
      borderBottom: '1pt solid #ccc',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 8,
      borderBottom: '0.5pt solid #e0e0e0',
    },
    tableColDescription: { width: '40%' },
    tableColQuantity: { width: '15%', textAlign: 'right' },
    tableColUnitPrice: { width: '20%', textAlign: 'right' },
    tableColTotal: { width: '25%', textAlign: 'right' },
    totalsSection: { marginTop: 20, alignItems: 'flex-end' },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '50%',
      paddingVertical: 4,
    },
    totalsLabel: { width: '60%', textAlign: 'right', paddingRight: 20 },
    totalsValue: { width: '40%', textAlign: 'right' },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      width: '50%',
      paddingVertical: 8,
      marginTop: 8,
      borderTop: '1pt solid #333',
      fontFamily: 'Helvetica-Bold',
      fontSize: 12,
    },
    notes: {
      marginTop: 30,
      padding: 15,
      backgroundColor: '#f9f9f9',
      borderRadius: 4,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      color: '#999',
      fontSize: 8,
    },
  });

@Injectable()
export class PdfGenerationService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async generateQuotePdfStream(
    quoteId: string,
    workspaceId: string,
  ): Promise<Readable> {
    const quoteRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'quote',
    );

    const quote = await quoteRepository.findOne({
      where: { id: quoteId },
      relations: {
        company: true,
        contact: true,
        lineItems: true,
      },
    });

    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const pdfData: QuotePdfData = this.transformQuoteToPdfData(quote);
    const styles = createQuotePdfStyles();

    // Create PDF document using React.createElement
    const doc = React.createElement(
      Document,
      {},
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.title }, 'QUOTE'),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `#${pdfData.quoteNumber}`,
          ),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `Date: ${new Date(pdfData.quoteDate).toLocaleDateString()}`,
          ),
          pdfData.expirationDate &&
            React.createElement(
              Text,
              { style: styles.subtitle },
              `Expires: ${new Date(pdfData.expirationDate).toLocaleDateString()}`,
            ),
        ),
        // Bill To/From
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            View,
            { style: styles.column },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              'From:',
            ),
            React.createElement(Text, { style: styles.text }, 'Phos Industries'),
          ),
          React.createElement(
            View,
            { style: styles.column },
            React.createElement(Text, { style: styles.sectionTitle }, 'Bill To:'),
            pdfData.company &&
              React.createElement(
                React.Fragment,
                {},
                React.createElement(
                  Text,
                  { style: styles.text },
                  pdfData.company.name,
                ),
              ),
          ),
        ),
        // Line Items
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Items'),
          React.createElement(
            View,
            { style: styles.table },
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(
                Text,
                { style: styles.tableColDescription },
                'Description',
              ),
              React.createElement(
                Text,
                { style: styles.tableColQuantity },
                'Qty',
              ),
              React.createElement(
                Text,
                { style: styles.tableColUnitPrice },
                'Unit Price',
              ),
              React.createElement(
                Text,
                { style: styles.tableColTotal },
                'Amount',
              ),
            ),
            ...pdfData.lineItems.map((item) =>
              React.createElement(
                View,
                { key: item.id, style: styles.tableRow },
                React.createElement(
                  Text,
                  { style: styles.tableColDescription },
                  item.description,
                ),
                React.createElement(
                  Text,
                  { style: styles.tableColQuantity },
                  item.quantity.toString(),
                ),
                React.createElement(
                  Text,
                  { style: styles.tableColUnitPrice },
                  formatCurrency(
                    item.unitPrice.amountMicros,
                    item.unitPrice.currencyCode,
                  ),
                ),
                React.createElement(
                  Text,
                  { style: styles.tableColTotal },
                  formatCurrency(
                    item.quantity * item.unitPrice.amountMicros,
                    item.unitPrice.currencyCode,
                  ),
                ),
              ),
            ),
          ),
        ),
        // Totals
        React.createElement(
          View,
          { style: styles.totalsSection },
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              'Subtotal:',
            ),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              formatCurrency(
                pdfData.subtotal.amountMicros,
                pdfData.subtotal.currencyCode,
              ),
            ),
          ),
          React.createElement(
            View,
            { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'Total:'),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              formatCurrency(
                pdfData.total.amountMicros,
                pdfData.total.currencyCode,
              ),
            ),
          ),
        ),
        // Footer
        React.createElement(
          Text,
          { style: styles.footer },
          'Thank you for your business! | Generated by Phos CRM',
        ),
      ),
    );

    const stream = await renderToStream(doc as any);
    return stream as unknown as Readable;
  }

  async generateInvoicePdfStream(
    invoiceId: string,
    workspaceId: string,
  ): Promise<Readable> {
    const invoiceRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'invoice',
    );

    const invoice = await invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: {
        company: true,
        contact: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const pdfData: InvoicePdfData = this.transformInvoiceToPdfData(invoice);
    const styles = createQuotePdfStyles(); // Reuse same styles for now

    const doc = React.createElement(
      Document,
      {},
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.title }, 'INVOICE'),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `#${pdfData.invoiceNumber}`,
          ),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `Date: ${new Date(pdfData.invoiceDate).toLocaleDateString()}`,
          ),
        ),
        React.createElement(
          View,
          { style: styles.totalsSection },
          React.createElement(
            View,
            { style: styles.totalRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'Total:'),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              formatCurrency(
                pdfData.total.amountMicros,
                pdfData.total.currencyCode,
              ),
            ),
          ),
        ),
      ),
    );

    const stream = await renderToStream(doc as any);
    return stream as unknown as Readable;
  }

  private transformQuoteToPdfData(quote: any): QuotePdfData {
    const subtotalMicros = (quote.lineItems || []).reduce(
      (sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.unitPrice?.amountMicros || 0);
      },
      0,
    );

    const discountPercentage = quote.discountPercentage || 0;
    const discountMicros = Math.round(
      (subtotalMicros * discountPercentage) / 100,
    );

    const taxableAmountMicros = subtotalMicros - discountMicros;
    const taxPercentage = quote.taxPercentage || 0;
    const taxMicros = Math.round((taxableAmountMicros * taxPercentage) / 100);

    const totalMicros = taxableAmountMicros + taxMicros;

    const currencyCode =
      quote.lineItems?.[0]?.unitPrice?.currencyCode || 'USD';

    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber || quote.id.slice(0, 8).toUpperCase(),
      quoteDate: quote.quoteDate || new Date().toISOString(),
      expirationDate: quote.expirationDate,
      status: quote.status || 'DRAFT',
      company: quote.company
        ? {
            id: quote.company.id,
            name: quote.company.name,
            address: {
              addressStreet1: quote.company.addressAddressStreet1,
              addressStreet2: quote.company.addressAddressStreet2,
              addressCity: quote.company.addressAddressCity,
              addressState: quote.company.addressAddressState,
              addressPostcode: quote.company.addressAddressPostcode,
              addressCountry: quote.company.addressAddressCountry,
            },
          }
        : undefined,
      contact: quote.contact
        ? {
            id: quote.contact.id,
            name: {
              firstName: quote.contact.nameFirstName || '',
              lastName: quote.contact.nameLastName || '',
            },
            email: quote.contact.email,
            phone: quote.contact.phone,
          }
        : undefined,
      lineItems: (quote.lineItems || []).map((item: any) => ({
        id: item.id,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || { amountMicros: 0, currencyCode },
        serviceCategory: item.serviceCategory,
      })),
      subtotal: {
        amountMicros: subtotalMicros,
        currencyCode,
      },
      discountPercentage,
      discountAmount: {
        amountMicros: discountMicros,
        currencyCode,
      },
      taxPercentage,
      taxAmount: {
        amountMicros: taxMicros,
        currencyCode,
      },
      total: {
        amountMicros: totalMicros,
        currencyCode,
      },
      notes: quote.notes,
      terms: quote.terms,
    };
  }

  private transformInvoiceToPdfData(invoice: any): InvoicePdfData {
    const subtotalMicros = (invoice.lineItems || []).reduce(
      (sum: number, item: any) => {
        return sum + (item.quantity || 0) * (item.unitPrice?.amountMicros || 0);
      },
      0,
    );

    const discountPercentage = invoice.discountPercentage || 0;
    const discountMicros = Math.round(
      (subtotalMicros * discountPercentage) / 100,
    );

    const taxableAmountMicros = subtotalMicros - discountMicros;
    const taxPercentage = invoice.taxPercentage || 0;
    const taxMicros = Math.round((taxableAmountMicros * taxPercentage) / 100);

    const totalMicros = taxableAmountMicros + taxMicros;
    const amountPaidMicros = invoice.amountPaid?.amountMicros || 0;
    const amountDueMicros = totalMicros - amountPaidMicros;

    const currencyCode =
      invoice.lineItems?.[0]?.unitPrice?.currencyCode || 'USD';

    return {
      id: invoice.id,
      invoiceNumber:
        invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
      invoiceDate: invoice.invoiceDate || new Date().toISOString(),
      dueDate: invoice.dueDate,
      status: invoice.status || 'DRAFT',
      company: invoice.company
        ? {
            id: invoice.company.id,
            name: invoice.company.name,
            address: {
              addressStreet1: invoice.company.addressAddressStreet1,
              addressStreet2: invoice.company.addressAddressStreet2,
              addressCity: invoice.company.addressAddressCity,
              addressState: invoice.company.addressAddressState,
              addressPostcode: invoice.company.addressAddressPostcode,
              addressCountry: invoice.company.addressAddressCountry,
            },
          }
        : undefined,
      contact: invoice.contact
        ? {
            id: invoice.contact.id,
            name: {
              firstName: invoice.contact.nameFirstName || '',
              lastName: invoice.contact.nameLastName || '',
            },
            email: invoice.contact.email,
            phone: invoice.contact.phone,
          }
        : undefined,
      lineItems: (invoice.lineItems || []).map((item: any) => ({
        id: item.id,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || { amountMicros: 0, currencyCode },
        serviceCategory: item.serviceCategory,
      })),
      subtotal: {
        amountMicros: subtotalMicros,
        currencyCode,
      },
      discountPercentage,
      discountAmount: {
        amountMicros: discountMicros,
        currencyCode,
      },
      taxPercentage,
      taxAmount: {
        amountMicros: taxMicros,
        currencyCode,
      },
      total: {
        amountMicros: totalMicros,
        currencyCode,
      },
      amountPaid: {
        amountMicros: amountPaidMicros,
        currencyCode,
      },
      amountDue: {
        amountMicros: amountDueMicros,
        currencyCode,
      },
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
    };
  }
}
