const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const rateLimit = require("express-rate-limit");
const User = require('./model/User');
const Service = require('./model/Service');
const Booking = require('./model/Booking');
const Review = require('./model/Review');
const Notification = require('./model/Notification');
const Favorite = require('./model/Favorite');

dotenv.config();
const mongo_uri = process.env.MONGO_URI;
mongoose.connect(mongo_uri);

const cors = require("cors");

const db = mongoose.connection;

db.on('error', (err) => {
    console.log(err);
});

db.once('open', () => {
    console.log("Database Connection Established Successfully");
});

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://admindash-olive.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173'
        ];

        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now, change to false in production
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400 // 24 hours
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Utility function to delete multiple media files from Cloudinary
const deleteMediaFiles = async (mediaArray) => {
    if (!mediaArray || !Array.isArray(mediaArray) || mediaArray.length === 0) {
        return { success: true, message: 'No media to delete' };
    }

    try {
        const deletePromises = mediaArray.map(media => {
            return cloudinary.uploader.destroy(media.publicId, {
                resource_type: media.resourceType || 'image'
            }).catch(error => {
                console.error(`Failed to delete ${media.publicId}:`, error);
                return { result: 'failed', publicId: media.publicId };
            });
        });

        const results = await Promise.all(deletePromises);

        const deletedCount = results.filter(r => r.result === 'ok').length;
        const failedCount = results.filter(r => r.result !== 'ok').length;

        console.log(`Media deletion: ${deletedCount} succeeded, ${failedCount} failed`);

        return {
            success: true,
            deletedCount,
            failedCount,
            message: `Deleted ${deletedCount} media file(s)`
        };
    } catch (error) {
        console.error('Error deleting media files:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Configure transporter (use environment variables for security)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

app.set('trust proxy', 1);

// Initialize Passport
app.use(passport.initialize());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100                  // limit each IP to 100 requests
});
app.use(limiter);

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://metrowayz.onrender.com/auth/google_callback"
}, async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
        user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value,
            isAdmin: false,
        });
        await user.save();
    }
    return done(null, user);
}));

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.query.token;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// ============= AUTH ROUTES =============

// Google Auth Route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
    "/auth/google_callback",
    passport.authenticate("google", { failureRedirect: "/", session: false }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user.googleId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Support multiple frontend URLs
        const allowedOrigins = [
            'https://metrowayz.vercel.app',
            'https://admindash-olive.vercel.app',
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        res.send(`
        <html>
          <head></head>
          <body>
            <script>
              try {
                if (window.opener) {
                  console.log('Sending token to opener');
                  // Send to all allowed origins
                  const allowedOrigins = ${JSON.stringify(allowedOrigins)};
                  allowedOrigins.forEach(origin => {
                    try {
                      window.opener.postMessage(
                        { token: "${token}" },
                        origin
                      );
                      console.log('Sent message to:', origin);
                    } catch (e) {
                      console.error('Failed to send to', origin, e);
                    }
                  });

                  setTimeout(() => {
                    window.close();
                  }, 1000);
                } else {
                  console.error('No opener window found');
                  document.body.innerHTML = '<p>Authentication successful! You can close this window.</p>';
                }
              } catch (error) {
                console.error('Error in callback:', error);
                document.body.innerHTML = '<p>Authentication successful! Please close this window and refresh the original page.</p>';
              }
            </script>
          </body>
        </html>
      `);
    }
);

// ============= USER ROUTES =============

