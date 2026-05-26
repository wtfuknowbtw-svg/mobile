import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface InvoiceHeaderProps {
  businessName: string;
  businessPhone: string;
  businessGstin?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  isPaid?: boolean;
}

export default function InvoiceHeader({
  businessName,
  businessPhone,
  businessGstin,
  invoiceNumber,
  invoiceDate,
  isPaid = false,
}: InvoiceHeaderProps) {
  const formattedDate = new Date(invoiceDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>ApnaKhata</Text>
        <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
          <Text style={[styles.statusText, isPaid ? styles.paidText : styles.unpaidText]}>
            {isPaid ? 'PAID' : 'UNPAID'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.businessSection}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.businessMeta}>Phone: {businessPhone}</Text>
          {businessGstin && <Text style={styles.businessMeta}>GSTIN: {businessGstin}</Text>}
        </View>

        <View style={styles.invoiceSection}>
          <Text style={styles.invoiceLabel}>Invoice Number</Text>
          <Text style={styles.invoiceVal}>{invoiceNumber}</Text>
          <Text style={[styles.invoiceLabel, { marginTop: 8 }]}>Date</Text>
          <Text style={styles.invoiceVal}>{formattedDate}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6B00', // Saffron brand color
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadge: {
    backgroundColor: '#E8F8EF',
  },
  unpaidBadge: {
    backgroundColor: '#FDEDEC',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paidText: {
    color: '#2ECC71',
  },
  unpaidText: {
    color: '#E74C3C',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  businessSection: {
    flex: 1,
    paddingRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  businessMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  invoiceSection: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  invoiceVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
});
