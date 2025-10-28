import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: 'UK'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    bedrooms: {
        type: Number,
        required: true,
        min: 1
    },
    bathrooms: {
        type: Number,
        required: true,
        min: 1
    },
    propertyType: {
        type: String,
        enum: ['apartment', 'house', 'villa', 'studio', 'cottage'],
        default: 'apartment'
    },
    amenities: {
        type: [String],
        default: []
    },
    images: {
        type: [String],
        default: []
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'properties'
});

// Indexes for faster queries
propertySchema.index({ ownerId: 1 });
propertySchema.index({ city: 1 });
propertySchema.index({ status: 1 });

const Property = mongoose.model('Property', propertySchema);

export default Property;

