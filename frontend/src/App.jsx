import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Send,
  ArrowDownUp,
  ReceiptText,
  CreditCard,
  Calculator,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { api } from './api';
import Header from './components/Header';
import KpiOverview from './components/KpiOverview';
import DashboardView from './components/DashboardView';
import TransferView from './components/TransferView';
import DepositWithdrawView from './components/DepositWithdrawView';
import TransactionsView from './components/TransactionsView';
import CardsView from './components/CardsView';
import LoansView from './components/LoansView';
import BillsView from './components/BillsView';
import NewAccountModal from './components/NewAccountModal';
import ReceiptModal from './components/ReceiptModal';
import Toast from './components/Toast';

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Data from Spring Boot REST APIs
  const loadInitialData = async () => {
    try {
      setIsRefreshing(true);
      const isHealthy = await api.checkHealth();
      setBackendOnline(isHealthy);

      const [accountsData, txnsData] = await Promise.all([
        api.getAccounts().catch(() => []),
        api.getAllTransactions().catch(() => []),
      ]);

      if (accountsData && accountsData.length > 0) {
        setAccounts(accountsData);
        // Retain or set active account
        setActiveAccount((prev) => {
          if (prev) {
            const found = accountsData.find((a) => a.accountNumber === prev.accountNumber);
            return found || accountsData[0];
          }
          return accountsData[0];
        });
      }

      if (txnsData) {
        setTransactions(txnsData);
      }
    } catch (err) {
      console.warn('Backend load warning, running demo fallback mode:', err);
      setBackendOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Account Switcher
  const handleSelectAccount = (accNo) => {
    const found = accounts.find((a) => a.accountNumber === accNo);
    if (found) {
      setActiveAccount(found);
      showToast(`Switched active account to ${found.accountName} (#${found.accountNumber})`, 'info');
    }
  };

  // Create New Account
  const handleCreateAccount = async (accountPayload) => {
    const newAcc = await api.createAccount(accountPayload);
    await loadInitialData();
    if (newAcc) {
      setActiveAccount(newAcc);
    }
  };

  // Deposit
  const handleDeposit = async (accNo, amount, note) => {
    const res = await api.deposit(accNo, amount, note);
    setReceiptData(res);
    await loadInitialData();
  };

  // Withdraw
  const handleWithdraw = async (accNo, amount, note) => {
    const res = await api.withdraw(accNo, amount, note);
    setReceiptData(res);
    await loadInitialData();
  };

  // Transfer
  const handleTransfer = async (transferPayload) => {
    const res = await api.transfer(
      transferPayload.fromAccountNumber,
      transferPayload.toAccountNumber,
      transferPayload.amount,
      transferPayload.note
    );
    setReceiptData(res);
    await loadInitialData();
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        onRefresh={loadInitialData}
        onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
        isRefreshing={isRefreshing}
        backendOnline={backendOnline}
      />

      {/* Feature Navigation Tabs */}
      <nav className="nav-tabs-wrapper" aria-label="Portal Navigation">
        <div className="nav-tabs">
          <button
            className={`tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard &amp; Overview
          </button>
          <button
            className={`tab-btn ${currentTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setCurrentTab('transfer')}
          >
            <Send size={16} /> Instant Transfer
          </button>
          <button
            className={`tab-btn ${currentTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setCurrentTab('deposit')}
          >
            <ArrowDownUp size={16} /> Deposit &amp; Withdraw (ATM)
          </button>
          <button
            className={`tab-btn ${currentTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setCurrentTab('transactions')}
          >
            <ReceiptText size={16} /> Ledger Transactions
          </button>
          <button
            className={`tab-btn ${currentTab === 'cards' ? 'active' : ''}`}
            onClick={() => setCurrentTab('cards')}
          >
            <CreditCard size={16} /> Smart Cards &amp; Security
          </button>
          <button
            className={`tab-btn ${currentTab === 'loans' ? 'active' : ''}`}
            onClick={() => setCurrentTab('loans')}
          >
            <Calculator size={16} /> Loans &amp; EMI Facility
          </button>
          <button
            className={`tab-btn ${currentTab === 'bills' ? 'active' : ''}`}
            onClick={() => setCurrentTab('bills')}
          >
            <Zap size={16} /> Pay Utilities
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="main-wrapper">
        {/* KPI Metrics */}
        <KpiOverview
          accounts={accounts}
          activeAccount={activeAccount}
          transactions={transactions}
        />

        {/* Dynamic Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            activeAccount={activeAccount}
            transactions={transactions}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenDepositModal={() => setCurrentTab('deposit')}
            onOpenWithdrawModal={() => setCurrentTab('deposit')}
          />
        )}

        {currentTab === 'transfer' && (
          <TransferView
            accounts={accounts}
            activeAccount={activeAccount}
            onTransferSuccess={handleTransfer}
            showToast={showToast}
          />
        )}

        {currentTab === 'deposit' && (
          <DepositWithdrawView
            activeAccount={activeAccount}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            showToast={showToast}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            activeAccount={activeAccount}
          />
        )}

        {currentTab === 'cards' && (
          <CardsView
            activeAccount={activeAccount}
            showToast={showToast}
          />
        )}

        {currentTab === 'loans' && (
          <LoansView
            activeAccount={activeAccount}
            onLoanApproved={loadInitialData}
            showToast={showToast}
          />
        )}

        {currentTab === 'bills' && (
          <BillsView
            activeAccount={activeAccount}
            onBillSettled={loadInitialData}
            showToast={showToast}
          />
        )}
      </main>

      {/* Modals & Toasts */}
      <NewAccountModal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        onCreateAccount={handleCreateAccount}
        showToast={showToast}
      />

      <ReceiptModal
        receipt={receiptData}
        onClose={() => setReceiptData(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
