# 🚀 Al-Arab Car Trade - Investment Platform

A complete investment platform built with HTML, CSS, JavaScript, and Firebase backend. Features a comprehensive admin panel for managing users, investments, withdrawals, and system settings.

## 📱 Features

### 🔐 Authentication System
- **User Registration & Login** with CAPTCHA verification
- **Firebase Authentication** integration
- **Session Management** with localStorage
- **Admin User Detection** - Special admin privileges

### 🏠 User Dashboard
- **Real-time Balance Display** with live updates
- **Investment Statistics** (Total Invested, Total Earned, Profit Available)
- **Investment Plans Grid** with 4 refinery options
- **Balance Validation** for investment purchases
- **Investment Confirmation** modals

### 💰 Investment System
- **4 Investment Plans**:
  - Oil Refinery (₨5,000 - 35% ROI)
  - Gas Refinery (₨8,000 - 37% ROI)
  - Memphis Refinery (₨11,000 - 39% ROI)
  - Meraux Refinery (₨22,000 - 42% ROI)
- **Daily Profit Calculation** and claiming system
- **Investment Tracking** with progress monitoring
- **Transaction History** recording

### 👥 Team & Referrals
- **Referral Code Generation** and sharing
- **Referral Statistics** (Total Referrals, Total Earnings)
- **Referral List** with user details
- **Commission Tracking** (5% commission on referrals)

### 💳 Withdrawal System
- **Withdrawal Request Form** with multiple payment methods
- **Payment Method Support**:
  - Bank Transfer
  - EasyPaisa
  - JazzCash
  - UPaisa
- **Minimum Withdrawal** validation
- **Withdrawal Status** tracking

### ⚙️ Admin Panel (Complete)

#### 📊 Dashboard
- **Real-time Statistics**:
  - Total Users
  - Total Revenue
  - Active Investments
  - Pending Withdrawals
  - Today's Profit
- **System Status** monitoring
- **Recent Activity** feed
- **Quick Actions** buttons

#### 👤 User Management
- **Complete User List** with search functionality
- **User Status Management** (Active, Suspended, Pending)
- **Balance Adjustments** (Add/Deduct with reasons)
- **User Actions**:
  - View user details
  - Add balance
  - Deduct balance
  - Suspend/Activate users
- **Filter Users** by status
- **Search Users** by name or email

#### 💰 Investment Management
- **All Investments Overview** across all users
- **Investment Details**:
  - Plan name and amount
  - User information
  - Days active
  - Earnings so far
- **Filter Investments** by status (Active, Completed)

#### 💳 Withdrawal Management
- **Withdrawal Requests** processing
- **Request Details**:
  - Amount and payment method
  - User information
  - Request timestamp
- **Admin Actions**:
  - Approve withdrawals
  - Reject withdrawals (with balance return)
- **Filter Withdrawals** by status (Pending, Approved, Rejected)

#### 📋 Investment Plans Management
- **Plan Management**:
  - View all investment plans
  - Add new investment plans
  - Edit existing plans
  - Enable/Disable plans
- **Plan Configuration**:
  - Plan name and description
  - Investment amount
  - Daily profit
  - Duration and ROI
  - Badge and status

#### ⚙️ System Settings
- **Support Information**:
  - Support phone number
  - Support email
- **App Configuration**:
  - Minimum withdrawal amount
  - Referral commission percentage
- **Real-time Settings** updates

## 🛠️ Technical Features

### 🔥 Firebase Integration
- **Firebase Authentication** for secure login
- **Firebase Realtime Database** for data storage
- **Real-time Data Sync** across all users
- **Offline Support** with localStorage caching

### 📱 Mobile-First Design
- **Responsive Design** optimized for mobile devices
- **Touch-Friendly Interface** with proper touch targets
- **Progressive Web App** features
- **Cross-platform Compatibility**

### 🎨 UI/UX Features
- **Modern Design** with gradient backgrounds
- **Smooth Animations** and transitions
- **Toast Notifications** for user feedback
- **Loading States** and progress indicators
- **Modal Dialogs** for all interactions
- **Professional Color Scheme**

### 🔒 Security Features
- **CAPTCHA Verification** for login/signup
- **Input Validation** and sanitization
- **Admin Role Verification**
- **Secure Data Transmission**

## 🚀 Setup Instructions

### 1. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Realtime Database
4. Update the `firebaseConfig` in `data.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 2. Admin User Setup
1. Add admin email addresses to `ADMIN_EMAILS` array in `data.js`:
```javascript
const ADMIN_EMAILS = [
    "admin@abcartrade.com",
    "your-admin-email@domain.com"
];
```

### 3. Database Rules
Set up Firebase Realtime Database rules for security:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "investments": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "transactions": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "withdrawals": {
      ".read": "root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
    },
    "settings": {
      ".read": true,
      ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
    }
  }
}
```

### 4. File Structure
```
pori-app/
├── index.html          # Main HTML file with embedded CSS
├── data.js            # Firebase configuration and API functions
├── script.js          # Main JavaScript functionality
├── admin.js           # Admin panel functionality
└── README.md          # This file
```

### 5. Deployment
1. Upload all files to your web server
2. Ensure HTTPS is enabled for Firebase
3. Test the application with admin and regular user accounts

## 👥 User Roles

### 🔐 Regular Users
- Register and login
- View investment plans
- Make investments
- Claim daily profits
- Manage referrals
- Request withdrawals
- View transaction history

### ⚙️ Admin Users
- All regular user features
- Access to admin panel
- User management
- Investment oversight
- Withdrawal processing
- Plan management
- System settings

## 📊 Admin Panel Access

To access the admin panel:
1. Login with an admin email address
2. The "Admin Panel" button will appear in the Mine page
3. Click to access the comprehensive admin dashboard

## 🔧 Customization

### Investment Plans
Edit the `INVESTMENT_PLANS` array in `data.js` to modify:
- Plan names and descriptions
- Investment amounts
- Daily profits
- Duration and ROI
- Badge colors and labels

### Support Information
Update `SUPPORT_INFO` in `data.js`:
- Phone numbers
- Email addresses
- Office address
- Working hours

### App Configuration
Modify `APP_CONFIG` in `data.js`:
- Minimum withdrawal amount
- Referral commission percentage
- Profit claim intervals
- Session timeout

## 🎯 Demo Credentials

For testing purposes, you can create demo accounts:
- **Admin**: Use any email in the `ADMIN_EMAILS` array
- **Regular User**: Use any other email address

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Notes

- Always use HTTPS in production
- Regularly update Firebase security rules
- Monitor admin access logs
- Implement rate limiting for API calls
- Regular database backups

## 🚀 Future Enhancements

- Push notifications
- Advanced analytics
- Multi-language support
- Advanced payment gateways
- Mobile app versions
- Advanced admin features

---

**Built with ❤️ for Al-Arab Car Trade**

*This application provides a complete investment platform with comprehensive admin capabilities for managing users, investments, and system operations.*