// Dashboard (Protected)
app.get('/dashboard', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('User from JWT:', req.user);

        let user = await User.findOne({ googleId: userId });

        if (!user.phoneNumber) {
            console.log("User has not registered at all");
            return res.json({ onboarded: false });
        }
        else if (user.phoneNumber) {
            console.log("user has Onboarded");
            return res.json({ onboarded: true });
        }

    } catch (error) {
        console.error("Error in /dashboard", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get('/user-details', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ message: "Missing googleId in session" });
        }

        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return user data in format expected by frontend
        return res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePic || '',
                role: user.isAdmin ? 'admin' : (user.userType === 'provider' || user.userType === 'both' ? 'seller' : 'user'),
                onboarded: !!(user.businessName || user.businessDescription)
            },
            // Also include business data for backward compatibility
            data: {
                businessData: {
                    businessName: user.businessName || '',
                    description: user.businessDescription || '',
                    businessType: user.businessType || '',
                    taxId: user.taxId || '',
                    email: user.email || '',
                    phone: user.phoneNumber || '',
                    website: user.website || '',
                    categories: user.categories || [],
                    certifications: user.certifications || [],
                    about: user.about || ''
                },
                businessHours: user.businessHours || {},
                locations: user.locations || [],
                socialLinks: user.socialLinks || {}
            }
        });
    } catch (error) {
        console.error("Error in /user-detail:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/update-profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId in request"
            });
        }

        console.log('Raw request body type checks:');
        console.log('businessHours type:', typeof req.body.businessHours, 'isArray:', Array.isArray(req.body.businessHours));
        console.log('locations type:', typeof req.body.locations, 'isArray:', Array.isArray(req.body.locations));
        console.log('socialLinks type:', typeof req.body.socialLinks, 'isArray:', Array.isArray(req.body.socialLinks));

        const {
            businessName,
            taxId,
            businessDescription,
            phoneNumber,
            businessType,
            website,
            locations,
            certifications,
            about,
            businessHours,
            categories,
            zipCode,
            socialLinks
        } = req.body;

        console.log('Update profile request body:', JSON.stringify(req.body, null, 2));

        // Build update object dynamically - only include defined fields
        const updateFields = {};

        if (businessName !== undefined) updateFields.businessName = businessName;
        if (categories !== undefined) updateFields.categories = categories;
        if (zipCode !== undefined) updateFields.zipCode = zipCode;
        if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
        if (businessType !== undefined) updateFields.businessType = businessType;
        if (website !== undefined) updateFields.website = website;
        if (businessDescription !== undefined) updateFields.businessDescription = businessDescription;
        if (taxId !== undefined) updateFields.taxId = taxId;
        if (certifications !== undefined) updateFields.certifications = certifications;
        if (about !== undefined) updateFields.about = about;
        if (businessHours !== undefined) updateFields.businessHours = businessHours;
        if (locations !== undefined) updateFields.locations = locations;
        if (socialLinks !== undefined) updateFields.socialLinks = socialLinks;

        console.log('Update fields prepared:', JSON.stringify(updateFields, null, 2));

        // Use MongoDB native collection to completely bypass Mongoose schema validation
        const result = await User.collection.updateOne(
            { googleId: userId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log('User profile updated successfully for user:', userId);
        console.log('Update result:', result);

        // Fetch updated user to return
        const updatedUser = await User.findOne({ googleId: userId });

        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error("Error updating user profile:", err);
        console.error("Error stack:", err.stack);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
});

// ============= DASHBOARD ROUTES =============

app.get("/dashboard-stats", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Calculate real stats from database
        const totalServices = await Service.countDocuments({ createdBy: user._id });
        const activeServices = await Service.countDocuments({ createdBy: user._id, status: 'active' });

        // Get all bookings for this provider
        const allBookings = await Booking.find({ providerId: user._id });
        const totalBookings = allBookings.length;

        // Calculate total revenue (from confirmed and completed bookings)
        const totalRevenue = allBookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Calculate this month's revenue
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthBookings = await Booking.find({
            providerId: user._id,
            createdAt: { $gte: firstDayOfMonth },
            status: { $in: ['confirmed', 'completed'] }
        });
        const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Calculate last month's revenue
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthBookings = await Booking.find({
            providerId: user._id,
            createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
            status: { $in: ['confirmed', 'completed'] }
        });
        const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Calculate monthly growth
        let monthlyGrowth = 0;
        if (lastMonthRevenue > 0) {
            monthlyGrowth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
        }

        // Calculate average rating from reviews
        const reviews = await Review.find({
            serviceId: { $in: await Service.find({ createdBy: user._id }).distinct('_id') }
        });
        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        // Calculate conversion rate (confirmed bookings / total bookings)
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
        const conversionRate = totalBookings > 0
            ? ((confirmedBookings / totalBookings) * 100).toFixed(1)
            : 0;

        const stats = {
            totalRevenue,
            totalBookings,
            activeServices,
            averageRating: parseFloat(averageRating),
            monthlyGrowth: parseFloat(monthlyGrowth),
            conversionRate: parseFloat(conversionRate)
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats",
            error: error.message
        });
    }
});

