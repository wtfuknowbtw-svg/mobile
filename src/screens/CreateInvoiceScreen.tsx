import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '../constants';
import { createInvoice } from '../api/invoices';
import { getWholesalePurchases } from '../api/wholesale';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/currency';
import InvoiceItemRow from '../components/InvoiceItemRow';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getInvoicePdfUrl } from '../api/invoices';

const UNITS = ['kg', 'g', 'litre', 'ml', 'bag', 'carton', 'piece', 'dozen', 'quintal'];
const GST_RATES = [0, 5, 12, 18];

interface ItemInput {
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export default function CreateInvoiceScreen({ navigation }: any) {
  const { businessId, language, token } = useAppStore();
  const queryClient = useQueryClient();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<ItemInput[]>([]);
  const [gstRate, setGstRate] = useState(0);
  const [notes, setNotes] = useState('');

  // Add Item Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('piece');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch Wholesale Purchases for autocomplete
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: wholesaleData } = useQuery({
    queryKey: ['wholesalePurchases', currentMonth, currentYear],
    queryFn: () => getWholesalePurchases(currentMonth, currentYear),
    enabled: !!businessId,
  });

  const wholesaleItems = wholesaleData?.data || [];
  const uniqueItemNames = Array.from(new Set(wholesaleItems.map((p) => p.itemName)));

