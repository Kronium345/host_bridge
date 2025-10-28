import { Router } from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.mongoose.js';
import { sendWelcomeEmail, sendLoginNotificationEmail } from '../services/emailService.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

const googleClient = new OAuth2Client(process.env.WEB_CLIENT_ID);

/**
 * GET /api/config/google - Get Google OAuth client ID
 */
router.get('/config/google', (req, res) => {
  res.json({
    clientId: process.env.WEB_CLIENT_ID
  });
});

/**
 * POST /api/register - Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone_number, role } = req.body;

    console.log('📝 Registration attempt:', { email, role });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine user role
    const userRole = role && ['landlord', 'operator'].includes(role) ? role : 'user';

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName: first_name || '',
      lastName: last_name || '',
      phoneNumber: phone_number || '',
      role: userRole
    });

    console.log('✅ User created:', { id: user._id, email: user.email, role: user.role });

    // Send welcome email (non-blocking)
    const userName = first_name || email.split('@')[0];
    sendWelcomeEmail(email, userName, userRole).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Generate JWT token
    const token = generateToken(user);

    // Set token in cookie (for web)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Also set session (for backward compatibility)
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Registration successful',
      token, // Return token for mobile/API clients
      user: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * POST /api/login - User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Login successful:', { id: user._id, email: user.email });

    // Send login notification (non-blocking)
    const userName = user.firstName || email.split('@')[0];
    sendLoginNotificationEmail(email, userName).catch(err => {
      console.error('Failed to send login notification:', err);
    });

    // Generate JWT token
    const token = generateToken(user);

    // Set token in cookie (for web)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Create session (for backward compatibility)
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Login successful',
      token, // Return token for mobile/API clients
      user: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/logout - User logout
 */
router.post('/logout', (req, res) => {
  const userEmail = req.session.user?.email;

  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    // Clear all auth cookies
    res.clearCookie('connect.sid');
    res.clearCookie('token');
    console.log('👋 User logged out:', userEmail);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * GET /api/user/status - Check authentication status
 */
router.get('/user/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

/**
 * GET /api/user/profile - Get user profile (requires authentication)
 */
router.get('/user/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email firstName lastName phoneNumber role emailVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        phone_number: user.phoneNumber,
        role: user.role,
        email_verified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * POST /api/auth/google - Google OAuth authentication
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    console.log('🔐 Google OAuth attempt');

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || process.env.WEB_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, given_name, family_name } = payload;

    console.log('✅ Google token verified:', { email, name });

    // Find existing user by email
    let user = await User.findOne({ email });
    let isNewUser = false;

    // Create user if not found
    if (!user) {
      isNewUser = true;
      console.log('📝 Creating new user from Google OAuth');

      // Split name into first and last
      const firstName = given_name || (name ? name.split(' ')[0] : '');
      const lastName = family_name || (name ? name.split(' ').slice(1).join(' ') : '');

      // Determine user role (use provided role if valid, otherwise default to 'user')
      const userRole = role && ['landlord', 'operator'].includes(role) ? role : 'user';

      user = await User.create({
        email,
        password: null, // No password for Google users
        firstName,
        lastName,
        phoneNumber: '',
        role: userRole, // Use role from registration page or default
        authProvider: 'google',
        profilePicture: picture,
        emailVerified: true // Google emails are pre-verified
      });

      console.log('✅ New Google user created:', { id: user._id, email: user.email, role: user.role });

      // Send welcome email (non-blocking)
      const userName = firstName || email.split('@')[0];
      sendWelcomeEmail(email, userName, user.role).catch(err => {
        console.error('Failed to send welcome email to Google user:', err);
      });
    } else {
      console.log('✅ Existing user found:', { id: user._id, email: user.email });

      // Send login notification (non-blocking)
      const userName = user.firstName || email.split('@')[0];
      sendLoginNotificationEmail(email, userName).catch(err => {
        console.error('Failed to send login notification:', err);
      });
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Set token in cookie (for web)
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Create session
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token: authToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        profile_picture: user.profilePicture,
        auth_provider: user.authProvider || 'google',
        is_new_user: isNewUser
      }
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});

export default router;

