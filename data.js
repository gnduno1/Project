// Data and Configuration for Al-Arab Car Trade App

// Firebase Configuration
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Investment Plans Data
const INVESTMENT_PLANS = [
    {
        id: "refinery1",
        name: "Oil Refinery",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        investment: 5000,
        dailyProfit: 175,
        duration: 90,
        totalReturn: 15750,
        rateOfReturn: 35,
        badge: "Popular",
        badgeColor: "badge-primary",
        enabled: true,
        description: "Entry level oil refinery investment with stable returns"
    },
    {
        id: "refinery2",
        name: "Gas Refinery",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        investment: 8000,
        dailyProfit: 296,
        duration: 90,
        totalReturn: 26640,
        rateOfReturn: 37,
        badge: "Best",
        badgeColor: "badge-success",
        enabled: true,
        description: "Premium gas refinery with higher profit margins"
    },
    {
        id: "refinery3",
        name: "Memphis Refinery",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        investment: 11000,
        dailyProfit: 429,
        duration: 90,
        totalReturn: 38610,
        rateOfReturn: 39,
        badge: "Value",
        badgeColor: "badge-warning",
        enabled: true,
        description: "High-value refinery investment with excellent returns"
    },
    {
        id: "refinery4",
        name: "Meraux Refinery",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
        investment: 22000,
        dailyProfit: 924,
        duration: 90,
        totalReturn: 83160,
        rateOfReturn: 42,
        badge: "VIP",
        badgeColor: "badge-purple",
        enabled: true,
        description: "Premium VIP refinery for high net worth investors"
    }
];

// Support Information
const SUPPORT_INFO = {
    phone: "+92 325 7340165",
    email: "support@abcartrade.com",
    address: "Karachi, Pakistan",
    whatsapp: "+92 325 7340165",
    workingHours: "24/7 Support Available"
};

// App Configuration
const APP_CONFIG = {
    name: "Al-Arab Car Trade",
    version: "1.0.0",
    currency: "₨",
    referralCommission: 0.05, // 5% commission
    minWithdrawal: 1000,
    maxWithdrawal: 50000,
    profitClaimInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER: "pori_user",
    TOKEN: "pori_token",
    SETTINGS: "pori_settings",
    INVESTMENTS: "pori_investments",
    TRANSACTIONS: "pori_transactions",
    REFERRALS: "pori_referrals"
};

// Utility Functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatCurrency(amount) {
    return APP_CONFIG.currency + amount.toLocaleString();
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Database Functions
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