  // Filtered suggestions
  const filteredSuggestions = uniqueItemNames.filter((name) =>
    name.toLowerCase().includes(newItemName.toLowerCase())
  );

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = (subtotal * gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  // Add Item handler
  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', language === 'hi' ? 'नाम आवश्यक है' : 'Item name is required');
      return;
    }
    const qty = parseFloat(newItemQty);
    const price = parseFloat(newItemPrice);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', language === 'hi' ? 'मात्रा अमान्य है' : 'Invalid quantity');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', language === 'hi' ? 'दर अमान्य है' : 'Invalid price per unit');
      return;
    }

    const newItem: ItemInput = {
      itemName: newItemName.trim(),
      quantity: qty,
      unit: newItemUnit,
      pricePerUnit: price,
      totalPrice: qty * price,
    };

    setItems([...items, newItem]);
    
    // Reset modal fields
    setNewItemName('');
    setNewItemQty('');
    setNewItemPrice('');
    setNewItemUnit('piece');
    setModalVisible(false);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      return response.data;
    },
  });

  // Save handler
  const handleSave = async (shareAfterSave = false) => {
    if (!customerName.trim()) {
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', language === 'hi' ? 'ग्राहक का नाम आवश्यक है' : 'Customer name is required');
      return;
    }
    if (items.length === 0) {
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', language === 'hi' ? 'कम से कम एक सामान जोड़ें' : 'Please add at least one item');
      return;
    }

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        items: items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
        })),
        gstRate,
        notes: notes.trim() || null,
      };

      const result = await createMutation.mutateAsync(payload);

      if (result && result.data) {
        const invoice = result.data;
        if (shareAfterSave) {
          // Trigger direct share of invoice
          try {
            const filename = `invoice-${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;
            const url = getInvoicePdfUrl(invoice.id);
            
            const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
              headers: { Authorization: token ? `Bearer ${token}` : '' }
            });

            if (downloadResult.status === 200 && await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloadResult.uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Share Invoice ${invoice.invoiceNumber}`,
                UTI: 'com.adobe.pdf'
              });
            }
          } catch (shareErr) {
            console.error('Failed sharing after save:', shareErr);
          }
        }
        navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'इनवॉइस बनाने में विफल' : 'Failed to create invoice'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'hi' ? 'नया इनवॉइस' : 'New Invoice'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Customer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'hi' ? 'ग्राहक का विवरण' : 'Customer Details'}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{language === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}</Text>
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Ramesh Kumar"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{language === 'hi' ? 'फोन नंबर (वैकल्पिक)' : 'Phone Number (Optional)'}</Text>
              <TextInput
                style={styles.textInput}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="numeric"
                placeholder="9876543210"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{language === 'hi' ? 'पता (वैकल्पिक)' : 'Address (Optional)'}</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                multiline
                placeholder="Sector 15, Dwarka"
              />
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'सामान की सूची' : 'Items'}
              </Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>
                  {language === 'hi' ? 'जोड़ें' : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>
                  {language === 'hi' ? 'कोई सामान नहीं जोड़ा गया।\nसामान जोड़ने के लिए ऊपर बटन दबाएं।' : 'No items added yet. Click Add Item to begin.'}
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item, idx) => (
                  <InvoiceItemRow
                    key={idx}
                    itemName={item.itemName}
                    quantity={item.quantity}
                    unit={item.unit}
                    pricePerUnit={item.pricePerUnit}
                    totalPrice={item.totalPrice}
                    showDelete
                    onDelete={() => handleRemoveItem(idx)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Tax & GST Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'टैक्स एवं जीएसटी' : 'Tax & GST'}</Text>
            <Text style={styles.inputLabel}>{language === 'hi' ? 'जीएसटी दर (%)' : 'GST Rate (%)'}</Text>
            <View style={styles.gstGrid}>
              {GST_RATES.map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.gstBtn, gstRate === rate && styles.activeGstBtn]}
                  onPress={() => setGstRate(rate)}
                >
                  <Text style={[styles.gstBtnText, gstRate === rate && styles.activeGstBtnText]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'अतिरिक्त टिप्पणी' : 'Optional Notes'}</Text>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Payment due in 7 days"
            />
          </View>

          {/* Summary totals */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{language === 'hi' ? 'उप-योग:' : 'Subtotal:'}</Text>
              <Text style={styles.summaryVal}>{formatCurrency(subtotal)}</Text>
            </View>
            {gstRate > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST ({gstRate}%):</Text>
                <Text style={styles.summaryVal}>{formatCurrency(gstAmount)}</Text>
              </View>
            )}
            <View style={styles.separator} />
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>{language === 'hi' ? 'कुल योग:' : 'Total Amount:'}</Text>
              <Text style={styles.grandTotalVal}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(false)}>
            <Text style={styles.saveBtnText}>
              {language === 'hi' ? 'इनवॉइस सहेजें' : 'Save Invoice'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={() => handleSave(true)}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>
              {language === 'hi' ? 'सहेजें और शेयर करें' : 'Save & Share'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Item Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {language === 'hi' ? 'नया सामान जोड़ें' : 'Add New Item'}
              </Text>

              {/* Item Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{language === 'hi' ? 'सामान का नाम *' : 'Item Name *'}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItemName}
                  onChangeText={(val) => {
                    setNewItemName(val);
                    setShowSuggestions(val.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. Rice, Sugar"
                />
                
                {/* Autocomplete suggestions */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <FlatList
                      data={filteredSuggestions}
                      keyExtractor={(item) => item}
                      keyboardShouldPersistTaps="always"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={() => {
                            setNewItemName(item);
                            setShowSuggestions(false);
                          }}
                        >
                          <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              {/* Qty & Unit Input */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>{language === 'hi' ? 'मात्रा *' : 'Quantity *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newItemQty}
                    onChangeText={setNewItemQty}
                    keyboardType="numeric"
                    placeholder="10"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{language === 'hi' ? 'यूनिट *' : 'Unit *'}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.unitScroll}
                  >
                    {UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitBtn, newItemUnit === unit && styles.activeUnitBtn]}
                        onPress={() => setNewItemUnit(unit)}
                      >
                        <Text style={[styles.unitBtnText, newItemUnit === unit && styles.activeUnitBtnText]}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Price Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{language === 'hi' ? 'दर प्रति यूनिट (₹) *' : 'Price per Unit (₹) *'}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="numeric"
                  placeholder="50"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddItem}>
                  <Text style={styles.modalAddBtnText}>{language === 'hi' ? 'जोड़ें' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#F8F9FA',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyItems: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  itemsList: {
    marginTop: 8,
  },
  gstGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gstBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F8F9FA',
  },
  activeGstBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gstBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeGstBtnText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
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
    fontSize: 20,
    color: '#FF6B00',
    fontWeight: '900',
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
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  shareBtn: {
    flex: 1.2,
    backgroundColor: '#FF6B00', // Saffron brand color
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    flexDirection: 'row',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  unitScroll: {
    paddingVertical: 4,
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginRight: 6,
  },
  activeUnitBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeUnitBtnText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  modalAddBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 999,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
