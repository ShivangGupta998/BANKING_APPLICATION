import React from 'react';
import { CheckCircle2, X, Download, ShieldCheck } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--accent-emerald)',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Transaction Successful</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Funds transferred and logged in CBS Core Ledger
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Reference ID</span>
            <span className="mono-font" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {receipt.referenceId || receipt.transactionId || `#${Date.now().toString().slice(-8)}`}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Timestamp</span>
            <span>{new Date().toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Debited Account</span>
            <span className="mono-font">#{receipt.fromAccountNumber || receipt.accountNumber}</span>
          </div>

          {receipt.toAccountNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Beneficiary Account</span>
              <span className="mono-font">#{receipt.toAccountNumber}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>Settled Amount</span>
            <span className="mono-font" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              ${Number(receipt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem' }}
          onClick={onClose}
        >
          Done &amp; Close Receipt
        </button>
      </div>
    </div>
  );
}
