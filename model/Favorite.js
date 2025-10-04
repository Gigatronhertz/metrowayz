const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    // Reference to the user who favorited
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Reference to the favorited service
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only favorite a service once
favoriteSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

// Index for faster queries
favoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
