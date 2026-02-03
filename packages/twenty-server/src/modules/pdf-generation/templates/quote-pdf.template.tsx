import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type Font,
} from '@react-pdf/renderer';

import { formatCurrency } from '../constants/currency.constants';
import { type QuotePdfData } from '../types/pdf-data.types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
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
  column: {
    width: '48%',
  },
  text: {
    marginBottom: 4,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
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
  tableColDescription: {
    width: '40%',
  },
  tableColQuantity: {
    width: '15%',
    textAlign: 'right',
  },
  tableColUnitPrice: {
    width: '20%',
    textAlign: 'right',
  },
  tableColTotal: {
    width: '25%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '50%',
    paddingVertical: 4,
  },
  totalsLabel: {
    width: '60%',
    textAlign: 'right',
    paddingRight: 20,
  },
  totalsValue: {
    width: '40%',
    textAlign: 'right',
  },
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

export const QuotePdfTemplate: React.FC<{ data: QuotePdfData }> = ({
  data,
}) => {
  const formatAddress = (address?: {
    addressStreet1?: string;
    addressStreet2?: string;
    addressCity?: string;
    addressState?: string;
    addressPostcode?: string;
    addressCountry?: string;
  }) => {
    if (!address) return '';
    const parts = [
      address.addressStreet1,
      address.addressStreet2,
      address.addressCity,
      address.addressState,
      address.addressPostcode,
      address.addressCountry,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>QUOTE</Text>
          <Text style={styles.subtitle}>#{data.quoteNumber}</Text>
          <Text style={styles.subtitle}>
            Date: {new Date(data.quoteDate).toLocaleDateString()}
          </Text>
          {data.expirationDate && (
            <Text style={styles.subtitle}>
              Expires: {new Date(data.expirationDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Bill To / From */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.text}>Phos Industries</Text>
            <Text style={styles.text}>Your Company Address</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            {data.company && (
              <>
                <Text style={styles.text}>{data.company.name}</Text>
                <Text style={styles.text}>
                  {formatAddress(data.company.address)}
                </Text>
              </>
            )}
            {data.contact && (
              <>
                <Text style={styles.text}>
                  Attn: {data.contact.name.firstName}{' '}
                  {data.contact.name.lastName}
                </Text>
                {data.contact.email && (
                  <Text style={styles.text}>{data.contact.email}</Text>
                )}
                {data.contact.phone && (
                  <Text style={styles.text}>{data.contact.phone}</Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableColDescription}>Description</Text>
              <Text style={styles.tableColQuantity}>Qty</Text>
              <Text style={styles.tableColUnitPrice}>Unit Price</Text>
              <Text style={styles.tableColTotal}>Amount</Text>
            </View>

            {/* Table Rows */}
            {data.lineItems.map((item) => {
              const lineTotal = item.quantity * item.unitPrice.amountMicros;
              return (
                <View key={item.id} style={styles.tableRow}>
                  <View style={styles.tableColDescription}>
                    <Text>{item.description}</Text>
                    {item.serviceCategory && (
                      <Text style={{ fontSize: 8, color: '#666' }}>
                        {item.serviceCategory}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.tableColQuantity}>{item.quantity}</Text>
                  <Text style={styles.tableColUnitPrice}>
                    {formatCurrency(
                      item.unitPrice.amountMicros,
                      item.unitPrice.currencyCode,
                    )}
                  </Text>
                  <Text style={styles.tableColTotal}>
                    {formatCurrency(lineTotal, item.unitPrice.currencyCode)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal:</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(
                data.subtotal.amountMicros,
                data.subtotal.currencyCode,
              )}
            </Text>
          </View>

          {data.discountPercentage > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Discount ({data.discountPercentage}%):
              </Text>
              <Text style={styles.totalsValue}>
                -
                {formatCurrency(
                  data.discountAmount.amountMicros,
                  data.discountAmount.currencyCode,
                )}
              </Text>
            </View>
          )}

          {data.taxPercentage > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({data.taxPercentage}%):
              </Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(
                  data.taxAmount.amountMicros,
                  data.taxAmount.currencyCode,
                )}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalsLabel}>Total:</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(
                data.total.amountMicros,
                data.total.currencyCode,
              )}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.text}>{data.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {data.terms && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Terms & Conditions:</Text>
            <Text style={styles.text}>{data.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! | Generated by Phos CRM
        </Text>
      </Page>
    </Document>
  );
};
