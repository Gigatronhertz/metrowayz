const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePic: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },

    // User type: 'customer' or 'provider' (or both)
    userType: {
        type: String,
        enum: ['customer', 'provider', 'both'],
        default: 'customer'
    },

    // Admin status
    isAdmin: {
        type: Boolean,
        default: false
    },

    // Provider/Business fields (only for providers)
    businessName: {
        type: String,
        default: ''
    },
    businessDescription: {
        type: String,
        default: ''
    },
    businessType: {
        type: String,
        default: ''
    },
    taxId: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    categories: [{
        type: String
    }],
    certifications: [{
        type: String
    }],
    about: {
        type: String,
        default: ''
    },
    businessHours: {
        type: Object,
        default: {}
    },
    locations: [{
        type: Object
    }],
    zipCode: {
        type: String,
        default: ''
    },
    socialLinks: {
        type: Object,
        default: {}
    },

    // Customer fields
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    membershipTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    referrals: {
        type: Number,
        default: 0
    },

    // Common fields
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
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);
