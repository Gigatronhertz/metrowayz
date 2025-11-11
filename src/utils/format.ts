export const formatCurrency = (amount: number): string => {
  // Format with explicit Naira symbol
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(startDate)
  
  const end = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(endDate)
  
  return `${start} - ${end}`
}

export const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return formatDate(date)
  }
}

/**
 * Format price unit for display with fallback
 * @param unit - The price unit (e.g., 'night', 'day', 'hour')
 * @param variant - Display variant: 'short' (e.g., '/night') or 'long' (e.g., 'per night')
 * @returns Formatted price unit string
 */
export const formatPriceUnit = (unit?: string, variant: 'short' | 'long' = 'long'): string => {
  const defaultUnit = 'day'
  const priceUnit = unit || defaultUnit

  return variant === 'short' ? `/${priceUnit}` : `per ${priceUnit}`
}

/**
 * Get plural form of price unit
 * @param unit - The price unit (e.g., 'night', 'day', 'hour')
 * @param count - Number of units
 * @returns Plural form of the unit
 */
export const getPluralPriceUnit = (unit?: string, count: number = 2): string => {
  const defaultUnit = 'day'
  const priceUnit = unit || defaultUnit

  // Handle special cases
  if (count === 1) return priceUnit

  // Most units just add 's'
  return `${priceUnit}s`
}