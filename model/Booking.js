const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Reference to the service being booked
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },

    // Reference to the user making the booking
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Reference to the service provider
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Booking details (cached from service for historical record)
    serviceName: {
        type: String,
        required: true
    },
    serviceLocation: {
        type: String,
        required: true
    },
    serviceImages: [{
        type: String
    }],

    // Date information
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },

    // Time slot information for time-based services (e.g., private chefs)
    timeSlot: {
        startTime: {
            type: String // Format: "HH:mm"
        },
        endTime: {
            type: String // Format: "HH:mm"
        },
        date: {
            type: Date // Specific date for the time slot
        }
    },

    // Service type to determine booking logic
    serviceType: {
        type: String,
        enum: ['date_based', 'time_based'],
        default: 'date_based'
    },

    // Number of guests
    guests: {
        type: Number,
        default: 1,
        min: 1
    },

    // Chef Service Specific Fields
    isChefService: {
        type: Boolean,
        default: false
    },
    guestCount: {
        type: Number,
        default: null
    },
    selectedMenuOptions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    selectedAddons: [{
        type: String
    }],
    serviceDate: {
        type: Date
    },
    serviceTime: {
        type: String // Format: "HH:mm"
    },

    // Pricing (no payment for now, but keep for future)
    totalAmount: {
        type: Number,
        default: 0
    },

    // Special requests from customer
    specialRequests: {
        type: String,
        default: ''
    },

    // Booking status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed' // Auto-confirm since no payment needed
    },

    // Cancellation policy
    cancellationPolicy: {
        type: String,
        enum: ['24_hours', '48_hours', '72_hours', 'flexible', 'strict'],
        default: '24_hours'
    },

    // Cancellation info
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    cancelledBy: {
        type: String,
        enum: ['customer', 'provider', 'admin']
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundPercentage: {
        type: Number,
        default: 0
    },

    // Cancellation request (for super admin approval)
    cancellationRequest: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: undefined
        },
        requestedAt: {
            type: Date
        },
        requestedBy: {
            type: String,
            enum: ['customer', 'provider']
        },
        reason: {
            type: String
        },
        processedAt: {
            type: Date
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        adminNotes: {
            type: String
        }
    },

    // Completion info
    completedAt: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to cancel booking with refund calculation
bookingSchema.methods.cancel = function(cancelledBy, reason) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelledBy = cancelledBy;
    this.cancellationReason = reason || '';
    
    // Calculate refund based on cancellation policy
    const refundInfo = this.calculateRefund();
    this.refundAmount = refundInfo.refundAmount;
    this.refundPercentage = refundInfo.refundPercentage;
    
    return this.save();
};

// Method to calculate refund based on cancellation policy
bookingSchema.methods.calculateRefund = function() {
    const now = new Date();
    let hoursUntilService, serviceDateTime, policyName;
    
    // Calculate time until service based on service type
    if (this.serviceType === 'time_based' && this.timeSlot && this.timeSlot.date) {
        // For time-based services (private chefs), use the specific time slot date
        serviceDateTime = new Date(this.timeSlot.date);
        hoursUntilService = (serviceDateTime - now) / (1000 * 60 * 60);
    } else {
        // For date-based services, use check-in date
        serviceDateTime = new Date(this.checkInDate);
        hoursUntilService = (serviceDateTime - now) / (1000 * 60 * 60);
    }
    
    let refundPercentage = 0;
    
    switch (this.cancellationPolicy) {
        case '24_hours':
            policyName = '24-hour cancellation policy';
            if (hoursUntilService >= 24) {
                refundPercentage = 100;
            } else {
                refundPercentage = 0;
            }
            break;
        case '48_hours':
            policyName = '48-hour cancellation policy';
            if (hoursUntilService >= 48) {
                refundPercentage = 100;
            } else {
                refundPercentage = 0;
            }
            break;
        case '72_hours':
            policyName = '72-hour cancellation policy';
            if (hoursUntilService >= 72) {
                refundPercentage = 100;
            } else {
                refundPercentage = 0;
            }
            break;
        case 'flexible':
            policyName = 'Flexible cancellation policy';
            if (hoursUntilService >= 24) {
                refundPercentage = 100;
            } else if (hoursUntilService >= 12) {
                refundPercentage = 50;
            } else {
                refundPercentage = 0;
            }
            break;
        case 'strict':
            policyName = 'Strict cancellation policy';
            if (hoursUntilService >= 72) {
                refundPercentage = 50;
            } else {
                refundPercentage = 0;
            }
            break;
        default:
            policyName = '24-hour cancellation policy';
            if (hoursUntilService >= 24) {
                refundPercentage = 100;
            } else {
                refundPercentage = 0;
            }
    }
    
    const refundAmount = (this.totalAmount * refundPercentage) / 100;
    
    return {
        refundAmount,
        refundPercentage,
        policyName,
        hoursUntilService: Math.max(0, hoursUntilService),
        serviceType: this.serviceType,
        description: this.getRefundDescription(refundPercentage, hoursUntilService, policyName)
    };
};

