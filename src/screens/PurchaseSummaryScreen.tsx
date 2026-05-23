import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { getPurchasesSummary, PurchaseSummary } from '../api/purchases';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function PurchaseSummaryScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const [filter, setFilter] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['purchasesSummary', businessId, filter],
    queryFn: () => getPurchasesSummary(filter),
    enabled: !!businessId,
  });

  const text = {
    title: language === 'hi' ? 'खरीद vs बिक्री' : 'Purchase vs Sales',
    profit: language === 'hi' ? 'कमाई' : 'Profit',
    loss: language === 'hi' ? 'नुकसान' : 'Loss',
    all: language === 'hi' ? 'सभी' : 'All',
    week: language === 'hi' ? 'सप्ताह' : 'Week',
    month: language === 'hi' ? 'महीना' : 'Month',
    custom: language === 'hi' ? 'कस्टम' : 'Custom',
    item: language === 'hi' ? 'आइटम' : 'Item',
    bought: language === 'hi' ? 'खरीदा' : 'Bought',
    sold: language === 'hi' ? 'बिका' : 'Sold',
    difference: language === 'hi' ? 'अंतर' : 'Difference',
    missing: language === 'hi' ? 'गायब' : 'Missing',
    empty: language === 'hi' ? 'कोई डेटा नहीं' : 'No data available',
  };

  const renderFilterTab = (key: string, label: string) => (
    <TouchableOpacity
      key={key}
      style={[styles.filterTab, filter === key && styles.filterTabActive]}
      onPress={() => setFilter(key)}
    >
      <Text style={[styles.filterTabText, filter === key && styles.filterTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItemRow = (item: PurchaseSummary['itemWiseSummary'][0]) => {
    const isMissing = item.difference > 0;
    const isNegative = item.difference < 0;

    return (
      <View key={item.itemName} style={styles.itemRow}>
        <View style={styles.itemNameCell}>
          <Text style={styles.itemName}>{item.itemName}</Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={styles.dataText}>
            {item.totalBought.toFixed(2)} {item.unit}
          </Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={styles.dataText}>
            {item.totalSold.toFixed(2)} {item.unit}
          </Text>
        </View>
        <View style={styles.dataCell}>
          <Text style={[styles.dataText, isMissing && styles.missingText, isNegative && styles.negativeText]}>
            {Math.abs(item.difference).toFixed(2)} {item.unit}
          </Text>
          {isMissing && <Ionicons name="warning" size={16} color={COLORS.danger} />}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const summary = data?.data;
  const isProfit = summary?.profitLoss && summary.profitLoss >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{text.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {renderFilterTab('all', text.all)}
          {renderFilterTab('week', text.week)}
          {renderFilterTab('month', text.month)}
          {renderFilterTab('custom', text.custom)}
        </View>

        {/* Profit/Loss Card */}
        {summary && (
          <View style={[styles.profitLossCard, isProfit ? styles.profitCard : styles.lossCard]}>
            <Text style={styles.profitLossLabel}>
              {isProfit ? text.profit : text.loss}
            </Text>
            <Text style={styles.profitLossAmount}>
              ₹{Math.abs(summary.profitLoss).toFixed(2)}
            </Text>
            <View style={styles.profitLossDetails}>
              <Text style={styles.profitLossDetail}>
                {language === 'hi' ? 'खरीदा' : 'Bought'}: ₹{summary.totalPurchaseCost.toFixed(2)}
              </Text>
              <Text style={styles.profitLossDetail}>
                {language === 'hi' ? 'बिका' : 'Sold'}: ₹{summary.totalSalesRevenue.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Item-wise Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>{text.item}</Text>
          <Text style={styles.tableHeaderText}>{text.bought}</Text>
          <Text style={styles.tableHeaderText}>{text.sold}</Text>
          <Text style={styles.tableHeaderText}>{text.difference}</Text>
        </View>

        {/* Item-wise Table */}
        {summary && summary.itemWiseSummary.length > 0 ? (
          summary.itemWiseSummary.map(renderItemRow)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{text.empty}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  profitLossCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profitCard: {
    backgroundColor: COLORS.success,
  },
  lossCard: {
    backgroundColor: COLORS.danger,
  },
  profitLossLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  profitLossAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 16,
  },
  profitLossDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitLossDetail: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  itemNameCell: {
    flex: 1.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dataCell: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dataText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  missingText: {
    color: COLORS.danger,
  },
  negativeText: {
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
