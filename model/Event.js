const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        default: ''
    },
    // Location coordinates for map display
    latitude: {
        type: Number,
        default: 0
    },
    longitude: {
        type: Number,
        default: 0
    },
    eventDate: {
        type: Date,
        required: true
    },
    eventTime: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    ticketPrice: {
        type: Number,
        default: 0
    },
    capacity: {
        type: Number,
        default: 0
    },
    availableTickets: {
        type: Number,
        default: 0
    },
    attendees: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    },
    images: [{
        url: String,
        publicId: String,
        resourceType: {
            type: String,
            default: 'image'
        }
    }],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    organizerName: {
        type: String,
        default: ''
    },
    tags: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    },
    registrationDeadline: {
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
eventSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Event', eventSchema);
