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

    // Number of guests
    guests: {
        type: Number,
        default: 1,
        min: 1
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

// Method to cancel booking
bookingSchema.methods.cancel = function(cancelledBy, reason) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelledBy = cancelledBy;
    this.cancellationReason = reason || '';
    return this.save();
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

// Static method: Get calendar view data for a month
bookingSchema.statics.getCalendarData = async function(serviceId, year, month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const bookings = await this.find({
        serviceId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { checkInDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { checkOutDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { checkInDate: { $lte: startOfMonth }, checkOutDate: { $gte: endOfMonth } }
        ]
    }).populate('userId', 'fullName email');

    return bookings.map(booking => ({
        id: booking._id,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        customerName: booking.userId?.fullName || 'Unknown',
        customerEmail: booking.userId?.email || '',
        guests: booking.guests,
        status: booking.status,
        totalAmount: booking.totalAmount
    }));
};

module.exports = mongoose.model('Booking', bookingSchema);
