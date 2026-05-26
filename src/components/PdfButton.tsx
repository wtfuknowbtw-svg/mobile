import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants';
import { getInvoicePdfUrl } from '../api/invoices';
import { useAppStore } from '../store/useAppStore';

interface PdfButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  actionType: 'download' | 'share';
  onPressComplete?: () => void;
}

export default function PdfButton({
  invoiceId,
  invoiceNumber,
  actionType,
  onPressComplete,
}: PdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const { token, language } = useAppStore();

  const handlePdfAction = async () => {
    setLoading(true);
    try {
      const filename = `invoice-${invoiceNumber.replace(/\//g, '-')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const url = getInvoicePdfUrl(invoiceId);

      // Download the PDF file using expo-file-system
      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error('Server failed to generate PDF');
      }

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (actionType === 'share') {
        if (isSharingAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Invoice ${invoiceNumber}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert(
            language === 'hi' ? 'साझाकरण अनुपलब्ध' : 'Sharing Unavailble',
            language === 'hi' ? 'इस डिवाइस पर साझा करना संभव नहीं है।' : 'Sharing is not supported on this platform.'
          );
        }
      } else {
        // Download / Save behavior
        if (Platform.OS === 'android') {
          // On Android, we can share to save or let the user choose a location
          if (isSharingAvailable) {
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Save Invoice ${invoiceNumber}`,
              UTI: 'com.adobe.pdf',
            });
          }
        } else {
          // On iOS, standard sharing provides 'Save to Files'
          if (isSharingAvailable) {
            await Sharing.shareAsync(downloadResult.uri);
          }
        }
        
        Alert.alert(
          language === 'hi' ? 'सफलता' : 'Success',
          language === 'hi' ? 'PDF सफलतापूर्वक तैयार किया गया।' : 'PDF generated successfully.'
        );
      }

      onPressComplete?.();
    } catch (error: any) {
      console.error('PDF Action Error:', error);
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi' ? 'PDF डाउनलोड/शेयर करने में विफल' : 'Failed to download or share invoice PDF'
      );
    } finally {
      setLoading(false);
    }
  };

  const isShare = actionType === 'share';
  const label = isShare 
    ? (language === 'hi' ? 'WhatsApp / शेयर करें' : 'Share Invoice')
    : (language === 'hi' ? 'PDF डाउनलोड करें' : 'Download PDF');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isShare ? styles.shareButton : styles.downloadButton,
        loading && styles.disabledButton
      ]}
      onPress={handlePdfAction}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons
            name={isShare ? 'share-social-outline' : 'download-outline'}
            size={18}
            color="#FFFFFF"
            style={styles.icon}
          />
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    height: 50,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
  },
  shareButton: {
    backgroundColor: '#FF6B00', // Saffron brand color
  },
  disabledButton: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
