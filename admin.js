// Admin Panel Functions

let currentAdminSection = 'dashboard';
let allUsers = [];
let allInvestments = [];
let allWithdrawals = [];
let allTransactions = [];

// Admin Section Navigation
function showAdminSection(section) {
    currentAdminSection = section;
    
    // Hide all admin sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    
    // Show selected section
    document.getElementById('admin' + section.charAt(0).toUpperCase() + section.slice(1)).classList.remove('hidden');
    
    // Update navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load section-specific data
    switch (section) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'investments':
            loadAdminInvestments();
            break;
        case 'withdrawals':
            loadAdminWithdrawals();
            break;
        case 'plans':
            loadAdminPlans();
            break;
        case 'settings':
            loadAdminSettings();
            break;
    }
}

// Load Admin Dashboard
async function loadAdminDashboard() {
    try {
        const stats = await API.getAdminStats();
        
        // Update stats
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
        document.getElementById('activeInvestments').textContent = stats.activeInvestments;
        document.getElementById('pendingWithdrawals').textContent = stats.pendingWithdrawals;
        document.getElementById('todayProfit').textContent = formatCurrency(stats.todayProfit);
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load Recent Activity
async function loadRecentActivity() {
    try {
        const transactions = await API.getAllTransactions();
        const recentActivity = document.getElementById('recentActivity');
        
        const recentTransactions = transactions.slice(0, 10);
        
        let activityHtml = '';
        if (recentTransactions.length === 0) {
            activityHtml = '<p class="text-gray-500 text-center">No recent activity</p>';
        } else {
            recentTransactions.forEach(transaction => {
                const icon = transaction.type === 'investment' ? '💰' : 
                           transaction.type === 'profit_claim' ? '📈' : 
                           transaction.type === 'withdrawal' ? '💳' : '📋';
                
                activityHtml += `
                    <div class="flex items-center justify-between p-2 border-b border-gray-100">
                        <div class="flex items-center gap-2">
                            <div class="icon">${icon}</div>
                            <div>
                                <div class="text-sm font-medium">${transaction.description}</div>
                                <div class="text-xs text-gray-600">${formatDate(transaction.timestamp)}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-bold">₨${transaction.amount}</div>
                            <div class="text-xs text-gray-500">${transaction.status}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        recentActivity.innerHTML = activityHtml;
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Load Admin Users
async function loadAdminUsers() {
    try {
        allUsers = await API.getAllUsers();
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

// Display Users
function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="text-center text-gray-500 py-4">No users found</p>';
        return;
    }
    
    let usersHtml = '';
    users.forEach(user => {
        const statusClass = user.status === 'active' ? 'status-active' : 
                          user.status === 'suspended' ? 'status-suspended' : 'status-pending';
        
        usersHtml += `
            <div class="user-list-item">
                <div class="user-info">
                    <div class="font-medium">${user.username}</div>
                    <div class="text-sm text-gray-600">${user.email}</div>
                    <div class="text-xs text-gray-500">Balance: ₨${user.balance} | Joined: ${formatDate(user.created_at)}</div>
                </div>
                <div class="user-actions">
                    <span class="badge ${statusClass}">${user.status}</span>
                    <button onclick="showUserActions('${user.uid}')" class="btn btn-secondary text-xs">Actions</button>
                </div>
            </div>
        `;
    });
    
    usersList.innerHTML = usersHtml;
}

// Filter Users
function filterUsers(filter) {
    const filterBtns = document.querySelectorAll('.filter-buttons .filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filteredUsers = allUsers;
    
    switch (filter) {
        case 'active':
            filteredUsers = allUsers.filter(user => user.status === 'active');
            break;
        case 'suspended':
            filteredUsers = allUsers.filter(user => user.status === 'suspended');
            break;
        case 'pending':
            filteredUsers = allUsers.filter(user => user.status === 'pending');
            break;
    }
    
    displayUsers(filteredUsers);
}

// Search Users
document.getElementById('userSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
});

// Show User Actions Modal
function showUserActions(userId) {
    const user = allUsers.find(u => u.uid === userId);
    if (!user) return;
    
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">User Actions - ${user.username}</h3>
        </div>
        <div class="modal-body">
            <div class="space-y-4">
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span class="text-gray-600">Balance:</span>
                            <span class="font-bold">₨${user.balance}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Status:</span>
                            <span class="font-bold">${user.status}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Total Invested:</span>
                            <span class="font-bold">₨${user.total_invested}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Total Earned:</span>
                            <span class="font-bold">₨${user.total_earned}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <button onclick="showBalanceAdjustment('${userId}', 'add')" class="btn btn-success w-full">Add Balance</button>
                    <button onclick="showBalanceAdjustment('${userId}', 'deduct')" class="btn btn-danger w-full">Deduct Balance</button>
                    <button onclick="updateUserStatus('${userId}', '${user.status === 'active' ? 'suspended' : 'active'}')" class="btn btn-secondary w-full">
                        ${user.status === 'active' ? 'Suspend User' : 'Activate User'}
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-primary">Close</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

// Show Balance Adjustment Modal
function showBalanceAdjustment(userId, action) {
    const user = allUsers.find(u => u.uid === userId);
    if (!user) return;
    
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">${action === 'add' ? 'Add' : 'Deduct'} Balance</h3>
        </div>
        <div class="modal-body">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Amount (₨)</label>
                    <input type="number" id="adjustmentAmount" class="input" min="1" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Reason</label>
                    <input type="text" id="adjustmentReason" class="input" placeholder="Reason for adjustment" required>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg text-sm">
                    <div class="flex justify-between">
                        <span>Current Balance:</span>
                        <span class="font-bold">₨${user.balance}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>New Balance:</span>
                        <span class="font-bold" id="newBalance">₨${user.balance}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
            <button onclick="processBalanceAdjustment('${userId}', '${action}')" class="btn btn-primary">Confirm</button>
        </div>
    `);
    
    document.body.appendChild(modal);
    
    // Update new balance preview
    document.getElementById('adjustmentAmount').addEventListener('input', function(e) {
        const amount = parseInt(e.target.value) || 0;
        const currentBalance = user.balance;
        const newBalance = action === 'add' ? currentBalance + amount : currentBalance - amount;
        document.getElementById('newBalance').textContent = `₨${newBalance}`;
    });
}

// Process Balance Adjustment
async function processBalanceAdjustment(userId, action) {
    const amount = parseInt(document.getElementById('adjustmentAmount').value);
    const reason = document.getElementById('adjustmentReason').value;
    
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    if (!reason) {
        showToast('Please enter a reason', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        if (action === 'add') {
            await API.addBalance(userId, amount, reason);
            showToast(`Added ₨${amount} to user balance`, 'success');
        } else {
            await API.deductBalance(userId, amount, reason);
            showToast(`Deducted ₨${amount} from user balance`, 'success');
        }
        
        closeModal();
        await loadAdminUsers(); // Refresh user list
        
    } catch (error) {
        showToast(error.message || 'Failed to adjust balance', 'error');
    } finally {
        setLoading(false);
    }
}

// Update User Status
async function updateUserStatus(userId, newStatus) {
    setLoading(true);
    
    try {
        await API.updateUserStatus(userId, newStatus);
        showToast(`User status updated to ${newStatus}`, 'success');
        closeModal();
        await loadAdminUsers(); // Refresh user list
        
    } catch (error) {
        showToast(error.message || 'Failed to update user status', 'error');
    } finally {
        setLoading(false);
    }
}

// Load Admin Investments
async function loadAdminInvestments() {
    try {
        allInvestments = await API.getAllInvestments();
        displayInvestments(allInvestments);
    } catch (error) {
        console.error('Error loading investments:', error);
        showToast('Error loading investments', 'error');
    }
}

// Display Investments
function displayInvestments(investments) {
    const investmentsList = document.getElementById('investmentsList');
    
    if (investments.length === 0) {
        investmentsList.innerHTML = '<p class="text-center text-gray-500 py-4">No investments found</p>';
        return;
    }
    
    let investmentsHtml = '';
    investments.forEach(investment => {
        const daysActive = Math.floor((Date.now() - investment.startDate) / (24 * 60 * 60 * 1000));
        const statusClass = investment.status === 'active' ? 'status-active' : 'status-pending';
        
        investmentsHtml += `
            <div class="user-list-item">
                <div class="user-info">
                    <div class="font-medium">${investment.planName}</div>
                    <div class="text-sm text-gray-600">User: ${investment.userId}</div>
                    <div class="text-xs text-gray-500">
                        Amount: ₨${investment.amount} | Days Active: ${daysActive} | Earned: ₨${investment.earnedSoFar}
                    </div>
                </div>
                <div class="user-actions">
                    <span class="badge ${statusClass}">${investment.status}</span>
                </div>
            </div>
        `;
    });
    
    investmentsList.innerHTML = investmentsHtml;
}

// Filter Investments
function filterInvestments(filter) {
    const filterBtns = document.querySelectorAll('#adminInvestments .filter-buttons .filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filteredInvestments = allInvestments;
    
    switch (filter) {
        case 'active':
            filteredInvestments = allInvestments.filter(inv => inv.status === 'active');
            break;
        case 'completed':
            filteredInvestments = allInvestments.filter(inv => inv.status === 'completed');
            break;
    }
    
    displayInvestments(filteredInvestments);
}

// Load Admin Withdrawals
async function loadAdminWithdrawals() {
    try {
        allWithdrawals = await API.getAllWithdrawals();
        displayWithdrawals(allWithdrawals);
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showToast('Error loading withdrawals', 'error');
    }
}

// Display Withdrawals
function displayWithdrawals(withdrawals) {
    const withdrawalsList = document.getElementById('withdrawalsList');
    
    if (withdrawals.length === 0) {
        withdrawalsList.innerHTML = '<p class="text-center text-gray-500 py-4">No withdrawal requests found</p>';
        return;
    }
    
    let withdrawalsHtml = '';
    withdrawals.forEach(withdrawal => {
        const statusClass = withdrawal.status === 'pending' ? 'status-pending' : 
                          withdrawal.status === 'approved' ? 'status-active' : 'status-suspended';
        
        withdrawalsHtml += `
            <div class="user-list-item">
                <div class="user-info">
                    <div class="font-medium">₨${withdrawal.amount} - ${withdrawal.paymentMethod}</div>
                    <div class="text-sm text-gray-600">User: ${withdrawal.userId}</div>
                    <div class="text-xs text-gray-500">Requested: ${formatDate(withdrawal.timestamp)}</div>
                </div>
                <div class="user-actions">
                    <span class="badge ${statusClass}">${withdrawal.status}</span>
                    ${withdrawal.status === 'pending' ? `
                        <button onclick="processWithdrawal('${withdrawal.id}', 'approved')" class="btn btn-success text-xs">Approve</button>
                        <button onclick="processWithdrawal('${withdrawal.id}', 'rejected')" class="btn btn-danger text-xs">Reject</button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    withdrawalsList.innerHTML = withdrawalsHtml;
}

// Filter Withdrawals
function filterWithdrawals(filter) {
    const filterBtns = document.querySelectorAll('#adminWithdrawals .filter-buttons .filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filteredWithdrawals = allWithdrawals;
    
    switch (filter) {
        case 'pending':
            filteredWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
            break;
        case 'approved':
            filteredWithdrawals = allWithdrawals.filter(w => w.status === 'approved');
            break;
        case 'rejected':
            filteredWithdrawals = allWithdrawals.filter(w => w.status === 'rejected');
            break;
    }
    
    displayWithdrawals(filteredWithdrawals);
}

// Process Withdrawal
async function processWithdrawal(withdrawalId, status) {
    setLoading(true);
    
    try {
        await API.processWithdrawal(withdrawalId, status, currentUser.uid);
        showToast(`Withdrawal ${status}`, 'success');
        await loadAdminWithdrawals(); // Refresh withdrawals list
        
    } catch (error) {
        showToast(error.message || 'Failed to process withdrawal', 'error');
    } finally {
        setLoading(false);
    }
}

// Load Admin Plans
async function loadAdminPlans() {
    try {
        const settings = await API.getSettings();
        const plans = settings.investmentPlans || INVESTMENT_PLANS;
        displayPlans(plans);
    } catch (error) {
        console.error('Error loading plans:', error);
        showToast('Error loading plans', 'error');
    }
}

// Display Plans
function displayPlans(plans) {
    const plansList = document.getElementById('plansList');
    
    if (plans.length === 0) {
        plansList.innerHTML = '<p class="text-center text-gray-500 py-4">No plans found</p>';
        return;
    }
    
    let plansHtml = '';
    plans.forEach(plan => {
        plansHtml += `
            <div class="user-list-item">
                <div class="user-info">
                    <div class="font-medium">${plan.name}</div>
                    <div class="text-sm text-gray-600">₨${plan.investment} - ${plan.rateOfReturn}% ROI</div>
                    <div class="text-xs text-gray-500">Daily Profit: ₨${plan.dailyProfit} | Duration: ${plan.duration} days</div>
                </div>
                <div class="user-actions">
                    <span class="badge ${plan.enabled ? 'badge-success' : 'badge-danger'}">${plan.enabled ? 'Active' : 'Disabled'}</span>
                    <button onclick="showEditPlanModal('${plan.id}')" class="btn btn-secondary text-xs">Edit</button>
                </div>
            </div>
        `;
    });
    
    plansList.innerHTML = plansHtml;
}

// Show Add Plan Modal
function showAddPlanModal() {
    const modal = createModal(`
        <div class="modal-header">
            <h3 class="font-bold">Add Investment Plan</h3>
        </div>
        <div class="modal-body">
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium mb-1">Plan Name</label>
                    <input type="text" id="planName" class="input" required>
                </div>
                <div class="form-row">
                    <div>
                        <label class="block text-sm font-medium mb-1">Investment Amount</label>
                        <input type="number" id="planInvestment" class="input" min="1" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Daily Profit</label>
                        <input type="number" id="planDailyProfit" class="input" min="1" required>
                    </div>
                </div>
                <div class="form-row">
                    <div>
                        <label class="block text-sm font-medium mb-1">Duration (Days)</label>
                        <input type="number" id="planDuration" class="input" min="1" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Rate of Return (%)</label>
                        <input type="number" id="planRateOfReturn" class="input" min="1" required>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Badge</label>
                    <input type="text" id="planBadge" class="input" placeholder="e.g., Popular, Best, VIP">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea id="planDescription" class="input" rows="3" placeholder="Plan description"></textarea>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
            <button onclick="addInvestmentPlan()" class="btn btn-primary">Add Plan</button>
        </div>
    `);
    
    document.body.appendChild(modal);
}

// Add Investment Plan
async function addInvestmentPlan() {
    const name = document.getElementById('planName').value;
    const investment = parseInt(document.getElementById('planInvestment').value);
    const dailyProfit = parseInt(document.getElementById('planDailyProfit').value);
    const duration = parseInt(document.getElementById('planDuration').value);
    const rateOfReturn = parseInt(document.getElementById('planRateOfReturn').value);
    const badge = document.getElementById('planBadge').value;
    const description = document.getElementById('planDescription').value;
    
    if (!name || !investment || !dailyProfit || !duration || !rateOfReturn) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const plan = {
            name: name,
            investment: investment,
            dailyProfit: dailyProfit,
            duration: duration,
            totalReturn: investment + (dailyProfit * duration),
            rateOfReturn: rateOfReturn,
            badge: badge || "New",
            badgeColor: "badge-primary",
            description: description,
            image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
        };
        
        await API.addInvestmentPlan(plan);
        showToast('Investment plan added successfully', 'success');
        closeModal();
        await loadAdminPlans(); // Refresh plans list
        
    } catch (error) {
        showToast(error.message || 'Failed to add plan', 'error');
    } finally {
        setLoading(false);
    }
}

// Load Admin Settings
async function loadAdminSettings() {
    try {
        const settings = await API.getSettings();
        
        // Populate settings form
        document.getElementById('supportPhone').value = settings.supportInfo?.phone || SUPPORT_INFO.phone;
        document.getElementById('supportEmail').value = settings.supportInfo?.email || SUPPORT_INFO.email;
        document.getElementById('minWithdrawal').value = settings.appConfig?.minWithdrawal || APP_CONFIG.minWithdrawal;
        document.getElementById('referralCommission').value = (settings.appConfig?.referralCommission || APP_CONFIG.referralCommission) * 100;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Error loading settings', 'error');
    }
}

// Save Settings
async function saveSettings() {
    const supportPhone = document.getElementById('supportPhone').value;
    const supportEmail = document.getElementById('supportEmail').value;
    const minWithdrawal = parseInt(document.getElementById('minWithdrawal').value);
    const referralCommission = parseInt(document.getElementById('referralCommission').value) / 100;
    
    if (!supportPhone || !supportEmail || !minWithdrawal || !referralCommission) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        const settings = {
            supportInfo: {
                phone: supportPhone,
                email: supportEmail,
                address: SUPPORT_INFO.address,
                whatsapp: supportPhone,
                workingHours: SUPPORT_INFO.workingHours
            },
            appConfig: {
                ...APP_CONFIG,
                minWithdrawal: minWithdrawal,
                referralCommission: referralCommission
            }
        };
        
        await API.updateSettings(settings);
        showToast('Settings saved successfully', 'success');
        
    } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
    } finally {
        setLoading(false);
    }
}

// Show Admin Panel (called from main script)
function showAdminPanel() {
    showPage('admin');
    loadAdminDashboard();
}

// Initialize admin functionality when user is admin
function initializeAdmin() {
    if (currentUser && currentUser.isAdmin) {
        document.getElementById('adminPanelBtn').classList.remove('hidden');
    }
}