import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../constants';
import { getInvoice } from '../api/invoices';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/currency';
import InvoiceHeader from '../components/InvoiceHeader';
import InvoiceItemRow from '../components/InvoiceItemRow';
import PdfButton from '../components/PdfButton';

export default function InvoiceDetailScreen({ route, navigation }: any) {
  const { invoiceId } = route.params;
  const { language } = useAppStore();

  // Fetch Invoice Details
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await getInvoice(invoiceId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>
          {language === 'hi' ? 'इनवॉइस लोड करने में विफल रहा' : 'Failed to load invoice details'}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {language === 'hi' ? 'इनवॉइस विवरण' : 'Invoice Details'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Receipt Styled Header Card */}
        <InvoiceHeader
          businessName={invoice.business?.name || invoice.business?.ownerName || 'My Kirana Shop'}
          businessPhone={invoice.business?.phone || ''}
          businessGstin={invoice.business?.gstin}
          invoiceNumber={invoice.invoiceNumber}
          invoiceDate={invoice.invoiceDate}
          isPaid={true} // Defaulting to Paid since kirana invoices are usually immediate sales
        />

        {/* Customer Section Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'hi' ? 'बिल भेजा गया:' : 'Billed To:'}
          </Text>
          <Text style={styles.customerName}>{invoice.customerName}</Text>
          {invoice.customerPhone && (
            <Text style={styles.customerDetail}>Phone: {invoice.customerPhone}</Text>
          )}
          {invoice.customerAddress && (
            <Text style={styles.customerDetail}>Address: {invoice.customerAddress}</Text>
          )}
        </View>

        {/* Items Table Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'hi' ? 'सामान' : 'Items'}
          </Text>
          {invoice.items?.map((item) => (
            <InvoiceItemRow
              key={item.id}
              itemName={item.itemName}
              quantity={item.quantity}
              unit={item.unit}
              pricePerUnit={item.pricePerUnit}
              totalPrice={item.totalPrice}
            />
          ))}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{language === 'hi' ? 'उप-योग:' : 'Subtotal:'}</Text>
            <Text style={styles.summaryVal}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.gstRate > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST ({invoice.gstRate}%):</Text>
              <Text style={styles.summaryVal}>{formatCurrency(invoice.gstAmount)}</Text>
            </View>
          )}
          <View style={styles.separator} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>{language === 'hi' ? 'कुल योग:' : 'Total Amount:'}</Text>
            <Text style={styles.grandTotalVal}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Notes if any */}
        {invoice.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {language === 'hi' ? 'टिप्पणी:' : 'Notes / Terms:'}
            </Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Buttons Footer */}
      <View style={styles.bottomBar}>
        <PdfButton
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          actionType="download"
        />
        <PdfButton
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          actionType="share"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 20,
    fontWeight: '600',
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  backButton: {
    padding: 8,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  customerDetail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '800',
  },
  grandTotalVal: {
    fontSize: 22,
    color: '#FF6B00',
    fontWeight: '900',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    gap: 12,
  },
});
