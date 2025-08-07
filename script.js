// Main JavaScript for Al-Arab Car Trade App

// Global State
let currentUser = null;
let currentPage = 'home';
let currentCaptcha = '';
let isLoading = false;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const captchaDisplay = document.getElementById('captchaDisplay');
const signupCaptchaDisplay = document.getElementById('signupCaptchaDisplay');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Check if user is already logged in
        const savedUser = loadFromLocalStorage(STORAGE_KEYS.USER);
        const savedToken = loadFromLocalStorage(STORAGE_KEYS.TOKEN);
        
        if (savedUser && savedToken) {
            currentUser = savedUser;
            showMainApp();
            await loadUserData();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showAuthScreen();
    } finally {
        hideLoading();
    }
}

// Authentication Functions
function showAuthScreen() {
    loadingScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    generateNewCaptcha();
}

function showMainApp() {
    loadingScreen.classList.add('hidden');
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    showPage('home');
}

function hideLoading() {
    loadingScreen.classList.add('hidden');
}

function generateNewCaptcha() {
    currentCaptcha = generateCaptcha();
    captchaDisplay.textContent = currentCaptcha;
    signupCaptchaDisplay.textContent = currentCaptcha;
}

// Tab Switching
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.tab:first-child').classList.add('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        document.querySelector('.tab:last-child').classList.add('active');
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
    
    generateNewCaptcha();
}

// Form Submissions
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await handleLogin();
});

signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await handleSignup();
});

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const captcha = document.getElementById('loginCaptcha').value;
    
    if (!email || !password || !captcha) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (captcha !== currentCaptcha) {
        showToast('Invalid CAPTCHA. Please try again.', 'error');
        generateNewCaptcha();
        document.getElementById('loginCaptcha').value = '';
        return;
    }
    
    setLoading(true);
    
    try {
        currentUser = await API.signIn(email, password);
        showMainApp();
        await loadUserData();
        showToast('Login successful!', 'success');
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
        generateNewCaptcha();
        document.getElementById('loginCaptcha').value = '';
    } finally {
        setLoading(false);
    }
}

async function handleSignup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const referCode = document.getElementById('signupReferCode').value;
    const captcha = document.getElementById('signupCaptcha').value;
    
    if (!username || !email || !password || !captcha) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (captcha !== currentCaptcha) {
        showToast('Invalid CAPTCHA. Please try again.', 'error');
        generateNewCaptcha();
        document.getElementById('signupCaptcha').value = '';
        return;
    }
    
    if (!validatePassword(password)) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        currentUser = await API.signUp(email, password, username, referCode);
        showMainApp();
        await loadUserData();
        showToast('Account created successfully!', 'success');
    } catch (error) {
        showToast(error.message || 'Signup failed', 'error');
        generateNewCaptcha();
        document.getElementById('signupCaptcha').value = '';
    } finally {
        setLoading(false);
    }
}

// Navigation Functions
function showPage(page) {
    currentPage = page;
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    // Show selected page
    document.getElementById(page + 'Page').classList.remove('hidden');
    
    // Update navigation (only for main nav items)
    if (page !== 'admin') {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        event.target.closest('.nav-item').classList.add('active');
    }
    
    // Load page-specific data
    switch (page) {
        case 'home':
            loadHomePage();
            break;
        case 'team':
            loadTeamPage();
            break;
        case 'mine':
            loadMinePage();
            break;
        case 'admin':
            loadAdminDashboard();
            break;
    }
}

