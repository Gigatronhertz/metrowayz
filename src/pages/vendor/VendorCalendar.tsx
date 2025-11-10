import { useQuery } from '@tanstack/react-query';
import VendorLayout from '../../components/vendor/VendorLayout';
import vendorApi from '../../services/vendor/vendorApi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const VendorCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ['vendor-calendar'],
    queryFn: vendorApi.booking.getProviderCalendar,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDate = (date: Date) => {
    if (!calendarData?.bookings) return [];
    return calendarData.bookings.filter((booking: any) => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      return date >= checkIn && date <= checkOut;
    });
  };

  const previousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar View</h1>
          <p className="text-gray-500 mt-1">View all your bookings in calendar format</p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {daysInMonth.map(day => {
              const bookings = getBookingsForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`min-h-24 p-2 border rounded-lg ${
                    !isSameMonth(day, currentDate)
                      ? 'bg-gray-50 text-gray-400'
                      : isToday
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                  {bookings.length > 0 && (
                    <div className="space-y-1">
                      {bookings.slice(0, 2).map((booking: any) => (
                        <div
                          key={booking._id}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                          title={booking.serviceName}
                        >
                          {booking.serviceName?.substring(0, 15)}...
                        </div>
                      ))}
                      {bookings.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{bookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span className="text-sm text-gray-700">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorCalendar;
