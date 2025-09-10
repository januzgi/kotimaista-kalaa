import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with conditional logic.
 * 
 * This function combines the power of `clsx` for conditional class names
 * and `twMerge` for intelligent Tailwind CSS class deduplication and conflict resolution.
 * 
 * @param inputs - Array of class values that can be strings, objects, arrays, or undefined
 * @returns A single string of merged and deduplicated CSS classes
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-2 py-1', 'bg-blue-500')
 * // Returns: "px-2 py-1 bg-blue-500"
 * 
 * // Conditional classes
 * cn('base-class', { 'active': isActive, 'disabled': isDisabled })
 * 
 * // Tailwind conflict resolution
 * cn('bg-red-500', 'bg-blue-500')
 * // Returns: "bg-blue-500" (later class wins)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
