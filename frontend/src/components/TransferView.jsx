import React, { useState } from 'react';
import { Send, ArrowRight, ShieldAlert, CheckCircle, UserPlus, Users } from 'lucide-react';

export default function TransferView({
  accounts,
  activeAccount,
  onTransferSuccess,
  showToast
}) {
  const [targetAccountNo, setTargetAccountNo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Other accounts available to transfer to
  const recipientAccounts = accounts.filter(
    (acc) => acc.accountNumber !== (activeAccount ? activeAccount.accountNumber : null)
  );

  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = activeAccount ? Number(activeAccount.accountBalance) : 0;
  const isInsufficient = parsedAmount > currentBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAccount) {
      showToast('Please select a funding account first.', 'error');
      return;
    }
    if (!targetAccountNo) {
      showToast('Please specify a recipient account number.', 'error');
      return;
    }
    if (parsedAmount <= 0) {
      showToast('Please enter a valid transfer amount greater than $0.', 'error');
      return;
    }
    if (isInsufficient) {
      showToast('Insufficient funds in the selected account.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransferSuccess({
        fromAccountNumber: activeAccount.accountNumber,
        toAccountNumber: Number(targetAccountNo),
        amount: parsedAmount,
        note: note || 'Peer Transfer',
      });
      setAmount('');
      setNote('');
      showToast(`Successfully transferred $${parsedAmount.toFixed(2)}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Transfer failed. Check recipient account number.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (val) => {
    setAmount(String(val));
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Send size={20} color="var(--accent-cyan)" /> Instant Money Transfer
            </div>
            <div className="panel-subtitle">
              Real-time ledger settlement between CBS Prime accounts
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sender Info Banner */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Debiting Account</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>{activeAccount?.accountName}</div>
              <div className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{activeAccount?.accountNumber}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Available</div>
              <div className="mono-font" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Quick Recipient Select */}
          <div className="form-group">
            <label className="form-label">Select Verified Recipient or Enter Account Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {recipientAccounts.map((acc) => (
                <button
                  key={acc.accountNumber}
                  type="button"
                  className="amount-chip"
                  style={{
                    borderColor: targetAccountNo === String(acc.accountNumber) ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    color: targetAccountNo === String(acc.accountNumber) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    background: targetAccountNo === String(acc.accountNumber) ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  }}
                  onClick={() => setTargetAccountNo(String(acc.accountNumber))}
                >
                  <Users size={12} style={{ marginRight: '4px', display: 'inline' }} />
                  {acc.accountName} (#{acc.accountNumber})
                </button>
              ))}
            </div>

            <input
              type="number"
              className="form-control mono-font"
              placeholder="e.g. 1001002002"
              value={targetAccountNo}
              onChange={(e) => setTargetAccountNo(e.target.value)}
              required
            />
          </div>

          {/* Transfer Amount */}
          <div className="form-group">
            <label className="form-label">Transfer Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control mono-font"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ fontSize: '1.25rem', fontWeight: 600 }}
            />

            {/* Quick Amount Chips */}
            <div className="quick-amount-row">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick:</span>
              {[50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="amount-chip"
                  onClick={() => handleQuickAmount(val)}
                >
                  +${val}
                </button>
              ))}
            </div>

            {isInsufficient && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontSize: '0.78rem' }}>
                <ShieldAlert size={14} /> Insufficient account balance. Maximum available is ${currentBalance.toFixed(2)}.
              </div>
            )}
          </div>

          {/* Transfer Note / Purpose */}
          <div className="form-group">
            <label className="form-label">Transfer Description / Note (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Invoice payment, rent, dinner"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
            disabled={isSubmitting || isInsufficient || parsedAmount <= 0 || !targetAccountNo}
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Processing Transaction...' : `Confirm Transfer of $${parsedAmount ? parsedAmount.toFixed(2) : '0.00'}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