// Page Loading Functions
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Update user info in UI
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userBalance').textContent = currentUser.balance.toLocaleString();
        document.getElementById('totalInvested').textContent = currentUser.total_invested.toLocaleString();
        document.getElementById('totalEarned').textContent = currentUser.total_earned.toLocaleString();
        document.getElementById('withdrawableProfit').textContent = currentUser.withdrawable_profit.toLocaleString();
        
        // Update profile info
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('userInitial').textContent = currentUser.username.charAt(0).toUpperCase();
        
        // Initialize admin functionality if user is admin
        if (currentUser.isAdmin) {
            document.getElementById('adminPanelBtn').classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadHomePage() {
    if (!currentUser) return;
    
    try {
        await loadUserData();
        await loadInvestmentPlans();
    } catch (error) {
        console.error('Error loading home page:', error);
    }
}

async function loadInvestmentPlans() {
    const plansGrid = document.getElementById('plansGrid');
    plansGrid.innerHTML = '';
    
    INVESTMENT_PLANS.forEach(plan => {
        if (!plan.enabled) return;
        
        const canAfford = currentUser.balance >= plan.investment;
        
        const planCard = document.createElement('div');
        planCard.className = 'plan-card relative';
        planCard.innerHTML = `
            <div class="relative">
                <img src="${plan.image}" alt="${plan.name}" class="plan-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/2563eb/ffffff?text=${plan.name}'">
                <div class="plan-badge">
                    <span class="badge ${plan.badgeColor}">${plan.badge}</span>
                </div>
                ${!canAfford ? `
                    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span class="badge badge-danger">Insufficient Balance</span>
                    </div>
                ` : ''}
            </div>
            <div class="plan-content">
                <h3 class="font-bold text-sm mb-1">${plan.name}</h3>
                <p class="text-lg font-bold text-red-600 mb-2">Rs ${plan.investment.toLocaleString()}</p>
                
                <div class="space-y-1 text-xs text-gray-600 mb-3">
                    <div class="flex justify-between">
                        <span>Rate of return:</span>
                        <span class="font-bold text-green-600">${plan.rateOfReturn}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Duration:</span>
                        <span class="font-bold">${plan.duration} Days</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Daily Profit:</span>
                        <span class="font-bold text-blue-600">₨${plan.dailyProfit}</span>
                    </div>
                </div>
                
                <button onclick="handleInvest('${plan.id}')" 
                        class="btn btn-primary w-full ${!canAfford ? 'btn-secondary' : ''}" 
                        ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'Buy now' : 'Low Balance'}
                </button>
            </div>
        `;
        
        plansGrid.appendChild(planCard);
    });
}

async function loadTeamPage() {
    if (!currentUser) return;
    
    try {
        const referralData = await API.getReferralData(currentUser.uid);
        
        // Update referral code
        document.getElementById('referralCode').value = referralData.referralCode;
        
        // Update stats
        document.getElementById('totalReferrals').textContent = referralData.totalReferrals;
        document.getElementById('totalEarnings').textContent = formatCurrency(referralData.totalEarnings);
        
        // Load referral list
        const referralList = document.getElementById('referralList');
        referralList.innerHTML = '';
        
        if (referralData.referralList.length === 0) {
            referralList.innerHTML = '<p class="text-center text-gray-500 py-4">No referrals yet</p>';
        } else {
            referralData.referralList.forEach(referral => {
                const referralItem = document.createElement('div');
                referralItem.className = 'flex items-center justify-between p-3 border-b border-gray-100';
                referralItem.innerHTML = `
                    <div>
                        <div class="font-medium">${referral.username}</div>
                        <div class="text-sm text-gray-600">${referral.email}</div>
                        <div class="text-xs text-gray-500">Joined: ${formatDate(referral.joined_at)}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-green-600">₨${referral.commission_earned}</div>
                        <div class="text-xs text-gray-500">${referral.status}</div>
                    </div>
                `;
                referralList.appendChild(referralItem);
            });
        }
    } catch (error) {
        console.error('Error loading team page:', error);
        showToast('Error loading referral data', 'error');
    }
}

async function loadMinePage() {
    if (!currentUser) return;
    
    try {
        await loadUserData();
    } catch (error) {
        console.error('Error loading mine page:', error);
    }
}

// Investment Functions
async function handleInvest(planId) {
    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) return;
    
    showInvestmentModal(plan);
}

