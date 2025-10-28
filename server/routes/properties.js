import { Router } from 'express';
import Property from '../models/Property.mongoose.js';
import User from '../models/User.mongoose.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = Router();

/**
 * Middleware to check if user is landlord
 */
const requireLandlord = (req, res, next) => {
    if (req.user.role !== 'landlord' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only landlords can perform this action.'
        });
    }
    next();
};

/**
 * POST /api/properties - Create new property listing (landlords only)
 */
router.post('/', authenticate, requireLandlord, upload.array('images', 10), async (req, res) => {
    try {
        const {
            title,
            description,
            address,
            city,
            country,
            price,
            bedrooms,
            bathrooms,
            propertyType,
            amenities
        } = req.body;

        console.log('📝 Creating property listing:', { title, city, ownerId: req.user.id });

        // Get uploaded file paths
        const imagePaths = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];

        // Create property
        const property = await Property.create({
            title,
            description,
            address,
            city,
            country: country || 'UK',
            price: parseFloat(price),
            bedrooms: parseInt(bedrooms) || 1,
            bathrooms: parseInt(bathrooms) || 1,
            propertyType: propertyType || 'apartment',
            amenities: amenities ? (Array.isArray(amenities) ? amenities : JSON.parse(amenities)) : [],
            images: imagePaths,
            ownerId: req.user.id,
            status: 'active'
        });

        console.log('✅ Property created:', { id: property._id, title: property.title });

        res.status(201).json({
            success: true,
            message: 'Property listing created successfully',
            property: {
                id: property._id.toString(),
                title: property.title,
                description: property.description,
                address: property.address,
                city: property.city,
                country: property.country,
                price: property.price,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                propertyType: property.propertyType,
                amenities: property.amenities,
                images: property.images,
                status: property.status,
                createdAt: property.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Property creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create property listing',
            error: error.message
        });
    }
});

/**
 * GET /api/properties - Get all active property listings
 */
router.get('/', async (req, res) => {
    try {
        const { city, propertyType, minPrice, maxPrice, bedrooms } = req.query;

        // Build where clause for filtering
        const where = { status: 'active' };

        if (city) where.city = city;
        if (propertyType) where.propertyType = propertyType;
        if (bedrooms) where.bedrooms = parseInt(bedrooms);
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.$gte = parseFloat(minPrice);
            if (maxPrice) where.price.$lte = parseFloat(maxPrice);
        }

        const properties = await Property.find(where)
            .populate('ownerId', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            properties: properties.map(p => ({
                id: p._id.toString(),
                title: p.title,
                description: p.description,
                address: p.address,
                city: p.city,
                country: p.country,
                price: p.price,
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
                propertyType: p.propertyType,
                amenities: p.amenities,
                images: p.images,
                owner: p.ownerId ? {
                    id: p.ownerId._id.toString(),
                    name: `${p.ownerId.firstName} ${p.ownerId.lastName}`,
                    email: p.ownerId.email,
                    phone: p.ownerId.phoneNumber
                } : null,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        console.error('❌ Properties fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch properties',
            error: error.message
        });
    }
});

/**
 * GET /api/properties/my - Get current user's properties (landlords only)
 */
router.get('/my', authenticate, requireLandlord, async (req, res) => {
    try {
        const properties = await Property.find({ ownerId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            properties: properties.map(p => ({
                ...p.toObject(),
                id: p._id.toString()
            }))
        });
    } catch (error) {
        console.error('❌ My properties fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your properties',
            error: error.message
        });
    }
});

/**
 * GET /api/properties/:id - Get single property by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('ownerId', 'firstName lastName email phoneNumber');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            property: {
                id: property._id.toString(),
                title: property.title,
                description: property.description,
                address: property.address,
                city: property.city,
                country: property.country,
                price: property.price,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                propertyType: property.propertyType,
                amenities: property.amenities,
                images: property.images,
                status: property.status,
                owner: property.ownerId ? {
                    id: property.ownerId._id.toString(),
                    name: `${property.ownerId.firstName} ${property.ownerId.lastName}`,
                    email: property.ownerId.email,
                    phone: property.ownerId.phoneNumber
                } : null,
                createdAt: property.createdAt,
                updatedAt: property.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ Property fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch property',
            error: error.message
        });
    }
});

/**
 * PUT /api/properties/:id - Update property (owner only)
 */
router.put('/:id', authenticate, requireLandlord, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check if user owns this property
        if (property.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own properties.'
            });
        }

        // Update property
        Object.assign(property, req.body);
        await property.save();

        res.json({
            success: true,
            message: 'Property updated successfully',
            property: {
                ...property.toObject(),
                id: property._id.toString()
            }
        });
    } catch (error) {
        console.error('❌ Property update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update property',
            error: error.message
        });
    }
});

/**
 * DELETE /api/properties/:id - Delete property (owner only)
 */
router.delete('/:id', authenticate, requireLandlord, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check if user owns this property
        if (property.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own properties.'
            });
        }

        await property.deleteOne();

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        console.error('❌ Property delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete property',
            error: error.message
        });
    }
});

export default router;

