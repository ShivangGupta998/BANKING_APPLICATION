/**
 * CBS Prime - Complete Enterprise Banking Portal Engine
 * Full-stack interactive client for Spring Boot Core Banking API
 */

// Application State
const State = {
    accounts: [],
    activeAccount: null,
    transactions: [],
    beneficiaries: [],
    bills: [],
    fixedDeposits: [],
    loans: [],
    cardControl: null,
    tickets: [],
    filterType: 'ALL',
    searchQuery: '',
    cardMasked: true,
    currentView: 'viewDashboard'
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    checkAuthSession();
    setupFeatureNavigation();
    setupEventListeners();
    await loadInitialData();
}

function checkAuthSession() {
    const userStr = localStorage.getItem('cbs_user');
    const navName = document.getElementById('navUserName');
    const navRole = document.getElementById('navUserRole');
    const navAvatar = document.getElementById('navUserAvatar');

    if (!userStr) {
        if (navName) navName.textContent = 'Demo Mode';
        if (navRole) navRole.textContent = 'Guest Viewer';
        if (navAvatar) navAvatar.textContent = 'DM';
        return;
    }

    try {
        const user = JSON.parse(userStr);
        if (navName) navName.textContent = user.accountName || 'Authorized User';
        if (navRole) navRole.textContent = user.role === 'ROLE_ADMIN' ? 'Executive Admin' : 'Verified Client';
        if (navAvatar && user.accountName) {
            navAvatar.textContent = user.accountName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
    } catch (e) {
        console.error('Session parsing error:', e);
    }
}

function logout() {
    localStorage.removeItem('cbs_user');
    localStorage.removeItem('cbs_token');
    window.location.href = 'login.html';
}

// Feature Suite Tab Navigation
function setupFeatureNavigation() {
    document.querySelectorAll('.feature-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewId = btn.getAttribute('data-view');
            switchFeatureView(viewId);
        });
    });
}

function switchFeatureView(viewId) {
    document.querySelectorAll('.feature-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.feature-view-panel').forEach(p => p.classList.remove('active'));

    const targetBtn = document.querySelector(`.feature-nav-btn[data-view="${viewId}"]`);
    const targetPanel = document.getElementById(viewId);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');

    State.currentView = viewId;

    if (State.activeAccount) {
        if (viewId === 'viewBills') loadBillHistory(State.activeAccount.accountNumber);
        if (viewId === 'viewDeposits') { loadFixedDeposits(State.activeAccount.accountNumber); calculateFdProjection(); }
        if (viewId === 'viewLoans') { loadLoans(State.activeAccount.accountNumber); calculateEmi(); }
        if (viewId === 'viewBeneficiaries') loadBeneficiaries(State.activeAccount.accountNumber);
        if (viewId === 'viewCards') loadCardControls(State.activeAccount.accountNumber);
        if (viewId === 'viewAnalytics') renderAnalyticsBreakdown();
        if (viewId === 'viewSupport') loadTickets(State.activeAccount.accountNumber);
    }
}

function setupEventListeners() {
    // Operations Hub Inner Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            const panel = document.getElementById(target);
            if (panel) panel.classList.add('active');
        });
    });

    // Preset Amount Chips in Transfers & Deposits
    document.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const form = chip.closest('form');
            const amountInput = form.querySelector('input[type="number"]');
            const val = chip.getAttribute('data-val');
            if (val === 'MAX' && State.activeAccount) {
                amountInput.value = State.activeAccount.accountBalance;
            } else if (val) {
                amountInput.value = parseFloat(val);
            }
        });
    });

    // Form Handlers
    const transferForm = document.getElementById('transferForm');
    if (transferForm) transferForm.addEventListener('submit', (e) => { e.preventDefault(); handleTransferSubmit(); });

    const depositForm = document.getElementById('depositForm');
    if (depositForm) depositForm.addEventListener('submit', (e) => { e.preventDefault(); handleDepositSubmit(); });

    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) withdrawForm.addEventListener('submit', (e) => { e.preventDefault(); handleWithdrawSubmit(); });

    const newAccountForm = document.getElementById('newAccountForm');
    if (newAccountForm) newAccountForm.addEventListener('submit', (e) => { e.preventDefault(); handleNewAccountSubmit(); });

    const billPayForm = document.getElementById('billPayForm');
    if (billPayForm) billPayForm.addEventListener('submit', (e) => { e.preventDefault(); handleBillPaySubmit(); });

    const fdForm = document.getElementById('fdForm');
    if (fdForm) fdForm.addEventListener('submit', (e) => { e.preventDefault(); handleFdSubmit(); });

    const loanForm = document.getElementById('loanForm');
    if (loanForm) loanForm.addEventListener('submit', (e) => { e.preventDefault(); handleLoanSubmit(); });

    const addBeneficiaryForm = document.getElementById('addBeneficiaryForm');
    if (addBeneficiaryForm) addBeneficiaryForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddBeneficiarySubmit(); });

    // Search and Filter Transactions
    const searchInput = document.getElementById('transactionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            State.searchQuery = e.target.value.toLowerCase().trim();
            renderTransactionsTable();
        });
    }

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            State.filterType = pill.getAttribute('data-filter');
            renderTransactionsTable();
        });
    });

    // Card Mask Toggle
    const cardToggleBtn = document.getElementById('cardToggleBtn');
    if (cardToggleBtn) {
        cardToggleBtn.addEventListener('click', () => {
            State.cardMasked = !State.cardMasked;
            updateCardDisplay();
        });
    }
}

