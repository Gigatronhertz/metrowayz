const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceUnit: {
        type: String,
        default: 'night',
        enum: ['night', 'day', 'hour', 'event', 'meal', 'service']
    },

    // Images stored as array of objects with url and publicId
    images: [{
        url: String,
        publicId: String,
        resourceType: {
            type: String,
            default: 'image'
        }
    }],

    amenities: [{
        type: String
    }],

    // Location coordinates
    latitude: {
        type: Number,
        default: 0
    },
    longitude: {
        type: Number,
        default: 0
    },

    // Availability
    isAvailable: {
        type: Boolean,
        default: true
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },

    // Creator information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: {
        type: String,
        default: ''
    },
    creatorEmail: {
        type: String,
        default: ''
    },

    // Statistics (calculated from real data)
    bookings: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
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
serviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to increment view count
serviceSchema.methods.incrementViews = function() {
    this.viewCount += 1;
    return this.save();
};

// Method to update rating (call this after a new review)
serviceSchema.methods.updateRating = async function() {
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ serviceId: this._id });

    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        this.rating = totalRating / reviews.length;
        this.reviewCount = reviews.length;
    } else {
        this.rating = 0;
        this.reviewCount = 0;
    }

    return this.save();
};

module.exports = mongoose.model('Service', serviceSchema);
