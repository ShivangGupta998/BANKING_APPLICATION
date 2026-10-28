import React from 'react';
import { Shield, Users, ArrowUpRight, Wallet, Activity } from 'lucide-react';

export default function KpiOverview({ accounts, activeAccount, transactions }) {
  const totalVaultBalance = accounts.reduce((acc, cur) => acc + (Number(cur.accountBalance) || 0), 0);
  const activeBalance = activeAccount ? Number(activeAccount.accountBalance) || 0 : 0;

  return (
    <section className="kpi-grid">
      {/* Total Vault Reserves */}
      <div className="kpi-card">
        <div>
          <div className="kpi-label">Total Vault Reserves</div>
          <div className="kpi-value mono-font">
            ${totalVaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-hint">
            <ArrowUpRight size={14} /> Live Aggregate Liquidity
          </div>
        </div>
        <div className="kpi-icon-container">
          <Shield size={22} />
        </div>
      </div>

      {/* Active Account Balance */}
      <div className="kpi-card">
        <div>
          <div className="kpi-label">Selected Account Balance</div>
          <div className="kpi-value mono-font" style={{ color: 'var(--accent-cyan)' }}>
            ${activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-hint" style={{ color: 'var(--text-muted)' }}>
            {activeAccount ? `${activeAccount.accountType} • #${activeAccount.accountNumber}` : 'No Account Selected'}
          </div>
        </div>
        <div className="kpi-icon-container" style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <Wallet size={22} color="var(--accent-cyan)" />
        </div>
      </div>

      {/* Verified Accounts Count */}
      <div className="kpi-card">
        <div>
          <div className="kpi-label">Active Customer Accounts</div>
          <div className="kpi-value mono-font">
            {accounts.length}
          </div>
          <div className="kpi-hint">
            <Activity size={14} /> Real-Time H2 Database
          </div>
        </div>
        <div className="kpi-icon-container">
          <Users size={22} />
        </div>
      </div>

      {/* Total Transactions Recorded */}
      <div className="kpi-card">
        <div>
          <div className="kpi-label">Ledger Transactions</div>
          <div className="kpi-value mono-font">
            {transactions.length}
          </div>
          <div className="kpi-hint">
            <ArrowUpRight size={14} /> Immutable Audit Records
          </div>
        </div>
        <div className="kpi-icon-container">
          <Activity size={22} />
        </div>
      </div>
    </section>
  );
}