app.get("/recent-bookings", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get 5 most recent bookings for this provider
        const bookings = await Booking.find({ providerId: user._id })
            .populate('userId', 'name email profilePic')
            .populate('serviceId', 'title category')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error("Error fetching recent bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching recent bookings",
            error: error.message
        });
    }
});

app.get("/dashboard-analytics", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get bookings for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get bookings created by this provider
        const bookings = await Booking.find({
            providerId: user._id,
            createdAt: { $gte: sixMonthsAgo }
        });

        // Calculate monthly booking trends
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const bookingsByMonth = {};
        const revenueByMonth = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            bookingsByMonth[monthKey] = 0;
            revenueByMonth[monthKey] = 0;
        }

        // Count bookings and revenue per month
        bookings.forEach(booking => {
            const date = new Date(booking.createdAt);
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (bookingsByMonth.hasOwnProperty(monthKey)) {
                bookingsByMonth[monthKey]++;
                if (booking.status === 'confirmed' || booking.status === 'completed') {
                    revenueByMonth[monthKey] += booking.totalAmount || 0;
                }
            }
        });

        // Format data for charts
        const bookingData = Object.keys(bookingsByMonth).map(month => ({
            month: month.split(' ')[0], // Just show month name
            count: bookingsByMonth[month]
        }));

        const revenueData = Object.keys(revenueByMonth).map(month => ({
            month: month.split(' ')[0], // Just show month name
            amount: revenueByMonth[month]
        }));

        const analytics = {
            revenue: revenueData,
            bookings: bookingData
        };

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard analytics",
            error: error.message
        });
    }
});

// ============= CLOUDINARY SIGNATURE ROUTE =============

// Get Cloudinary upload signature (for secure frontend uploads)
app.get("/cloudinary-signature", authenticateJWT, async (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'services';

        // Generate signature for upload
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: folder
            },
            process.env.CLOUDINARY_API_SECRET
        );

        res.status(200).json({
            success: true,
            data: {
                signature,
                timestamp,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY,
                folder
            }
        });
    } catch (error) {
        console.error("Error generating Cloudinary signature:", error);
        res.status(500).json({
            success: false,
            message: "Error generating upload signature",
            error: error.message
        });
    }
});

// ============= SERVICE ROUTES =============

// Public endpoint - Get all active services (for customer-facing app)
app.get("/api/public/services", async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            minPrice,
            maxPrice,
            location,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build base query - exclude only 'inactive' services, allow everything else
        let query = {};

        // Exclude inactive services while including undefined/null status (backward compatibility)
        query.$or = [
            { status: { $ne: 'inactive' } },
            { status: { $exists: false } }
        ];

        // Search functionality
        if (search && search.trim()) {
            query.$and = [
                { $or: query.$or }, // Preserve status filter
                {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                }
            ];
            delete query.$or; // Remove the top-level $or since we moved it into $and
        }

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Filter by location
        if (location && location.trim()) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const services = await Service.find(query)
            .select('-createdBy -__v') // Don't expose internal IDs
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean()
            .exec();

        const total = await Service.countDocuments(query);

        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error("Error fetching public services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
            error: error.message
        });
    }
});

// Public endpoint - Get single service details (for customer-facing app)
app.get("/api/public/services/:id", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .select('-createdBy -__v')
            .lean();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Only return if service is active or status is undefined (for backward compatibility)
        // Explicitly block only 'inactive' services
        if (service.status === 'inactive') {
            return res.status(404).json({
                success: false,
                message: "Service not available"
            });
        }

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service",
            error: error.message
        });
    }
});

// Public endpoint - Get service categories (for filtering)
app.get("/api/public/categories", async (req, res) => {
    try {
        const categories = await Service.distinct('category', { status: 'active' });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
});

// Admin/Provider endpoint - Create service (requires authentication)
app.post("/create-service", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        // Add creator info to service
        const serviceData = {
            ...req.body,
            createdBy: user._id,
            creatorName: user.name,
            creatorEmail: user.email,
            images: req.body.images || [],
            bookings: 0,
            rating: 0,
            createdAt: new Date()
        };

        const service = new Service(serviceData);
        await service.save();

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            service,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

 app.get("/services", authenticateJWT, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status,category } = req.query;

        // Safely handle user lookup
        let user = null;
        try {
            const userId = req.user?.userId;
            if (userId) {
                user = await User.findOne({ googleId: userId });
            }
        } catch (userError) {
            console.error("Error finding user:", userError);
        }

        let query = {};

        // Filter by user's services only (unless admin or user not found)
        if (user && !user.isAdmin) {
            query.createdBy = user._id;
        }

        // Add search functionality
        if (search && search.trim()) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Safely fetch services
        let services = [];
        let total = 0;

        try {
            services = await Service.find(query)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean()
                .exec();

            total = await Service.countDocuments(query);
        } catch (dbError) {
            console.error("Database error fetching services:", dbError);
            // Return empty array instead of erroring
            services = [];
            total = 0;
        }

        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit) || 0
            }
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        // Always return 200 with empty data instead of 500
        res.status(200).json({
            success: true,
            data: [],
            pagination: {
                total: 0,
                page: parseInt(req.query.page || 1),
                pages: 0
            },
            message: "Services temporarily unavailable"
        });
    }
});

