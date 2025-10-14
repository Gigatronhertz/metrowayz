import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './BookingCalendar.css'

interface BookingCalendarProps {
  serviceId: string
  bookedDates: string[]
  onDateSelect: (checkIn: string, checkOut: string) => void
  selectedCheckIn?: string
  selectedCheckOut?: string
  minNights?: number
  price?: number
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  serviceId,
  bookedDates,
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
  minNights = 1,
  price
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingCheckIn, setSelectingCheckIn] = useState(true)
  const [tempCheckIn, setTempCheckIn] = useState<string | null>(selectedCheckIn || null)
  const [tempCheckOut, setTempCheckOut] = useState<string | null>(selectedCheckOut || null)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []

    // Add empty cells for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  // Format date as YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Check if date is booked
  const isDateBooked = (dateStr: string) => {
    return bookedDates.includes(dateStr)
  }

  // Check if date is in the past
  const isDatePast = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Check if date is selected
  const isDateSelected = (dateStr: string) => {
    if (!tempCheckIn && !tempCheckOut) return false
    if (tempCheckIn === dateStr || tempCheckOut === dateStr) return true

    // Check if date is in range
    if (tempCheckIn && tempCheckOut) {
      const date = new Date(dateStr)
      const checkIn = new Date(tempCheckIn)
      const checkOut = new Date(tempCheckOut)
      return date > checkIn && date < checkOut
    }

    return false
  }

  // Handle date click
  const handleDateClick = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day)

    // Don't allow selecting past dates or booked dates
    if (isDatePast(year, month, day) || isDateBooked(dateStr)) {
      return
    }

    if (selectingCheckIn || !tempCheckIn) {
      // Selecting check-in date
      setTempCheckIn(dateStr)
      setTempCheckOut(null)
      setSelectingCheckIn(false)
    } else {
      // Selecting check-out date
      const checkInDate = new Date(tempCheckIn)
      const checkOutDate = new Date(dateStr)

      // Ensure check-out is after check-in
      if (checkOutDate <= checkInDate) {
        // Reset and start over
        setTempCheckIn(dateStr)
        setTempCheckOut(null)
        return
      }

      // Check if any dates in range are booked
      let hasBookedInRange = false
      let currentDate = new Date(checkInDate)
      currentDate.setDate(currentDate.getDate() + 1)

      while (currentDate <= checkOutDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        if (isDateBooked(dateStr)) {
          hasBookedInRange = true
          break
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (hasBookedInRange) {
        alert('Some dates in this range are already booked. Please select different dates.')
        setTempCheckIn(null)
        setTempCheckOut(null)
        setSelectingCheckIn(true)
        return
      }

      setTempCheckOut(dateStr)
      onDateSelect(tempCheckIn, dateStr)
      setSelectingCheckIn(true)
    }
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Calculate total nights and price
  const calculateNights = () => {
    if (!tempCheckIn || !tempCheckOut) return 0
    const checkIn = new Date(tempCheckIn)
    const checkOut = new Date(tempCheckOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const totalPrice = price ? nights * price : 0

  const days = getDaysInMonth(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  return (
    <div className="booking-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button
          onClick={previousMonth}
          className="calendar-nav-button"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="calendar-month-title">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="calendar-nav-button"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Instructions */}
      <div className="calendar-instructions">
        {selectingCheckIn || !tempCheckIn
          ? 'Select your check-in date'
          : 'Now select your check-out date'}
      </div>

      {/* Day Names */}
      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty" />
          }

          const dateStr = formatDate(year, month, day)
          const isBooked = isDateBooked(dateStr)
          const isPast = isDatePast(year, month, day)
          const isSelected = isDateSelected(dateStr)
          const isCheckIn = tempCheckIn === dateStr
          const isCheckOut = tempCheckOut === dateStr
          const isDisabled = isPast || isBooked

          return (
            <button
              key={day}
              onClick={() => !isDisabled && handleDateClick(year, month, day)}
              disabled={isDisabled}
              className={`
                calendar-day
                ${isDisabled ? 'disabled' : ''}
                ${isSelected ? 'selected' : ''}
                ${isCheckIn ? 'check-in' : ''}
                ${isCheckOut ? 'check-out' : ''}
                ${isBooked ? 'booked' : ''}
              `}
            >
              <span className="day-number">{day}</span>
            </button>
          )
        })}
      </div>

      {/* Selected Dates Summary */}
      {tempCheckIn && tempCheckOut && (
        <div className="calendar-summary">
          <div className="summary-dates">
            <div className="summary-item">
              <span className="summary-label">Check-in</span>
              <span className="summary-value">{new Date(tempCheckIn).toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Check-out</span>
              <span className="summary-value">{new Date(tempCheckOut).toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Nights</span>
              <span className="summary-value">{nights}</span>
            </div>
          </div>
          {price && (
            <div className="summary-total">
              <span>Total</span>
              <span className="summary-price">${totalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  )
}

export default BookingCalendar
