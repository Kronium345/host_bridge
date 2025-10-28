# Host Bridge - Property Management Platform

A comprehensive platform connecting property owners with short-term rental operators.

## 🚀 Migration to Node.js + Express

This project has been migrated from Flask (Python) to Express (Node.js) with Sequelize ORM for better email delivery and modern JavaScript architecture.

## 📋 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite with Sequelize ORM
- **Email**: SendGrid API
- **Authentication**: express-session + bcrypt
- **Frontend**: Vanilla JavaScript + HTML/CSS

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SendGrid account (for email functionality)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Then edit `.env` and add your credentials:
```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-secret-key-here

SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_VERIFIED_EMAIL=awolowodaniel@yahoo.ie
SENDER_EMAIL=awolowodaniel@yahoo.ie
```

3. **Initialize database**:
```bash
npm run sync
```

This will:
- Create the SQLite database
- Set up all tables
- Create a default admin user:
  - Email: `admin@hostbridge.com`
  - Password: `admin123` (⚠️ Change this!)

4. **Start the server**:
```bash
npm start
```

The server will run on `http://localhost:3000`

## 📁 Project Structure

```
Host_bridge/
├── server/
│   ├── config/
│   │   └── config.json          # Sequelize configuration
│   ├── models/
│   │   ├── index.js             # Model initialization
│   │   ├── User.js              # User model
│   │   └── Property.js          # Property model
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── services/
│   │   └── emailService.js      # SendGrid email service
│   ├── migrations/              # Database migrations
│   ├── seeders/                 # Database seeders
│   ├── index.js                 # Main server file
│   └── sync.js                  # Database sync script
├── static_html/                 # Frontend files
│   ├── css/
│   ├── js/
│   ├── images/
│   └── *.html                   # HTML pages
├── database/                    # SQLite database files
├── package.json
├── .env                         # Environment variables (create this)
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/register` - Register new user
  - Body: `{ email, password, first_name, last_name, phone_number, role }`
  - Returns: `{ success, message, user }`

- `POST /api/login` - User login
  - Body: `{ email, password }`
  - Returns: `{ success, message, user }`

- `POST /api/logout` - User logout
  - Returns: `{ success, message }`

- `GET /api/user/status` - Check authentication status
  - Returns: `{ authenticated, user }`

- `GET /api/user/profile` - Get user profile (requires auth)
  - Returns: `{ success, user }`

### Static Files

- All HTML files are served from root: `/index.html`, `/login.html`, etc.
- Static assets: `/static/*`, `/images/*`, `/css/*`, `/js/*`

## 📧 Email Configuration

### SendGrid Setup

1. **Create a SendGrid account** at [sendgrid.com](https://sendgrid.com)

2. **Create an API key**:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Select "Full Access"
   - Copy the key and add it to your `.env` file

3. **Verify sender email**:
   - Go to Settings > Sender Authentication > Single Sender Verification
   - Click "Create New Sender"
   - Enter your email: `awolowodaniel@yahoo.ie`
   - Reply To: `hostbridgee@gmail.com`
   - Complete verification (check your inbox)

4. **Update environment variables** in Render:
   - `SENDGRID_API_KEY` = Your API key
   - `SENDGRID_VERIFIED_EMAIL` = `awolowodaniel@yahoo.ie`
   - `SENDER_EMAIL` = `awolowodaniel@yahoo.ie`

### Email Features

The platform sends automated emails for:
- ✅ Welcome emails on registration (with user role)
- ✅ Login notifications
- ✅ Password reset (ready for implementation)

## 🚀 Deployment (Render)

### Initial Setup

1. **Connect your GitHub repository** to Render

2. **Create a new Web Service**:
   - Environment: Node
   - Build Command: `npm install && npm run sync`
   - Start Command: `npm start`
   - Health Check Path: `/health`

3. **Add environment variables** in Render dashboard:
   ```
   NODE_ENV=production
   SESSION_SECRET=<generate-strong-secret>
   SENDGRID_API_KEY=<your-api-key>
   SENDGRID_VERIFIED_EMAIL=awolowodaniel@yahoo.ie
   SENDER_EMAIL=awolowodaniel@yahoo.ie
   ```

4. **Deploy**: Render will automatically build and deploy

### Automatic Deployments

The `render.yaml` file is configured for automatic deployments on every push to main branch.

## 🔄 Database Management

### Run Migrations
```bash
npm run db:migrate
```

### Run Seeders
```bash
npm run db:seed
```

### Reset Database (⚠️ Deletes all data)
```bash
npm run sync
```

## 🧪 Development

### Development Mode
```bash
npm run dev
```

Uses Node's `--watch` flag for auto-restart on file changes.

### Database Location

- Development: `./database/hostbridge.db`
- Production: `./database/hostbridge.db` (persisted on Render)

## 📝 Migration Notes

### What Changed from Flask

1. **Backend Framework**: Flask → Express
2. **ORM**: SQLAlchemy → Sequelize
3. **Email Service**: Python SMTP → SendGrid API (Node.js)
4. **Session Management**: Flask-Login → express-session
5. **API Structure**: Direct Flask routes → RESTful `/api/*` routes

### Frontend Changes

- Login/Register forms now use `/api/login` and `/api/register`
- Logout is now `POST /api/logout` (was `GET /logout`)
- User status check: `/api/user/status` returns `authenticated` (was `logged_in`)

### Files Removed/Deprecated

These Python files are no longer needed and can be removed:
- `app/routes.py`
- `app/__init__.py`
- `app/models.py`
- `app/email_service.py`
- `app/email_service_sendgrid.py`
- `run.py`
- `requirements.txt`
- All `__pycache__` directories

## 🐛 Troubleshooting

### "SendGrid Sender Identity Error"

**Solution**: Make sure you've verified your sender email in SendGrid and updated the `SENDER_EMAIL` environment variable.

### "Database locked" error

**Solution**: Close any other processes accessing the database, or restart the server.

### Sessions not persisting

**Solution**: Make sure `SESSION_SECRET` is set in your `.env` file and cookies are enabled in your browser.

### Emails not sending

**Solution**:
1. Check SendGrid API key is correct
2. Verify sender email is verified in SendGrid
3. Check Render logs for error messages

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [SendGrid API Documentation](https://docs.sendgrid.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 👥 Admin Access

Default admin credentials (created on first sync):
- **Email**: `admin@hostbridge.com`
- **Password**: `admin123`

⚠️ **Important**: Change the admin password immediately after first login in production!

## 📄 License

Proprietary - All rights reserved

---

**Questions?** Contact the development team or check the [deployment logs](https://dashboard.render.com).
