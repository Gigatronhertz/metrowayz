const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Reference to the user who receives this notification
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Notification type
    type: {
        type: String,
        enum: ['booking', 'payment', 'loyalty', 'offer', 'review', 'cancellation', 'reminder', 'system'],
        required: true
    },

    // Notification content
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },

    // Related resource (optional)
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedType: {
        type: String,
        enum: ['booking', 'service', 'review', 'user']
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },

    // Action link (optional)
    actionUrl: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
    const notification = new this(data);
    return await notification.save();
};

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