app.put("/services/:id", authenticateJWT, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const userId = req.user.userId;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check if user owns the service or is admin
        const user = await User.findOne({ googleId: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (service.createdBy.toString() !== user._id.toString() && !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this service"
            });
        }

        // Handle image updates - delete removed images from Cloudinary
        if (req.body.images && Array.isArray(req.body.images)) {
            const oldImages = service.images || [];
            const newImages = req.body.images;

            // Find images that were removed (in old but not in new)
            const removedImages = oldImages.filter(oldImg =>
                !newImages.some(newImg => newImg.publicId === oldImg.publicId)
            );

            // Delete removed images from Cloudinary
            if (removedImages.length > 0) {
                console.log(`Removing ${removedImages.length} old image(s) from service ${serviceId}`);
                await deleteMediaFiles(removedImages);
            }
        }

        // Update service fields
        Object.keys(req.body).forEach(key => {
            if (key !== 'createdBy' && key !== '_id') {
                service[key] = req.body[key];
            }
        });

        await service.save();

        res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: service
        });
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({
            success: false,
            message: "Error updating service",
            error: error.message
        });
    }
});

app.put("/services/:id/status", authenticateJWT, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { status } = req.body;
        const userId = req.user.userId;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Check if user owns the service or is admin
        const user = await User.findOne({ googleId: userId });
        if (service.createdBy.toString() !== user._id.toString() && !user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to update this service" });
        }

        service.status = status;
        await service.save();

        res.status(200).json({
            success: true,
            message: "Service status updated successfully",
            data: service
        });
    } catch (error) {
        console.error("Error updating service status:", error);
        res.status(500).json({ message: "Error updating service status", error });
    }
});

app.delete("/services/:id", authenticateJWT, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const userId = req.user.userId;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check if user owns the service or is admin
        const user = await User.findOne({ googleId: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (service.createdBy.toString() !== user._id.toString() && !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this service"
            });
        }

        // Delete all associated media files from Cloudinary
        if (service.images && Array.isArray(service.images) && service.images.length > 0) {
            console.log(`Deleting ${service.images.length} media file(s) for service ${serviceId}`);
            const deleteResult = await deleteMediaFiles(service.images);
            console.log('Media deletion result:', deleteResult);
        }

        // Delete the service from database
        await Service.findByIdAndDelete(serviceId);

        res.status(200).json({
            success: true,
            message: "Service and associated media deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting service",
            error: error.message
        });
    }
});

// ============= BOOKING MANAGEMENT ROUTES =============

// Helper function to create booking notification
const createBookingNotification = async (userId, type, title, message, bookingId) => {
    try {
        await Notification.createNotification({
            userId,
            type,
            title,
            message,
            relatedId: bookingId,
            relatedType: 'booking'
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// ============= CALENDAR API ENDPOINTS =============

// Get all booked dates for a service (for customer calendar view)
app.get("/api/services/:serviceId/booked-dates", async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Validate service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Get booked dates using the Booking model method
        const bookedDates = await Booking.getBookedDates(serviceId);

        res.status(200).json({
            success: true,
            data: bookedDates
        });
    } catch (error) {
        console.error("Error fetching booked dates:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching booked dates",
            error: error.message
        });
    }
});

// Check availability for a date range
app.post("/api/services/:serviceId/check-availability", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { checkInDate, checkOutDate } = req.body;

        if (!checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: "Check-in and check-out dates are required"
            });
        }

        // Validate service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check availability using the Booking model method
        const availabilityResult = await Booking.checkAvailability(
            serviceId,
            checkInDate,
            checkOutDate
        );

        res.status(200).json({
            success: true,
            data: availabilityResult
        });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({
            success: false,
            message: "Error checking availability",
            error: error.message
        });
    }
});

