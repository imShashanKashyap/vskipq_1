/**
 * Utility functions for WhatsApp interactions
 */

// Function to format phone number for WhatsApp
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If the number doesn't start with a '+', add one
  if (!phone.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  
  return digitsOnly;
}

// Function to generate WhatsApp deep link
export function getWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