function showInvestmentModal(plan) {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Confirm Investment</h3>
        </div>
        <div class="modal-body">
            <p class="text-gray-600 mb-4">Are you sure you want to invest in ${plan.name}?</p>
            
            <div class="bg-gray-50 p-3 rounded-lg mb-4">
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p class="text-gray-600">Plan</p>
                        <p class="font-semibold">${plan.name}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Amount</p>
                        <p class="font-semibold">₨${plan.investment}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Daily Profit</p>
                        <p class="font-semibold text-green-600">₨${plan.dailyProfit}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Duration</p>
                        <p class="font-semibold">${plan.duration} Days</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-3 rounded-lg text-sm">
                <div class="flex justify-between">
                    <span>Current Balance:</span>
                    <span class="font-semibold">₨${currentUser.balance}</span>
                </div>
                <div class="flex justify-between">
                    <span>After Investment:</span>
                    <span class="font-semibold">₨${currentUser.balance - plan.investment}</span>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
            <button onclick="confirmInvestment('${plan.id}')" class="btn btn-primary">Confirm Investment</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

async function confirmInvestment(planId) {
    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) return;
    
    setLoading(true);
    
    try {
        await API.createInvestment(currentUser.uid, {
            planId: plan.id,
            planName: plan.name,
            amount: plan.investment,
            dailyProfit: plan.dailyProfit,
            duration: plan.duration,
            totalReturn: plan.totalReturn
        });
        
        // Refresh user data
        currentUser = await API.getUserData(currentUser.uid);
        await loadUserData();
        
        closeModal();
        showToast(`Investment successful! ₨${plan.dailyProfit} daily profit activated.`, 'success');
    } catch (error) {
        showToast(error.message || 'Investment failed', 'error');
    } finally {
        setLoading(false);
    }
}

// Utility Functions
function setLoading(loading) {
    isLoading = loading;
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (loading) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="icon">${type === 'success' ? '✅' : '❌'}</div>
            <span>${message}</span>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    // Close modal when clicking overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal;
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Copy Functions
function copyReferralCode() {
    const referralCode = document.getElementById('referralCode');
    referralCode.select();
    referralCode.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showToast('Referral code copied to clipboard!', 'success');
    } catch (error) {
        showToast('Failed to copy referral code', 'error');
    }
}

// Section Functions
function showSection(section) {
    switch (section) {
        case 'deposit':
            showDepositModal();
            break;
        case 'withdraw':
            showWithdrawModal();
            break;
        case 'investments':
            showInvestmentsModal();
            break;
        case 'transactions':
            showTransactionsModal();
            break;
        case 'profile':
            showProfileModal();
            break;
        case 'support':
            showSupportModal();
            break;
    }
}