// Initial Data Load
async function loadInitialData() {
    try {
        await Promise.all([loadAccounts(), loadAnalytics()]);
    } catch (err) {
        console.error('Initialization error:', err);
        showToast('Error connecting to Core Banking Server', 'error');
    }
}

async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const result = await response.json();
        if (result.success && result.data) {
            State.accounts = result.data;
            renderAccountPills();
            populateDropdowns();

            // Select active account (priority: logged-in user's account)
            let targetAcc = null;
            const userStr = localStorage.getItem('cbs_user');
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u.accountNumber > 0) {
                        targetAcc = State.accounts.find(a => a.accountNumber === u.accountNumber);
                    }
                } catch(e) {}
            }

            if (!targetAcc) {
                if (State.activeAccount) {
                    targetAcc = State.accounts.find(a => a.accountNumber === State.activeAccount.accountNumber);
                } else if (State.accounts.length > 0) {
                    targetAcc = State.accounts[0];
                }
            }

            if (targetAcc) {
                selectAccount(targetAcc.accountNumber);
            }
        }
    } catch (err) {
        console.error('Failed to load accounts:', err);
    }
}

async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const result = await response.json();
        if (result.success && result.data) {
            const data = result.data;
            const totalBalanceEl = document.getElementById('kpiTotalBalance');
            const totalAccountsEl = document.getElementById('kpiTotalAccounts');
            const totalTxnsEl = document.getElementById('kpiTotalTransactions');

            if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(data.totalBalance);
            if (totalAccountsEl) totalAccountsEl.textContent = data.totalAccounts;
            if (totalTxnsEl) totalTxnsEl.textContent = data.totalTransactions;
        }
    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

async function loadAccountTransactions(accountNumber) {
    try {
        const response = await fetch(`/api/transactions/${accountNumber}`);
        const result = await response.json();
        if (result.success && result.data) {
            State.transactions = result.data;
            renderTransactionsTable();
            renderAnalyticsBreakdown();
        }
    } catch (err) {
        console.error('Failed to load transactions:', err);
        State.transactions = [];
        renderTransactionsTable();
    }
}

// Account Selection
function selectAccount(accountNumber) {
    const acc = State.accounts.find(a => a.accountNumber === accountNumber);
    if (!acc) return;
    State.activeAccount = acc;

    document.querySelectorAll('.account-pill').forEach(pill => {
        const accNum = parseInt(pill.getAttribute('data-acc'));
        if (accNum === accountNumber) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    updateCardDisplay();
    updateAccountDetailsDisplay();
    syncDropdownSelection(accountNumber);
    loadAccountTransactions(accountNumber);

    // Refresh whichever tab is active
    if (State.currentView === 'viewBills') loadBillHistory(accountNumber);
    if (State.currentView === 'viewDeposits') loadFixedDeposits(accountNumber);
    if (State.currentView === 'viewLoans') loadLoans(accountNumber);
    if (State.currentView === 'viewBeneficiaries') loadBeneficiaries(accountNumber);
    if (State.currentView === 'viewCards') loadCardControls(accountNumber);
    if (State.currentView === 'viewSupport') loadTickets(accountNumber);
}

function updateCardDisplay() {
    if (!State.activeAccount) return;
    const acc = State.activeAccount;

    const cardHolderEl = document.getElementById('cardHolderName');
    const cardNumberEl = document.getElementById('cardNumberText');
    const cardTypeBadge = document.getElementById('cardTypeBadge');
    const cardEl = document.getElementById('virtualCard');

    if (cardHolderEl) cardHolderEl.textContent = acc.accountName;

    if (cardEl) {
        if (acc.accountType.toLowerCase().includes('corporate') || acc.accountType.toLowerCase().includes('business')) {
            cardEl.style.background = 'var(--gradient-corp)';
            if (cardTypeBadge) cardTypeBadge.textContent = 'COMMERCIAL ELITE';
        } else if (acc.accountType.toLowerCase().includes('premium')) {
            cardEl.style.background = 'var(--gradient-gold)';
            if (cardTypeBadge) cardTypeBadge.textContent = 'WEALTH PLATINUM';
        } else {
            cardEl.style.background = 'var(--gradient-visa)';
            if (cardTypeBadge) cardTypeBadge.textContent = 'VISA INFINITE';
        }
    }

    if (cardNumberEl) {
        const numStr = String(acc.accountNumber);
        if (State.cardMasked) {
            const last4 = numStr.slice(-4);
            cardNumberEl.textContent = `•••• •••• •••• ${last4}`;
        } else {
            cardNumberEl.textContent = formatCardNumber(numStr);
        }
    }
}

function updateAccountDetailsDisplay() {
    if (!State.activeAccount) return;
    const acc = State.activeAccount;

    const balanceEl = document.getElementById('detailBalance');
    const accNumEl = document.getElementById('detailAccountNumber');
    const typeEl = document.getElementById('detailAccountType');
    const holderEl = document.getElementById('detailAccountHolder');

    if (balanceEl) balanceEl.textContent = formatCurrency(acc.accountBalance);
    if (accNumEl) accNumEl.textContent = acc.accountNumber;
    if (typeEl) typeEl.textContent = acc.accountType;
    if (holderEl) holderEl.textContent = acc.accountName;
}

function renderAccountPills() {
    const container = document.getElementById('accountPillsContainer');
    if (!container) return;
    container.innerHTML = '';

    State.accounts.forEach(acc => {
        const pill = document.createElement('div');
        pill.className = `account-pill ${State.activeAccount && State.activeAccount.accountNumber === acc.accountNumber ? 'active' : ''}`;
        pill.setAttribute('data-acc', acc.accountNumber);

        const initials = acc.accountName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        pill.innerHTML = `
            <div class="pill-avatar">${initials}</div>
            <div class="pill-info">
                <span class="pill-name">${escapeHtml(acc.accountName)}</span>
                <span class="pill-balance mono-font">${formatCurrency(acc.accountBalance)}</span>
            </div>
        `;

        pill.addEventListener('click', () => selectAccount(acc.accountNumber));
        container.appendChild(pill);
    });
}

function populateDropdowns() {
    const fromSelect = document.getElementById('transferFrom');
    const toSelect = document.getElementById('transferTo');
    const depositSelect = document.getElementById('depositAccount');
    const withdrawSelect = document.getElementById('withdrawAccount');

    const updateSelect = (select) => {
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '';
        State.accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.accountNumber;
            opt.textContent = `${acc.accountName} - #${acc.accountNumber} (${formatCurrency(acc.accountBalance)})`;
            select.appendChild(opt);
        });
        if (currentVal && Array.from(select.options).some(o => o.value == currentVal)) {
            select.value = currentVal;
        }
    };

    updateSelect(fromSelect);
    updateSelect(depositSelect);
    updateSelect(withdrawSelect);
    updateSelect(toSelect);
}