// Get calendar data for a specific month (optional - for advanced calendar views)
app.get("/api/services/:serviceId/calendar/:year/:month", async (req, res) => {
    try {
        const { serviceId, year, month } = req.params;

        // Validate service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Get calendar data using the Booking model method
        const calendarData = await Booking.getCalendarData(
            serviceId,
            parseInt(year),
            parseInt(month)
        );

        res.status(200).json({
            success: true,
            data: calendarData
        });
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching calendar data",
            error: error.message
        });
    }
});

// Get calendar view of bookings for provider
app.get("/api/provider/calendar", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const bookings = await Booking.find({
            providerId: user._id,
            status: { $in: ['pending', 'confirmed', 'in_progress'] },
            $or: [
                {
                    checkInDate: { $gte: start, $lte: end }
                },
                {
                    checkOutDate: { $gte: start, $lte: end }
                },
                {
                    checkInDate: { $lte: start },
                    checkOutDate: { $gte: end }
                }
            ]
        })
        .populate('userId', 'name email phoneNumber')
        .populate('serviceId', 'title category')
        .sort({ checkInDate: 1 })
        .lean();

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error("Error fetching calendar bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching calendar bookings",
            error: error.message
        });
    }
});

// Create a new booking
app.post("/api/bookings", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const {
            serviceId,
            checkInDate,
            checkOutDate,
            guests,
            specialRequests
        } = req.body;

        // Validate required fields
        if (!serviceId || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get service details
        const service = await Service.findById(serviceId).populate('createdBy');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Calculate total amount (even though payment is free for now)
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalAmount = service.price * Math.max(duration, 1);

        // Create booking
        const booking = new Booking({
            serviceId: service._id,
            userId: user._id,
            providerId: service.createdBy._id,
            serviceName: service.title,
            serviceLocation: service.location,
            serviceImages: service.images.map(img => img.url || img),
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guests: guests || 1,
            totalAmount,
            specialRequests: specialRequests || '',
            status: 'confirmed' // Auto-confirm since no payment
        });

        await booking.save();

        // Update service bookings count
        service.bookings += 1;
        await service.save();

        // Update user total bookings
        user.totalBookings += 1;
        await user.save();

        // Create notification for customer
        await createBookingNotification(
            user._id,
            'booking',
            'Booking Confirmed',
            `Your booking for ${service.title} has been confirmed`,
            booking._id
        );

        // Create notification for provider
        await createBookingNotification(
            service.createdBy._id,
            'booking',
            'New Booking Received',
            `You have a new booking for ${service.title}`,
            booking._id
        );

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error creating booking",
            error: error.message
        });
    }
});

// Get user's bookings (customer view)
app.get("/api/user/bookings", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        let query = { userId: user._id };

        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('serviceId', 'title category images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// Get provider's bookings (provider view)
app.get("/api/provider/bookings", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        let query = { providerId: user._id };

        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'name email profilePic phoneNumber')
            .populate('serviceId', 'title category images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching provider bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// Get single booking details
app.get("/api/bookings/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        const booking = await Booking.findById(req.params.id)
            .populate('serviceId')
            .populate('userId', 'name email profilePic phoneNumber')
            .populate('providerId', 'name email businessName phoneNumber');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is authorized to view this booking
        if (booking.userId._id.toString() !== user._id.toString() &&
            booking.providerId._id.toString() !== user._id.toString() &&
            !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this booking"
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching booking",
            error: error.message
        });
    }
});

// Update booking status
app.put("/api/bookings/:id/status", authenticateJWT, async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check authorization
        const isCustomer = booking.userId._id.toString() === user._id.toString();
        const isProvider = booking.providerId._id.toString() === user._id.toString();

        if (!isCustomer && !isProvider && !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this booking"
            });
        }

        booking.status = status;
        await booking.save();

        // Create notification based on status change
        let notificationTitle = '';
        let notificationMessage = '';

        if (status === 'cancelled') {
            notificationTitle = 'Booking Cancelled';
            notificationMessage = `Booking for ${booking.serviceName} has been cancelled`;
        } else if (status === 'completed') {
            notificationTitle = 'Booking Completed';
            notificationMessage = `Booking for ${booking.serviceName} has been completed`;
        }

        if (notificationTitle) {
            // Notify the other party
            const notifyUserId = isCustomer ? booking.providerId._id : booking.userId._id;
            await createBookingNotification(
                notifyUserId,
                'booking',
                notificationTitle,
                notificationMessage,
                booking._id
            );
        }

        res.status(200).json({
            success: true,
            message: `Booking ${status} successfully`,
            data: booking
        });
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating booking status",
            error: error.message
        });
    }
});