function showDepositModal() {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Deposit Funds</h3>
        </div>
        <div class="modal-body">
            <p class="text-gray-600 mb-4">Contact support to deposit funds into your account.</p>
            <div class="bg-blue-50 p-3 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <div class="icon">📞</div>
                    <span class="font-medium">Phone: ${SUPPORT_INFO.phone}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                    <div class="icon">📧</div>
                    <span class="font-medium">Email: ${SUPPORT_INFO.email}</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="icon">📍</div>
                    <span class="font-medium">Address: ${SUPPORT_INFO.address}</span>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-primary">Close</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function showWithdrawModal() {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Withdraw Funds</h3>
        </div>
        <div class="modal-body">
            <div class="bg-green-50 p-3 rounded-lg mb-4">
                <div class="text-sm">
                    <div class="flex justify-between mb-1">
                        <span>Available for withdrawal:</span>
                        <span class="font-bold">₨${currentUser.withdrawable_profit}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Minimum withdrawal:</span>
                        <span class="font-bold">₨${APP_CONFIG.minWithdrawal}</span>
                    </div>
                </div>
            </div>
            
            <form id="withdrawForm" class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Amount (₨)</label>
                    <input type="number" id="withdrawAmount" class="input" min="${APP_CONFIG.minWithdrawal}" max="${currentUser.withdrawable_profit}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Payment Method</label>
                    <select id="paymentMethod" class="input" required>
                        <option value="">Select payment method</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="upaisa">UPaisa</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Account Details</label>
                    <textarea id="accountDetails" class="input" rows="3" placeholder="Enter your account number, phone number, or other payment details" required></textarea>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
            <button onclick="submitWithdrawal()" class="btn btn-primary">Submit Request</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

// Submit Withdrawal Request
async function submitWithdrawal() {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const accountDetails = document.getElementById('accountDetails').value;
    
    if (!amount || !paymentMethod || !accountDetails) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (amount < APP_CONFIG.minWithdrawal) {
        showToast(`Minimum withdrawal amount is ₨${APP_CONFIG.minWithdrawal}`, 'error');
        return;
    }
    
    if (amount > currentUser.withdrawable_profit) {
        showToast('Insufficient withdrawable balance', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        await API.createWithdrawalRequest(currentUser.uid, amount, paymentMethod, accountDetails);
        
        // Refresh user data
        currentUser = await API.getUserData(currentUser.uid);
        await loadUserData();
        
        closeModal();
        showToast('Withdrawal request submitted successfully!', 'success');
    } catch (error) {
        showToast(error.message || 'Failed to submit withdrawal request', 'error');
    } finally {
        setLoading(false);
    }
}

async function showInvestmentsModal() {
    try {
        const investments = await API.getInvestments(currentUser.uid);
        
        let investmentsHtml = '';
        if (investments.length === 0) {
            investmentsHtml = '<p class="text-center text-gray-500 py-4">No investments yet</p>';
        } else {
            investments.forEach(investment => {
                const daysActive = Math.floor((Date.now() - investment.startDate) / (24 * 60 * 60 * 1000));
                const canClaim = Date.now() - investment.lastProfitClaim >= APP_CONFIG.profitClaimInterval;
                
                investmentsHtml += `
                    <div class="border-b border-gray-100 pb-3 mb-3">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold">${investment.planName}</h4>
                                <p class="text-sm text-gray-600">₨${investment.amount} invested</p>
                            </div>
                            <span class="badge ${investment.status === 'active' ? 'badge-success' : 'badge-secondary'}">${investment.status}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                                <span class="text-gray-600">Daily Profit:</span>
                                <span class="font-bold text-green-600">₨${investment.dailyProfit}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Earned:</span>
                                <span class="font-bold">₨${investment.earnedSoFar}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Days Active:</span>
                                <span class="font-bold">${daysActive}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Remaining:</span>
                                <span class="font-bold">${investment.duration - daysActive} days</span>
                            </div>
                        </div>
                        ${canClaim ? `
                            <button onclick="claimProfit('${investment.id}')" class="btn btn-primary w-full text-sm">
                                Claim Daily Profit (₨${investment.dailyProfit})
                            </button>
                        ` : `
                            <button disabled class="btn btn-secondary w-full text-sm">
                                Next claim in ${Math.ceil((APP_CONFIG.profitClaimInterval - (Date.now() - investment.lastProfitClaim)) / (60 * 60 * 1000))} hours
                            </button>
                        `}
                    </div>
                `;
            });
        }
        
        const modal = createModal(`
            <div class="modal-header">
                <h3 class="font-bold">My Investments</h3>
            </div>
            <div class="modal-body">
                ${investmentsHtml}
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-primary">Close</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading investments:', error);
        showToast('Error loading investments', 'error');
    }
}

async function claimProfit(investmentId) {
    setLoading(true);
    
    try {
        const result = await API.claimProfit(currentUser.uid, investmentId);
        
        // Refresh user data
        currentUser = await API.getUserData(currentUser.uid);
        await loadUserData();
        
        showToast(`Profit claimed! +₨${result.profit} added to balance.`, 'success');
        
        // Refresh investments modal
        closeModal();
        setTimeout(() => showInvestmentsModal(), 100);
    } catch (error) {
        showToast(error.message || 'Failed to claim profit', 'error');
    } finally {
        setLoading(false);
    }
}

async function showTransactionsModal() {
    try {
        const transactions = await API.getTransactions(currentUser.uid);
        
        let transactionsHtml = '';
        if (transactions.length === 0) {
            transactionsHtml = '<p class="text-center text-gray-500 py-4">No transactions yet</p>';
        } else {
            transactions.forEach(transaction => {
                const icon = transaction.type === 'investment' ? '💰' : 
                           transaction.type === 'profit_claim' ? '📈' : '💳';
                const color = transaction.type === 'investment' ? 'text-red-600' : 'text-green-600';
                
                transactionsHtml += `
                    <div class="flex items-center justify-between p-3 border-b border-gray-100">
                        <div class="flex items-center gap-3">
                            <div class="icon">${icon}</div>
                            <div>
                                <div class="font-medium">${transaction.description}</div>
                                <div class="text-sm text-gray-600">${formatDate(transaction.timestamp)}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold ${color}">${transaction.type === 'investment' ? '-' : '+'}₨${transaction.amount}</div>
                            <div class="text-xs text-gray-500">${transaction.status}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        const modal = createModal(`
            <div class="modal-header">
                <h3 class="font-bold">Transaction History</h3>
            </div>
            <div class="modal-body">
                ${transactionsHtml}
            </div>
            <div class="modal-footer">
                <button onclick="closeModal()" class="btn btn-primary">Close</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Error loading transactions', 'error');
    }
}

function showProfileModal() {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Profile Settings</h3>
        </div>
        <div class="modal-body">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Username</label>
                    <input type="text" value="${currentUser.username}" class="input" readonly>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value="${currentUser.email}" class="input" readonly>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Referral Code</label>
                    <input type="text" value="${currentUser.refer_code}" class="input" readonly>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Member Since</label>
                    <input type="text" value="${formatDate(currentUser.created_at)}" class="input" readonly>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-primary">Close</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

function showSupportModal() {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Support & Contact</h3>
        </div>
        <div class="modal-body">
            <div class="space-y-4">
                <div class="bg-blue-50 p-3 rounded-lg">
                    <h4 class="font-bold mb-2">Contact Information</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="icon">📞</div>
                            <span>Phone: ${SUPPORT_INFO.phone}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="icon">📧</div>
                            <span>Email: ${SUPPORT_INFO.email}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="icon">📍</div>
                            <span>Address: ${SUPPORT_INFO.address}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="icon">⏰</div>
                            <span>${SUPPORT_INFO.workingHours}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 p-3 rounded-lg">
                    <h4 class="font-bold mb-2">Quick Actions</h4>
                    <div class="space-y-2">
                        <button onclick="window.open('https://wa.me/${SUPPORT_INFO.whatsapp.replace('+', '')}')" class="btn btn-success w-full text-sm">
                            📱 WhatsApp Support
                        </button>
                        <button onclick="window.open('mailto:${SUPPORT_INFO.email}')" class="btn btn-primary w-full text-sm">
                            📧 Email Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-primary">Close</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        API.logout();
        currentUser = null;
        showAuthScreen();
        showToast('Logged out successfully', 'success');
    }
}

// Show Admin Panel
function showAdminPanel() {
    showPage('admin');
    loadAdminDashboard();
}

// Auto-refresh user data every 30 seconds
setInterval(async () => {
    if (currentUser) {
        try {
            currentUser = await API.getUserData(currentUser.uid);
            await loadUserData();
        } catch (error) {
            console.error('Error auto-refreshing user data:', error);
        }
    }
}, 30000);