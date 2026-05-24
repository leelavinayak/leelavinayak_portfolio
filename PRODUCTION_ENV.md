# MERN & AI/ML Portfolio - Production Environment Variables

Configure these variables inside your `.env` file in the root directory to activate the MongoDB database and automatic email transmissions:

```env
# Database Connection (MongoDB)
# Defaults to "mongodb://127.0.0.1:27017/leela_portfolio" if left blank
MONGODB_URI="your-mongodb-connection-string"

# Mail Server Configurations (SMTP)
# Setup these to enable real email transmissions when contact form is submitted!
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="kleelavinayak@gmail.com"
SMTP_PASS="xhqk kpaz rptp ujlt"

# Recipient Email (Owner Notification Address)
EMAIL_TO="leelavinayakkothakota@gmail.com"

# Gemini Cognitive assistant API key
GEMINI_API_KEY="your-gemini-key"
```

## Running the Production Build
To build and start the fully integrated full-stack server:
1. Compile assets: `npm run build`
2. Start Node server: `npm run start`
