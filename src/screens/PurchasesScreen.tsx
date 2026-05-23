import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchases, deletePurchase, Purchase } from '../api/purchases';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function PurchasesScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', businessId, filter],
    queryFn: () => getPurchases(filter),
    enabled: !!businessId,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete purchase');
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      language === 'hi' ? 'खरीद हटाएं?' : 'Delete Purchase?',
      language === 'hi' ? 'क्या आप इस खरीद को हटाना चाहते हैं?' : 'Are you sure you want to delete this purchase?',
      [
        { text: language === 'hi' ? 'नहीं' : 'Cancel', style: 'cancel' },
        {
          text: language === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const text = {
    title: language === 'hi' ? 'खरीद खाता' : 'Purchase Ledger',
    totalSpent: language === 'hi' ? 'इस महीने खरीदा' : 'Bought this month',
    add: language === 'hi' ? 'नई खरीद' : 'New Purchase',
    all: language === 'hi' ? 'सभी' : 'All',
    week: language === 'hi' ? 'सप्ताह' : 'Week',
    month: language === 'hi' ? 'महीना' : 'Month',
    custom: language === 'hi' ? 'कस्टम' : 'Custom',
    empty: language === 'hi' ? 'कोई खरीद नहीं' : 'No purchases',
    emptySubtext: language === 'hi' ? 'नीचे + से खरीद जोड़ें' : 'Add purchases using the + button',
  };

  const renderPurchaseCard = (purchase: Purchase) => {
    const itemInitial = purchase.itemName.charAt(0).toUpperCase();
    const formattedDate = new Date(purchase.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <TouchableOpacity
        key={purchase.id}
        style={styles.purchaseCard}
        onLongPress={() => handleDelete(purchase.id)}
      >
        <View style={styles.itemInitial}>
          <Text style={styles.itemInitialText}>{itemInitial}</Text>
        </View>

        <View style={styles.purchaseContent}>
          <Text style={styles.itemName}>{purchase.itemName}</Text>
          {purchase.supplierName && (
            <Text style={styles.supplierName}>{purchase.supplierName}</Text>
          )}
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={styles.purchaseRight}>
          <Text style={styles.totalCost}>₹{purchase.totalCost.toFixed(2)}</Text>
          <Text style={styles.quantity}>
            {purchase.quantity} {purchase.unit || ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{text.title}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPurchase')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Summary Card */}
          {data?.summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{text.totalSpent}</Text>
              <Text style={styles.summaryAmount}>₹{data.summary.totalSpend?.toFixed(2) || '0'}</Text>
              <View style={styles.summaryStats}>
                <Text style={styles.summaryStat}>
                  {data.summary.itemCount || 0} {language === 'hi' ? 'आइटम' : 'items'}
                </Text>
                <Text style={styles.summaryStat}>|</Text>
                <Text style={styles.summaryStat}>
                  {data.summary.supplierCount || 0} {language === 'hi' ? 'सप्लायर' : 'suppliers'}
                </Text>
              </View>
            </View>
          )}

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {renderFilterTab('all', text.all)}
            {renderFilterTab('week', text.week)}
            {renderFilterTab('month', text.month)}
            {renderFilterTab('custom', text.custom)}
          </View>

          {/* Purchase List */}
          {data?.data && data.data.length > 0 ? (
            data.data.map(renderPurchaseCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{text.empty}</Text>
              <Text style={styles.emptySubtext}>{text.emptySubtext}</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryStat: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
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
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInitialText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  purchaseContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  purchaseRight: {
    alignItems: 'flex-end',
  },
  totalCost: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
