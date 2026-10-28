import React from 'react';
import { Landmark, RefreshCw, PlusCircle, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export default function Header({
  accounts,
  activeAccount,
  onSelectAccount,
  onRefresh,
  onOpenNewAccountModal,
  isRefreshing,
  backendOnline
}) {
  return (
    <header className="top-header">
      <div className="header-container">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Landmark size={24} />
          </div>
          <div>
            <div className="brand-title">
              CBS PRIME <span className="brand-badge">Enterprise</span>
            </div>
            <div className="brand-subtitle">Dynamic Core Banking Ledger &amp; Settlement</div>
          </div>
        </div>

        {/* System Status */}
        <div className="system-status">
          <span className="pulse-dot" style={{ backgroundColor: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}></span>
          <span>
            {backendOnline ? (
              <>Core Engine: <strong style={{ color: 'var(--accent-emerald)' }}>ONLINE (Port 8082)</strong></>
            ) : (
              <>Core Engine: <strong style={{ color: 'var(--accent-rose)' }}>OFFLINE</strong></>
            )}
          </span>
        </div>

        {/* Actions & Account Switcher */}
        <div className="header-actions">
          {/* Active Account Dropdown */}
          <div className="account-selector">
            <UserCheck size={16} color="var(--accent-cyan)" />
            <select
              value={activeAccount ? activeAccount.accountNumber : ''}
              onChange={(e) => onSelectAccount(Number(e.target.value))}
              aria-label="Active Account"
            >
              {accounts.map((acc) => (
                <option key={acc.accountNumber} value={acc.accountNumber}>
                  {acc.accountName} (#{acc.accountNumber}) - ${Number(acc.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            className="btn btn-ghost"
            onClick={onRefresh}
            title="Refresh Account Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          {/* Open Account Modal Button */}
          <button
            className="btn btn-primary"
            onClick={onOpenNewAccountModal}
          >
            <PlusCircle size={16} />
            <span>Open Account</span>
          </button>
        </div>
      </div>
    </header>
  );
}