function syncDropdownSelection(accountNumber) {
    const fromSelect = document.getElementById('transferFrom');
    const depositSelect = document.getElementById('depositAccount');
    const withdrawSelect = document.getElementById('withdrawAccount');

    if (fromSelect) fromSelect.value = accountNumber;
    if (depositSelect) depositSelect.value = accountNumber;
    if (withdrawSelect) withdrawSelect.value = accountNumber;
}

// =========================================================================
// Transfer & Core Banking Handlers
// =========================================================================

async function handleTransferSubmit() {
    const fromAccount = parseInt(document.getElementById('transferFrom').value);
    const toAccount = parseInt(document.getElementById('transferTo').value);
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const desc = document.getElementById('transferDesc').value;
    const submitBtn = document.getElementById('btnSubmitTransfer');

    if (!fromAccount || !toAccount || !amount || amount <= 0) {
        showToast('Please provide a valid transfer amount and accounts', 'error');
        return;
    }

    if (fromAccount === toAccount) {
        showToast('Source and destination accounts must be different', 'error');
        return;
    }

    try {
        if (submitBtn) submitBtn.disabled = true;
        const response = await fetch('/api/transfers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromAccountNumber: fromAccount,
                toAccountNumber: toAccount,
                amount: amount,
                description: desc
            })
        });

        const result = await response.json();
        if (result.success && result.data) {
            showReceiptModal(result.data, fromAccount, toAccount);
            showToast('Transfer completed successfully!', 'success');
            document.getElementById('transferAmount').value = '';
            document.getElementById('transferDesc').value = '';
            await loadAccounts();
            await loadAnalytics();
        } else {
            showToast(result.message || 'Transfer failed', 'error');
        }
    } catch (err) {
        showToast('Transfer request failed', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function handleDepositSubmit() {
    const account = parseInt(document.getElementById('depositAccount').value);
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const desc = document.getElementById('depositDesc').value;

    if (!account || !amount || amount <= 0) {
        showToast('Please enter a valid deposit amount', 'error');
        return;
    }

    try {
        const response = await fetch('/api/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountNumber: account, amount: amount, description: desc })
        });
        const result = await response.json();
        if (result.success) {
            showToast(`Deposited ${formatCurrency(amount)} successfully`, 'success');
            document.getElementById('depositAmount').value = '';
            document.getElementById('depositDesc').value = '';
            await loadAccounts();
            await loadAnalytics();
        } else {
            showToast(result.message || 'Deposit failed', 'error');
        }
    } catch (err) {
        showToast('Deposit failed', 'error');
    }
}

async function handleWithdrawSubmit() {
    const account = parseInt(document.getElementById('withdrawAccount').value);
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const desc = document.getElementById('withdrawDesc').value;

    if (!account || !amount || amount <= 0) {
        showToast('Please enter a valid withdrawal amount', 'error');
        return;
    }

    try {
        const response = await fetch('/api/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountNumber: account, amount: amount, description: desc })
        });
        const result = await response.json();
        if (result.success) {
            showToast(`Withdrew ${formatCurrency(amount)} successfully`, 'success');
            document.getElementById('withdrawAmount').value = '';
            document.getElementById('withdrawDesc').value = '';
            await loadAccounts();
            await loadAnalytics();
        } else {
            showToast(result.message || 'Withdrawal failed', 'error');
        }
    } catch (err) {
        showToast('Withdrawal failed', 'error');
    }
}

