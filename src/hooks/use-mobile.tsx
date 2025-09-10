import * as React from "react"

/**
 * Custom hook for detecting mobile screen sizes using a responsive breakpoint.
 * 
 * Features:
 * - Uses 768px as the mobile breakpoint (matches Tailwind's md breakpoint)
 * - Updates state on window resize events
 * - Returns boolean indicating if screen is mobile-sized
 * - Handles initial undefined state during SSR
 * - Proper cleanup of event listeners
 * 
 * Useful for conditional rendering based on screen size or implementing
 * mobile-specific behaviors in React components.
 * 
 * @returns Boolean indicating if the current screen size is mobile (< 768px)
 */
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
