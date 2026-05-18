import { Linking, Alert } from 'react-native';

/**
 * WhatsApp payment reminder helper functions
 */

interface WhatsAppMessageParams {
  language: 'hi' | 'en';
  customerName: string;
  businessName: string;
  amount: number;
}

/**
 * Get WhatsApp payment reminder message based on language
 */
export function getWhatsAppMessage(params: WhatsAppMessageParams): string {
  const { language, customerName, businessName, amount } = params;
  
  if (language === 'hi') {
    return `नमस्ते ${customerName} जी! 🙏\n${businessName} की तरफ से याद दिला रहे हैं।\nआपका बाकी amount: ₹${amount}\nजल्दी payment करें। धन्यवाद! 🙏`;
  } else {
    return `Hello ${customerName}! 🙏\nReminder from ${businessName}.\nYour pending amount: ₹${amount}\nPlease pay soon. Thank you! 🙏`;
  }
}

/**
 * Open WhatsApp with payment reminder
 */
export function openWhatsAppReminder(phone: string, customerName: string, businessName: string, amount: number, language: 'hi' | 'en') {
  const message = getWhatsAppMessage({
    language,
    customerName,
    businessName,
    amount
  });
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?phone=91${phone}&text=${encodedMessage}`;
  const smsUrl = `sms:+91${phone}?body=${encodedMessage}`;

  const handleSmsFallback = () => {
    Linking.openURL(smsUrl).catch((smsError: any) => {
      console.error('SMS also failed:', smsError);
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Error',
        language === 'hi'
          ? 'WhatsApp या SMS नहीं खुला। कृपया जांचें कि ऐप इंस्टॉल है।'
          : 'Could not open WhatsApp or SMS. Please check if the app is installed.'
      );
    });
  };

  Linking.canOpenURL('whatsapp://send')
    .then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl).catch((error: any) => {
          console.error('WhatsApp failed to open:', error);
          handleSmsFallback();
        });
      } else {
        handleSmsFallback();
      }
    })
    .catch((err) => {
      console.error('canOpenURL failed:', err);
      handleSmsFallback();
    });
}