async function handleNewAccountSubmit() {
    const name = document.getElementById('newAccountName').value.trim();
    const type = document.getElementById('newAccountType').value;
    const deposit = parseFloat(document.getElementById('newAccountDeposit').value) || 0;

    if (!name) {
        showToast('Please enter full customer name', 'error');
        return;
    }

    try {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountName: name, accountType: type, accountBalance: deposit })
        });
        const result = await response.json();
        if (result.success && result.data) {
            showToast(`Account #${result.data.accountNumber} opened successfully!`, 'success');
            document.getElementById('newAccountName').value = '';
            await loadAccounts();
            await loadAnalytics();
            selectAccount(result.data.accountNumber);
        } else {
            showToast(result.message || 'Account creation failed', 'error');
        }
    } catch (err) {
        showToast('Failed to open account', 'error');
    }
}

// =========================================================================
// FEATURE: Bill Payments
// =========================================================================

function updateBillerNames() {
    const cat = document.getElementById('billCategory').value;
    const nameInput = document.getElementById('billBillerName');
    if (!nameInput) return;
    if (cat === 'Electricity') nameInput.value = 'Consolidated Edison Power';
    if (cat === 'Water') nameInput.value = 'Municipal Water Board';
    if (cat === 'Broadband') nameInput.value = 'Verizon Fios Fiber';
    if (cat === 'Mobile') nameInput.value = 'AT&T Mobility Wireless';
    if (cat === 'Credit Card') nameInput.value = 'Amex Platinum Settlement';
}

function quickFillBill(cat, biller, consumer, amount) {
    document.getElementById('billCategory').value = cat;
    document.getElementById('billBillerName').value = biller;
    document.getElementById('billConsumerNo').value = consumer;
    document.getElementById('billAmount').value = amount;
    showToast(`Loaded ${biller} invoice`, 'success');
}

async function handleBillPaySubmit() {
    if (!State.activeAccount) return;
    const cat = document.getElementById('billCategory').value;
    const biller = document.getElementById('billBillerName').value;
    const consumer = document.getElementById('billConsumerNo').value;
    const amount = parseFloat(document.getElementById('billAmount').value);

    try {
        const response = await fetch('/api/bills/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNumber: State.activeAccount.accountNumber,
                billerCategory: cat,
                billerName: biller,
                consumerNumber: consumer,
                amount: amount
            })
        });
        const result = await response.json();
        if (result.success && result.data) {
            showToast(`Bill paid! Ref: ${result.data.referenceId}`, 'success');
            document.getElementById('billAmount').value = '';
            await loadAccounts();
            await loadBillHistory(State.activeAccount.accountNumber);
        } else {
            showToast(result.message || 'Payment failed', 'error');
        }
    } catch (e) {
        showToast('Payment request failed', 'error');
    }
}

async function loadBillHistory(accountNumber) {
    try {
        const response = await fetch(`/api/bills/${accountNumber}`);
        const result = await response.json();
        const tbody = document.getElementById('billsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No bill payment records yet.</td></tr>`;
            return;
        }

        result.data.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="txn-ref-badge mono-font">${escapeHtml(b.referenceId)}</span></td>
                <td>${escapeHtml(b.paymentDate)}</td>
                <td><span class="badge-type badge-transfer">${escapeHtml(b.billerCategory)}</span></td>
                <td style="font-weight: 700; color: #fff;">${escapeHtml(b.billerName)}</td>
                <td class="mono-font">${escapeHtml(b.consumerNumber)}</td>
                <td class="amount-negative mono-font">-${formatCurrency(b.amount)}</td>
                <td><span class="status-badge-ok"><i class="fa fa-check-circle"></i> PAID</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Failed to load bill history:', e);
    }
}

// =========================================================================
// FEATURE: Fixed Deposits & Term Wealth
// =========================================================================

function calculateFdProjection() {
    const amount = parseFloat(document.getElementById('fdAmount')?.value) || 0;
    const months = parseInt(document.getElementById('fdTenure')?.value) || 12;

    let rate = 6.5;
    if (months >= 12) rate = 7.1;
    if (months >= 36) rate = 7.75;
    if (months >= 60) rate = 8.25;

    const interest = amount * (rate / 100.0) * (months / 12.0);
    const maturity = amount + interest;

    const maturityEl = document.getElementById('fdProjectedMaturity');
    const interestEl = document.getElementById('fdProjectedInterest');

    if (maturityEl) maturityEl.textContent = formatCurrency(maturity);
    if (interestEl) interestEl.textContent = `+ ${formatCurrency(interest)} Guaranteed Profit (${rate}% p.a.)`;
}

async function handleFdSubmit() {
    if (!State.activeAccount) return;
    const amount = parseFloat(document.getElementById('fdAmount').value);
    const months = parseInt(document.getElementById('fdTenure').value);

    try {
        const response = await fetch('/api/deposits/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNumber: State.activeAccount.accountNumber,
                depositAmount: amount,
                tenureMonths: months
            })
        });
        const result = await response.json();
        if (result.success && result.data) {
            showToast(`Fixed Deposit booked! Cert: ${result.data.certificateNumber}`, 'success');
            await loadAccounts();
            await loadFixedDeposits(State.activeAccount.accountNumber);
        } else {
            showToast(result.message || 'Booking failed', 'error');
        }
    } catch (e) {
        showToast('FD booking request failed', 'error');
    }
}