// Firebase API Functions
const API = {
    // Authentication
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user data from database
            const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
            const userData = userSnapshot.val();
            
            if (!userData) {
                throw new Error("User data not found");
            }
            
            // Update last login
            await database.ref(`users/${user.uid}`).update({
                last_login: Date.now()
            });
            
            const userWithAuth = {
                uid: user.uid,
                email: user.email,
                ...userData
            };
            
            saveToLocalStorage(STORAGE_KEYS.USER, userWithAuth);
            return userWithAuth;
        } catch (error) {
            console.error('Firebase sign in error:', error);
            throw new Error(error.message);
        }
    },

    async signUp(email, password, username, referCode = "") {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Generate referral code
            const generatedReferCode = username.toUpperCase() + Math.random().toString(36).substr(2, 4);
            
            // Create user data
            const userData = {
                uid: user.uid,
                username: username,
                email: email,
                balance: 1000, // Welcome bonus
                total_invested: 0,
                total_earned: 0,
                withdrawable_profit: 0,
                refer_code: generatedReferCode,
                referred_by: referCode,
                referral_earnings: 0,
                created_at: Date.now(),
                last_login: Date.now()
            };
            
            // Save user data to database
            await database.ref(`users/${user.uid}`).set(userData);
            
            // If referral code provided, update referrer's earnings
            if (referCode) {
                await this.processReferral(referCode, userData);
            }
            
            saveToLocalStorage(STORAGE_KEYS.USER, userData);
            return userData;
        } catch (error) {
            console.error('Firebase sign up error:', error);
            throw new Error(error.message);
        }
    },

    async processReferral(referCode, newUserData) {
        try {
            // Find user with this referral code
            const usersSnapshot = await database.ref('users').orderByChild('refer_code').equalTo(referCode).once('value');
            const referrerData = usersSnapshot.val();
            
            if (referrerData) {
                const referrerId = Object.keys(referrerData)[0];
                const referrer = referrerData[referrerId];
                
                // Calculate commission (5% of welcome bonus)
                const commission = 1000 * APP_CONFIG.referralCommission;
                
                // Update referrer's earnings
                await database.ref(`users/${referrerId}`).update({
                    referral_earnings: referrer.referral_earnings + commission
                });
                
                // Create commission record
                await database.ref('referral_commissions').push({
                    referrerId: referrerId,
                    referredUserId: newUserData.uid,
                    referredUsername: newUserData.username,
                    commissionAmount: commission,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error processing referral:', error);
        }
    },

    // User Data
    async getUserData(userId) {
        try {
            const snapshot = await database.ref(`users/${userId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user data:', error);
            throw new Error('Failed to get user data');
        }
    },

    async updateUserData(userId, updates) {
        try {
            await database.ref(`users/${userId}`).update(updates);
            const updatedUser = await this.getUserData(userId);
            saveToLocalStorage(STORAGE_KEYS.USER, updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Error updating user data:', error);
            throw new Error('Failed to update user data');
        }
    },

    // Investments
    async getInvestments(userId) {
        try {
            const snapshot = await database.ref(`investments/${userId}`).once('value');
            const investments = snapshot.val();
            return investments ? Object.values(investments) : [];
        } catch (error) {
            console.error('Error getting investments:', error);
            return [];
        }
    },

    async createInvestment(userId, investmentData) {
        try {
            const investment = {
                id: generateId(),
                ...investmentData,
                startDate: Date.now(),
                status: "active",
                lastProfitClaim: 0,
                earnedSoFar: 0
            };
            
            // Save investment to database
            await database.ref(`investments/${userId}`).push(investment);
            
            // Update user balance
            const userSnapshot = await database.ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val();
            
            await database.ref(`users/${userId}`).update({
                balance: userData.balance - investmentData.amount,
                total_invested: userData.total_invested + investmentData.amount
            });
            
            // Create transaction record
            await this.createTransaction(userId, {
                type: "investment",
                amount: investmentData.amount,
                description: `Investment in ${investmentData.planName}`,
                status: "completed"
            });
            
            return investment;
        } catch (error) {
            console.error('Error creating investment:', error);
            throw new Error('Failed to create investment');
        }
    },

    async claimProfit(userId, investmentId) {
        try {
            // Get investment
            const investmentsSnapshot = await database.ref(`investments/${userId}`).once('value');
            const investments = investmentsSnapshot.val();
            
            if (!investments) {
                throw new Error("No investments found");
            }
            
            // Find the specific investment
            let investment = null;
            let investmentKey = null;
            
            for (const [key, inv] of Object.entries(investments)) {
                if (inv.id === investmentId) {
                    investment = inv;
                    investmentKey = key;
                    break;
                }
            }
            
            if (!investment) {
                throw new Error("Investment not found");
            }
            
            const now = Date.now();
            const timeSinceLastClaim = now - investment.lastProfitClaim;
            
            if (timeSinceLastClaim < APP_CONFIG.profitClaimInterval) {
                throw new Error("Profit can only be claimed once per day");
            }
            
            // Calculate profit
            const profit = investment.dailyProfit;
            
            // Update investment
            await database.ref(`investments/${userId}/${investmentKey}`).update({
                lastProfitClaim: now,
                earnedSoFar: investment.earnedSoFar + profit
            });
            
            // Update user data
            const userSnapshot = await database.ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val();
            
            await database.ref(`users/${userId}`).update({
                balance: userData.balance + profit,
                total_earned: userData.total_earned + profit,
                withdrawable_profit: userData.withdrawable_profit + profit
            });
            
            // Create transaction record
            await this.createTransaction(userId, {
                type: "profit_claim",
                amount: profit,
                description: `Daily profit from ${investment.planName}`,
                status: "completed"
            });
            
            return { profit, newBalance: userData.balance + profit };
        } catch (error) {
            console.error('Error claiming profit:', error);
            throw new Error(error.message);
        }
    },

    // Transactions
    async getTransactions(userId) {
        try {
            const snapshot = await database.ref(`transactions/${userId}`).once('value');
            const transactions = snapshot.val();
            if (!transactions) return [];
            
            return Object.values(transactions).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },

    async createTransaction(userId, transactionData) {
        try {
            const transaction = {
                id: generateId(),
                ...transactionData,
                timestamp: Date.now()
            };
            
            await database.ref(`transactions/${userId}`).push(transaction);
            return transaction;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error('Failed to create transaction');
        }
    },

    // Referrals
    async getReferralData(userId) {
        try {
            const userSnapshot = await database.ref(`users/${userId}`).once('value');
            const userData = userSnapshot.val();
            
            // Get users referred by this user
            const referralsSnapshot = await database.ref('users').orderByChild('referred_by').equalTo(userData.refer_code).once('value');
            const referrals = referralsSnapshot.val() || {};
            
            // Get commission history
            const commissionsSnapshot = await database.ref('referral_commissions').orderByChild('referrerId').equalTo(userId).once('value');
            const commissions = commissionsSnapshot.val() || {};
            
            const referralList = Object.values(referrals).map(referral => ({
                id: referral.uid,
                username: referral.username,
                email: referral.email,
                joined_at: referral.created_at,
                commission_earned: 50, // Default commission per referral
                status: "active"
            }));
            
            return {
                referralCode: userData.refer_code,
                totalReferrals: referralList.length,
                totalEarnings: userData.referral_earnings,
                referralList: referralList
            };
        } catch (error) {
            console.error('Error getting referral data:', error);
            return {
                referralCode: "",
                totalReferrals: 0,
                totalEarnings: 0,
                referralList: []
            };
        }
    },

    // Settings
    async getSettings() {
        try {
            const snapshot = await database.ref('settings').once('value');
            const settings = snapshot.val();
            
            if (!settings) {
                // Initialize default settings
                const defaultSettings = {
                    investmentPlans: INVESTMENT_PLANS,
                    supportInfo: SUPPORT_INFO,
                    appConfig: APP_CONFIG
                };
                
                await database.ref('settings').set(defaultSettings);
                return defaultSettings;
            }
            
            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                investmentPlans: INVESTMENT_PLANS,
                supportInfo: SUPPORT_INFO,
                appConfig: APP_CONFIG
            };
        }
    },

    // Logout
    async logout() {
        try {
            await auth.signOut();
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
};

// Auth state observer
auth.onAuthStateChanged(function(user) {
    if (user) {
        console.log('User is signed in:', user.uid);
    } else {
        console.log('User is signed out');
        // Clear local storage when user signs out
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
});