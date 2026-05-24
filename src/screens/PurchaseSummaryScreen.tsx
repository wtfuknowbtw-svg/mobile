import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery } from '@tanstack/react-query';
import { getPurchasesSummary, PurchaseSummary } from '../api/purchases';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export default function PurchaseSummaryScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const [filter, setFilter] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['purchasesSummary', businessId, filter],
    queryFn: () => getPurchasesSummary(filter),
    enabled: !!businessId,
  });

  const text = {
    title: language === 'hi' ? 'स्टॉक ट्रैकर' : 'Stock Tracker',
    unitSettings: language === 'hi' ? 'यूनिट सेटिंग →' : 'Unit Settings →',
    totalBought: language === 'hi' ? 'कुल खरीदा' : 'Total Bought',
    totalSold: language === 'hi' ? 'कुल बिका' : 'Total Sold',
    netProfit: language === 'hi' ? 'कुल लाभ' : 'Net Profit',
    netLoss: language === 'hi' ? 'कुल हानि' : 'Net Loss',
    all: language === 'hi' ? 'सभी' : 'All',
    week: language === 'hi' ? 'सप्ताह' : 'Week',
    month: language === 'hi' ? 'महीना' : 'Month',
    custom: language === 'hi' ? 'कस्टम' : 'Custom',
    empty: language === 'hi' ? 'कोई स्टॉक डेटा उपलब्ध नहीं है' : 'No stock data available',
    bought: language === 'hi' ? 'खरीदा:' : 'Bought:',
    sold: language === 'hi' ? 'बिका:' : 'Sold:',
    remaining: language === 'hi' ? 'बचा हुआ:' : 'Remaining:',
    missing: language === 'hi' ? 'गायब:' : 'Missing:',
    unitMismatchWarning:
      language === 'hi' ? '⚠️ यूनिट कन्वर्शन सेट करें' : '⚠️ Set Unit Conversion',
    conversionText: language === 'hi' ? 'कन्वर्शन नियम:' : 'Conversion:',
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

  const summary = data?.data;
  const isProfit = summary?.profitLoss && summary.profitLoss >= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{text.title}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('UnitConversions')}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsBtnText}>{text.unitSettings}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {renderFilterTab('all', text.all)}
          {renderFilterTab('week', text.week)}
          {renderFilterTab('month', text.month)}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A3C6E" />
          </View>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              {/* Total Bought Card */}
              <View style={[styles.summaryCard, styles.boughtCard]}>
                <Ionicons name="cart-outline" size={20} color="#1A3C6E" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>{text.totalBought}</Text>
                <Text style={styles.cardAmount}>₹{summary.totalPurchaseCost.toFixed(2)}</Text>
              </View>

              {/* Total Sold Card */}
              <View style={[styles.summaryCard, styles.soldCard]}>
                <Ionicons name="cash-outline" size={20} color="#10B981" style={styles.cardIcon} />
                <Text style={styles.cardLabel}>{text.totalSold}</Text>
                <Text style={styles.cardAmount}>₹{summary.totalSalesRevenue.toFixed(2)}</Text>
              </View>
            </View>

            {/* Net Profit/Loss Card */}
            <View
              style={[
                styles.netCard,
                isProfit ? styles.netProfitBg : styles.netLossBg,
              ]}
            >
              <View style={styles.netInfo}>
                <Text style={styles.netLabel}>{isProfit ? text.netProfit : text.netLoss}</Text>
                <Text style={styles.netAmount}>
                  ₹{Math.abs(summary.profitLoss).toFixed(2)}
                </Text>
              </View>
              <View style={styles.netIconBg}>
                <Ionicons
                  name={isProfit ? 'trending-up' : 'trending-down'}
                  size={28}
                  color={isProfit ? '#10B981' : '#EF4444'}
                />
              </View>
            </View>

            {/* Item Wise List */}
            <Text style={styles.sectionTitle}>
              {language === 'hi' ? 'आइटम अनुसार ट्रैकिंग' : 'Item-wise Tracking'}
            </Text>

            {summary.itemWiseTracking && summary.itemWiseTracking.length > 0 ? (
              summary.itemWiseTracking.map((item: any) => {
                const hasMismatch = item.unitMismatch;
                const isItemMissing = item.isMissing;
                const hasConversion = !!item.conversionUsed;

                return (
                  <View key={item.itemName} style={styles.itemCard}>
                    {/* Item Name */}
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                      {hasMismatch && (
                        <TouchableOpacity
                          style={styles.mismatchBadge}
                          onPress={() => navigation.navigate('UnitConversions')}
                        >
                          <Text style={styles.mismatchText}>{text.unitMismatchWarning}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Bought and Sold row */}
                    <View style={styles.itemDetails}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>{text.bought}</Text>
                        <Text style={styles.detailValue}>
                          {item.purchased.quantity} {item.purchased.unit || 'unit'}
                        </Text>
                        {hasConversion && (
                          <Text style={styles.convertedSub}>
                            (= {item.purchased.convertedQuantity.toFixed(1)} {item.purchased.convertedUnit})
                          </Text>
                        )}
                      </View>

                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>{text.sold}</Text>
                        <Text style={styles.detailValue}>
                          {item.sold.quantity} {item.sold.unit || 'unit'}
                        </Text>
                      </View>
                    </View>

                    {/* Remaining & Missing */}
                    <View style={styles.itemFooter}>
                      {!hasMismatch ? (
                        <View style={styles.footerRow}>
                          <Text style={styles.footerLabel}>{text.remaining}</Text>
                          <Text
                            style={[
                              styles.footerValue,
                              item.remaining >= 0 ? styles.positiveText : styles.negativeText,
                            ]}
                          >
                            {item.remaining.toFixed(2)} {item.remainingUnit}
                          </Text>
                        </View>
                      ) : null}

                      {isItemMissing && (
                        <View style={styles.missingRow}>
                          <Text style={styles.missingLabel}>{text.missing}</Text>
                          <Text style={styles.missingValue}>
                            ⚠️ {item.missingQuantity.toFixed(2)} {item.remainingUnit}
                          </Text>
                        </View>
                      )}

                      {hasConversion && (
                        <View style={styles.conversionRow}>
                          <Ionicons name="swap-horizontal" size={12} color="#6B7280" />
                          <Text style={styles.conversionInfo}>
                            {item.conversionUsed}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : summary.itemWiseSummary && summary.itemWiseSummary.length > 0 ? (
              // Fallback to legacy structure if itemWiseTracking is empty or missing
              summary.itemWiseSummary.map((item: any) => {
                const isMissing = item.difference > 0;
                return (
                  <View key={item.itemName} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.itemName}</Text>
                    </View>
                    <View style={styles.itemDetails}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>{text.bought}</Text>
                        <Text style={styles.detailValue}>
                          {item.totalBought} {item.unit || 'unit'}
                        </Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>{text.sold}</Text>
                        <Text style={styles.detailValue}>
                          {item.totalSold} {item.unit || 'unit'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemFooter}>
                      <View style={styles.footerRow}>
                        <Text style={styles.footerLabel}>{text.remaining}</Text>
                        <Text
                          style={[
                            styles.footerValue,
                            item.difference >= 0 ? styles.positiveText : styles.negativeText,
                          ]}
                        >
                          {item.difference} {item.unit || 'unit'}
                        </Text>
                      </View>
                      {isMissing && (
                        <View style={styles.missingRow}>
                          <Text style={styles.missingLabel}>{text.missing}</Text>
                          <Text style={styles.missingValue}>
                            ⚠️ {item.difference} {item.unit || 'unit'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>{text.empty}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1A3C6E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  settingsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5A623',
  },
  settingsBtnText: {
    color: '#1A3C6E',
    fontWeight: '800',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#1A3C6E',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  boughtCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  soldCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  netCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  netProfitBg: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  netLossBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  netInfo: {
    flex: 1,
  },
  netLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2,
  },
  netIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    paddingLeft: 2,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  mismatchBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mismatchText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '800',
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  convertedSub: {
    fontSize: 11,
    color: '#F5A623',
    fontWeight: '700',
    marginTop: 2,
  },
  itemFooter: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  positiveText: {
    color: '#10B981',
  },
  negativeText: {
    color: '#EF4444',
  },
  missingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  missingLabel: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '800',
  },
  missingValue: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '800',
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conversionInfo: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },
});