// Cancel booking
app.delete("/api/bookings/:id", authenticateJWT, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check authorization
        const isCustomer = booking.userId._id.toString() === user._id.toString();
        const isProvider = booking.providerId._id.toString() === user._id.toString();

        if (!isCustomer && !isProvider && !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to cancel this booking"
            });
        }

        // Determine who cancelled
        let cancelledBy = 'customer';
        if (isProvider) cancelledBy = 'provider';
        if (user.isAdmin) cancelledBy = 'admin';

        await booking.cancel(cancelledBy, reason);

        // Notify the other party
        const notifyUserId = isCustomer ? booking.providerId._id : booking.userId._id;
        await createBookingNotification(
            notifyUserId,
            'cancellation',
            'Booking Cancelled',
            `Booking for ${booking.serviceName} has been cancelled`,
            booking._id
        );

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully"
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Error cancelling booking",
            error: error.message
        });
    }
});

// ============= REVIEW/RATING ROUTES =============

// Submit a review for a service
app.post("/api/services/:serviceId/reviews", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { serviceId } = req.params;
        const { rating, comment, bookingId } = req.body;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate required fields
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required"
            });
        }

        // Check if service exists
        const service = await Service.findById(serviceId).populate('createdBy');
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check if user has already reviewed this service
        const existingReview = await Review.findOne({
            serviceId,
            userId: user._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this service"
            });
        }

        // Create review
        const review = new Review({
            serviceId,
            userId: user._id,
            bookingId,
            userName: user.name,
            userAvatar: user.profilePic || '',
            rating: parseInt(rating),
            comment
        });

        await review.save();

        // Notify the provider
        await createBookingNotification(
            service.createdBy._id,
            'review',
            'New Review Received',
            `${user.name} left a ${rating}-star review for ${service.title}`,
            review._id
        );

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: review
        });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({
            success: false,
            message: "Error submitting review",
            error: error.message
        });
    }
});

// Get reviews for a service
app.get("/api/services/:serviceId/reviews", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;

        const sortOptions = {};
        if (sortBy === 'helpful') {
            sortOptions.helpfulCount = -1;
        } else if (sortBy === 'rating') {
            sortOptions.rating = -1;
        } else {
            sortOptions.createdAt = -1;
        }

        const reviews = await Review.find({ serviceId })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Review.countDocuments({ serviceId });

        // Calculate rating breakdown
        const ratingBreakdown = await Review.aggregate([
            { $match: { serviceId: mongoose.Types.ObjectId(serviceId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            ratingBreakdown,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reviews",
            error: error.message
        });
    }
});

// Update a review
app.put("/api/reviews/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { rating, comment } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this review"
            });
        }

        if (rating) review.rating = rating;
        if (comment) review.comment = comment;

        await review.save();

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Error updating review",
            error: error.message
        });
    }
});

// Delete a review
app.delete("/api/reviews/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns this review or is admin
        if (review.userId.toString() !== user._id.toString() && !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this review"
            });
        }

        await review.remove();

        res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting review",
            error: error.message
        });
    }
});

// Mark review as helpful
app.post("/api/reviews/:id/helpful", authenticateJWT, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        review.helpfulCount += 1;
        await review.save();

        res.status(200).json({
            success: true,
            message: "Review marked as helpful",
            data: review
        });
    } catch (error) {
        console.error("Error marking review as helpful:", error);
        res.status(500).json({
            success: false,
            message: "Error marking review as helpful",
            error: error.message
        });
    }
});

// Provider response to review
app.post("/api/reviews/:id/response", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { response } = req.body;

        const review = await Review.findById(req.params.id).populate('serviceId');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user is the service provider
        if (review.serviceId.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the service provider can respond to reviews"
            });
        }

        await review.addProviderResponse(response);

        res.status(200).json({
            success: true,
            message: "Response added successfully",
            data: review
        });
    } catch (error) {
        console.error("Error adding provider response:", error);
        res.status(500).json({
            success: false,
            message: "Error adding provider response",
            error: error.message
        });
    }
});

