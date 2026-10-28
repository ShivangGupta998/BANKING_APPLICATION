import React, { useState } from 'react';
import { Eye, EyeOff, Send, ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, ShieldCheck, Clock } from 'lucide-react';

export default function DashboardView({
  activeAccount,
  transactions,
  onNavigateTab,
  onOpenDepositModal,
  onOpenWithdrawModal
}) {
  const [showFullCard, setShowFullCard] = useState(false);

  if (!activeAccount) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No account selected. Please select or open an account above.</p>
      </div>
    );
  }

  // Format Card Number
  const rawAcc = String(activeAccount.accountNumber).padStart(12, '0');
  const formattedCardNumber = showFullCard
    ? `4192 ${rawAcc.slice(0, 4)} ${rawAcc.slice(4, 8)} ${rawAcc.slice(8, 12)}`
    : `4192 •••• •••• ${rawAcc.slice(-4)}`;

  // Filter recent transactions for this account
  const recentTxns = transactions
    .filter(
      (t) =>
        t.accountNumber === activeAccount.accountNumber ||
        t.fromAccountNumber === activeAccount.accountNumber ||
        t.toAccountNumber === activeAccount.accountNumber
    )
    .slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.75rem', alignItems: 'start' }}>
      {/* Left Column: Virtual Debit Card & Quick Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Modern Virtual Card */}
        <div className="virtual-card">
          <div className="card-top">
            <div className="card-chip"></div>
            <div className="card-network">VISA PRIME</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>
                Debit Platinum
              </span>
              <button
                onClick={() => setShowFullCard(!showFullCard)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}
                title={showFullCard ? 'Hide Card Number' : 'Reveal Card Number'}
              >
                {showFullCard ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showFullCard ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <div className="card-number mono-font">{formattedCardNumber}</div>
          </div>

          <div className="card-bottom">
            <div>
              <div className="card-holder-label">Account Holder</div>
              <div className="card-holder-name">{activeAccount.accountName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card-holder-label">Expires</div>
              <div className="mono-font" style={{ fontSize: '0.85rem', fontWeight: 600 }}>12/29</div>
            </div>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="glass-panel">
          <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
            <ShieldCheck size={18} color="var(--accent-cyan)" /> Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '0.75rem', fontSize: '0.8rem' }}
              onClick={() => onNavigateTab('transfer')}
            >
              <Send size={15} /> Send Money
            </button>
            <button
              className="btn btn-success"
              style={{ padding: '0.75rem', fontSize: '0.8rem' }}
              onClick={onOpenDepositModal}
            >
              <ArrowDownLeft size={15} /> Deposit Cash
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '0.75rem', fontSize: '0.8rem' }}
              onClick={onOpenWithdrawModal}
            >
              <ArrowUpRight size={15} /> Cash Withdrawal
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '0.75rem', fontSize: '0.8rem' }}
              onClick={() => onNavigateTab('bills')}
            >
              <Receipt size={15} /> Pay Utilities
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Account Specs & Recent Activity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Account Details Header Card */}
        <div className="glass-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                {activeAccount.accountName}
              </div>
              <div className="panel-subtitle">
                {activeAccount.accountType} • Account #{activeAccount.accountNumber}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Balance</div>
              <div className="mono-font" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${Number(activeAccount.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>Active &amp; Verified</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Routing Code</div>
              <div className="mono-font" style={{ fontSize: '0.85rem', fontWeight: 600 }}>CBS00918</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Transfer Limit</div>
              <div className="mono-font" style={{ fontSize: '0.85rem', fontWeight: 600 }}>$50,000.00</div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Snippet */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Clock size={18} color="var(--accent-cyan)" /> Recent Activity
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={() => onNavigateTab('transactions')}
            >
              View Full Ledger &rarr;
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recorded transactions yet for this account.</p>
          ) : (
            <div className="tx-table-wrapper">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference / Description</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((tx, idx) => {
                    const isCredit =
                      tx.type === 'CREDIT' ||
                      tx.type === 'DEPOSIT' ||
                      (tx.type === 'TRANSFER' && tx.toAccountNumber === activeAccount.accountNumber);
                    return (
                      <tr key={tx.transactionId || tx.id || idx}>
                        <td>
                          <span className={`tx-badge ${isCredit ? 'credit' : 'debit'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {tx.description || tx.note || 'System Transaction'}
                          </div>
                          <div className="mono-font" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Ref: {tx.referenceId || tx.transactionId || `#${idx + 1}`}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="mono-font" style={{ textAlign: 'right', fontWeight: 700, color: isCredit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {isCredit ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
