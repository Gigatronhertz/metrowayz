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
const Event = require('./model/Event');
const { sendWelcomeEmail, sendBookingConfirmationToUser, sendBookingNotificationToVendor } = require('./model/emailService');

dotenv.config();
const mongo_uri = process.env.MONGO_URI;
mongoose.connect(mongo_uri);

const cors = require("cors");

const db = mongoose.connection;

db.on('error', (err) => {
    console.log(err);
});

db.once('open', async () => {
    console.log("Database Connection Established Successfully");
    
    try {
        const indexExists = await User.collection.getIndexes();
        if (indexExists['googleId_1']) {
            await User.collection.dropIndex('googleId_1');
            console.log("Dropped old googleId index");
        }
        await User.collection.createIndex({ googleId: 1 }, { sparse: true, unique: true });
        console.log("Created new googleId index with sparse and unique constraints");
    } catch (err) {
        console.error("Index migration error:", err.message);
    }
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
    const isNewUser = !user;
    if (!user) {
        user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value,
            isAdmin: false,
        });
        await user.save();

        // Send welcome email to new Google OAuth users (don't await)
        sendWelcomeEmail(user.email, user.name).catch(err => {
            console.error('Failed to send welcome email to Google OAuth user:', err);
        });
    }
    return done(null, user);
}));

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.query.token;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    console.log('🔑 authenticateJWT - Token present:', !!token);
    console.log('🔑 authenticateJWT - Token preview:', token ? token.substring(0, 20) + '...' : 'none');

    if (!token) {
        console.log('❌ authenticateJWT: No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ authenticateJWT - Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('❌ authenticateJWT - Token verification failed:', err.message);
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

// Super Admin middleware
const requireSuperAdmin = async (req, res, next) => {
    try {
        console.log('🔐 requireSuperAdmin middleware - req.user:', req.user);
        const userId = req.user.userId;
        console.log('🔍 Looking up user with googleId:', userId);

        const user = await User.findOne({ googleId: userId });
        console.log('🔍 Found user:', user ? {
            _id: user._id,
            email: user.email,
            googleId: user.googleId,
            role: user.role,
            isAdmin: user.isAdmin
        } : null);

        if (!user) {
            console.log('❌ requireSuperAdmin: User not found');
            return res.status(403).json({
                success: false,
                message: 'Super Admin access required - User not found'
            });
        }

        if (user.role !== 'super_admin') {
            console.log('❌ requireSuperAdmin: User role is not super_admin, got:', user.role);
            return res.status(403).json({
                success: false,
                message: `Super Admin access required - Current role: ${user.role || 'none'}`
            });
        }

        console.log('✅ requireSuperAdmin: Access granted');
        req.superAdmin = user;
        next();
    } catch (error) {
        console.error('❌ requireSuperAdmin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
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

// Email/Password Authentication Routes
app.post('/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            name,
            role: 'user'
        });

        await user.save();

        // Send welcome email (don't await to avoid delaying response)
        sendWelcomeEmail(user.email, user.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed',
            error: error.message
        });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password (simple comparison - should use bcrypt in production)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Test endpoint to verify backend is working
app.get('/auth/super-admin/test', (req, res) => {
    res.json({
        success: true,
        message: 'Super Admin endpoint is reachable',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to check current user (authenticated)
app.get('/auth/whoami', authenticateJWT, async (req, res) => {
    try {
        console.log('🔍 WhoAmI - JWT user:', req.user);
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        console.log('🔍 WhoAmI - Found user:', user ? {
            _id: user._id,
            email: user.email,
            googleId: user.googleId,
            role: user.role,
            isAdmin: user.isAdmin
        } : null);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found in database',
                jwtUserId: userId
            });
        }

        res.json({
            success: true,
            jwt: req.user,
            database: {
                _id: user._id,
                email: user.email,
                name: user.name,
                googleId: user.googleId,
                role: user.role,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('❌ WhoAmI error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Endpoint to ensure super admin user exists with correct role (public for setup)
app.post('/auth/super-admin/ensure-setup', async (req, res) => {
    try {
        const SUPER_ADMIN_EMAIL = 'superadmin@metrowayz.com';
        const SUPER_ADMIN_GOOGLE_ID = 'super_admin_metrowayz_001';

        console.log('🔧 ensure-setup: Looking for user with email:', SUPER_ADMIN_EMAIL);

        // Find existing user
        let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });

        if (!superAdmin) {
            console.log('🔧 ensure-setup: User not found, creating new one');

            // Use MongoDB native insert to bypass schema validation
            const result = await User.collection.insertOne({
                googleId: SUPER_ADMIN_GOOGLE_ID,
                name: 'Super Admin',
                email: SUPER_ADMIN_EMAIL,
                role: 'super_admin',
                isAdmin: true,
                businessName: 'MetroWayz Administration',
                businessType: 'Administration',
                phoneNumber: '+1-000-000-0000',
                about: 'Super Administrator with full system access',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ ensure-setup: Created new super admin:', result.insertedId);

            return res.status(200).json({
                success: true,
                message: 'Super Admin user created successfully',
                action: 'created',
                userId: result.insertedId
            });
        }

        console.log('🔧 ensure-setup: Found existing user:', {
            _id: superAdmin._id,
            email: superAdmin.email,
            currentRole: superAdmin.role,
            currentGoogleId: superAdmin.googleId
        });

        // Update existing user using MongoDB native update to bypass schema validation
        const previousRole = superAdmin.role;
        const updateResult = await User.collection.updateOne(
            { email: SUPER_ADMIN_EMAIL },
            {
                $set: {
                    role: 'super_admin',
                    isAdmin: true,
                    googleId: SUPER_ADMIN_GOOGLE_ID,
                    updatedAt: new Date()
                }
            }
        );

        console.log('✅ ensure-setup: Update result:', {
            matched: updateResult.matchedCount,
            modified: updateResult.modifiedCount
        });

        // Verify the update
        const updatedUser = await User.findOne({ email: SUPER_ADMIN_EMAIL });
        console.log('✅ ensure-setup: Verified updated user:', {
            _id: updatedUser._id,
            email: updatedUser.email,
            role: updatedUser.role,
            googleId: updatedUser.googleId,
            isAdmin: updatedUser.isAdmin
        });

        return res.status(200).json({
            success: true,
            message: 'Super Admin user updated successfully',
            action: 'updated',
            previousRole: previousRole,
            currentRole: 'super_admin',
            updateResult: {
                matched: updateResult.matchedCount,
                modified: updateResult.modifiedCount
            }
        });
    } catch (error) {
        console.error('❌ Error ensuring super admin setup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Manual Login for Super Admin
app.post('/auth/super-admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Super Admin Login Request:', {
            receivedEmail: email,
            receivedPasswordLength: password?.length,
            emailMatch: email === 'superadmin@metrowayz.com',
            passwordMatch: password === 'SuperAdmin@2024!',
            body: req.body
        });

        // Hardcoded credentials for super admin
        const SUPER_ADMIN_EMAIL = 'superadmin@metrowayz.com';
        const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2024!';

        if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
            console.log('❌ Super Admin Login Failed: Invalid credentials');
            console.log('Expected email:', SUPER_ADMIN_EMAIL, 'Got:', email);
            console.log('Expected password:', SUPER_ADMIN_PASSWORD, 'Got:', password);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Super Admin credentials matched!');

        // Find or create super admin user
        let superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });

        if (!superAdmin) {
            superAdmin = new User({
                googleId: 'super_admin_metrowayz_001',
                name: 'Super Admin',
                email: SUPER_ADMIN_EMAIL,
                role: 'super_admin',
                isAdmin: true,
                businessName: 'MetroWayz Administration',
                businessType: 'Administration',
                phoneNumber: '+1-000-000-0000',
                about: 'Super Administrator with full system access'
            });
            await superAdmin.save();
        } else if (superAdmin.role !== 'super_admin') {
            // Ensure user has super_admin role
            superAdmin.role = 'super_admin';
            superAdmin.isAdmin = true;
            await superAdmin.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: superAdmin.googleId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role,
                isAdmin: superAdmin.isAdmin
            },
            message: 'Super Admin login successful'
        });
    } catch (error) {
        console.error('Super Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

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

// Get user profile
app.get('/api/user/profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ message: "Missing userId in request" });
        }

        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                country: user.country,
                bio: user.bio,
                profilePic: user.profilePic,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error("Error in /api/user/profile GET:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ message: "Missing userId in request" });
        }

        const { name, phone, address, city, country, bio } = req.body;

        // Build update object
        const updateFields = {};

        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;
        if (address !== undefined) updateFields.address = address;
        if (city !== undefined) updateFields.city = city;
        if (country !== undefined) updateFields.country = country;
        if (bio !== undefined) updateFields.bio = bio;

        // Update user
        const user = await User.findOneAndUpdate(
            { googleId: userId },
            { $set: updateFields },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                country: user.country,
                bio: user.bio,
                profilePic: user.profilePic,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error("Error in /api/user/profile PUT:", error);
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

        // If business information is being set, mark user as vendor
        if (businessName || businessType || businessDescription) {
            updateFields.role = 'vendor';
            console.log('Setting user role to vendor');
        }

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

// Debug endpoint for current vendor
app.get("/debug-my-data", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get services created by this user
        const services = await Service.find({ createdBy: user._id });
        console.log('🔍 DEBUG: Services found for user:', services.length);

        // Get all bookings with this user as providerId
        const bookingsByProviderId = await Booking.find({ providerId: user._id });
        console.log('🔍 DEBUG: Bookings by providerId:', bookingsByProviderId.length);

        // Get bookings for this user's services
        const serviceIds = services.map(s => s._id);
        const bookingsByServiceId = await Booking.find({ serviceId: { $in: serviceIds } });
        console.log('🔍 DEBUG: Bookings by serviceId:', bookingsByServiceId.length);

        // Get all services in the database (to see if any exist)
        const allServicesCount = await Service.countDocuments({});
        const allBookingsCount = await Booking.countDocuments({});

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    googleId: user.googleId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    businessName: user.businessName,
                    isAdmin: user.isAdmin
                },
                services: {
                    count: services.length,
                    list: services.map(s => ({
                        _id: s._id,
                        title: s.title,
                        createdBy: s.createdBy,
                        status: s.status,
                        createdAt: s.createdAt
                    }))
                },
                bookings: {
                    byProviderId: {
                        count: bookingsByProviderId.length,
                        list: bookingsByProviderId.slice(0, 5).map(b => ({
                            _id: b._id,
                            serviceName: b.serviceName,
                            status: b.status,
                            providerId: b.providerId,
                            serviceId: b.serviceId
                        }))
                    },
                    byServiceId: {
                        count: bookingsByServiceId.length,
                        list: bookingsByServiceId.slice(0, 5).map(b => ({
                            _id: b._id,
                            serviceName: b.serviceName,
                            status: b.status,
                            providerId: b.providerId,
                            serviceId: b.serviceId
                        }))
                    }
                },
                databaseTotals: {
                    allServices: allServicesCount,
                    allBookings: allBookingsCount
                }
            }
        });
    } catch (error) {
        console.error("Error in debug-my-data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching debug data",
            error: error.message
        });
    }
});

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
            totalServices,
            activeServices,
            pendingBookings: allBookings.filter(b => b.status === 'pending').length,
            averageRating: parseFloat(averageRating),
            monthlyGrowth: parseFloat(monthlyGrowth),
            conversionRate: parseFloat(conversionRate)
        };

        console.log('📊 DASHBOARD STATS for user', user.email, ':', stats);

        res.status(200).json({
            success: true,
            stats: stats, // Changed from 'data' to 'stats' to match frontend
            data: stats   // Keep both for compatibility
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

        console.log('📋 RECENT BOOKINGS for user', user.email, ':', bookings.length);

        res.status(200).json({
            success: true,
            bookings: bookings,  // Changed from 'data' to 'bookings' to match frontend
            data: bookings       // Keep both for compatibility
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
            if (Object.prototype.hasOwnProperty.call(bookingsByMonth, monthKey)) {
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
        console.log('📸 Cloudinary signature requested');
        console.log('📸 CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');
        console.log('📸 CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
        console.log('📸 CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

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

        const responseData = {
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder
        };

        console.log('📸 Returning cloudinary data:', {
            hasSignature: !!responseData.signature,
            timestamp: responseData.timestamp,
            cloudName: responseData.cloudName,
            apiKey: responseData.apiKey ? 'SET' : 'NOT SET',
            folder: responseData.folder
        });

        res.status(200).json({
            success: true,
            data: responseData
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

        // Filter by category with new mapping
        if (category && category !== 'all') {
            const categoryLower = category.toLowerCase();

            // Map new category structure
            if (categoryLower === 'professional' || categoryLower === 'professional services') {
                // Professional Services includes: Transportation, Events, Cleaning, Health & Wellness, and Professional Services
                query.category = {
                    $regex: 'transportation|event|cleaning|health|wellness|professional',
                    $options: 'i'
                };
            } else if (categoryLower === 'private chefs' || categoryLower === 'private-chefs') {
                query.category = { $regex: 'chef|private chef', $options: 'i' };
            } else {
                // Direct match for Accommodation and Entertainment
                query.category = { $regex: category, $options: 'i' };
            }
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

// DEBUG ENDPOINT - Check all services in database
app.get("/debug/services", authenticateJWT, async (req, res) => {
    try {
        const allServices = await Service.find({}).select('title createdBy creatorName status createdAt').limit(50).lean();
        const total = await Service.countDocuments({});

        console.log('🐛 DEBUG - Total services in DB:', total);

        res.json({
            success: true,
            total: total,
            services: allServices,
            message: 'Debug: All services in database'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin/Provider endpoint - Create service (requires authentication)
app.post("/create-service", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('🆕 CREATE SERVICE - JWT userId:', userId);

        const user = await User.findOne({ googleId: userId });
        console.log('🆕 CREATE SERVICE - Found user:', user ? { _id: user._id, name: user.name, email: user.email } : null);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please log in again."
            });
        }

        // Validate and clean images array
        let images = [];
        if (req.body.images && Array.isArray(req.body.images)) {
            images = req.body.images.filter(img =>
                img && img.url && img.publicId
            );
        }

        // Log for debugging
        console.log('🆕 CREATE SERVICE - Images count:', images.length);
        console.log('🆕 CREATE SERVICE - Service title:', req.body.title);
        console.log('🆕 CREATE SERVICE - Is Chef Service:', req.body.isChefService);

        // Validation for chef services
        if (req.body.isChefService) {
            console.log('🆕 CREATE SERVICE - Validating chef service fields...');
            
            if (!req.body.pricing || !req.body.pricing.model) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires pricing model (fixed or range)"
                });
            }

            if (!req.body.availability || !req.body.availability.availableDays || req.body.availability.availableDays.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires at least one available day"
                });
            }

            if (!req.body.availability.timeSlots || req.body.availability.timeSlots.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires at least one time slot"
                });
            }

            console.log('🆕 CREATE SERVICE - Chef service validation passed');
        }

        // Add creator info to service
        const serviceData = {
            ...req.body,
            createdBy: user._id,
            creatorName: user.name,
            creatorEmail: user.email,
            images: images,
            bookings: 0,
            rating: 0,
            createdAt: new Date()
        };

        console.log('🆕 CREATE SERVICE - Saving with createdBy:', user._id);

        const service = new Service(serviceData);
        await service.save();

        console.log('🆕 CREATE SERVICE - Saved successfully! Service ID:', service._id);

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            service,
        });
    } catch (error) {
        console.error("Create service error:", error);

        // Send more detailed error for validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error: " + error.message,
                errors: error.errors
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
});

 app.get("/services", authenticateJWT, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status,category } = req.query;

        // Safely handle user lookup
        let user = null;
        try {
            const userId = req.user?.userId;
            console.log('🔍 GET /services - JWT userId:', userId);
            if (userId) {
                user = await User.findOne({ googleId: userId });
                console.log('🔍 GET /services - Found user:', user ? { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } : null);
            }
        } catch (userError) {
            console.error("Error finding user:", userError);
        }

        let query = {};
        let createdByFilter = null;

        // Filter by user's services only (unless admin or user not found)
        if (user && !user.isAdmin) {
            createdByFilter = user._id;
            query.createdBy = user._id;
            console.log('🔍 GET /services - Query filter (createdBy):', user._id);
        } else {
            console.log('🔍 GET /services - No user filter (user:', user ? 'admin' : 'null', ')');
        }

        // Add search functionality
        if (search && search.trim()) {
            const searchQuery = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ]
            };
            // Combine createdByFilter with search using $and
            if (createdByFilter) {
                query = {
                    $and: [
                        { createdBy: createdByFilter },
                        searchQuery
                    ]
                };
            } else {
                query = { ...query, ...searchQuery };
            }
        }

        // Filter by category with new mapping
        if (category && category !== 'all') {
            const categoryLower = category.toLowerCase();

            // Map new category structure
            if (categoryLower === 'professional' || categoryLower === 'professional services') {
                // Professional Services includes: Transportation, Events, Cleaning, Health & Wellness, and Professional Services
                query.category = {
                    $regex: 'transportation|event|cleaning|health|wellness|professional',
                    $options: 'i'
                };
            } else if (categoryLower === 'private chefs' || categoryLower === 'private-chefs') {
                query.category = { $regex: 'chef|private chef', $options: 'i' };
            } else {
                // Direct match for Accommodation and Entertainment
                query.category = { $regex: category, $options: 'i' };
            }
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Safely fetch services
        let services = [];
        let total = 0;

        console.log('🔍 GET /services - Final query:', JSON.stringify(query));

        try {
            services = await Service.find(query)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean()
                .exec();

            total = await Service.countDocuments(query);

            console.log('🔍 GET /services - Found services:', services.length);
            console.log('🔍 GET /services - Total count:', total);
            if (services.length > 0) {
                console.log('🔍 GET /services - First service createdBy:', services[0].createdBy);
            }
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

// Get single service for editing (vendor endpoint with full data)
app.get("/services/:id", authenticateJWT, async (req, res) => {
    try {
        const serviceId = req.params.id;
        const userId = req.user.userId;

        const service = await Service.findById(serviceId).lean();

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
                message: "Not authorized to view this service"
            });
        }

        res.status(200).json({
            success: true,
            service: service
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

        // Validation for chef services
        if (req.body.isChefService) {
            console.log('🔄 UPDATE SERVICE - Validating chef service fields...');
            
            if (!req.body.pricing || !req.body.pricing.model) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires pricing model (fixed or range)"
                });
            }

            if (!req.body.availability || !req.body.availability.availableDays || req.body.availability.availableDays.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires at least one available day"
                });
            }

            if (!req.body.availability.timeSlots || req.body.availability.timeSlots.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Chef service requires at least one time slot"
                });
            }

            console.log('🔄 UPDATE SERVICE - Chef service validation passed');
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

// Helper function to send email to vendor about pending booking
const sendBookingPendingEmail = async (vendorEmail, vendorName, bookingData) => {
    try {
        const { serviceName, checkInDate, checkOutDate, guestName, bookingId } = bookingData;
        
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: vendorEmail,
            subject: `New Booking Awaiting Your Approval - ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${vendorName},</h2>
                    <p>You have received a new booking that requires your approval.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>${serviceName}</h3>
                        <p><strong>Guest Name:</strong> ${guestName}</p>
                        <p><strong>Check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
                        <p style="margin: 20px 0;">
                            <a href="https://metrowayz-frontend.vercel.app/vendor/bookings" 
                               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Review Booking
                            </a>
                        </p>
                    </div>
                    
                    <p>Please log in to your vendor dashboard to approve or reject this booking.</p>
                    <p>Best regards,<br>MetroWayz Team</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Booking notification email sent to ${vendorEmail}`);
    } catch (error) {
        console.error("Error sending booking notification email:", error);
    }
};

// Helper function to send email to customer when booking is approved
const sendBookingApprovedEmail = async (customerEmail, customerName, bookingData) => {
    try {
        const { serviceName, checkInDate, checkOutDate } = bookingData;
        
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: customerEmail,
            subject: `Your Booking Approved - ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${customerName},</h2>
                    <p>Great news! Your booking has been approved by the service provider.</p>
                    
                    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <h3>${serviceName}</h3>
                        <p><strong>Check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
                        <p style="margin: 20px 0;">
                            <a href="https://metrowayz-frontend.vercel.app/bookings" 
                               style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                View Booking
                            </a>
                        </p>
                    </div>
                    
                    <p>You're all set! The provider is ready to welcome you. If you have any questions, please contact the provider through the platform.</p>
                    <p>Best regards,<br>MetroWayz Team</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Booking approval email sent to ${customerEmail}`);
    } catch (error) {
        console.error("Error sending booking approval email:", error);
    }
};

// Helper function to send email to customer when booking is rejected
const sendBookingRejectedEmail = async (customerEmail, customerName, bookingData) => {
    try {
        const { serviceName, checkInDate, checkOutDate, reason } = bookingData;
        
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: customerEmail,
            subject: `Booking Declined - ${serviceName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${customerName},</h2>
                    <p>Unfortunately, your booking request has been declined by the service provider.</p>
                    
                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h3>${serviceName}</h3>
                        <p><strong>Check-in:</strong> ${new Date(checkInDate).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> ${new Date(checkOutDate).toLocaleDateString()}</p>
                        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                        <p style="margin: 20px 0;">
                            <a href="https://metrowayz-frontend.vercel.app/search" 
                               style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Find Similar Services
                            </a>
                        </p>
                    </div>
                    
                    <p>Your payment has been refunded to your original payment method. We encourage you to explore other services on our platform.</p>
                    <p>Best regards,<br>MetroWayz Team</p>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Booking rejection email sent to ${customerEmail}`);
    } catch (error) {
        console.error("Error sending booking rejection email:", error);
    }
};

