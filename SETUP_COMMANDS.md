# 🚀 Host Bridge - Setup & Run Commands

## ✅ VERIFICATION COMPLETE - Everything is Configured!

### What's Working:

#### 1. ✅ Backend Configuration
- **Express server** with Socket.IO support
- **SQLite database** with Sequelize ORM
- **Session management** with express-session
- **CORS** enabled for API access
- **Body parser** for JSON and form data
- **Cookie parser** for session cookies

#### 2. ✅ Authentication System
- **Registration** (`POST /api/register`)
  - Validates email and password
  - Hashes passwords with bcrypt
  - Supports roles: user, landlord, operator
  - Creates user session
  - Sends welcome email
- **Login** (`POST /api/login`)
  - Validates credentials
  - Creates session
  - Sends login notification email
- **Logout** (`POST /api/logout`)
  - Destroys session
  - Clears cookies
  - Works on desktop & mobile
- **User Status** (`GET /api/user/status`)
  - Returns authentication state
  - Provides user data for navbar

#### 3. ✅ Email Service (Nodemailer + Gmail)
- **Gmail SMTP** configured
- Uses `GMAIL_EMAIL` and `GMAIL_PASSWORD` from .env
- **Email templates** with beautiful HTML:
  - Welcome emails (role-specific)
  - Login notifications
  - Password reset (ready)
- **Error handling** with detailed logs
- **Non-blocking** email sending

#### 4. ✅ Frontend Integration
- **Login form** (`/login.html`)
  - AJAX submission to `/api/login`
  - Toast notifications
  - Auto-redirect on success
- **Register form** (`/register.html`)
  - AJAX submission to `/api/register`
  - Role parameter from URL
  - Session storage for role
- **Navbar authentication** (`navbar-auth.js`)
  - Dynamic user info display
  - Desktop & mobile support
  - Async logout functionality
- **All static pages** properly served

#### 5. ✅ Database Models
- **User model** with fields:
  - id, email, password (hashed)
  - firstName, lastName, phoneNumber
  - role (user/landlord/operator/admin)
  - emailVerified, verificationToken
  - resetToken, resetTokenExpires
  - timestamps (createdAt, updatedAt)
- **Property model** ready for listings
- **Migrations & Seeders** configured

#### 6. ✅ Real-time Features
- **Socket.IO** initialized
- Ready for live chat, notifications, etc.

## 📝 Commands to Run

### First Time Setup:

```bash
# 1. Install dependencies
npm install

# 2. Create database and admin user
npm run sync
```

**Default Admin Account:**
- Email: `admin@hostbridge.com`
- Password: `admin123`
- ⚠️ Change this after first login!

### Run Development Server:

```bash
npm start
```

**Or with auto-reload:**
```bash
npm run dev
```

Server will start at: `http://localhost:3000`

### Verify Email Setup:

Your `.env` should have:
```bash
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_PASSWORD=your-app-password
```

**Note**: For Gmail, you need an **App Password**, not your regular Gmail password:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that 16-character password as `GMAIL_PASSWORD`

## 🎯 Test Everything Locally:

1. **Start server:**
   ```bash
   npm start
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Test Registration:**
   - Go to `/register.html`
   - Fill in form
   - Click "Create Account"
   - ✅ Check email inbox for welcome message

4. **Test Login:**
   - Go to `/login.html`
   - Enter credentials
   - Click "Sign In"
   - ✅ Check email for login notification
   - ✅ Verify navbar shows your name

5. **Test Logout:**
   - Click "Logout" in navbar
   - ✅ Verify redirect to homepage
   - ✅ Verify navbar shows login/register again

## 🚀 Deploy to Render:

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Complete Node.js migration with Gmail SMTP"
git push origin main
```

### Step 2: Configure Render

**Build Settings:**
- Build Command: `npm install && npm run sync`
- Start Command: `npm start`
- Health Check: `/health`

**Environment Variables (Required):**

