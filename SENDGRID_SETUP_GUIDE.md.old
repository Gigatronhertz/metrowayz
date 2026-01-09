# SendGrid Email Setup Guide

## ✅ What's Been Done

1. ✅ Installed `@sendgrid/mail` package
2. ✅ Updated email service to use SendGrid API
3. ✅ All three email functions ready:
   - Welcome email on signup
   - Booking confirmation to users
   - Booking notification to vendors

## 🔧 Steps to Complete Setup

### Step 1: Get Your SendGrid API Key

1. Go to https://sendgrid.com/free/
2. Sign up for a free account (100 emails/day forever)
3. Verify your email address
4. Complete the setup wizard
5. Go to **Settings** → **API Keys**
6. Click **"Create API Key"**
7. Name it "MetroWayz"
8. Select **"Full Access"**
9. Click **"Create & View"**
10. **COPY THE API KEY** (you'll only see it once!)

### Step 2: Verify Your Sender Email

**IMPORTANT**: SendGrid requires you to verify your sender email address.

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name**: MetroWayz
   - **From Email Address**: richmondchidubem135@gmail.com
   - **Reply To**: richmondchidubem135@gmail.com
   - Fill in address details (can be any valid address)
4. Click **"Create"**
5. Check your Gmail inbox for verification email
6. Click the verification link
7. Wait for "Verified" status in SendGrid

### Step 3: Add API Key to Your Code

Replace the placeholder in **both** files:

**File 1: `model/emailService.js`**
```javascript
// Line 4 - Replace this:
const SENDGRID_API_KEY = 'YOUR_SENDGRID_API_KEY_HERE';

// With your actual API key:
const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

**File 2: `backend/config/emailService.js`**
```javascript
// Line 4 - Replace this:
const SENDGRID_API_KEY = 'YOUR_SENDGRID_API_KEY_HERE';

// With your actual API key:
const SENDGRID_API_KEY = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### Step 4: Deploy to Render

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add SendGrid email integration"
   git push
   ```

2. Render will auto-deploy

3. **Optional but Recommended**: Add API key as environment variable in Render:
   - Go to your Render dashboard
   - Click on your service
   - Go to **Environment** tab
   - Add: `SENDGRID_API_KEY` = `your_api_key_here`
   - Then update code to use: `process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE'`

### Step 5: Test the Emails

**Test Welcome Email:**
1. Create a new account on your app
2. Check your email inbox
3. You should receive a welcome email

**Test Booking Emails:**
1. Make a test booking
2. User should receive booking confirmation email
3. Vendor should receive booking notification email

## 📊 SendGrid Dashboard

Monitor your emails at: https://app.sendgrid.com/stats/overview

You can see:
- Total emails sent
- Delivery rate
- Bounce rate
- Open rate (if you enable tracking)

## ⚠️ Important Notes

1. **Free Tier Limit**: 100 emails per day
2. **Sender Email**: MUST be verified in SendGrid
3. **API Key Security**: Never commit API keys to git (use environment variables in production)
4. **Delivery Time**: Emails typically arrive within seconds

## 🐛 Troubleshooting

**Error: "Forbidden"**
- Your sender email is not verified in SendGrid
- Go to Settings → Sender Authentication and verify it

**Error: "Unauthorized"**
- Wrong API key
- Double-check you copied the correct key

**Error: "Bad Request"**
- Check the email addresses are valid
- Make sure you're not sending to role-based emails (admin@, noreply@, etc.) on free tier

**Emails going to spam?**
- Verify your domain in SendGrid (advanced)
- Or use SendGrid's domain for now

## 🎉 You're All Set!

Once you complete these steps, your app will send beautiful emails via SendGrid instead of Gmail, and you won't have SMTP timeout issues on Render!

## Need Help?

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
