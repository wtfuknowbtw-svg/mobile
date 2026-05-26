import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addWholesalePurchase, getWholesalePurchases } from '../api/wholesale';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function AddPurchaseScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const queryClient = useQueryClient();

  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [totalPrice, setTotalPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const units = ['kg', 'g', 'litre', 'ml', 'bag', 'carton', 'piece', 'dozen', 'quintal'];

  // Fetch recent purchases to build autocomplete suggestions
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: pastPurchasesResponse } = useQuery({
    queryKey: ['wholesalePurchases', currentMonth, currentYear],
    queryFn: () => getWholesalePurchases(currentMonth, currentYear),
    enabled: !!businessId,
  });

  const suggestions = useMemo(() => {
    if (!pastPurchasesResponse?.data) return [];
    const items = pastPurchasesResponse.data.map((p) => p.itemName);
    // Get unique and trim
    return Array.from(new Set(items)).map(name => name.trim());
  }, [pastPurchasesResponse]);

  const filteredSuggestions = useMemo(() => {
    if (!itemName) {
      // Show top 5 recent suggestions when empty
      return suggestions.slice(0, 5);
    }
    return suggestions.filter((s) =>
      s.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 5);
  }, [suggestions, itemName]);

  const mutation = useMutation({
    mutationFn: addWholesalePurchase,
    onSuccess: () => {
      // Invalidate both standard and month-filtered queries
      queryClient.invalidateQueries({ queryKey: ['wholesalePurchases'] });
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'खरीद जोड़ने में विफल' : 'Failed to add purchase'
      );
    },
  });

  const handleSave = () => {
    if (!itemName.trim()) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'आइटम नाम आवश्यक है' : 'Item name is required'
      );
      return;
    }

    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'मान्य मात्रा आवश्यक है' : 'Valid quantity is required'
      );
      return;
    }

    if (!totalPrice || isNaN(parseFloat(totalPrice)) || parseFloat(totalPrice) <= 0) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'कुल कीमत आवश्यक है' : 'Total price is required'
      );
      return;
    }

    mutation.mutate({
      itemName: itemName.trim(),
      quantity: parseFloat(quantity),
      unit: unit,
      totalPrice: parseFloat(totalPrice),
      supplierName: supplierName.trim() || undefined,
      purchaseDate: purchaseDate,
    });
  };

  const text = {
    title: language === 'hi' ? 'थोक खरीद जोड़ें' : 'Add Wholesale Purchase',
    itemName: language === 'hi' ? 'आइटम नाम (आवश्यक)' : 'Item Name (required)',
    itemPlaceholder: language === 'hi' ? 'जैसे: Basmati Rice' : 'e.g. Basmati Rice',
    quantity: language === 'hi' ? 'मात्रा (Quantity)' : 'Quantity',
    unit: language === 'hi' ? 'यूनिट (Unit)' : 'Unit',
    totalPrice: language === 'hi' ? 'कुल कीमत (₹)' : 'Total Price (₹)',
    pricePlaceholder: language === 'hi' ? 'भुगतान की गई राशि' : 'Total amount paid in ₹',
    supplierName: language === 'hi' ? 'सप्लायर का नाम (वैकल्पिक)' : 'Supplier Name (optional)',
    supplierPlaceholder: language === 'hi' ? 'जैसे: नागपुर होलसेल मार्केट' : 'e.g. Nagpur Wholesale Market',
    date: language === 'hi' ? 'तारीख' : 'Purchase Date',
    save: language === 'hi' ? 'सेव करें' : 'Save Purchase',
    suggestionsLabel: language === 'hi' ? 'हाल के आइटम्स:' : 'Recent Items:',
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{text.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Item Name Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="cube-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.itemName}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={text.itemPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={itemName}
            onChangeText={setItemName}
          />
        </View>

        {/* Autocomplete Suggestions */}
        {filteredSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>{text.suggestionsLabel}</Text>
            <View style={styles.chipsContainer}>
              {filteredSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.chip}
                  onPress={() => setItemName(suggestion)}
                >
                  <Text style={styles.chipText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="scale-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.quantity}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Unit Dropdown/Selector */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="options-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.unit}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.unitPickerScroll}
            contentContainerStyle={styles.unitPickerContent}
          >
            {units.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, unit === u ? styles.unitChipSelected : styles.unitChipUnselected]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitChipText, unit === u ? styles.unitChipTextSelected : styles.unitChipTextUnselected]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Total Price */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.totalPrice}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={text.pricePlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={totalPrice}
            onChangeText={setTotalPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Supplier Name */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="storefront-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.supplierName}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={text.supplierPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={supplierName}
            onChangeText={setSupplierName}
          />
        </View>

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.date}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>{text.save}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionsContainer: {
    marginTop: -10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  unitPickerScroll: {
    marginTop: 4,
  },
  unitPickerContent: {
    paddingVertical: 4,
    gap: 8,
  },
  unitChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitChipSelected: {
    backgroundColor: COLORS.primary,
  },
  unitChipUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  unitChipText: {
    fontWeight: '600',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  unitChipTextUnselected: {
    color: '#6B7280',
    fontSize: 13,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
