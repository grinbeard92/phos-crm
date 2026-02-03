import { Injectable } from '@nestjs/common';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { type Readable } from 'stream';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  type QuotePdfData,
  type InvoicePdfData,
} from '../types/pdf-data.types';
import { QuotePdfTemplate } from '../templates/quote-pdf.template';
import { InvoicePdfTemplate } from '../templates/invoice-pdf.template';

@Injectable()
export class PdfGenerationService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async generateQuotePdfStream(
    quoteId: string,
    workspaceId: string,
  ): Promise<Readable> {
    // Get repository for quote object
    const quoteRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'quote',
    );

    // Fetch quote with relations
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

    // Transform to PDF data format
    const pdfData: QuotePdfData = this.transformQuoteToPdfData(quote);

    // Render React component to PDF stream
    const stream = await renderToStream(
      React.createElement(QuotePdfTemplate, { data: pdfData }) as any,
    );

    return stream as unknown as Readable;
  }

  async generateInvoicePdfStream(
    invoiceId: string,
    workspaceId: string,
  ): Promise<Readable> {
    // Get repository for invoice object
    const invoiceRepository = await this.globalWorkspaceOrmManager.getRepository(
      workspaceId,
      'invoice',
    );

    // Fetch invoice with relations
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

    // Transform to PDF data format
    const pdfData: InvoicePdfData = this.transformInvoiceToPdfData(invoice);

    // Render React component to PDF stream
    const stream = await renderToStream(
      React.createElement(InvoicePdfTemplate, { data: pdfData }) as any,
    );

    return stream as unknown as Readable;
  }

  private transformQuoteToPdfData(quote: any): QuotePdfData {
    // Calculate totals
    const subtotalMicros = (quote.lineItems || []).reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0) * (item.unitPrice?.amountMicros || 0);
    }, 0);

    const discountPercentage = quote.discountPercentage || 0;
    const discountMicros = Math.round((subtotalMicros * discountPercentage) / 100);

    const taxableAmountMicros = subtotalMicros - discountMicros;
    const taxPercentage = quote.taxPercentage || 0;
    const taxMicros = Math.round((taxableAmountMicros * taxPercentage) / 100);

    const totalMicros = taxableAmountMicros + taxMicros;

    const currencyCode = quote.lineItems?.[0]?.unitPrice?.currencyCode || 'USD';

    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber || quote.id.slice(0, 8).toUpperCase(),
      quoteDate: quote.quoteDate || new Date().toISOString(),
      expirationDate: quote.expirationDate,
      status: quote.status || 'DRAFT',
      company: quote.company ? {
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
      } : undefined,
      contact: quote.contact ? {
        id: quote.contact.id,
        name: {
          firstName: quote.contact.nameFirstName || '',
          lastName: quote.contact.nameLastName || '',
        },
        email: quote.contact.email,
        phone: quote.contact.phone,
      } : undefined,
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
    // Calculate totals
    const subtotalMicros = (invoice.lineItems || []).reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0) * (item.unitPrice?.amountMicros || 0);
    }, 0);

    const discountPercentage = invoice.discountPercentage || 0;
    const discountMicros = Math.round((subtotalMicros * discountPercentage) / 100);

    const taxableAmountMicros = subtotalMicros - discountMicros;
    const taxPercentage = invoice.taxPercentage || 0;
    const taxMicros = Math.round((taxableAmountMicros * taxPercentage) / 100);

    const totalMicros = taxableAmountMicros + taxMicros;
    const amountPaidMicros = invoice.amountPaid?.amountMicros || 0;
    const amountDueMicros = totalMicros - amountPaidMicros;

    const currencyCode = invoice.lineItems?.[0]?.unitPrice?.currencyCode || 'USD';

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
      invoiceDate: invoice.invoiceDate || new Date().toISOString(),
      dueDate: invoice.dueDate,
      status: invoice.status || 'DRAFT',
      company: invoice.company ? {
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
      } : undefined,
      contact: invoice.contact ? {
        id: invoice.contact.id,
        name: {
          firstName: invoice.contact.nameFirstName || '',
          lastName: invoice.contact.nameLastName || '',
        },
        email: invoice.contact.email,
        phone: invoice.contact.phone,
      } : undefined,
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