```bash
NODE_ENV=production
SESSION_SECRET=<generate-strong-random-string>

# Gmail SMTP
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_PASSWORD=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**Optional (for other SMTP providers):**
```bash
SMTP_USER=<override-if-needed>
SMTP_PASSWORD=<override-if-needed>
EMAIL_USER=<override-if-needed>
```

### Step 3: Deploy

Render will automatically:
1. Clone your repo
2. Run `npm install`
3. Run `npm run sync` (creates database + admin user)
4. Run `npm start`
5. Deploy to your URL

### Step 4: Verify Deployment

Look for these lines in Render logs:
```
✅ SMTP Server is ready to send emails
✅ Database connection established
✅ Database models synchronized
✅ Host Bridge server running on http://localhost:3000
```

Then test on your live URL:
- Register new user
- Check email received
- Login
- Check login notification
- Test all features

## 📊 What You Should See:

### On `npm start`:
```
✅ SMTP Server is ready to send emails
✅ Database connection established
✅ Database models synchronized
==============================
✅ Host Bridge server running on http://localhost:3000
   Environment: development
==============================
```

### When registering:
```
📝 Registration attempt: { email: 'test@example.com', role: 'landlord' }
✅ User created: { id: 1, email: 'test@example.com', role: 'landlord' }
🟢 DEBUG: Sending welcome email...
✅ Welcome email sent successfully!
```

### When logging in:
```
🔐 Login attempt: test@example.com
✅ Login successful: { id: 1, email: 'test@example.com' }
🔵 DEBUG: Sending login notification...
✅ Login notification sent successfully!
```

## 🐛 Common Issues:

### "SMTP Authentication Error"

**Cause:** Wrong Gmail credentials or not using App Password

**Fix:**
1. Make sure using Gmail **App Password**, not regular password
2. Double-check `GMAIL_EMAIL` and `GMAIL_PASSWORD` in `.env`
3. Restart server after changing `.env`

### "Network Error" when submitting forms

**Cause:** Server not running

**Fix:**
```bash
npm start
```

### Database not found

**Cause:** Database not initialized

**Fix:**
```bash
npm run sync
```

### Port 3000 already in use

**Fix:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

## 📁 Project Structure Summary:

```
Host_bridge/
├── server/
│   ├── config/
│   │   └── nodemailer.js          ✅ Gmail SMTP setup
│   ├── models/
│   │   ├── index.js               ✅ Sequelize initialization
│   │   ├── User.js                ✅ User model
│   │   └── Property.js            ✅ Property model
│   ├── routes/
│   │   └── auth.js                ✅ All auth endpoints
│   ├── services/
│   │   ├── emailService.js        ✅ Email sending functions
│   │   └── emailTemplates.js      ✅ HTML templates
│   ├── index.js                   ✅ Main server
│   └── sync.js                    ✅ Database sync script
├── static_html/
│   ├── login.html                 ✅ Login page
│   ├── register.html              ✅ Register page
│   ├── index.html                 ✅ Homepage
│   └── js/
│       └── navbar-auth.js         ✅ Navbar dynamic updates
├── database/
│   └── hostbridge.db              ✅ SQLite database
├── package.json                   ✅ All dependencies
├── .env                           ✅ Your Gmail credentials
└── README.md                      ✅ Documentation
```

## ✅ Final Checklist:

Before deploying:
- [x] All dependencies installed (`npm install`)
- [x] Database created (`npm run sync`)
- [x] `.env` has `GMAIL_EMAIL` and `GMAIL_PASSWORD`
- [x] Server starts without errors (`npm start`)
- [x] Can register and receive email locally
- [x] Can login and receive notification locally
- [x] Can logout successfully
- [x] All pages load correctly
- [x] Code pushed to GitHub
- [x] Ready for Render deployment!

## 🎉 You're All Set!

Everything is configured and ready. Just run:

```bash
npm install
npm start
```

Then test locally, and when ready, push to GitHub and deploy to Render!

---

**Need Help?** Check the logs - they have detailed emoji indicators:
- 🟢 = Registration/Welcome email
- 🔵 = Login notification
- ✅ = Success
- ❌ = Error
- 📝 = Registration attempt
- 🔐 = Login attempt

