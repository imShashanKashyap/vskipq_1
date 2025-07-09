/**
 * QR Code generator utility for restaurant table QR codes
 * Supports multiple restaurants with unique identifiers
 */

/**
 * Generate a QR code URL for a specific restaurant table
 * 
 * @param tableNumber - The table number in the restaurant
 * @param restaurantId - Optional restaurant identifier (for multi-restaurant support)
 * @returns Promise<string> - URL to be encoded as QR code
 */
export async function generateQrCodeUrl(tableNumber: number, restaurantId?: string): Promise<string> {
  try {
    // In a real implementation, this would generate an actual QR code image
    // or a data URL. For simplicity, we're just returning a string that
    // can be used with a client-side QR code generator.
    
    // Get the base URL for the application from environment variable or use a default
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // Generate the URL that the QR code will point to, including restaurant ID if provided
    let targetUrl = `${baseUrl}/menu?table=${tableNumber}`;
    
    // Add restaurant ID to URL if provided (for multi-restaurant support)
    if (restaurantId) {
      targetUrl += `&restaurant=${restaurantId}`;
    }
    
    // Return the URL as a string - the frontend will generate the actual QR code
    return targetUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
