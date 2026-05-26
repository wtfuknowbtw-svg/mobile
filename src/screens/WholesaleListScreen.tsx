import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWholesalePurchases, deleteWholesalePurchase } from '../api/wholesale';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';
import { formatCurrency } from '../utils/currency';
import OfflineBanner from '../components/OfflineBanner';

export default function WholesaleListScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const queryClient = useQueryClient();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed (Jan = 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Fetch Wholesale Purchases
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wholesalePurchases', selectedMonth, selectedYear],
    queryFn: () => getWholesalePurchases(selectedMonth, selectedYear),
    enabled: !!businessId,
  });

  const purchases = data?.data || [];
  const summary = data?.summary || { totalSpent: 0, totalItems: 0 };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWholesalePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesalePurchases'] });
    },
    onError: () => {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'खरीद हटाने में विफल' : 'Failed to delete purchase record'
      );
    },
  });

  const handleDelete = (id: string, itemName: string) => {
    Alert.alert(
      language === 'hi' ? 'खरीद हटाएं' : 'Delete Purchase',
      language === 'hi' 
        ? `क्या आप वाकई "${itemName}" की थोक खरीद हटाना चाहते हैं?` 
        : `Are you sure you want to delete the purchase for "${itemName}"?`,
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: language === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const months = language === 'hi'
    ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const currentMonthLabel = `${months[selectedMonth - 1]} ${selectedYear}`;

  const text = {
    title: language === 'hi' ? 'थोक खरीद बही' : 'Wholesale Purchases',
    totalSpent: language === 'hi' ? 'कुल खर्च:' : 'Total Spent:',
    itemsCount: language === 'hi' ? 'आइटम्स:' : 'items',
    emptyState: language === 'hi' ? 'इस महीने कोई थोक खरीद नहीं है।\nजोड़ने के लिए + दबाएं।' : 'No purchases this month.\nTap + to add one.',
    recentLabel: language === 'hi' ? 'हाल के सप्लायर्स और खरीद सूची' : 'Suppliers and purchase records',
    longPressTip: language === 'hi' ? '💡 हटाने के लिए कार्ड को दबाकर रखें' : '💡 Long press on a card to delete it',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{text.title}</Text>
          <Text style={styles.headerSubtitle}>{currentMonthLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => setShowMonthPicker(true)}
        >
          <Ionicons name="calendar" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary KPI Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>{text.totalSpent}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalSpent)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>{language === 'hi' ? 'कुल आइटम्स:' : 'Unique Items:'}</Text>
          <Text style={styles.summaryValue}>{summary.totalItems}</Text>
        </View>
      </View>

      {/* Purchases List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            purchases.length > 0 ? (
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>{text.recentLabel}</Text>
                <Text style={styles.listHeaderSubtitle}>{text.longPressTip}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={48} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>{text.emptyState}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.card}
              onLongPress={() => handleDelete(item.id, item.itemName)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.qtyText}>
                  {item.quantity} {item.unit}
                </Text>
                {item.supplierName ? (
                  <View style={styles.supplierRow}>
                    <Ionicons name="storefront-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.supplierText} numberOfLines={1}>
                      {item.supplierName}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.dateText}>{formatDate(item.purchaseDate)}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.priceText}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPurchase')}
      >
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>

      {/* Month Selector Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowMonthPicker(false)}
            style={{ flex: 1 }}
          />
          <View style={styles.monthPickerContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {language === 'hi' ? 'महीना चुनें' : 'Select Month'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              <View style={styles.monthsGrid}>
                {months.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      setSelectedMonth(idx + 1);
                      setShowMonthPicker(false);
                    }}
                    style={[
                      styles.monthBtn,
                      selectedMonth === idx + 1 && styles.activeMonthBtn,
                    ]}
                  >
                    <Text style={[
                      styles.monthBtnText,
                      selectedMonth === idx + 1 && styles.activeMonthBtnText,
                    ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.yearSelector}>
                <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
                  <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.yearText}>{selectedYear}</Text>
                <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)}>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listHeaderRow: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  supplierText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981', // green for positive/prominent spends
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  monthPickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E9ECEF',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  monthBtn: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeMonthBtn: {
    backgroundColor: COLORS.primary,
  },
  monthBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeMonthBtnText: {
    color: '#FFFFFF',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
    paddingVertical: 10,
  },
  yearText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
