/**
 * ========================================
 * UTILS.TS - Utility Functions
 * ========================================
 * 
 * Common helper functions used throughout the app.
 * Keep this file focused on pure utility functions with no side effects.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS classes intelligently
 * 
 * @param inputs - Any number of class values (strings, objects, arrays)
 * @returns Merged className string with conflicts resolved
 * 
 * @example
 * cn("px-2 py-1", condition && "bg-blue-500", { "font-bold": isActive })
 * // Output: "px-2 py-1 bg-blue-500 font-bold" (if condition and isActive are true)
 * 
 * CODING TIP: This function is essential for conditional styling in React components.
 * It handles Tailwind conflicts intelligently (e.g., "px-2 px-4" becomes just "px-4")
 * 
 * USAGE PATTERN:
 * <div className={cn(
 *   "base-classes",           // Always applied
 *   condition && "extra-class", // Conditional
 *   { "active": isActive }     // Object syntax
 * )} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ADD YOUR CUSTOM UTILITY FUNCTIONS BELOW
 * 
 * Examples of useful utilities you might add:
 * - formatCurrency(amount: number): string
 * - formatDate(date: Date): string
 * - debounce(fn: Function, delay: number)
 * - generateId(): string
 */
