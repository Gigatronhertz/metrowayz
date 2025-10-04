const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Reference to the service being reviewed
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },

    // Reference to the user who wrote the review
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Reference to the booking (optional, but helpful)
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },

    // User info (cached for display)
    userName: {
        type: String,
        required: true
    },
    userAvatar: {
        type: String,
        default: ''
    },

    // Review content
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },

    // Helpful count (users can mark reviews as helpful)
    helpfulCount: {
        type: Number,
        default: 0
    },

    // Provider response
    providerResponse: {
        type: String,
        default: ''
    },
    respondedAt: {
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
reviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add provider response
reviewSchema.methods.addProviderResponse = function(response) {
    this.providerResponse = response;
    this.respondedAt = new Date();
    return this.save();
};

// After saving a review, update the service rating
reviewSchema.post('save', async function() {
    const Service = mongoose.model('Service');
    const service = await Service.findById(this.serviceId);
    if (service) {
        await service.updateRating();
    }
});

// After deleting a review, update the service rating
reviewSchema.post('remove', async function() {
    const Service = mongoose.model('Service');
    const service = await Service.findById(this.serviceId);
    if (service) {
        await service.updateRating();
    }
});

module.exports = mongoose.model('Review', reviewSchema);