// ============= CUSTOMER MANAGEMENT ROUTES =============

app.get("/customers", authenticateJWT, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        // TODO: Replace with real Customer model when created
        res.status(200).json({
            success: true,
            data: [],
            pagination: {
                total: 0,
                page: parseInt(page),
                pages: 0
            }
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching customers",
            error: error.message
        });
    }
});

// ============= ANALYTICS ROUTES =============

app.get("/analytics", authenticateJWT, async (req, res) => {
    try {
        const { dateRange = '30' } = req.query;

        // TODO: Calculate real analytics from bookings when models exist
        const analyticsData = {
            stats: {
                totalBookings: 0,
                conversionRate: 0,
                totalCustomers: 0,
                averageRating: 0
            },
            bookingTrends: [],
            customerSegments: [],
            servicePerformance: []
        };

        res.status(200).json({
            success: true,
            data: analyticsData
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching analytics",
            error: error.message
        });
    }
});

// ============= NOTIFICATION ROUTES =============

// Get user's notifications
app.get("/api/notifications", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { page = 1, limit = 20, unreadOnly } = req.query;
        let query = { userId: user._id };

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error.message
        });
    }
});

// Mark notification as read
app.put("/api/notifications/:id/read", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        // Check if notification belongs to user
        if (notification.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({
            success: false,
            message: "Error marking notification as read",
            error: error.message
        });
    }
});

// Mark all notifications as read
app.put("/api/notifications/read-all", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        await Notification.updateMany(
            { userId: user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({
            success: false,
            message: "Error marking all notifications as read",
            error: error.message
        });
    }
});

// Delete a notification
app.delete("/api/notifications/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        // Check if notification belongs to user
        if (notification.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Notification deleted"
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting notification",
            error: error.message
        });
    }
});

// ============= FAVORITE/WISHLIST ROUTES =============

// Get user's favorites
app.get("/api/favorites", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { page = 1, limit = 20 } = req.query;

        const favorites = await Favorite.find({ userId: user._id })
            .populate('serviceId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Favorite.countDocuments({ userId: user._id });

        res.status(200).json({
            success: true,
            data: favorites,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching favorites",
            error: error.message
        });
    }
});

// Add service to favorites
app.post("/api/favorites/:serviceId", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { serviceId } = req.params;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            userId: user._id,
            serviceId
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: "Service already in favorites"
            });
        }

        const favorite = new Favorite({
            userId: user._id,
            serviceId
        });

        await favorite.save();

        res.status(201).json({
            success: true,
            message: "Service added to favorites",
            data: favorite
        });
    } catch (error) {
        console.error("Error adding to favorites:", error);
        res.status(500).json({
            success: false,
            message: "Error adding to favorites",
            error: error.message
        });
    }
});

// Remove service from favorites
app.delete("/api/favorites/:serviceId", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { serviceId } = req.params;

        const favorite = await Favorite.findOneAndDelete({
            userId: user._id,
            serviceId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: "Favorite not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Service removed from favorites"
        });
    } catch (error) {
        console.error("Error removing from favorites:", error);
        res.status(500).json({
            success: false,
            message: "Error removing from favorites",
            error: error.message
        });
    }
});

// Check if service is favorited
app.get("/api/favorites/check/:serviceId", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { serviceId } = req.params;

        const favorite = await Favorite.findOne({
            userId: user._id,
            serviceId
        });

        res.status(200).json({
            success: true,
            isFavorited: !!favorite
        });
    } catch (error) {
        console.error("Error checking favorite status:", error);
        res.status(500).json({
            success: false,
            message: "Error checking favorite status",
            error: error.message
        });
    }
});

// ============= FINANCIAL MANAGEMENT ROUTES =============

app.get("/financial/overview", authenticateJWT, async (req, res) => {
    try {
        const { dateRange = '30' } = req.query;

        // TODO: Calculate real financial data from bookings/transactions when models exist
        const financialData = {
            stats: {
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                pendingPayouts: 0,
                thisMonthRevenue: 0,
                lastMonthRevenue: 0,
                averageBookingValue: 0,
                conversionRate: 0
            },
            revenueData: [],
            serviceRevenue: []
        };

        res.status(200).json({
            success: true,
            data: financialData
        });
    } catch (error) {
        console.error("Error fetching financial overview:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching financial overview",
            error: error.message
        });
    }
});

