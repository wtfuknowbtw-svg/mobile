import { Linking } from 'react-native';

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
  
  Linking.openURL(whatsappUrl).catch((error: any) => {
    console.error('WhatsApp not available, falling back to SMS:', error);
    // Fallback to SMS if WhatsApp is not available
    const smsUrl = `sms:${phone}?body=${encodedMessage}`;
    Linking.openURL(smsUrl).catch((smsError: any) => {
      console.error('SMS also failed:', smsError);
    });
  });
}
