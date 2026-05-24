import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { COLORS } from '../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUnitConversions,
  createUnitConversion,
  updateUnitConversion,
  deleteUnitConversion,
  UnitConversion,
} from '../api/unitConversions';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export default function UnitConversionsScreen({ navigation }: any) {
  const { language } = useAppStore();
  const queryClient = useQueryClient();

  // Form state
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [multiplier, setMultiplier] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch conversions
  const { data: conversions, isLoading } = useQuery({
    queryKey: ['unitConversions'],
    queryFn: getUnitConversions,
  });

  // Query Client invalidation helper
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['unitConversions'] });
    queryClient.invalidateQueries({ queryKey: ['purchasesSummary'] });
  };

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: createUnitConversion,
    onSuccess: () => {
      invalidateQueries();
      resetForm();
      setIsModalVisible(false);
      Alert.alert(
        language === 'hi' ? 'सफलता' : 'Success',
        language === 'hi' ? 'नया यूनिट कन्वर्शन जोड़ा गया!' : 'New unit conversion added!'
      );
    },
    onError: (error: any) => {
      const msg = error?.message || (language === 'hi' ? 'कन्वर्शन जोड़ने में त्रुटि' : 'Failed to add conversion');
      Alert.alert(language === 'hi' ? 'त्रुटि' : 'Error', msg);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { multiplier: number } }) =>
      updateUnitConversion(id, data),
    onSuccess: () => {
      invalidateQueries();
      resetForm();
      setIsModalVisible(false);
      Alert.alert(
        language === 'hi' ? 'सफलता' : 'Success',
        language === 'hi' ? 'कन्वर्शन अपडेट किया गया!' : 'Conversion updated!'
      );
    },
    onError: () => {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'कन्वर्शन अपडेट करने में विफल' : 'Failed to update conversion'
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUnitConversion,
    onSuccess: () => {
      invalidateQueries();
      Alert.alert(
        language === 'hi' ? 'सफलता' : 'Success',
        language === 'hi' ? 'कन्वर्शन हटा दिया गया!' : 'Conversion deleted!'
      );
    },
    onError: () => {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'कन्वर्शन हटाने में विफल' : 'Failed to delete conversion'
      );
    },
  });

  const resetForm = () => {
    setFromUnit('');
    setToUnit('');
    setMultiplier('');
    setEditingId(null);
  };

  const handleSave = () => {
    const multVal = parseFloat(multiplier);
    if (!fromUnit.trim() || !toUnit.trim() || isNaN(multVal) || multVal <= 0) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'कृपया सभी फ़ील्ड सही से भरें' : 'Please fill all fields correctly'
      );
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { multiplier: multVal } });
    } else {
      addMutation.mutate({
        fromUnit: fromUnit.toLowerCase().trim(),
        toUnit: toUnit.toLowerCase().trim(),
        multiplier: multVal,
      });
    }
  };

  const handleEdit = (uc: UnitConversion) => {
    setEditingId(uc.id);
    setFromUnit(uc.fromUnit);
    setToUnit(uc.toUnit);
    setMultiplier(uc.multiplier.toString());
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      language === 'hi' ? 'हटाएं' : 'Delete',
      language === 'hi' ? 'क्या आप इस कन्वर्शन को हटाना चाहते हैं?' : 'Are you sure you want to delete this conversion?',
      [
        { text: language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: language === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const handleAddPreset = (from: string, to: string, mult: number) => {
    // Check if preset already exists in list
    const exists = conversions?.data?.some(
      (c) => c.fromUnit === from.toLowerCase() && c.toUnit === to.toLowerCase()
    );

    if (exists) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'यह कन्वर्शन पहले से मौजूद है' : 'This conversion already exists'
      );
      return;
    }

    addMutation.mutate({
      fromUnit: from.toLowerCase(),
      toUnit: to.toLowerCase(),
      multiplier: mult,
    });
  };

  const presets = [
    { from: 'bag', to: 'kg', mult: 25, label: '1 bag = 25 kg' },
    { from: 'quintal', to: 'kg', mult: 100, label: '1 quintal = 100 kg' },
    { from: 'dozen', to: 'pieces', mult: 12, label: '1 dozen = 12 pieces' },
    { from: 'litre', to: 'ml', mult: 1000, label: '1 litre = 1000 ml' },
  ];

  const text = {
    title: language === 'hi' ? 'यूनिट कन्वर्शन' : 'Unit Conversions',
    subtitle: language === 'hi' ? 'बताएं 1 बैग = कितना kg?' : 'Define: 1 bag = how many kg?',
    infoTitle: language === 'hi' ? 'स्मार्ट स्टॉक ट्रैकर' : 'Smart Stock Tracker',
    infoDesc:
      language === 'hi'
        ? 'यह बताएं कि आपकी खरीद की यूनिट और बिक्री की यूनिट में क्या संबंध है। जैसे: 1 बैग = 25 kg'
        : 'Define the relationship between your purchase and sales units. e.g. 1 bag = 25 kg',
    presetsTitle: language === 'hi' ? 'सामान्य प्रीसेट्स' : 'Common Presets',
    listTitle: language === 'hi' ? 'आपके सेव किये गए नियम' : 'Your Saved Rules',
    addNewBtn: language === 'hi' ? '+ नया कन्वर्शन जोड़ें' : '+ Add New Conversion',
    addModalTitle: language === 'hi' ? 'नया यूनिट नियम' : 'New Unit Rule',
    editModalTitle: language === 'hi' ? 'यूनिट नियम बदलें' : 'Edit Unit Rule',
    fromUnitLabel: language === 'hi' ? 'से यूनिट (From Unit)' : 'From Unit (e.g. bag)',
    toUnitLabel: language === 'hi' ? 'को यूनिट (To Unit)' : 'To Unit (e.g. kg)',
    multiplierLabel: language === 'hi' ? 'कितना होता है (Multiplier)' : 'Multiplier (e.g. 25)',
    saveBtn: language === 'hi' ? 'सेव करें' : 'Save',
    cancelBtn: language === 'hi' ? 'रद्द करें' : 'Cancel',
    emptyList: language === 'hi' ? 'कोई कन्वर्शन नियम सेट नहीं है' : 'No conversion rules set yet',
    previewLabel: language === 'hi' ? 'पूर्वावलोकन:' : 'Preview:',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{text.title}</Text>
          <Text style={styles.headerSubtitle}>{text.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBg}>
            <Ionicons name="information-circle" size={24} color="#1A3C6E" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{text.infoTitle}</Text>
            <Text style={styles.infoDesc}>{text.infoDesc}</Text>
          </View>
        </View>

        {/* Common Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.presetsTitle}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {presets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetChip}
                onPress={() => handleAddPreset(preset.from, preset.to, preset.mult)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#F5A623" style={styles.presetChipIcon} />
                <Text style={styles.presetChipText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Conversions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.listTitle}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1A3C6E" style={{ marginTop: 20 }} />
          ) : conversions?.data && conversions.data.length > 0 ? (
            conversions.data.map((uc) => (
              <View key={uc.id} style={styles.conversionCard}>
                <View style={styles.conversionDetails}>
                  <Text style={styles.conversionText}>
                    1 <Text style={styles.highlightText}>{uc.fromUnit}</Text> = {uc.multiplier}{' '}
                    <Text style={styles.highlightText}>{uc.toUnit}</Text>
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleEdit(uc)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#1A3C6E" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(uc.id)} style={[styles.iconBtn, styles.deleteBtn]}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="options-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>{text.emptyList}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>{text.addNewBtn}</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal Form */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? text.editModalTitle : text.addModalTitle}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#1D2939" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent}>
              {/* From Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{text.fromUnitLabel}</Text>
                <TextInput
                  style={[styles.input, editingId ? styles.disabledInput : {}]}
                  placeholder="e.g. bag, box, quintal"
                  value={fromUnit}
                  onChangeText={setFromUnit}
                  editable={!editingId}
                  autoCapitalize="none"
                />
              </View>

              {/* Multiplier */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{text.multiplierLabel}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 25, 100, 10"
                  value={multiplier}
                  onChangeText={setMultiplier}
                  keyboardType="numeric"
                />
              </View>

              {/* To Unit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{text.toUnitLabel}</Text>
                <TextInput
                  style={[styles.input, editingId ? styles.disabledInput : {}]}
                  placeholder="e.g. kg, pieces, litre"
                  value={toUnit}
                  onChangeText={setToUnit}
                  editable={!editingId}
                  autoCapitalize="none"
                />
              </View>

              {/* Real-time Preview */}
              {fromUnit.trim() && toUnit.trim() && multiplier.trim() && !isNaN(parseFloat(multiplier)) ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>{text.previewLabel}</Text>
                  <Text style={styles.previewText}>
                    1 <Text style={styles.previewHighlight}>{fromUnit.toLowerCase()}</Text> = {parseFloat(multiplier)}{' '}
                    <Text style={styles.previewHighlight}>{toUnit.toLowerCase()}</Text>
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>{text.cancelBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalSaveBtn]}
                  onPress={handleSave}
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  {addMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>{text.saveBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 24,
  },
  infoIconBg: {
    backgroundColor: '#DBEAFE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3C6E',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 4,
  },
  presetsContainer: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 12,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  presetChipIcon: {
    marginRight: 6,
  },
  presetChipText: {
    color: '#1A3C6E',
    fontWeight: '700',
    fontSize: 13,
  },
  conversionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  conversionDetails: {
    flex: 1,
  },
  conversionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3C6E',
  },
  highlightText: {
    color: '#F5A623',
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addButton: {
    backgroundColor: '#1A3C6E',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A3C6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3C6E',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalForm: {
    marginTop: 16,
  },
  modalFormContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1D2939',
  },
  disabledInput: {
    backgroundColor: '#F2F4F7',
    color: '#667085',
  },
  previewCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
  },
  previewHighlight: {
    color: '#D97706',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  modalCancelBtnText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSaveBtn: {
    backgroundColor: '#1A3C6E',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
