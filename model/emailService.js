const sgMail = require('@sendgrid/mail');

// REPLACE THIS WITH YOUR SENDGRID API KEY
const SENDGRID_API_KEY = 'YOUR_SENDGRID_API_KEY_HERE';

// Email sender (must be verified in SendGrid)
const FROM_EMAIL = 'richmondchidubem135@gmail.com';
const FROM_NAME = 'MetroWayz';

// Set SendGrid API Key
sgMail.setApiKey(SENDGRID_API_KEY);

console.log('✅ SendGrid email service initialized');

// Send Welcome Email
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const msg = {
      to: userEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: 'Welcome to MetroWayz - Premium Lifestyle Services',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ff6b3d 0%, #8b6dff 100%);
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #ff6b3d;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .features {
              margin: 20px 0;
            }
            .feature-item {
              padding: 10px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .feature-item:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to MetroWayz!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName || 'there'}! 👋</h2>
            <p>We're thrilled to have you join the MetroWayz community!</p>

            <p>MetroWayz is your gateway to premium lifestyle services. Whether you're looking for luxury accommodations, private chefs, entertainment, or professional services - we've got you covered.</p>

            <div class="features">
              <h3>What you can do with MetroWayz:</h3>
              <div class="feature-item">
                <strong>🏠 Luxury Accommodations</strong> - Book premium apartments and venues
              </div>
              <div class="feature-item">
                <strong>👨‍🍳 Private Chefs</strong> - Enjoy culinary excellence at home
              </div>
              <div class="feature-item">
                <strong>🎉 Events & Entertainment</strong> - Create memorable experiences
              </div>
              <div class="feature-item">
                <strong>💼 Professional Services</strong> - Get expert assistance when you need it
              </div>
            </div>

            <center>
              <a href="https://metrowayz.vercel.app" class="button">Start Exploring</a>
            </center>

            <p>If you have any questions, feel free to reach out to our support team anytime.</p>

            <p>Best regards,<br>
            <strong>The MetroWayz Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0; color: #666; font-size: 12px;">
              © 2024 MetroWayz. All rights reserved.<br>
              Premium Lifestyle Services
            </p>
          </div>
        </body>
        </html>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Welcome email sent successfully via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Send Booking Confirmation Email to User