// ============= CALENDAR API ENDPOINTS =============

// Get all booked dates for a service (for customer calendar view)
app.get("/api/services/:serviceId/booked-dates", async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Get booked dates using the Booking model method
        // No need to validate service exists - if it doesn't exist, there won't be any bookings
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

        console.log('=== AVAILABILITY CHECK ===');
        console.log('Service ID:', serviceId);
        console.log('Check-in Date:', checkInDate);
        console.log('Check-out Date:', checkOutDate);

        // Find all existing bookings for this service to debug
        const allBookings = await Booking.find({
            serviceId,
            status: { $in: ['pending', 'confirmed'] }
        }).select('checkInDate checkOutDate status');

        console.log('Existing bookings for this service:', allBookings.length);
        allBookings.forEach(booking => {
            console.log(`  - Booking: ${booking._id}, Check-in: ${booking.checkInDate}, Check-out: ${booking.checkOutDate}, Status: ${booking.status}`);
        });

        // Check availability using the Booking model method
        const availabilityResult = await Booking.checkAvailability(
            serviceId,
            checkInDate,
            checkOutDate
        );

        console.log('Availability Result:', availabilityResult);
        console.log('=========================');

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

        // Get calendar data using the Booking model method
        // No need to validate service exists - if it doesn't exist, there won't be any bookings
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

// TEMPORARY: Delete all bookings for a service (for testing/development)
// Remove this endpoint in production!
app.delete("/api/services/:serviceId/clear-bookings", async (req, res) => {
    try {
        const { serviceId } = req.params;

        const result = await Booking.deleteMany({
            serviceId,
            status: { $in: ['pending', 'confirmed'] }
        });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} booking(s) for service ${serviceId}`
        });
    } catch (error) {
        console.error("Error clearing bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error clearing bookings",
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
            specialRequests,
            serviceType,
            timeSlot,
            isChefService,
            guestCount,
            selectedMenuOptions,
            selectedAddons,
            serviceDate,
            serviceTime
        } = req.body;

        // Validate required fields
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: "Service ID is required"
            });
        }

        // Validate based on service type
        if (isChefService) {
            if (!serviceDate || !serviceTime) {
                return res.status(400).json({
                    success: false,
                    message: "Service date and time are required for chef service bookings"
                });
            }
        } else if (serviceType === 'time_based') {
            if (!timeSlot || !timeSlot.date || !timeSlot.startTime || !timeSlot.endTime) {
                return res.status(400).json({
                    success: false,
                    message: "Time slot information is required for time-based bookings"
                });
            }
        } else {
            if (!checkInDate || !checkOutDate) {
                return res.status(400).json({
                    success: false,
                    message: "Check-in and check-out dates are required for date-based bookings"
                });
            }
        }

        // Get service details
        const service = await Service.findById(serviceId).populate('createdBy');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Calculate total amount based on service type
        let totalAmount, checkIn, checkOut;
        
        if (isChefService) {
            // For chef services, calculate total with menu options and add-ons
            let basePrice = 0;
            
            if (service.pricing.model === 'fixed') {
                basePrice = service.pricing.fixed?.basePrice || 0;
                if (service.pricing.fixed?.pricePerPerson) {
                    basePrice = basePrice * (guestCount || 1);
                }
            } else {
                basePrice = service.pricing.range?.minPrice || 0;
            }
            
            let menuPrice = 0;
            if (service.menuParameters && selectedMenuOptions) {
                service.menuParameters.forEach((param) => {
                    const selected = selectedMenuOptions[param.name];
                    if (selected) {
                        const option = param.options.find(opt => opt.value === selected);
                        if (option) {
                            menuPrice += option.priceEffect || 0;
                        }
                    }
                });
            }
            
            let addonPrice = 0;
            if (service.addons && selectedAddons && Array.isArray(selectedAddons)) {
                selectedAddons.forEach((addonLabel) => {
                    const addon = service.addons.find(a => a.label === addonLabel);
                    if (addon) {
                        addonPrice += addon.price;
                    }
                });
            }
            
            let guestFee = 0;
            if (service.guestRules && guestCount > service.guestRules.baseGuestLimit) {
                const extraGuests = guestCount - service.guestRules.baseGuestLimit;
                guestFee = extraGuests * (service.guestRules.extraGuestFee || 0);
            }
            
            totalAmount = basePrice + menuPrice + addonPrice + guestFee;
            checkIn = new Date(serviceDate);
            checkOut = new Date(serviceDate);
        } else if (serviceType === 'time_based') {
            // For time-based services, use the service price directly
            totalAmount = service.price;
            checkIn = new Date(timeSlot.date);
            checkOut = new Date(timeSlot.date); // Same day for time-based services
        } else {
            // For date-based services, calculate based on duration
            checkIn = new Date(checkInDate);
            checkOut = new Date(checkOutDate);
            const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            totalAmount = service.price * Math.max(duration, 1);
        }

        // Require vendor approval after payment
        // Booking starts as pending and needs vendor confirmation
        const initialStatus = 'pending';
        const customerNotificationTitle = 'Booking Pending Confirmation';
        const customerNotificationMessage = `Your booking for ${service.title} is pending vendor confirmation`;
        const providerNotificationTitle = 'New Booking Awaiting Your Approval';
        const providerNotificationMessage = `You have a new booking for ${service.title} that requires your approval`;

        // Create booking
        const bookingData = {
            serviceId: service._id,
            userId: user._id,
            providerId: service.createdBy._id,
            serviceName: service.title,
            serviceLocation: service.location,
            serviceImages: service.images.map(img => img.url || img),
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guests: guests || guestCount || 1,
            totalAmount,
            specialRequests: specialRequests || '',
            status: initialStatus,
            serviceType: serviceType || 'date_based',
            isChefService: isChefService || false
        };

        // Add chef service specific information
        if (isChefService) {
            bookingData.guestCount = guestCount;
            bookingData.selectedMenuOptions = selectedMenuOptions || {};
            bookingData.selectedAddons = selectedAddons || [];
            bookingData.serviceDate = new Date(serviceDate);
            bookingData.serviceTime = serviceTime;
            bookingData.serviceType = 'time_based';
        }

        // Add time slot information for time-based services
        if (serviceType === 'time_based') {
            bookingData.timeSlot = {
                date: new Date(timeSlot.date),
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime
            };
        }

        const booking = new Booking(bookingData);

        await booking.save();

        // Create notification for customer
        await createBookingNotification(
            user._id,
            'booking',
            customerNotificationTitle,
            customerNotificationMessage,
            booking._id
        );

        // Create notification for provider
        await createBookingNotification(
            service.createdBy._id,
            'booking',
            providerNotificationTitle,
            providerNotificationMessage,
            booking._id
        );

        // Prepare booking details for emails
        const bookingEmailDetails = {
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone || '',
            vendorName: service.createdBy.name,
            serviceName: service.title,
            serviceCategory: service.category,
            serviceLocation: service.location,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            guests: booking.guests,
            totalAmount: booking.totalAmount,
            bookingId: booking._id.toString().slice(-8).toUpperCase()
        };

        // Send confirmation email to user (don't await to avoid delaying response)
        sendBookingConfirmationToUser(user.email, bookingEmailDetails).catch(err => {
            console.error('Failed to send booking confirmation to user:', err);
        });

        // Send notification email to vendor (don't await to avoid delaying response)
        sendBookingNotificationToVendor(service.createdBy.email, bookingEmailDetails).catch(err => {
            console.error('Failed to send booking notification to vendor:', err);
        });

        res.status(201).json({
            success: true,
            message: "Booking created successfully. Pending vendor confirmation.",
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

// ============= BOOKING APPROVAL/REJECTION =============

// Approve pending booking (Provider only)
app.put("/api/provider/bookings/:id/approve", authenticateJWT, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { message } = req.body; // Optional message to customer

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId')
            .populate('serviceId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is the provider
        if (booking.providerId._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the service provider can approve bookings"
            });
        }

        // Check if booking is pending
        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve booking with status: ${booking.status}. Only pending bookings can be approved.`
            });
        }

        // Check availability before approving
        const isAvailable = await Booking.checkAvailability(
            booking.serviceId._id,
            booking.checkInDate,
            booking.checkOutDate,
            booking._id
        );

        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Dates are no longer available. Another booking has been confirmed for this period."
            });
        }

        // Approve booking
        booking.status = 'confirmed';
        await booking.save();

        // Increment service bookings count
        await Service.findByIdAndUpdate(
            booking.serviceId._id,
            { $inc: { bookings: 1 } }
        );

        // Increment user total bookings
        await User.collection.updateOne(
            { _id: booking.userId._id },
            { $inc: { totalBookings: 1 } }
        );

        // Notify customer
        await createBookingNotification(
            booking.userId._id,
            'booking',
            'Booking Approved',
            message || `Your booking for ${booking.serviceName} has been approved by the provider`,
            booking._id
        );

        // Send approval email to customer
         sendBookingApprovedEmail(booking.userId.email, booking.userId.name, {
            serviceName: booking.serviceName,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate
        });

        res.status(200).json({
            success: true,
            message: "Booking approved successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({
            success: false,
            message: "Error approving booking",
            error: error.message
        });
    }
});

