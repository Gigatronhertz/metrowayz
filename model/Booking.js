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

module.exports = mongoose.model('Booking', bookingSchema);