const sendBookingConfirmationToUser = async (userEmail, bookingDetails) => {
  try {
    const {
      userName,
      serviceName,
      serviceCategory,
      serviceLocation,
      checkInDate,
      checkOutDate,
      guests,
      totalAmount,
      bookingId
    } = bookingDetails;

    const msg = {
      to: userEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `Booking Confirmed - ${serviceName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ff6b3d 0%, #8b6dff 100%);
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .booking-details {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .total {
              background: #ff6b3d;
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #ff6b3d;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName}!</h2>
            <p>Great news! Your booking has been confirmed. We're excited to serve you!</p>

            <div class="booking-details">
              <h3 style="margin-top: 0;">Booking Details</h3>

              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${bookingId}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${serviceName}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${serviceCategory}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${serviceLocation}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span class="detail-value">${new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              ${checkOutDate ? `
              <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span class="detail-value">${new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}

              <div class="detail-row">
                <span class="detail-label">Guests:</span>
                <span class="detail-value">${guests} ${guests > 1 ? 'guests' : 'guest'}</span>
              </div>

              <div class="total">
                Total Amount: ₦${totalAmount.toLocaleString()}
              </div>
            </div>

            <p><strong>What's next?</strong></p>
            <ul>
              <li>The service provider will contact you shortly</li>
              <li>Make sure to be available on the scheduled date</li>
              <li>You can view and manage your booking in the app</li>
            </ul>

            <center>
              <a href="https://metrowayz.vercel.app/bookings" class="button">View My Bookings</a>
            </center>

            <p>If you have any questions or need to make changes, please contact our support team.</p>

            <p>Best regards,<br>
            <strong>The MetroWayz Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0; color: #666; font-size: 12px;">
              © 2024 MetroWayz. All rights reserved.<br>
              Premium Lifestyle Services
            </p>
          </div>
        </body>
        </html>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Booking confirmation email sent to user via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending booking confirmation to user:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Send Booking Notification Email to Vendor
const sendBookingNotificationToVendor = async (vendorEmail, bookingDetails) => {
  try {
    const {
      vendorName,
      userName,
      userEmail,
      userPhone,
      serviceName,
      serviceCategory,
      serviceLocation,
      checkInDate,
      checkOutDate,
      guests,
      totalAmount,
      bookingId
    } = bookingDetails;

    const msg = {
      to: vendorEmail,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: `New Booking - ${serviceName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #8b6dff 0%, #ff6b3d 100%);
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .booking-details {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .customer-info {
              background: #fff4e6;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #ff6b3d;
              margin: 20px 0;
            }
            .total {
              background: #8b6dff;
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #8b6dff;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📅 New Booking Received!</h1>
          </div>
          <div class="content">
            <h2>Hi ${vendorName}!</h2>
            <p>You have received a new booking! Please review the details below and contact the customer.</p>

            <div class="customer-info">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              ${userPhone ? `<p><strong>Phone:</strong> ${userPhone}</p>` : ''}
            </div>

            <div class="booking-details">
              <h3 style="margin-top: 0;">Booking Details</h3>

              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${bookingId}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${serviceName}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${serviceCategory}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${serviceLocation}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span class="detail-value">${new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              ${checkOutDate ? `
              <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span class="detail-value">${new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}

              <div class="detail-row">
                <span class="detail-label">Guests:</span>
                <span class="detail-value">${guests} ${guests > 1 ? 'guests' : 'guest'}</span>
              </div>

              <div class="total">
                Total Amount: ₦${totalAmount.toLocaleString()}
              </div>
            </div>

            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Review the booking details carefully</li>
              <li>Contact the customer to confirm the booking</li>
              <li>Prepare for the scheduled service date</li>
              <li>Update booking status in your vendor dashboard</li>
            </ul>

            <center>
              <a href="https://metrowayz.vercel.app/vendor/bookings" class="button">View in Dashboard</a>
            </center>

            <p>Thank you for being a valued MetroWayz service provider!</p>

            <p>Best regards,<br>
            <strong>The MetroWayz Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0; color: #666; font-size: 12px;">
              © 2024 MetroWayz. All rights reserved.<br>
              Premium Lifestyle Services
            </p>
          </div>
        </body>
        </html>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Booking notification email sent to vendor via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending booking notification to vendor:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Send Support/Contact Message Email
const sendSupportMessage = async (messageDetails) => {
  try {
    const {
      userEmail,
      userName,
      subject,
      message
    } = messageDetails;

    const msg = {
      to: 'richmond@metrowayz.com', // Support team email
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      replyTo: userEmail, // Allow replying directly to user
      subject: `Support Request: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ff6b3d 0%, #8b6dff 100%);
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .user-info {
              background: #fff4e6;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #ff6b3d;
              margin: 20px 0;
            }
            .message-box {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #e0e0e0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💬 New Support Request</h1>
          </div>
          <div class="content">
            <h2>Support Request from Customer</h2>

            <div class="user-info">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <p><strong>Name:</strong> ${userName || 'Not provided'}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
            </div>

            <div class="message-box">
              <h3 style="margin-top: 0;">Subject</h3>
              <p><strong>${subject}</strong></p>

              <h3>Message</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <p><strong>How to respond:</strong></p>
            <p>Simply reply to this email to respond directly to ${userEmail}.</p>

            <p>Best regards,<br>
            <strong>MetroWayz Support System</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0; color: #666; font-size: 12px;">
              © 2024 MetroWayz. All rights reserved.<br>
              Premium Lifestyle Services
            </p>
          </div>
        </body>
        </html>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Support message sent to richmond@metrowayz.com via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending support message:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmationToUser,
  sendBookingNotificationToVendor,
  sendSupportMessage
};