// Reject pending booking (Provider only)
app.put("/api/provider/bookings/:id/reject", authenticateJWT, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { reason } = req.body; // Reason for rejection

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is the provider
        if (booking.providerId._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the service provider can reject bookings"
            });
        }

        // Check if booking is pending
        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject booking with status: ${booking.status}. Only pending bookings can be rejected.`
            });
        }

        // Reject booking (set to cancelled)
        booking.status = 'cancelled';
        booking.cancelledBy = 'provider';
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason || 'Rejected by provider';
        await booking.save();

        // Notify customer
        await createBookingNotification(
            booking.userId._id,
            'booking',
            'Booking Rejected',
            reason
                ? `Your booking for ${booking.serviceName} was declined: ${reason}`
                : `Your booking for ${booking.serviceName} was declined by the provider`,
            booking._id
        );

        // Send rejection email to customer
         sendBookingRejectedEmail(booking.userId.email, booking.userId.name, {
            serviceName: booking.serviceName,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            reason: reason || null
        });

        res.status(200).json({
            success: true,
            message: "Booking rejected successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        res.status(500).json({
            success: false,
            message: "Error rejecting booking",
            error: error.message
        });
    }
});

// Get pending bookings for provider (requires action)
app.get("/api/provider/bookings/pending", authenticateJWT, async (req, res) => {
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

        const pendingBookings = await Booking.find({
            providerId: user._id,
            status: 'pending'
        })
            .populate('userId', 'name email profilePic phoneNumber')
            .populate('serviceId', 'title category images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Booking.countDocuments({
            providerId: user._id,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            data: pendingBookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            },
            message: total > 0
                ? `You have ${total} pending booking${total > 1 ? 's' : ''} awaiting your approval`
                : 'No pending bookings'
        });
    } catch (error) {
        console.error("Error fetching pending bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching pending bookings",
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

// ============= CANCELLATION & RESCHEDULING ROUTES =============

// Load cancellation policy and enhanced booking models
const CancellationPolicy = require('./model/CancellationPolicy');
const { seedDefaultPolicies } = require('./model/seeds/defaultCancellationPolicies');

// ============= CANCELLATION POLICY ENDPOINTS =============

// Get all cancellation policies (default + custom)
app.get("/api/provider/cancellation-policies", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get default policies + user's custom policies
        const policies = await CancellationPolicy.find({
            $or: [
                { isDefault: true, isActive: true },
                { createdBy: user._id, isActive: true }
            ]
        }).sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: policies
        });
    } catch (error) {
        console.error("Error fetching policies:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching cancellation policies",
            error: error.message
        });
    }
});

// Create custom cancellation policy
app.post("/api/provider/cancellation-policies", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const policyData = {
            ...req.body,
            createdBy: user._id,
            isDefault: false
        };

        const policy = await CancellationPolicy.create(policyData);

        res.status(201).json({
            success: true,
            message: "Cancellation policy created successfully",
            data: policy
        });
    } catch (error) {
        console.error("Error creating policy:", error);
        res.status(500).json({
            success: false,
            message: "Error creating cancellation policy",
            error: error.message
        });
    }
});

// Update cancellation policy
app.put("/api/provider/cancellation-policies/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { id } = req.params;

        const policy = await CancellationPolicy.findById(id);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Policy not found"
            });
        }

        // Can't edit default policies
        if (policy.isDefault) {
            return res.status(403).json({
                success: false,
                message: "Cannot modify default policies"
            });
        }

        // Check ownership
        if (policy.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to modify this policy"
            });
        }

        Object.assign(policy, req.body);
        await policy.save();

        res.status(200).json({
            success: true,
            message: "Policy updated successfully",
            data: policy
        });
    } catch (error) {
        console.error("Error updating policy:", error);
        res.status(500).json({
            success: false,
            message: "Error updating policy",
            error: error.message
        });
    }
});

// Delete (deactivate) cancellation policy
app.delete("/api/provider/cancellation-policies/:id", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { id } = req.params;

        const policy = await CancellationPolicy.findById(id);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Policy not found"
            });
        }

        // Can't delete default policies
        if (policy.isDefault) {
            return res.status(403).json({
                success: false,
                message: "Cannot delete default policies"
            });
        }

        // Check ownership
        if (policy.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this policy"
            });
        }

        // Soft delete
        policy.isActive = false;
        await policy.save();

        res.status(200).json({
            success: true,
            message: "Policy deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting policy:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting policy",
            error: error.message
        });
    }
});

// Get cancellation policy for a service
app.get("/api/services/:id/cancellation-policy", async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id).populate('cancellationPolicy');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // If no policy assigned, return default moderate policy
        let policy = service.cancellationPolicy;

        if (!policy) {
            policy = await CancellationPolicy.findOne({
                name: 'moderate',
                isDefault: true
            });
        }

        res.status(200).json({
            success: true,
            data: policy
        });
    } catch (error) {
        console.error("Error fetching service policy:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching service policy",
            error: error.message
        });
    }
});

// Set cancellation policy for a service
app.put("/api/provider/services/:id/cancellation-policy", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { id } = req.params;
        const { policyId } = req.body;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Check ownership
        if (service.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to modify this service"
            });
        }

        // Verify policy exists
        const policy = await CancellationPolicy.findById(policyId);
        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Policy not found"
            });
        }

        service.cancellationPolicy = policyId;
        await service.save();

        res.status(200).json({
            success: true,
            message: "Cancellation policy updated for service",
            data: service
        });
    } catch (error) {
        console.error("Error setting service policy:", error);
        res.status(500).json({
            success: false,
            message: "Error setting service policy",
            error: error.message
        });
    }
});

// ============= ENHANCED CANCELLATION ENDPOINTS =============

// Get cancellation preview with refund calculation
app.get("/api/bookings/:id/cancellation-preview", authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id).populate('serviceId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Calculate refund using the booking's own method
        const refundCalculation = booking.calculateRefund();

        res.status(200).json({
            success: true,
            data: {
                booking: {
                    id: booking._id,
                    serviceName: booking.serviceName,
                    serviceType: booking.serviceType,
                    cancellationPolicy: booking.cancellationPolicy,
                    totalAmount: booking.totalAmount,
                    checkInDate: booking.checkInDate,
                    timeSlot: booking.timeSlot
                },
                refund: refundCalculation
            }
        });
    } catch (error) {
        console.error("Error getting cancellation preview:", error);
        res.status(500).json({
            success: false,
            message: "Error calculating refund",
            error: error.message
        });
    }
});

// Enhanced cancel booking with policy enforcement
app.post("/api/bookings/:id/cancel", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { id } = req.params;
        const { reason, reasonCategory } = req.body;

        // Find booking
        const booking = await Booking.findById(id)
            .populate('userId')
            .populate('providerId')
            .populate('serviceId');

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

        // Check if already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled"
            });
        }

        // Calculate estimated refund using the booking's method (final refund determined by super admin)
        const refundCalculation = booking.calculateRefund();
        let estimatedRefund = {
            refundPercentage: isProvider ? 100 : refundCalculation.refundPercentage, // Provider cancellations = 100%
            totalRefund: booking.totalAmount,
            refundAmount: isProvider ? booking.totalAmount : refundCalculation.refundAmount,
            rule: isProvider ? 'provider_cancellation' : 'customer_cancellation',
            description: isProvider ? 'Full refund due to provider cancellation' : `Estimated refund (${refundCalculation.refundPercentage}%) pending super admin approval`,
            policyName: refundCalculation.policyName,
            hoursUntilService: refundCalculation.hoursUntilService,
            serviceType: refundCalculation.serviceType
        };

        // Create cancellation request instead of directly canceling
        booking.cancellationRequest = {
            status: 'pending',
            requestedAt: new Date(),
            requestedBy: isCustomer ? 'customer' : 'provider',
            reason: reason || 'No reason provided'
        };
        booking.cancellationReason = reason || 'No reason provided';

        await booking.save();

        // Send notifications
        const notifyUserId = isCustomer ? booking.providerId._id : booking.userId._id;
        await createBookingNotification(
            notifyUserId,
            'cancellation',
            'Cancellation Request Submitted',
            `A cancellation request for ${booking.serviceName} has been submitted by ${isCustomer ? 'customer' : 'provider'}. Pending Super Admin approval.`,
            booking._id
        );

        res.status(200).json({
            success: true,
            message: "Cancellation request submitted successfully. Pending Super Admin approval.",
            data: {
                booking,
                refund: estimatedRefund
            }
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

// Get all cancellation requests for provider
app.get("/api/provider/cancellation-requests", authenticateJWT, async (req, res) => {
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

        let query = {
            providerId: user._id,
            status: 'cancelled'
        };

        const cancellations = await Booking.find(query)
            .populate('userId', 'name email profilePic')
            .populate('serviceId', 'title images')
            .sort({ cancelledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Booking.countDocuments(query);

        // Calculate statistics
        const stats = {
            totalCancellations: total,
            customerCancelled: await Booking.countDocuments({
                ...query,
                cancelledBy: 'customer'
            }),
            providerCancelled: await Booking.countDocuments({
                ...query,
                cancelledBy: 'provider'
            })
        };

        res.status(200).json({
            success: true,
            data: cancellations,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching cancellations:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching cancellations",
            error: error.message
        });
    }
});

// ============= RESCHEDULING ENDPOINTS =============

// Request to reschedule booking
app.post("/api/bookings/:id/reschedule", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { id } = req.params;
        const { newCheckInDate, newCheckOutDate, message } = req.body;

        if (!newCheckInDate || !newCheckOutDate) {
            return res.status(400).json({
                success: false,
                message: "New check-in and check-out dates are required"
            });
        }

        const booking = await Booking.findById(id)
            .populate('userId')
            .populate('providerId')
            .populate('serviceId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check authorization
        const isCustomer = booking.userId._id.toString() === user._id.toString();
        const isProvider = booking.providerId._id.toString() === user._id.toString();

        if (!isCustomer && !isProvider) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to reschedule this booking"
            });
        }

        // Check if booking can be rescheduled
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: "This booking cannot be rescheduled"
            });
        }

        // Check availability for new dates
        const isAvailable = await Booking.checkAvailability(
            booking.serviceId._id,
            newCheckInDate,
            newCheckOutDate,
            booking._id
        );

        // Calculate new pricing
        const newCheckIn = new Date(newCheckInDate);
        const newCheckOut = new Date(newCheckOutDate);
        const numberOfNights = Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24));

        const nightlyRate = booking.serviceId.price;
        const newBaseAmount = nightlyRate * numberOfNights;
        const newTotal = newBaseAmount;

        const priceDifference = newTotal - booking.totalAmount;

        // Create reschedule request
        const crypto = require('crypto');
        const requestId = crypto.randomBytes(8).toString('hex');

        const rescheduleRequest = {
            requestId,
            requestedBy: isCustomer ? 'customer' : 'provider',
            requestedAt: new Date(),
            originalDates: {
                checkIn: booking.checkInDate,
                checkOut: booking.checkOutDate
            },
            newDates: {
                checkIn: new Date(newCheckInDate),
                checkOut: new Date(newCheckOutDate)
            },
            isAvailable,
            pricing: {
                originalTotal: booking.totalAmount,
                newTotal,
                difference: priceDifference,
                newBreakdown: {
                    baseAmount: newBaseAmount,
                    numberOfNights,
                    nightlyRate
                }
            },
            message,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        // Initialize reschedule if not exists
        if (!booking.reschedule) {
            booking.reschedule = {
                hasActiveRequest: false,
                requests: [],
                rescheduledCount: 0,
                maxReschedules: 3
            };
        }

        booking.reschedule.requests.push(rescheduleRequest);
        booking.reschedule.hasActiveRequest = true;
        booking.markModified('reschedule');

        await booking.save();

        // Notify other party
        const notifyUserId = isCustomer ? booking.providerId._id : booking.userId._id;
        await createBookingNotification(
            notifyUserId,
            'booking',
            'Reschedule Request',
            `${isCustomer ? 'Customer' : 'Provider'} has requested to reschedule booking for ${booking.serviceName}`,
            booking._id
        );

        res.status(200).json({
            success: true,
            message: "Reschedule request submitted successfully",
            data: {
                booking,
                request: rescheduleRequest
            }
        });
    } catch (error) {
        console.error("Error requesting reschedule:", error);
        res.status(500).json({
            success: false,
            message: "Error requesting reschedule",
            error: error.message
        });
    }
});

// Get pricing quote for new dates
app.get("/api/bookings/:id/reschedule-quote", authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { newCheckInDate, newCheckOutDate } = req.query;

        if (!newCheckInDate || !newCheckOutDate) {
            return res.status(400).json({
                success: false,
                message: "New dates are required"
            });
        }

        const booking = await Booking.findById(id).populate('serviceId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check availability
        const isAvailable = await Booking.checkAvailability(
            booking.serviceId._id,
            newCheckInDate,
            newCheckOutDate,
            booking._id
        );

        // Calculate pricing
        const newCheckIn = new Date(newCheckInDate);
        const newCheckOut = new Date(newCheckOutDate);
        const numberOfNights = Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24));

        const nightlyRate = booking.serviceId.price;
        const newBaseAmount = nightlyRate * numberOfNights;
        const newTotal = newBaseAmount;

        const priceDifference = newTotal - booking.totalAmount;

        res.status(200).json({
            success: true,
            data: {
                isAvailable,
                originalTotal: booking.totalAmount,
                newTotal,
                priceDifference,
                numberOfNights,
                nightlyRate,
                message: priceDifference > 0
                    ? `You will need to pay an additional $${priceDifference.toFixed(2)}`
                    : priceDifference < 0
                    ? `You will receive a refund of $${Math.abs(priceDifference).toFixed(2)}`
                    : 'No price change'
            }
        });
    } catch (error) {
        console.error("Error getting reschedule quote:", error);
        res.status(500).json({
            success: false,
            message: "Error calculating quote",
            error: error.message
        });
    }
});

// Approve reschedule request
app.put("/api/provider/reschedule-requests/:bookingId/approve", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { bookingId } = req.params;
        const { requestId, message } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is provider
        if (booking.providerId._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the provider can approve reschedule requests"
            });
        }

        // Find request
        const request = booking.reschedule?.requests?.find(r => r.requestId === requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Reschedule request not found"
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Request has already been processed"
            });
        }

        // Check if expired
        if (new Date() > new Date(request.expiresAt)) {
            request.status = 'expired';
            booking.markModified('reschedule');
            await booking.save();
            return res.status(400).json({
                success: false,
                message: "Request has expired"
            });
        }

        // Update booking dates
        booking.checkInDate = request.newDates.checkIn;
        booking.checkOutDate = request.newDates.checkOut;
        booking.totalAmount = request.pricing.newTotal;

        // Update request status
        request.status = 'approved';
        request.appliedAt = new Date();
        request.response = {
            respondedAt: new Date(),
            message
        };

        booking.reschedule.hasActiveRequest = false;
        booking.reschedule.rescheduledCount = (booking.reschedule.rescheduledCount || 0) + 1;
        booking.reschedule.lastRescheduledAt = new Date();

        booking.markModified('reschedule');
        await booking.save();

        // Notify customer
        await createBookingNotification(
            booking.userId._id,
            'booking',
            'Reschedule Approved',
            `Your reschedule request for ${booking.serviceName} has been approved`,
            booking._id
        );

        res.status(200).json({
            success: true,
            message: "Reschedule request approved successfully",
            data: booking
        });
    } catch (error) {
        console.error("Error approving reschedule:", error);
        res.status(500).json({
            success: false,
            message: "Error approving reschedule",
            error: error.message
        });
    }
});

// Reject reschedule request
app.put("/api/provider/reschedule-requests/:bookingId/reject", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });
        const { bookingId } = req.params;
        const { requestId, message } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('userId')
            .populate('providerId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if user is provider
        if (booking.providerId._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only the provider can reject reschedule requests"
            });
        }

        // Find request
        const request = booking.reschedule?.requests?.find(r => r.requestId === requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Reschedule request not found"
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Request has already been processed"
            });
        }

        // Update request status
        request.status = 'rejected';
        request.response = {
            respondedAt: new Date(),
            message
        };

        booking.reschedule.hasActiveRequest = false;
        booking.markModified('reschedule');

        await booking.save();

        // Notify customer
        await createBookingNotification(
            booking.userId._id,
            'booking',
            'Reschedule Rejected',
            `Your reschedule request for ${booking.serviceName} has been declined`,
            booking._id
        );

        res.status(200).json({
            success: true,
            message: "Reschedule request rejected",
            data: booking
        });
    } catch (error) {
        console.error("Error rejecting reschedule:", error);
        res.status(500).json({
            success: false,
            message: "Error rejecting reschedule",
            error: error.message
        });
    }
});

// Get all reschedule requests for provider
app.get("/api/provider/reschedule-requests", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { status = 'pending', page = 1, limit = 20 } = req.query;

        // Find bookings with reschedule requests
        let query = {
            providerId: user._id,
            'reschedule.hasActiveRequest': true
        };

        const bookings = await Booking.find(query)
            .populate('userId', 'name email profilePic')
            .populate('serviceId', 'title images')
            .sort({ 'reschedule.requests.requestedAt': -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Extract only the active requests
        const rescheduleRequests = bookings.map(booking => {
            const activeRequest = booking.reschedule?.requests?.find(r => r.status === 'pending');
            return {
                ...booking,
                activeRequest
            };
        }).filter(b => b.activeRequest);

        const total = rescheduleRequests.length;

        res.status(200).json({
            success: true,
            data: rescheduleRequests,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching reschedule requests:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reschedule requests",
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

// ============= SYSTEM INITIALIZATION =============

// Initialize default cancellation policies (run once)
app.post("/api/admin/init-policies", authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        // Check if user is admin
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only administrators can initialize policies"
            });
        }

        console.log('Initializing default cancellation policies...');
        const policies = await seedDefaultPolicies();

        res.status(200).json({
            success: true,
            message: "Default cancellation policies initialized successfully",
            data: policies
        });
    } catch (error) {
        console.error("Error initializing policies:", error);
        res.status(500).json({
            success: false,
            message: "Error initializing policies",
            error: error.message
        });
    }
});

// Check if default policies exist
app.get("/api/admin/policies-status", authenticateJWT, async (req, res) => {
    try {
        const count = await CancellationPolicy.countDocuments({ isDefault: true });

        res.status(200).json({
            success: true,
            data: {
                defaultPoliciesCount: count,
                isInitialized: count > 0,
                message: count > 0
                    ? `${count} default policies found`
                    : 'No default policies found. Run POST /api/admin/init-policies to initialize.'
            }
        });
    } catch (error) {
        console.error("Error checking policies status:", error);
        res.status(500).json({
            success: false,
            message: "Error checking policies status",
            error: error.message
        });
    }
});

// ============= SUPER ADMIN ROUTES =============

// Get all vendors (super admin only)
app.get("/api/super-admin/vendors", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;

        const query = { role: 'vendor' };

        // Search by name, email, or business name
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { businessName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const vendors = await User.find(query)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        // Get service counts for each vendor
        const vendorsWithServiceCount = await Promise.all(
            vendors.map(async (vendor) => {
                const serviceCount = await Service.countDocuments({ createdBy: vendor._id });
                return {
                    ...vendor.toObject(),
                    servicesCount: serviceCount
                };
            })
        );

        res.status(200).json({
            success: true,
            vendors: vendorsWithServiceCount,
            total,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching vendors",
            error: error.message
        });
    }
});

// Debug endpoint to check vendor data (super admin only)
app.get("/api/super-admin/debug-vendor/:vendorId", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Get vendor user
        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        // Get services created by this vendor
        const services = await Service.find({ createdBy: vendorId });

        // Get bookings for this vendor's services
        const serviceIds = services.map(s => s._id);
        const bookings = await Booking.find({ serviceId: { $in: serviceIds } });

        // Get bookings by providerId
        const bookingsByProviderId = await Booking.find({ providerId: vendorId });

        res.status(200).json({
            success: true,
            data: {
                vendor: {
                    _id: vendor._id,
                    name: vendor.name,
                    email: vendor.email,
                    role: vendor.role,
                    businessName: vendor.businessName,
                    googleId: vendor.googleId
                },
                services: {
                    count: services.length,
                    list: services.map(s => ({
                        _id: s._id,
                        title: s.title,
                        createdBy: s.createdBy,
                        status: s.status
                    }))
                },
                bookings: {
                    byServiceId: {
                        count: bookings.length,
                        list: bookings.map(b => ({
                            _id: b._id,
                            serviceId: b.serviceId,
                            providerId: b.providerId,
                            status: b.status
                        }))
                    },
                    byProviderId: {
                        count: bookingsByProviderId.length,
                        list: bookingsByProviderId.map(b => ({
                            _id: b._id,
                            serviceId: b.serviceId,
                            providerId: b.providerId,
                            status: b.status
                        }))
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error debugging vendor:", error);
        res.status(500).json({
            success: false,
            message: "Error debugging vendor",
            error: error.message
        });
    }
});

// Migration endpoint to fix existing vendors (super admin only)
app.post("/api/super-admin/fix-vendor-roles", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        // Find all users who have business information but no vendor role
        const usersWithBusiness = await User.find({
            $and: [
                { $or: [
                    { businessName: { $exists: true, $ne: '' } },
                    { businessType: { $exists: true, $ne: '' } },
                    { businessDescription: { $exists: true, $ne: '' } }
                ]},
                { $or: [
                    { role: { $exists: false } },
                    { role: { $ne: 'vendor' } },
                    { role: null }
                ]}
            ]
        });

        console.log(`Found ${usersWithBusiness.length} users with business info but no vendor role`);

        // Update all of them to have vendor role
        const updateResult = await User.updateMany(
            {
                _id: { $in: usersWithBusiness.map(u => u._id) }
            },
            {
                $set: { role: 'vendor' }
            }
        );

        res.status(200).json({
            success: true,
            message: `Successfully updated ${updateResult.modifiedCount} users to vendor role`,
            data: {
                found: usersWithBusiness.length,
                updated: updateResult.modifiedCount,
                users: usersWithBusiness.map(u => ({
                    id: u._id,
                    name: u.name,
                    email: u.email,
                    businessName: u.businessName
                }))
            }
        });
    } catch (error) {
        console.error("Error fixing vendor roles:", error);
        res.status(500).json({
            success: false,
            message: "Error fixing vendor roles",
            error: error.message
        });
    }
});

// Get all bookings from all vendors (super admin only)
app.get("/api/super-admin/bookings", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { status, vendorId, startDate, endDate, page = 1, limit = 20 } = req.query;

        const query = {};

        if (status) query.status = status;
        if (vendorId) {
            const service = await Service.findOne({ createdBy: vendorId });
            if (service) query.serviceId = service._id;
        }
        if (startDate || endDate) {
            query.checkInDate = {};
            if (startDate) query.checkInDate.$gte = new Date(startDate);
            if (endDate) query.checkInDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const bookings = await Booking.find(query)
            .populate('serviceId', 'title category price priceType')
            .populate('userId', 'name email phoneNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// Get all services from all vendors (super admin only)
app.get("/api/super-admin/services", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { category, status, search, page = 1, limit = 20 } = req.query;

        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const services = await Service.find(query)
            .populate('createdBy', 'name email businessName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Service.countDocuments(query);

        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching all services:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching services",
            error: error.message
        });
    }
});

// Get all cancellation/reschedule requests (super admin only)
app.get("/api/super-admin/cancellation-requests", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        // Default: only show bookings with cancellation requests
        const query = {
            'cancellationRequest.status': { $exists: true }
        };

        // Find bookings with cancellation or reschedule requests
        if (status === 'pending') {
            query['cancellationRequest.status'] = 'pending';
        } else if (status === 'approved') {
            query['cancellationRequest.status'] = 'approved';
        } else if (status === 'rejected') {
            query['cancellationRequest.status'] = 'rejected';
        }

        // Type filter (for future if we add reschedule requests)
        if (type === 'cancellation') {
            query.cancellationRequest = { $exists: true, $ne: null };
        } else if (type === 'reschedule') {
            query.rescheduleRequest = { $exists: true, $ne: null };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const requests = await Booking.find(query)
            .populate('serviceId', 'title category price')
            .populate('userId', 'name email phoneNumber')
            .populate('providerId', 'name email businessName')
            .sort({ 'cancellationRequest.requestedAt': -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        // Add refundAmount to each request based on who requested cancellation
        const requestsWithRefund = requests.map(booking => {
            const bookingObj = booking.toObject();
            // Provider cancellations = 100%, customer = 80%
            const isProviderCancellation = booking.cancellationRequest?.requestedBy === 'provider';
            bookingObj.refundAmount = isProviderCancellation
                ? booking.totalAmount
                : Math.round(booking.totalAmount * 0.8);
            return bookingObj;
        });

        // Calculate stats
        const approvedToday = await Booking.countDocuments({
            'cancellationRequest.status': 'approved',
            'cancellationRequest.processedAt': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        const totalRefundAmount = await Booking.aggregate([
            { $match: { 'cancellationRequest.status': 'pending' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.status(200).json({
            success: true,
            requests: requestsWithRefund,
            approvedToday,
            totalRefundAmount: totalRefundAmount[0]?.total || 0,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching cancellation requests:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching cancellation requests",
            error: error.message
        });
    }
});

// Approve/Reject cancellation request (super admin only)
app.put("/api/super-admin/cancellation-requests/:bookingId/:action", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const { bookingId, action } = req.params;
        const { adminNotes } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'approve' or 'reject'"
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate('serviceId', 'title')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (!booking.userId) {
            return res.status(400).json({
                success: false,
                message: "Booking has no customer information"
            });
        }

        if (!booking.serviceId) {
            return res.status(400).json({
                success: false,
                message: "Booking has no service information"
            });
        }

        if (!booking.cancellationRequest) {
            return res.status(400).json({
                success: false,
                message: "No cancellation request found for this booking"
            });
        }

        console.log('📝 Current cancellation request:', booking.cancellationRequest);
        console.log('📝 Super admin ID:', req.superAdmin._id);

        // Update cancellation request
        booking.cancellationRequest.status = action === 'approve' ? 'approved' : 'rejected';
        booking.cancellationRequest.processedAt = new Date();
        booking.cancellationRequest.processedBy = req.superAdmin._id;
        booking.cancellationRequest.adminNotes = adminNotes || `${action === 'approve' ? 'Approved' : 'Rejected'} by Super Admin`;

        // If approved, update booking status
        if (action === 'approve') {
            booking.status = 'cancelled';
            booking.cancelledAt = new Date();
            booking.cancelledBy = booking.cancellationRequest.requestedBy === 'customer' ? 'customer' : 'provider';
        }

        // Mark the nested object as modified so Mongoose saves it
        booking.markModified('cancellationRequest');

        console.log('💾 Saving booking...');
        await booking.save();
        console.log('✅ Booking saved successfully');

        console.log('📧 Creating notification for customer:', booking.userId._id);
        // Create notification for customer
        await Notification.create({
            userId: booking.userId._id,
            type: 'cancellation',
            title: `Cancellation Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            message: `Your cancellation request for "${booking.serviceId.title}" has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
            relatedId: booking._id,
            relatedType: 'booking'
        });
        console.log('✅ Customer notification created');

        // Create notification for provider if different from customer
        if (booking.providerId && booking.providerId.toString() !== booking.userId._id.toString()) {
            console.log('📧 Creating notification for provider:', booking.providerId);
            await Notification.create({
                userId: booking.providerId,
                type: 'cancellation',
                title: `Cancellation Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                message: `A cancellation request for "${booking.serviceId.title}" has been ${action === 'approve' ? 'approved' : 'rejected'} by Super Admin.`,
                relatedId: booking._id,
                relatedType: 'booking'
            });
            console.log('✅ Provider notification created');
        }

        res.status(200).json({
            success: true,
            message: `Cancellation request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            data: booking
        });
    } catch (error) {
        console.error("Error processing cancellation request:", error);
        res.status(500).json({
            success: false,
            message: "Error processing cancellation request",
            error: error.message
        });
    }
});

// Get dashboard stats (super admin only)
app.get("/api/super-admin/stats", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [
            totalVendors,
            newVendorsThisMonth,
            totalBookings,
            pendingBookings,
            todayBookings,
            weekBookings,
            monthBookings,
            totalServices,
            activeServices,
            pendingCancellations,
            totalRevenue,
            totalEvents,
            upcomingEvents
        ] = await Promise.all([
            User.countDocuments({ role: 'vendor' }),
            User.countDocuments({ role: 'vendor', createdAt: { $gte: startOfMonth } }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'pending' }),
            Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
            Booking.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Service.countDocuments(),
            Service.countDocuments({ status: 'active' }),
            Booking.countDocuments({ 'cancellationRequest.status': 'pending' }),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Event.countDocuments(),
            Event.countDocuments({ eventDate: { $gte: now }, status: 'active' })
        ]);

        // Get top vendor
        const topVendorData = await Booking.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: '$providerId', bookingCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
            { $sort: { revenue: -1 } },
            { $limit: 1 }
        ]);

        let topVendor = null;
        if (topVendorData.length > 0) {
            const vendorUser = await User.findById(topVendorData[0]._id);
            topVendor = {
                name: vendorUser?.name || 'N/A',
                revenue: topVendorData[0].revenue
            };
        }

        // Calculate completion rate
        const completedBookings = await Booking.countDocuments({ status: 'completed' });
        const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

        // Calculate platform revenue (5% of total)
        const platformRevenue = Math.round((totalRevenue[0]?.total || 0) * 0.05);

        res.status(200).json({
            success: true,
            totalVendors,
            newVendorsThisMonth,
            totalBookings,
            pendingBookings,
            todayBookings,
            weekBookings,
            monthBookings,
            totalServices,
            activeServices,
            pendingCancellations,
            platformRevenue,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalEvents,
            upcomingEvents,
            topVendor,
            completionRate,
            averageRating: 4.5 // TODO: Calculate from reviews
        });
    } catch (error) {
        console.error("Error fetching super admin stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching stats",
            error: error.message
        });
    }
});

// ============= EVENTS ROUTES =============

// Get all events (public - no auth required)
app.get("/api/events", async (req, res) => {
    try {
        const { status, category, search, featured, page = 1, limit = 20 } = req.query;

        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (featured === 'true') query.featured = true;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(query)
            .populate('createdBy', 'name email')
            .sort({ eventDate: 1 }) // Sort by event date ascending
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Event.countDocuments(query);

        console.log('📸 Returning events, first event image:', events[0]?.image);
        console.log('📸 Returning events, first event images array:', events[0]?.images);

        res.status(200).json({
            success: true,
            data: events,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching events",
            error: error.message
        });
    }
});

// Get single event by ID (public - no auth required)
app.get("/api/events/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching event",
            error: error.message
        });
    }
});

// Create event (super admin only)
app.post("/api/super-admin/events", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            eventDate,
            eventTime,
            location,
            venue,
            latitude,
            longitude,
            ticketPrice,
            image,
            category,
            capacity,
            tags,
            featured
        } = req.body;

        console.log('📸 Received image data:', image);
        console.log('📸 Image URL:', image?.url);
        console.log('📸 Full request body:', req.body);

        // Validate required fields
        if (!title || !eventDate || !eventTime || !location || ticketPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, eventDate, eventTime, location, ticketPrice"
            });
        }

        const eventImageUrl = image?.url || '';
        const eventImages = image ? [image] : [];

        console.log('📸 Setting event image URL:', eventImageUrl);
        console.log('📸 Setting event images array:', eventImages);

        const event = new Event({
            title,
            description,
            eventDate,
            eventTime,
            location,
            venue,
            latitude: latitude || 0,
            longitude: longitude || 0,
            ticketPrice,
            price: ticketPrice, // Also set price for backward compatibility
            image: eventImageUrl,
            images: eventImages,
            category: category || 'General',
            capacity: capacity || 0,
            availableTickets: capacity || 0,
            tags: tags || [],
            featured: featured || false,
            createdBy: req.superAdmin._id,
            status: 'active'
        });

        await event.save();

        console.log('✅ Event saved successfully');
        console.log('📸 Saved event image:', event.image);
        console.log('📸 Saved event images array:', event.images);

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: event
        });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({
            success: false,
            message: "Error creating event",
            error: error.message
        });
    }
});

// Update event (super admin only)
app.put("/api/super-admin/events/:id", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const {
            title,
            description,
            eventDate,
            eventTime,
            location,
            venue,
            latitude,
            longitude,
            ticketPrice,
            image,
            category,
            capacity,
            availableTickets,
            status,
            tags,
            featured
        } = req.body;

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Update fields
        if (title) event.title = title;
        if (description !== undefined) event.description = description;
        if (eventDate) event.eventDate = eventDate;
        if (eventTime) event.eventTime = eventTime;
        if (location) event.location = location;
        if (venue !== undefined) event.venue = venue;
        if (latitude !== undefined) event.latitude = latitude;
        if (longitude !== undefined) event.longitude = longitude;
        if (ticketPrice !== undefined) {
            event.ticketPrice = ticketPrice;
            event.price = ticketPrice; // Also update price for backward compatibility
        }
        if (image) {
            event.image = image.url || image;
            event.images = [image];
        }
        if (category) event.category = category;
        if (capacity !== undefined) {
            event.capacity = capacity;
            // If capacity increased, add to available tickets
            if (capacity > event.capacity) {
                event.availableTickets += (capacity - event.capacity);
            }
        }
        if (availableTickets !== undefined) event.availableTickets = availableTickets;
        if (status) event.status = status;
        if (tags) event.tags = tags;
        if (featured !== undefined) event.featured = featured;

        await event.save();

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            data: event
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({
            success: false,
            message: "Error updating event",
            error: error.message
        });
    }
});

// Delete event (super admin only)
app.delete("/api/super-admin/events/:id", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Delete image from Cloudinary
        if (event.image && event.image.publicId) {
            try {
                await cloudinary.uploader.destroy(event.image.publicId);
            } catch (cloudinaryError) {
                console.error("Error deleting image from Cloudinary:", cloudinaryError);
            }
        }

        await Event.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting event",
            error: error.message
        });
    }
});

// Get event statistics (super admin only)
app.get("/api/super-admin/events/stats/overview", authenticateJWT, requireSuperAdmin, async (req, res) => {
    try {
        const [
            totalEvents,
            upcomingEvents,
            ongoingEvents,
            completedEvents
        ] = await Promise.all([
            Event.countDocuments(),
            Event.countDocuments({ status: 'upcoming' }),
            Event.countDocuments({ status: 'ongoing' }),
            Event.countDocuments({ status: 'completed' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalEvents,
                upcomingEvents,
                ongoingEvents,
                completedEvents
            }
        });
    } catch (error) {
        console.error("Error fetching event stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching event statistics",
            error: error.message
        });
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