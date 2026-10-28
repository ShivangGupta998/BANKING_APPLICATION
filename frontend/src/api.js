/**
 * CBS Prime Banking - Core REST API Client
 * Communicates with Spring Boot backend at http://localhost:8082 via Vite proxy
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `HTTP ${response.status}: Request failed`);
    }
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Accounts
  getAccounts: () => request('/api/accounts'),
  getAccount: (accNo) => request(`/api/accounts/${accNo}`),
  createAccount: (accountData) => request('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  }),

  // Operations: Deposit, Withdraw, Transfer
  deposit: (accountNumber, amount, note = 'Cash Deposit') => request('/api/deposit', {
    method: 'POST',
    body: JSON.stringify({ accountNumber: Number(accountNumber), amount: Number(amount), note }),
  }),

  withdraw: (accountNumber, amount, note = 'Cash Withdrawal') => request('/api/withdraw', {
    method: 'POST',
    body: JSON.stringify({ accountNumber: Number(accountNumber), amount: Number(amount), note }),
  }),

  transfer: (fromAccountNumber, toAccountNumber, amount, note = 'Fund Transfer') => request('/api/transfers', {
    method: 'POST',
    body: JSON.stringify({
      fromAccountNumber: Number(fromAccountNumber),
      toAccountNumber: Number(toAccountNumber),
      amount: Number(amount),
      note,
    }),
  }),

  // Transactions & Analytics
  getAllTransactions: () => request('/api/transactions'),
  getTransactionsForAccount: (accNo) => request(`/api/transactions/${accNo}`),
  getAnalytics: () => request('/api/analytics'),

  // Beneficiaries
  getBeneficiaries: (accNo) => request(`/api/beneficiaries/${accNo}`),
  addBeneficiary: (beneficiary) => request('/api/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(beneficiary),
  }),
  deleteBeneficiary: (id) => request(`/api/beneficiaries/${id}`, {
    method: 'DELETE',
  }),

  // Bills
  getBills: (accNo) => request(`/api/bills/${accNo}`),
  payBill: (bill) => request('/api/bills/pay', {
    method: 'POST',
    body: JSON.stringify(bill),
  }),

  // Loans
  getLoans: (accNo) => request(`/api/loans/${accNo}`),
  applyLoan: (loan) => request('/api/loans/apply', {
    method: 'POST',
    body: JSON.stringify(loan),
  }),

  // Cards
  getCard: (accNo) => request(`/api/cards/${accNo}`),
  toggleCardFreeze: (accNo) => request(`/api/cards/${accNo}/freeze-toggle`, {
    method: 'POST',
  }),
  updateCardSettings: (settings) => request('/api/cards/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  }),
  changeCardPin: (accNo, newPin) => request(`/api/cards/${accNo}/change-pin`, {
    method: 'POST',
    body: JSON.stringify({ newPin }),
  }),

  // Health
  checkHealth: async () => {
    try {
      const res = await fetch('/sayHello');
      return res.ok;
    } catch {
      return false;
    }
  }
};