async function loadFixedDeposits(accountNumber) {
    try {
        const response = await fetch(`/api/deposits/${accountNumber}`);
        const result = await response.json();
        const container = document.getElementById('fdCertificatesContainer');
        if (!container) return;
        container.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No active Fixed Deposits. Book an FD to earn high-yield interest.</div>`;
            return;
        }

        result.data.forEach(fd => {
            const card = document.createElement('div');
            card.className = 'fd-certificate-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong class="mono-font" style="color: #fff; font-size: 1rem;">${escapeHtml(fd.certificateNumber)}</strong>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">Tenure: ${fd.tenureMonths} Months (${fd.interestRate}% p.a.)</p>
                    </div>
                    <span class="ticket-status-${fd.status === 'ACTIVE' ? 'resolved' : 'open'}">${fd.status}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                    <div>
                        <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Principal</span>
                        <div class="mono-font" style="font-size: 1.1rem; font-weight: 700; color: #fff;">${formatCurrency(fd.depositAmount)}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Maturity Value</span>
                        <div class="mono-font" style="font-size: 1.1rem; font-weight: 700; color: var(--accent-emerald);">${formatCurrency(fd.maturityAmount)}</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                    <span>Matures: ${fd.maturityDate}</span>
                    ${fd.status === 'ACTIVE' ? `<button class="btn-action-small" style="padding: 0.35rem 0.75rem;" onclick="breakDepositApi(${fd.id})"><i class="fa fa-unlock"></i> Liquidate</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error('Failed to load FDs:', e);
    }
}

async function breakDepositApi(id) {
    if (!confirm('Are you sure you want to break this Fixed Deposit early? A premature fee applies.')) return;
    try {
        const response = await fetch(`/api/deposits/${id}/break`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            showToast(result.message, 'success');
            await loadAccounts();
            await loadFixedDeposits(State.activeAccount.accountNumber);
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) {
        showToast('Liquidate failed', 'error');
    }
}

// =========================================================================
// FEATURE: Loans & Interactive EMI
// =========================================================================

function updateLoanRate() {
    calculateEmi();
}

function calculateEmi() {
    const p = parseFloat(document.getElementById('loanAmountSlider')?.value) || 25000;
    const n = parseInt(document.getElementById('loanTenureSlider')?.value) || 36;
    const type = document.getElementById('loanType')?.value || 'Auto Loan';

    document.getElementById('lblLoanAmount').textContent = formatCurrency(p);
    document.getElementById('lblLoanTenure').textContent = `${n} Months`;

    let rate = 9.5;
    if (type.includes('Home')) rate = 7.5;
    if (type.includes('Auto')) rate = 8.5;
    if (type.includes('Personal')) rate = 11.5;

    const monthlyRate = (rate / 100.0) / 12.0;
    const emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - p;

    document.getElementById('calcMonthlyEmi').textContent = formatCurrency(emi);
    document.getElementById('calcTotalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('calcTotalPayable').textContent = formatCurrency(totalPayable);
}

async function handleLoanSubmit() {
    if (!State.activeAccount) return;
    const p = parseFloat(document.getElementById('loanAmountSlider').value);
    const n = parseInt(document.getElementById('loanTenureSlider').value);
    const type = document.getElementById('loanType').value;

    try {
        const response = await fetch('/api/loans/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNumber: State.activeAccount.accountNumber,
                loanType: type,
                loanAmount: p,
                tenureMonths: n
            })
        });
        const result = await response.json();
        if (result.success && result.data) {
            showToast(`Loan Approved! ${formatCurrency(p)} disbursed into balance. Ref: ${result.data.referenceNumber}`, 'success');
            await loadAccounts();
            await loadLoans(State.activeAccount.accountNumber);
        } else {
            showToast(result.message || 'Loan application failed', 'error');
        }
    } catch (e) {
        showToast('Loan request error', 'error');
    }
}

