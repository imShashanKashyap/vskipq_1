/**
 * WhatsApp messaging utility for sending order notifications to customers
 * and verifying phone numbers via OTP
 */

// Cache OTP codes for phone verification
const otpCache = new Map<string, { code: string, expiresAt: Date }>();

// Function to send WhatsApp message
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // Get the WhatsApp API key from environment variable
    const whatsappApiKey = process.env.WHATSAPP_API_KEY || "";
    
    if (!whatsappApiKey) {
      console.log(`WhatsApp API key not provided. Would send message to ${phoneNumber}: ${message}`);
      return true; // Simulating success for development
    }
    
    // TODO: Implement actual WhatsApp API integration using Twilio, WhatsApp Business API, etc.
    // This would involve making an HTTP request to the WhatsApp API service
    
    // Format phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
    
    // For now, just log the message that would be sent
    console.log(`Sending WhatsApp message to ${formattedPhone}: ${message}`);
    
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
}

// Format phone number for WhatsApp (remove non-digits and ensure it starts with country code)
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // If number doesn't start with country code, assume it's a local number and add default country code
  if (!digits.startsWith('1') && digits.length === 10) {
    digits = '1' + digits; // Add US country code as default
  }
  
  return digits;
}

// Generate an OTP code for phone verification
export function generateOTP(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via WhatsApp
export async function sendOTPViaWhatsApp(phoneNumber: string): Promise<string> {
  // Generate a new OTP code
  const otpCode = generateOTP();
  
  // Set expiration (10 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  // Store OTP in cache
  otpCache.set(phoneNumber, { code: otpCode, expiresAt });
  
  // Send OTP via WhatsApp
  const message = `Your TableServe verification code is: ${otpCode}. This code will expire in 10 minutes.`;
  await sendWhatsAppMessage(phoneNumber, message);
  
  return otpCode;
}

// Verify OTP code
export function verifyOTP(phoneNumber: string, otpCode: string): boolean {
  const storedOTP = otpCache.get(phoneNumber);
  
  // Check if OTP exists and hasn't expired
  if (!storedOTP || new Date() > storedOTP.expiresAt) {
    return false;
  }
  
  // Check if OTP code matches
  if (storedOTP.code === otpCode) {
    // OTP verified, remove from cache
    otpCache.delete(phoneNumber);
    return true;
  }
  
  return false;
}
