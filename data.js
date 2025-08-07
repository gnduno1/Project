// Data and Configuration for Al-Arab Car Trade App

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

// Mock Database (for demo purposes)
let mockDatabase = {
    users: {},
    investments: {},
    transactions: {},
    referrals: {},
    settings: {
        investmentPlans: INVESTMENT_PLANS,
        supportInfo: SUPPORT_INFO,
        appConfig: APP_CONFIG
    }
};

// Initialize with demo data
function initializeDemoData() {
    // Demo user
    mockDatabase.users["demo123"] = {
        uid: "demo123",
        username: "Demo User",
        email: "demo@example.com",
        balance: 50000,
        total_invested: 15000,
        total_earned: 2500,
        withdrawable_profit: 1200,
        refer_code: "DEMO123",
        referred_by: "",
        referral_earnings: 500,
        created_at: Date.now(),
        last_login: Date.now()
    };

    // Demo investments
    mockDatabase.investments["demo123"] = [
        {
            id: "inv1",
            planId: "refinery1",
            planName: "Oil Refinery",
            amount: 5000,
            dailyProfit: 175,
            duration: 90,
            totalReturn: 15750,
            startDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
            status: "active",
            lastProfitClaim: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
            earnedSoFar: 1225
        },
        {
            id: "inv2",
            planId: "refinery2",
            planName: "Gas Refinery",
            amount: 8000,
            dailyProfit: 296,
            duration: 90,
            totalReturn: 26640,
            startDate: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
            status: "active",
            lastProfitClaim: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
            earnedSoFar: 888
        }
    ];

    // Demo transactions
    mockDatabase.transactions["demo123"] = [
        {
            id: "tx1",
            type: "investment",
            amount: 5000,
            description: "Investment in Oil Refinery",
            status: "completed",
            timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000)
        },
        {
            id: "tx2",
            type: "investment",
            amount: 8000,
            description: "Investment in Gas Refinery",
            status: "completed",
            timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000)
        },
        {
            id: "tx3",
            type: "profit_claim",
            amount: 175,
            description: "Daily profit from Oil Refinery",
            status: "completed",
            timestamp: Date.now() - (24 * 60 * 60 * 1000)
        }
    ];

    // Demo referrals
    mockDatabase.referrals["demo123"] = [
        {
            id: "ref1",
            username: "John Doe",
            email: "john@example.com",
            joined_at: Date.now() - (10 * 24 * 60 * 60 * 1000),
            commission_earned: 250,
            status: "active"
        },
        {
            id: "ref2",
            username: "Jane Smith",
            email: "jane@example.com",
            joined_at: Date.now() - (5 * 24 * 60 * 60 * 1000),
            commission_earned: 250,
            status: "active"
        }
    ];
}

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

// Database Simulation Functions
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

// Mock API Functions
const API = {
    // Authentication
    async signIn(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo login
        if (email === "demo@example.com" && password === "demo123") {
            const user = mockDatabase.users["demo123"];
            saveToLocalStorage(STORAGE_KEYS.USER, user);
            saveToLocalStorage(STORAGE_KEYS.TOKEN, "demo_token_" + Date.now());
            return user;
        }
        
        throw new Error("Invalid email or password");
    },

    async signUp(email, password, username, referCode = "") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists
        if (mockDatabase.users["demo123"] && mockDatabase.users["demo123"].email === email) {
            throw new Error("User already exists");
        }
        
        const userId = generateId();
        const user = {
            uid: userId,
            username: username,
            email: email,
            balance: 1000, // Welcome bonus
            total_invested: 0,
            total_earned: 0,
            withdrawable_profit: 0,
            refer_code: username.toUpperCase() + Math.random().toString(36).substr(2, 4),
            referred_by: referCode,
            referral_earnings: 0,
            created_at: Date.now(),
            last_login: Date.now()
        };
        
        mockDatabase.users[userId] = user;
        saveToLocalStorage(STORAGE_KEYS.USER, user);
        saveToLocalStorage(STORAGE_KEYS.TOKEN, "demo_token_" + Date.now());
        
        return user;
    },

    // User Data
    async getUserData(userId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockDatabase.users[userId] || null;
    },

    async updateUserData(userId, updates) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (mockDatabase.users[userId]) {
            mockDatabase.users[userId] = { ...mockDatabase.users[userId], ...updates };
            saveToLocalStorage(STORAGE_KEYS.USER, mockDatabase.users[userId]);
            return mockDatabase.users[userId];
        }
        throw new Error("User not found");
    },

    // Investments
    async getInvestments(userId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockDatabase.investments[userId] || [];
    },

    async createInvestment(userId, investmentData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const investment = {
            id: generateId(),
            ...investmentData,
            startDate: Date.now(),
            status: "active",
            lastProfitClaim: 0,
            earnedSoFar: 0
        };
        
        if (!mockDatabase.investments[userId]) {
            mockDatabase.investments[userId] = [];
        }
        mockDatabase.investments[userId].push(investment);
        
        // Update user balance
        const user = mockDatabase.users[userId];
        user.balance -= investmentData.amount;
        user.total_invested += investmentData.amount;
        
        // Create transaction record
        this.createTransaction(userId, {
            type: "investment",
            amount: investmentData.amount,
            description: `Investment in ${investmentData.planName}`,
            status: "completed"
        });
        
        return investment;
    },

    async claimProfit(userId, investmentId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const investments = mockDatabase.investments[userId] || [];
        const investment = investments.find(inv => inv.id === investmentId);
        
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
        investment.lastProfitClaim = now;
        investment.earnedSoFar += profit;
        
        // Update user data
        const user = mockDatabase.users[userId];
        user.balance += profit;
        user.total_earned += profit;
        user.withdrawable_profit += profit;
        
        // Create transaction record
        this.createTransaction(userId, {
            type: "profit_claim",
            amount: profit,
            description: `Daily profit from ${investment.planName}`,
            status: "completed"
        });
        
        return { profit, newBalance: user.balance };
    },

    // Transactions
    async getTransactions(userId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockDatabase.transactions[userId] || [];
    },

    async createTransaction(userId, transactionData) {
        const transaction = {
            id: generateId(),
            ...transactionData,
            timestamp: Date.now()
        };
        
        if (!mockDatabase.transactions[userId]) {
            mockDatabase.transactions[userId] = [];
        }
        mockDatabase.transactions[userId].unshift(transaction);
        
        return transaction;
    },

    // Referrals
    async getReferralData(userId) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = mockDatabase.users[userId];
        const referrals = mockDatabase.referrals[userId] || [];
        
        return {
            referralCode: user.refer_code,
            totalReferrals: referrals.length,
            totalEarnings: user.referral_earnings,
            referralList: referrals
        };
    },

    // Settings
    async getSettings() {
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockDatabase.settings;
    }
};

// Initialize demo data when the script loads
initializeDemoData();