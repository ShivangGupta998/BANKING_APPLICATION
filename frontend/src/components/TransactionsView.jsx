import React, { useState } from 'react';
import { Search, Download, Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from 'lucide-react';

export default function TransactionsView({ transactions, activeAccount }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    // Type match
    const type = (tx.type || '').toUpperCase();
    if (filterType !== 'ALL' && type !== filterType) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const ref = String(tx.referenceId || tx.transactionId || tx.id || '').toLowerCase();
      const desc = String(tx.description || tx.note || '').toLowerCase();
      const fromAcc = String(tx.fromAccountNumber || tx.accountNumber || '').toLowerCase();
      const toAcc = String(tx.toAccountNumber || '').toLowerCase();
      return ref.includes(q) || desc.includes(q) || fromAcc.includes(q) || toAcc.includes(q);
    }

    return true;
  });

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Reference ID', 'Type', 'Amount', 'Date', 'From Account', 'To Account', 'Description'];
    const rows = filtered.map((tx) => [
      `"${tx.referenceId || tx.transactionId || tx.id || ''}"`,
      `"${tx.type || ''}"`,
      tx.amount || 0,
      `"${tx.timestamp ? new Date(tx.timestamp).toISOString() : ''}"`,
      tx.fromAccountNumber || tx.accountNumber || '',
      tx.toAccountNumber || '',
      `"${(tx.description || tx.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBS_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel">
      {/* Header & Controls */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="panel-title">
            <Clock size={20} color="var(--accent-cyan)" /> Core Ledger Audit Records
          </div>
          <div className="panel-subtitle">
            Immutable transaction records recorded in database
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Export CSV */}
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search reference #, description, account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {['ALL', 'CREDIT', 'DEBIT', 'TRANSFER'].map((type) => (
            <button
              key={type}
              type="button"
              className="tab-btn"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.75rem',
                background: filterType === type ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                borderColor: filterType === type ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: filterType === type ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No transactions match your search or filter criteria.
        </div>
      ) : (
        <div className="tx-table-wrapper">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference ID</th>
                <th>Description</th>
                <th>From / To</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, idx) => {
                const isCredit =
                  tx.type === 'CREDIT' ||
                  tx.type === 'DEPOSIT' ||
                  (tx.type === 'TRANSFER' && activeAccount && tx.toAccountNumber === activeAccount.accountNumber);
                return (
                  <tr key={tx.transactionId || tx.id || idx}>
                    <td>
                      <span className={`tx-badge ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                      {tx.referenceId || tx.transactionId || `#TXN-${1000 + idx}`}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>
                        {tx.description || tx.note || 'CBS Prime Transaction'}
                      </div>
                    </td>
                    <td className="mono-font" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {tx.fromAccountNumber && tx.toAccountNumber ? (
                        <span>#{tx.fromAccountNumber} &rarr; #{tx.toAccountNumber}</span>
                      ) : (
                        <span>Account #{tx.accountNumber || (activeAccount?.accountNumber)}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td
                      className="mono-font"
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: isCredit ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      }}
                    >
                      {isCredit ? '+' : '-'}${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
