import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, ShieldAlert, Sparkles } from 'lucide-react';

export default function DepositWithdrawView({
  activeAccount,
  onDeposit,
  onWithdraw,
  showToast
}) {
  const [mode, setMode] = useState('deposit'); // 'deposit' or 'withdraw'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBalance = activeAccount ? Number(activeAccount.accountBalance) : 0;
  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficient = mode === 'withdraw' && parsedAmount > currentBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAccount) {
      showToast('Please select an account first.', 'error');
      return;
    }
    if (parsedAmount <= 0) {
      showToast('Please enter an amount greater than $0.', 'error');
      return;
    }
    if (isInsufficient) {
      showToast('Insufficient funds for this withdrawal.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'deposit') {
        await onDeposit(activeAccount.accountNumber, parsedAmount, note || 'ATM Cash Deposit');
        showToast(`Deposited $${parsedAmount.toFixed(2)} into Account #${activeAccount.accountNumber}`, 'success');
      } else {
        await onWithdraw(activeAccount.accountNumber, parsedAmount, note || 'ATM Cash Withdrawal');
        showToast(`Withdrew $${parsedAmount.toFixed(2)} from Account #${activeAccount.accountNumber}`, 'info');
      }
      setAmount('');
      setNote('');
    } catch (err) {
      showToast(err.message || 'Operation failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = (val) => {
    setAmount(String(val));
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="glass-panel">
        {/* Toggle Mode: Deposit vs Withdraw */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem' }}>
          <button
            type="button"
            className="tab-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: mode === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: mode === 'deposit' ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
              color: mode === 'deposit' ? 'var(--accent-emerald)' : 'var(--text-muted)',
            }}
            onClick={() => setMode('deposit')}
          >
            <ArrowDownLeft size={16} /> Instant Deposit
          </button>
          <button
            type="button"
            className="tab-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              background: mode === 'withdraw' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              borderColor: mode === 'withdraw' ? 'rgba(244, 63, 94, 0.4)' : 'transparent',
              color: mode === 'withdraw' ? 'var(--accent-rose)' : 'var(--text-muted)',
            }}
            onClick={() => setMode('withdraw')}
          >
            <ArrowUpRight size={16} /> Cash Withdrawal
          </button>
        </div>

        {/* Account Info Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Account</div>
            <div style={{ fontWeight: 700, color: '#fff' }}>{activeAccount?.accountName}</div>
            <div className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{activeAccount?.accountNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Available Balance</div>
            <div className="mono-font" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {mode === 'deposit' ? 'Deposit Amount (USD)' : 'Withdrawal Amount (USD)'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control mono-font"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ fontSize: '1.4rem', fontWeight: 700 }}
            />

            {/* Quick Chips */}
            <div className="quick-amount-row">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Denominations:</span>
              {[20, 50, 100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="amount-chip"
                  onClick={() => handleQuickAdd(val)}
                >
                  ${val}
                </button>
              ))}
            </div>

            {isInsufficient && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontSize: '0.78rem' }}>
                <ShieldAlert size={14} /> Insufficient funds. Maximum withdrawal allowed is ${currentBalance.toFixed(2)}.
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Memo / Reference (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder={mode === 'deposit' ? 'e.g. Salary, check deposit, savings' : 'e.g. ATM cash out, travel money'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`btn ${mode === 'deposit' ? 'btn-success' : 'btn-danger'}`}
            style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
            disabled={isSubmitting || isInsufficient || parsedAmount <= 0}
          >
            {mode === 'deposit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            <span>
              {isSubmitting
                ? 'Posting Transaction...'
                : mode === 'deposit'
                ? `Confirm Cash Deposit of $${parsedAmount ? parsedAmount.toFixed(2) : '0.00'}`
                : `Confirm Withdrawal of $${parsedAmount ? parsedAmount.toFixed(2) : '0.00'}`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