app.get("/financial/transactions", authenticateJWT, async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;

        // TODO: Replace with real Transaction model when created
        res.status(200).json({
            success: true,
            data: [],
            pagination: {
                total: 0,
                page: parseInt(page),
                pages: 0
            }
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching transactions",
            error: error.message
        });
    }
});

app.get("/financial/payouts", authenticateJWT, async (req, res) => {
    try {
        // TODO: Replace with real Payout model when created
        res.status(200).json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error("Error fetching payouts:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payouts",
            error: error.message
        });
    }
});

app.get("/financial/expenses", authenticateJWT, async (req, res) => {
    try {
        // TODO: Replace with real Expense model when created
        res.status(200).json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching expenses",
            error: error.message
        });
    }
});

app.post("/financial/expenses", authenticateJWT, async (req, res) => {
    try {
        const expenseData = req.body;

        // TODO: Replace with real Expense model when created
        res.status(201).json({
            success: true,
            message: "Expense feature coming soon",
            data: null
        });
    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({
            success: false,
            message: "Error creating expense",
            error: error.message
        });
    }
});

// ============= ADMIN ROUTES =============

// Get all users (Admin only)
app.get("/admin/users", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { businessName: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.isAdmin = role === 'admin';
        }

        const users = await User.find(query)
            .select('-googleId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users", error });
    }
});

// Update user role (Admin only)
app.put("/admin/users/:id/role", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const { isAdmin } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isAdmin },
            { new: true }
        ).select('-googleId');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: user
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Error updating user role", error });
    }
});

// Delete user (Admin only)
app.delete("/admin/users/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find all services created by this user
        const userServices = await Service.find({ createdBy: req.params.id });

        // Delete all media files from Cloudinary for each service
        let totalMediaDeleted = 0;
        for (const service of userServices) {
            if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                console.log(`Deleting ${service.images.length} media file(s) for service ${service._id}`);
                const deleteResult = await deleteMediaFiles(service.images);
                totalMediaDeleted += deleteResult.deletedCount || 0;
            }
        }

        // Delete all services created by this user
        await Service.deleteMany({ createdBy: req.params.id });

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: `User, ${userServices.length} service(s), and ${totalMediaDeleted} media file(s) deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error.message
        });
    }
});

// Get dashboard analytics (Admin only)
app.get("/admin/analytics", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalServices = await Service.countDocuments();
        const activeServices = await Service.countDocuments({ status: 'active' });
        const pendingServices = await Service.countDocuments({ status: 'pending' });

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Get services by category
        const servicesByCategory = await Service.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get recent activities
        const recentServices = await Service.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalServices,
                    activeServices,
                    pendingServices,
                    recentUsers
                },
                servicesByCategory,
                recentServices
            }
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Error fetching analytics", error });
    }
});

// ============= NOTIFICATION ROUTES =============

// Send notification to all users (Admin only)
app.post("/admin/notifications", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const { subject, message, type = 'info' } = req.body;

        const users = await User.find({}, 'email name');

        const emailPromises = users.map(user => {
            return transporter.sendMail({
                from: process.env.MAIL_USER,
                to: user.email,
                subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hello ${user.name},</h2>
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            ${message}
                        </div>
                        <p>Best regards,<br>Admin Team</p>
                    </div>
                `
            });
        });

        await Promise.all(emailPromises);

        res.status(200).json({
            success: true,
            message: `Notification sent to ${users.length} users`
        });
    } catch (error) {
        console.error("Error sending notifications:", error);
        res.status(500).json({ message: "Error sending notifications", error });
    }
});

// ============= SETTINGS ROUTES =============

// Get system settings (Admin only)
app.get("/admin/settings", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        // You can store settings in a separate Settings model or return hardcoded values
        const settings = {
            siteName: "Admin Dashboard",
            maintenanceMode: false,
            registrationEnabled: true,
            emailNotifications: true,
            maxServicesPerUser: 10
        };

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Error fetching settings", error });
    }
});

// ============= ERROR HANDLING =============

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error:", error);
    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// ============= SCHEDULED TASKS =============

// Example: Clean up expired sessions daily at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running daily cleanup...');
    // Add cleanup logic here
});

// ============= SERVER STARTUP =============

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
