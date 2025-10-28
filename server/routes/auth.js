import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { sendWelcomeEmail, sendLoginNotificationEmail } from '../services/emailService.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

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
    const existingUser = await User.findOne({ where: { email } });
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

    console.log('✅ User created:', { id: user.id, email: user.email, role: user.role });

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
      id: user.id,
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
        id: user.id,
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
    const user = await User.findOne({ where: { email } });
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

    console.log('✅ Login successful:', { id: user.id, email: user.email });

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
      id: user.id,
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
        id: user.id,
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
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'emailVerified']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
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

export default router;

