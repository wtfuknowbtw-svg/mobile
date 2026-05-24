import React, { useState, useEffect } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchase } from '../api/purchases';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

export default function AddPurchaseScreen({ navigation }: any) {
  const { businessId, language } = useAppStore();
  const queryClient = useQueryClient();

  const [supplierName, setSupplierName] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [costPrice, setCostPrice] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const units = ['kg', 'g', 'litre', 'pieces', 'bags', 'boxes'];

  // Auto-calculate total cost when quantity or cost price changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(costPrice) || 0;
    const total = qty * price;
    if (total > 0) {
      setTotalCost(total.toString());
    }
  }, [quantity, costPrice]);

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigation.goBack();
    },
    onError: (error) => {
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

    if (!quantity || !costPrice || !totalCost) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'मात्रा और कीमत आवश्यक है' : 'Quantity and price are required'
      );
      return;
    }

    mutation.mutate({
      supplierName: supplierName.trim() || undefined,
      itemName: itemName.trim(),
      quantity: parseFloat(quantity),
      unit: unit,
      costPrice: parseFloat(costPrice),
      totalCost: parseFloat(totalCost),
      date: date,
      notes: notes.trim() || undefined,
    });
  };

  const text = {
    title: language === 'hi' ? 'नई खरीद' : 'New Purchase',
    supplierName: language === 'hi' ? 'सप्लायर नाम (वैकल्पिक)' : 'Supplier Name (optional)',
    supplierPlaceholder: language === 'hi' ? 'जैसे: Sharma Wholesale' : 'e.g. Sharma Wholesale',
    itemName: language === 'hi' ? 'आइटम नाम (आवश्यक)' : 'Item Name (required)',
    itemPlaceholder: language === 'hi' ? 'जैसे: Basmati Rice' : 'e.g. Basmati Rice',
    quantity: language === 'hi' ? 'मात्रा' : 'Quantity',
    costPrice: language === 'hi' ? 'प्रति यूनिट कीमत' : 'Cost per unit',
    totalCost: language === 'hi' ? 'कुल लागत' : 'Total Cost',
    date: language === 'hi' ? 'तारीख' : 'Date',
    notes: language === 'hi' ? 'नोट्स (वैकल्पिक)' : 'Notes (optional)',
    totalCostLabel: language === 'hi' ? 'कुल लागत: ₹' : 'Total Cost: ₹',
    save: language === 'hi' ? 'सेव करें' : 'Save',
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{text.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
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

        {/* Item Name */}
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

        {/* Quantity + Unit */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="scale-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.quantity}</Text>
          </View>
          <View style={styles.quantityInputRow}>
            <TextInput
              style={[styles.input, styles.quantityInput, { flex: 1 }]}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            {unit ? (
              <View style={styles.unitSuffixContainer}>
                <Text style={styles.unitSuffixText}>{unit}</Text>
              </View>
            ) : null}
          </View>
          
          <Text style={styles.quantityPreviewText}>
            {quantity || '0'} {unit}
          </Text>

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

        {/* Cost Price */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.costPrice}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={costPrice}
            onChangeText={setCostPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Total Cost */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="wallet-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.totalCost}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            value={totalCost}
            onChangeText={setTotalCost}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.date}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.primary} style={styles.labelIcon} />
            <Text style={styles.label}>{text.notes}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={language === 'hi' ? 'वैकल्पिक नोट्स' : 'Optional notes'}
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Total Cost Display */}
        <View style={styles.totalCostDisplay}>
          <Text style={styles.totalCostLabel}>
            {text.totalCostLabel}{totalCost || '0'}
          </Text>
        </View>
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
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  quantityInput: {
    height: 56,
    fontSize: 18,
    paddingRight: 60,
  },
  unitSuffixContainer: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitSuffixText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3C6E',
  },
  quantityPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitChipSelected: {
    backgroundColor: '#1A3C6E',
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
    fontSize: 16,
  },
  unitChipTextUnselected: {
    color: '#6B7280',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalCostDisplay: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalCostLabel: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
