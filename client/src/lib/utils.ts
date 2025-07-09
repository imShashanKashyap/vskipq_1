import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CartItem } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the total price of items in the cart
 * @param items Cart items array
 * @returns Total price in cents
 */
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}
