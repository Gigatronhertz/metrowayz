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
    serviceType: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        default: ''
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
        url: {
            type: String,
            required: false
        },
        publicId: {
            type: String,
            required: false
        },
        resourceType: {
            type: String,
            default: 'image'
        }
    }],

    video: {
        type: String,
        default: ''
    },

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

    // Chef Service Specific Fields
    isChefService: {
        type: Boolean,
        default: false
    },

    // Pricing Model for Chef Services
    pricing: {
        model: {
            type: String,
            enum: ['fixed', 'range'],
            default: 'fixed'
        },
        fixed: {
            basePrice: {
                type: Number,
                default: 0
            },
            pricePerPerson: {
                type: Boolean,
                default: false
            }
        },
        range: {
            minPrice: {
                type: Number,
                default: 0
            },
            maxPrice: {
                type: Number,
                default: 0
            }
        }
    },

    // Guest Rules
    guestRules: {
        baseGuestLimit: {
            type: Number,
            default: 2
        },
        maxGuestsAllowed: {
            type: Number,
            default: 20
        },
        extraGuestFee: {
            type: Number,
            default: 0
        }
    },

    // Menu Parameters (for chefs)
    menuParameters: [{
        name: String,
        label: String,
        type: {
            type: String,
            enum: ['single_select', 'multi_select', 'boolean']
        },
        options: [{
            label: String,
            value: String,
            priceEffect: {
                type: Number,
                default: 0
            }
        }]
    }],

    // Add-ons
    addons: [{
        label: String,
        price: {
            type: Number,
            default: 0
        }
    }],

    // Availability for Chef Services
    availability: {
        availableDays: [String],
        timeSlots: [{
            start: String,
            end: String
        }],
        blockedDates: [String]
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