async function loadLoans(accountNumber) {
    try {
        const response = await fetch(`/api/loans/${accountNumber}`);
        const result = await response.json();
        const container = document.getElementById('loansContainer');
        if (!container) return;
        container.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No active loan contracts. Use the EMI calculator to apply instantly.</div>`;
            return;
        }

        result.data.forEach(ln => {
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #fff; font-size: 1rem;">${escapeHtml(ln.loanType)}</strong>
                        <p class="mono-font" style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(ln.referenceNumber)}</p>
                    </div>
                    <span class="status-badge-ok"><i class="fa fa-check-circle"></i> ${escapeHtml(ln.status)}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase;">Principal</span>
                        <div class="mono-font" style="font-weight: 700; color: #fff;">${formatCurrency(ln.loanAmount)}</div>
                    </div>
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase;">Monthly EMI</span>
                        <div class="mono-font" style="font-weight: 700; color: var(--accent-cyan);">${formatCurrency(ln.monthlyEmi)}</div>
                    </div>
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase;">Interest Rate</span>
                        <div class="mono-font" style="font-weight: 700; color: var(--accent-emerald);">${ln.interestRate}%</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error('Failed to load loans:', e);
    }
}

// =========================================================================
// FEATURE: Beneficiaries & Payees
// =========================================================================

async function loadBeneficiaries(accountNumber) {
    try {
        const response = await fetch(`/api/beneficiaries/${accountNumber}`);
        const result = await response.json();
        const grid = document.getElementById('beneficiariesGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            grid.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No saved beneficiaries yet. Register a payee below.</div>`;
            return;
        }

        result.data.forEach(b => {
            const card = document.createElement('div');
            card.className = 'beneficiary-card';
            const initials = b.beneficiaryName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            card.innerHTML = `
                <div class="beneficiary-header">
                    <div class="beneficiary-avatar">${initials}</div>
                    <div style="flex: 1;">
                        <strong style="color: #fff; font-size: 0.95rem;">${escapeHtml(b.beneficiaryName)}</strong>
                        <p class="mono-font" style="font-size: 0.75rem; color: var(--text-muted);">${b.bankName} - #${b.beneficiaryAccountNumber}</p>
                    </div>
                    <button class="btn-action-small" style="padding: 0.4rem 0.65rem; color: var(--accent-rose);" onclick="deleteBeneficiaryApi(${b.id})" title="Delete Payee">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                    <span style="font-size: 0.72rem; color: var(--text-dim);">Daily Cap: ${formatCurrency(b.dailyLimit)}</span>
                    <button class="btn-action-small" style="background: rgba(99, 102, 241, 0.2); color: #fff; border-color: var(--accent-primary);" onclick="transferToBeneficiary(${b.beneficiaryAccountNumber})">
                        <i class="fa fa-paper-plane"></i> Send Money
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error('Failed to load beneficiaries:', e);
    }
}

async function handleAddBeneficiarySubmit() {
    if (!State.activeAccount) return;
    const name = document.getElementById('benName').value.trim();
    const accNo = parseInt(document.getElementById('benAccountNo').value);
    const bank = document.getElementById('benBankName').value.trim();
    const routing = document.getElementById('benRouting').value.trim();
    const cap = parseFloat(document.getElementById('benDailyLimit').value) || 25000;

    try {
        const response = await fetch('/api/beneficiaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAccountNumber: State.activeAccount.accountNumber,
                beneficiaryName: name,
                beneficiaryAccountNumber: accNo,
                bankName: bank,
                routingCode: routing,
                dailyLimit: cap
            })
        });
        const result = await response.json();
        if (result.success) {
            showToast(`Beneficiary ${name} saved successfully`, 'success');
            document.getElementById('benName').value = '';
            document.getElementById('benAccountNo').value = '';
            await loadBeneficiaries(State.activeAccount.accountNumber);
        } else {
            showToast(result.message || 'Failed to add payee', 'error');
        }
    } catch (e) {
        showToast('Error saving beneficiary', 'error');
    }
}

function transferToBeneficiary(targetAcc) {
    switchFeatureView('viewDashboard');
    const toSelect = document.getElementById('transferTo');
    if (toSelect) toSelect.value = targetAcc;
    document.querySelector('[data-tab="tabTransfer"]')?.click();
    showToast(`Recipient #${targetAcc} selected for transfer`, 'success');
}

async function deleteBeneficiaryApi(id) {
    if (!confirm('Remove this beneficiary contact?')) return;
    try {
        const response = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showToast('Beneficiary deleted', 'success');
            await loadBeneficiaries(State.activeAccount.accountNumber);
        }
    } catch (e) {
        showToast('Delete failed', 'error');
    }
}

// =========================================================================
// FEATURE: Card Controls & Security
// =========================================================================

async function loadCardControls(accountNumber) {
    try {
        const response = await fetch(`/api/cards/${accountNumber}`);
        const result = await response.json();
        if (result.success && result.data) {
            const c = result.data;
            document.getElementById('chkFreezeCard').checked = c.frozen;
            document.getElementById('chkOnlineTxn').checked = c.onlineTransactions;
            document.getElementById('chkIntlUsage').checked = c.internationalUsage;
            document.getElementById('chkContactless').checked = c.contactlessPayments;
            document.getElementById('cardAtmLimitSlider').value = c.dailyAtmLimit;
            document.getElementById('cardPosLimitSlider').value = c.dailyPosLimit;
            document.getElementById('lblAtmLimit').textContent = formatCurrency(c.dailyAtmLimit);
            document.getElementById('lblPosLimit').textContent = formatCurrency(c.dailyPosLimit);
        }
    } catch (e) {
        console.error('Failed to load card controls:', e);
    }
}

async function toggleCardFreezeApi() {
    if (!State.activeAccount) return;
    try {
        const response = await fetch(`/api/cards/${State.activeAccount.accountNumber}/freeze-toggle`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            showToast(result.message, result.data.frozen ? 'error' : 'success');
        }
    } catch (e) {
        showToast('Toggle freeze failed', 'error');
    }
}

async function saveCardSettingsApi() {
    if (!State.activeAccount) return;
    try {
        const payload = {
            accountNumber: State.activeAccount.accountNumber,
            frozen: document.getElementById('chkFreezeCard').checked,
            onlineTransactions: document.getElementById('chkOnlineTxn').checked,
            internationalUsage: document.getElementById('chkIntlUsage').checked,
            contactlessPayments: document.getElementById('chkContactless').checked,
            dailyAtmLimit: parseFloat(document.getElementById('cardAtmLimitSlider').value),
            dailyPosLimit: parseFloat(document.getElementById('cardPosLimitSlider').value)
        };
        const response = await fetch('/api/cards/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            showToast('Card security limits and rules saved!', 'success');
        }
    } catch (e) {
        showToast('Failed to save settings', 'error');
    }
}

async function submitChangePin() {
    if (!State.activeAccount) return;
    const pin = document.getElementById('newCardPin').value.trim();
    if (!pin || pin.length !== 4) {
        showToast('PIN must be 4 digits', 'error');
        return;
    }
    try {
        const response = await fetch(`/api/cards/${State.activeAccount.accountNumber}/change-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPin: pin })
        });
        const result = await response.json();
        if (result.success) {
            showToast('ATM PIN updated successfully!', 'success');
            document.getElementById('newCardPin').value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) {
        showToast('PIN change failed', 'error');
    }
}

// =========================================================================
// FEATURE: Spending Analytics & Insights
// =========================================================================

function renderAnalyticsBreakdown() {
    if (!State.transactions) return;

    let totalInflow = 0;
    let totalOutflow = 0;
    let catTransfers = 0;
    let catBills = 0;
    let catInvest = 0;
    let catCash = 0;

    State.transactions.forEach(t => {
        const isDebit = (t.transactionType === 'TRANSFER' && t.sourceAccountNumber === State.activeAccount?.accountNumber) ||
                        t.transactionType === 'WITHDRAWAL' ||
                        t.transactionType === 'BILL_PAYMENT' ||
                        t.transactionType === 'INVESTMENT';

        if (isDebit) {
            totalOutflow += t.amount;
            if (t.transactionType === 'TRANSFER') catTransfers += t.amount;
            if (t.transactionType === 'BILL_PAYMENT') catBills += t.amount;
            if (t.transactionType === 'INVESTMENT') catInvest += t.amount;
            if (t.transactionType === 'WITHDRAWAL') catCash += t.amount;
        } else {
            totalInflow += t.amount;
        }
    });

    const inflowEl = document.getElementById('analyticsInflow');
    const outflowEl = document.getElementById('analyticsOutflow');
    const netEl = document.getElementById('analyticsNetFlow');

    if (inflowEl) inflowEl.textContent = formatCurrency(totalInflow);
    if (outflowEl) outflowEl.textContent = formatCurrency(totalOutflow);
    if (netEl) {
        const net = totalInflow - totalOutflow;
        netEl.textContent = `${net >= 0 ? '+' : ''}${formatCurrency(net)}`;
        netEl.style.color = net >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)';
    }

    // Bar distribution
    const totalSpent = totalOutflow || 1;
    const pXfer = Math.round((catTransfers / totalSpent) * 100);
    const pBill = Math.round((catBills / totalSpent) * 100);
    const pInv = Math.round((catInvest / totalSpent) * 100);
    const pCash = Math.round((catCash / totalSpent) * 100);

    const updateBar = (barId, pctId, val) => {
        const bar = document.getElementById(barId);
        const lbl = document.getElementById(pctId);
        if (bar) bar.style.width = `${val}%`;
        if (lbl) lbl.textContent = `${val}% (${formatCurrency(val * totalSpent / 100)})`;
    };

    updateBar('barFillTransfers', 'barPctTransfers', pXfer);
    updateBar('barFillBills', 'barPctBills', pBill);
    updateBar('barFillInvest', 'barPctInvest', pInv);
    updateBar('barFillCash', 'barPctCash', pCash);
}

// =========================================================================
// FEATURE: Support Desk & AI Virtual Assistant
// =========================================================================

async function submitSupportTicket() {
    if (!State.activeAccount) return;
    const cat = document.getElementById('ticketCategory').value;
    const sub = document.getElementById('ticketSubject').value.trim();
    const msg = document.getElementById('ticketMessage').value.trim();

    try {
        const response = await fetch('/api/support/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountNumber: State.activeAccount.accountNumber,
                category: cat,
                subject: sub,
                message: msg
            })
        });
        const result = await response.json();
        if (result.success && result.data) {
            showToast(`Support ticket ${result.data.ticketNumber} logged.`, 'success');
            document.getElementById('ticketSubject').value = '';
            document.getElementById('ticketMessage').value = '';
            await loadTickets(State.activeAccount.accountNumber);
        }
    } catch (e) {
        showToast('Ticket submission failed', 'error');
    }
}

async function loadTickets(accountNumber) {
    try {
        const response = await fetch(`/api/support/tickets/${accountNumber}`);
        const result = await response.json();
        const container = document.getElementById('ticketsContainer');
        if (!container) return;
        container.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No support requests open.</div>`;
            return;
        }

        result.data.forEach(t => {
            const row = document.createElement('div');
            row.className = 'ticket-row';
            row.innerHTML = `
                <div>
                    <strong style="color: #fff; font-size: 0.85rem;">${escapeHtml(t.subject)}</strong>
                    <p style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(t.category)} | Ref: ${escapeHtml(t.ticketNumber)}</p>
                </div>
                <span class="ticket-status-${t.status === 'RESOLVED' ? 'resolved' : 'open'}">${t.status}</span>
            `;
            container.appendChild(row);
        });
    } catch (e) {
        console.error('Failed to load tickets:', e);
    }
}

// Virtual Assistant Chatbot Logic
function handleChatSubmit() {
    const input = document.getElementById('chatInput');
    const msgContainer = document.getElementById('chatMessages');
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    // Append user message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.textContent = input.value;
    msgContainer.appendChild(userBubble);
    input.value = '';

    // Simulate AI smart response
    setTimeout(() => {
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble chat-bubble-bot';

        let reply = "I can help clarify fees, routing numbers, and card locks. For complex wire inquiries, our representative desk is ready.";
        if (q.includes('fee') || q.includes('cost')) {
            reply = "CBS Prime charges $0.00 for domestic wire transfers, bill payments, and inter-account movements.";
        } else if (q.includes('routing') || q.includes('swift')) {
            reply = "Our Federal Reserve Routing Transit Number is 021000021 (CBS Prime Global).";
        } else if (q.includes('freeze') || q.includes('lost') || q.includes('lock')) {
            reply = "You can immediately freeze your card under the 'Card Security' tab to prevent any unauthorized transactions in 1 click.";
        } else if (q.includes('interest') || q.includes('fd') || q.includes('rate')) {
            reply = "Our Fixed Deposit rates range from 6.50% (3-6 Months) up to 8.25% p.a. (5 Years) with guaranteed compound yields.";
        } else if (q.includes('loan') || q.includes('emi') || q.includes('borrow')) {
            reply = "Our automated lending engine approves personal, auto, and home loans instantly with immediate balance disbursement into your account.";
        }

        botBubble.textContent = reply;
        msgContainer.appendChild(botBubble);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 450);

    msgContainer.scrollTop = msgContainer.scrollHeight;
}

// =========================================================================
// General Table, Receipts, and Utilities
// =========================================================================

function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = State.transactions.filter(t => {
        if (State.filterType === 'TRANSFERS' && t.transactionType !== 'TRANSFER') return false;
        if (State.filterType === 'DEPOSITS' && t.transactionType !== 'DEPOSIT' && t.transactionType !== 'LOAN_DISBURSED') return false;
        if (State.filterType === 'WITHDRAWALS' && t.transactionType !== 'WITHDRAWAL' && t.transactionType !== 'BILL_PAYMENT' && t.transactionType !== 'INVESTMENT') return false;

        if (State.searchQuery) {
            const ref = (t.referenceId || '').toLowerCase();
            const desc = (t.description || '').toLowerCase();
            return ref.includes(State.searchQuery) || desc.includes(State.searchQuery);
        }
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    <i class="fa fa-folder-open-o" style="font-size: 1.8rem; margin-bottom: 0.5rem; display: block;"></i>
                    No transactions found for the selected criteria.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(txn => {
        const tr = document.createElement('tr');
        const isDebit = (txn.transactionType === 'TRANSFER' && txn.sourceAccountNumber === State.activeAccount?.accountNumber) ||
                        txn.transactionType === 'WITHDRAWAL' ||
                        txn.transactionType === 'BILL_PAYMENT' ||
                        txn.transactionType === 'INVESTMENT';

        const amountClass = isDebit ? 'amount-negative' : 'amount-positive';
        const sign = isDebit ? '-' : '+';

        let badgeClass = 'badge-transfer';
        if (txn.transactionType === 'DEPOSIT' || txn.transactionType === 'LOAN_DISBURSED') badgeClass = 'badge-deposit';
        if (txn.transactionType === 'WITHDRAWAL' || txn.transactionType === 'BILL_PAYMENT') badgeClass = 'badge-withdrawal';

        tr.innerHTML = `
            <td><span class="txn-ref-badge mono-font">${escapeHtml(txn.referenceId || 'TXN')}</span></td>
            <td>${escapeHtml(txn.timestamp || 'N/A')}</td>
            <td style="font-weight: 600; color: var(--text-primary);">${escapeHtml(txn.description || 'Transaction')}</td>
            <td><span class="badge-type ${badgeClass}">${escapeHtml(txn.transactionType)}</span></td>
            <td><span class="status-badge-ok"><i class="fa fa-check-circle"></i> ${escapeHtml(txn.status || 'SUCCESS')}</span></td>
            <td class="${amountClass} mono-font">${sign}${formatCurrency(txn.amount)}</td>
            <td class="mono-font" style="color: var(--text-muted);">${formatCurrency(txn.balanceAfter)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showReceiptModal(txn, fromAcc, toAcc) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    document.getElementById('receiptRefId').textContent = txn.referenceId;
    document.getElementById('receiptTimestamp').textContent = txn.timestamp;
    document.getElementById('receiptFromAcc').textContent = '#' + fromAcc;
    document.getElementById('receiptToAcc').textContent = '#' + toAcc;
    document.getElementById('receiptAmount').textContent = formatCurrency(txn.amount);
    document.getElementById('receiptBalance').textContent = formatCurrency(txn.balanceAfter);

    modal.classList.add('active');
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.classList.remove('active');
}

function exportStatementCSV() {
    if (!State.transactions || State.transactions.length === 0) {
        showToast('No transaction data to export', 'error');
        return;
    }

    const headers = ['Reference ID', 'Date & Time', 'Description', 'Type', 'Status', 'Amount', 'Balance After'];
    const rows = State.transactions.map(t => [
        t.referenceId,
        t.timestamp,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.transactionType,
        t.status,
        t.amount,
        t.balanceAfter
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBS-Statement-Acc-${State.activeAccount?.accountNumber || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Statement exported successfully as CSV', 'success');
}

function copyActiveAccountNumber() {
    if (!State.activeAccount) return;
    navigator.clipboard.writeText(String(State.activeAccount.accountNumber))
        .then(() => showToast(`Account #${State.activeAccount.accountNumber} copied to clipboard!`, 'success'))
        .catch(() => showToast('Could not copy to clipboard', 'error'));
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fa ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function formatCurrency(val) {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatCardNumber(numStr) {
    return numStr.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