// Method to get refund description
bookingSchema.methods.getRefundDescription = function(refundPercentage, hoursUntilService, policyName) {
    const serviceTypeText = this.serviceType === 'time_based' ? 'service time' : 'check-in';
    
    if (refundPercentage === 100) {
        return `Full refund (${refundPercentage}%) - Cancellation made more than 24 hours before ${serviceTypeText}.`;
    } else if (refundPercentage === 50) {
        return `Partial refund (${refundPercentage}%) - Cancellation made within the policy timeframe.`;
    } else {
        return `No refund - Cancellation made less than 24 hours before ${serviceTypeText}.`;
    }
};

// Method to complete booking
bookingSchema.methods.complete = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Static method: Get all booked dates for a service
bookingSchema.statics.getBookedDates = async function(serviceId) {
    const bookings = await this.find({
        serviceId,
        status: { $in: ['pending', 'confirmed'] } // Only active bookings
    }).select('checkInDate checkOutDate');

    // Create array of all booked dates
    const bookedDates = [];
    bookings.forEach(booking => {
        const start = new Date(booking.checkInDate);
        const end = new Date(booking.checkOutDate);

        // Add all dates in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            bookedDates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return [...new Set(bookedDates)]; // Remove duplicates
};

// Static method: Check availability for a date range
bookingSchema.statics.checkAvailability = async function(serviceId, checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find overlapping bookings
    const overlappingBookings = await this.find({
        serviceId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            // New booking starts during existing booking
            { checkInDate: { $lte: checkInDate }, checkOutDate: { $gte: checkInDate } },
            // New booking ends during existing booking
            { checkInDate: { $lte: checkOutDate }, checkOutDate: { $gte: checkOutDate } },
            // New booking completely contains existing booking
            { checkInDate: { $gte: checkInDate }, checkOutDate: { $lte: checkOutDate } }
        ]
    });

    return {
        available: overlappingBookings.length === 0,
        conflictingBookings: overlappingBookings.length
    };
};

// Static method: Check time slot availability for time-based services
bookingSchema.statics.checkTimeSlotAvailability = async function(serviceId, date, startTime, endTime) {
    const slotDate = new Date(date);
    
    // Find bookings with overlapping time slots on the same date
    const overlappingBookings = await this.find({
        serviceId,
        status: { $in: ['pending', 'confirmed'] },
        serviceType: 'time_based',
        'timeSlot.date': slotDate,
        $or: [
            // New slot starts during existing slot
            { 'timeSlot.startTime': { $lte: startTime }, 'timeSlot.endTime': { $gt: startTime } },
            // New slot ends during existing slot
            { 'timeSlot.startTime': { $lt: endTime }, 'timeSlot.endTime': { $gte: endTime } },
            // New slot completely contains existing slot
            { 'timeSlot.startTime': { $gte: startTime }, 'timeSlot.endTime': { $lte: endTime } }
        ]
    });

    return {
        available: overlappingBookings.length === 0,
        conflictingBookings: overlappingBookings.length
    };
};

// Static method: Get calendar view data for a month
bookingSchema.statics.getCalendarData = async function(serviceId, year, month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const daysInMonth = endOfMonth.getDate();

    // Get all bookings for this month
    const bookings = await this.find({
        serviceId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { checkInDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { checkOutDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { checkInDate: { $lte: startOfMonth }, checkOutDate: { $gte: endOfMonth } }
        ]
    }).populate('userId', 'fullName email');

    // Create a set of booked dates
    const bookedDatesSet = new Set();
    bookings.forEach(booking => {
        const start = new Date(booking.checkInDate);
        const end = new Date(booking.checkOutDate);

        let currentDate = new Date(start);
        while (currentDate <= end) {
            bookedDatesSet.add(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    // Calculate available dates (all dates in month that are not booked and not in the past)
    const availableDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Date is available if it's not booked and not in the past
        if (!bookedDatesSet.has(dateStr) && currentDate >= today) {
            availableDates.push(dateStr);
        }
    }

    return {
        bookings: bookings.map(booking => ({
            id: booking._id,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            customerName: booking.userId?.fullName || 'Unknown',
            customerEmail: booking.userId?.email || '',
            guests: booking.guests,
            status: booking.status,
            totalAmount: booking.totalAmount
        })),
        availableDates
    };
};

module.exports = mongoose.model('Booking', bookingSchema);
