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
    supplierName: language === 'hi' ? '🏪 सप्लायर नाम (वैकल्पिक)' : '🏪 Supplier Name (optional)',
    supplierPlaceholder: language === 'hi' ? 'जैसे: Sharma Wholesale' : 'e.g. Sharma Wholesale',
    itemName: language === 'hi' ? '📦 आइटम नाम (आवश्यक)' : '📦 Item Name (required)',
    itemPlaceholder: language === 'hi' ? 'जैसे: Basmati Rice' : 'e.g. Basmati Rice',
    quantity: language === 'hi' ? '⚖️ मात्रा' : '⚖️ Quantity',
    costPrice: language === 'hi' ? '💰 प्रति यूनिट कीमत' : '💰 Cost per unit',
    totalCost: language === 'hi' ? '💵 कुल लागत' : '💵 Total Cost',
    date: language === 'hi' ? '📅 तारीख' : '📅 Date',
    notes: language === 'hi' ? '📝 नोट्स (वैकल्पिक)' : '📝 Notes (optional)',
    totalCostLabel: language === 'hi' ? 'कुल लागत: ₹' : 'Total Cost: ₹',
    save: language === 'hi' ? 'सेव करें' : 'Save',
  };

  const renderUnitPicker = () => (
    <View style={styles.unitPicker}>
      {units.map((u) => (
        <TouchableOpacity
          key={u}
          style={[styles.unitOption, unit === u && styles.unitOptionActive]}
          onPress={() => setUnit(u)}
        >
          <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextActive]}>
            {u}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
          <Text style={styles.label}>{text.supplierName}</Text>
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
          <Text style={styles.label}>{text.itemName}</Text>
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
          <Text style={styles.label}>{text.quantity}</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
            {renderUnitPicker()}
          </View>
        </View>

        {/* Cost Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{text.costPrice}</Text>
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
          <Text style={styles.label}>{text.totalCost}</Text>
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
          <Text style={styles.label}>{text.date}</Text>
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
          <Text style={styles.label}>{text.notes}</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  unitPicker: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  unitOptionTextActive: {
    color: COLORS.white,
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
