import React, { useState } from 'react';
import { X, PlusCircle, UserCheck, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewAccountModal({ isOpen, onClose, onCreateAccount, showToast }) {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('Premium Savings');
  const [initialDeposit, setInitialDeposit] = useState('1000');
  const [customAccNo, setCustomAccNo] = useState(() => 1000000000 + Math.floor(Math.random() * 900000000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) {
      showToast('Account holder name is required.', 'error');
      return;
    }

    const depositVal = parseFloat(initialDeposit) || 0;
    if (depositVal < 0) {
      showToast('Initial deposit cannot be negative.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateAccount({
        accountNumber: Number(customAccNo),
        accountName: accountName.trim(),
        accountType,
        accountBalance: depositVal,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      showToast(`Account #${customAccNo} opened successfully for ${accountName.trim()}!`, 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateAccNo = () => {
    setCustomAccNo(1000000000 + Math.floor(Math.random() * 900000000));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Open New Bank Account</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Issue customer ledger node with instant routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Account Number Preview */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Assigned Account Number</label>
              <button
                type="button"
                onClick={regenerateAccNo}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                Regenerate
              </button>
            </div>
            <input
              type="number"
              className="form-control mono-font"
              value={customAccNo}
              onChange={(e) => setCustomAccNo(Number(e.target.value))}
              required
            />
          </div>

          {/* Account Name */}
          <div className="form-group">
            <label className="form-label">Full Name of Account Holder</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Alex Henderson"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Account Type */}
          <div className="form-group">
            <label className="form-label">Account Classification</label>
            <select
              className="form-control"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="Premium Savings">Premium Savings (4.25% APY)</option>
              <option value="Checking Account">Student / Everyday Checking</option>
              <option value="Business Corporate">Corporate Business Account</option>
              <option value="Private Wealth">Private Wealth Tier</option>
            </select>
          </div>

          {/* Initial Deposit */}
          <div className="form-group">
            <label className="form-label">Initial Opening Deposit (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control mono-font"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={isSubmitting || !accountName.trim()}
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Creating Node...' : 'Open Account Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
