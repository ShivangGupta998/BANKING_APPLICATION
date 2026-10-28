import React, { useState } from 'react';
import { Zap, Droplets, Wifi, Smartphone, Flame, CheckCircle, Receipt } from 'lucide-react';
import { api } from '../api';

const DEFAULT_BILLERS = [
  { id: 'elec', name: 'Metro Electric Grid', icon: Zap, category: 'Electricity', amount: 84.50, due: 'In 4 days', color: 'var(--accent-amber)' },
  { id: 'water', name: 'City Municipal Water', icon: Droplets, category: 'Water', amount: 32.10, due: 'In 7 days', color: 'var(--accent-cyan)' },
  { id: 'net', name: 'FiberLink Ultra High-Speed', icon: Wifi, category: 'Internet', amount: 69.99, due: 'In 12 days', color: 'var(--accent-indigo)' },
  { id: 'cell', name: 'Apex 5G Mobile Unlimited', icon: Smartphone, category: 'Cellular', amount: 45.00, due: 'In 2 days', color: 'var(--accent-emerald)' },
  { id: 'gas', name: 'CleanEnergy Natural Gas', icon: Flame, category: 'Heating & Gas', amount: 56.20, due: 'In 10 days', color: 'var(--accent-rose)' },
];

export default function BillsView({ activeAccount, onBillSettled, showToast }) {
  const [bills, setBills] = useState(DEFAULT_BILLERS);
  const [settledIds, setSettledIds] = useState([]);
  const [payingId, setPayingId] = useState(null);

  const handlePay = async (bill) => {
    if (!activeAccount) {
      showToast('Please select a funding account first.', 'error');
      return;
    }
    if (Number(activeAccount.accountBalance) < bill.amount) {
      showToast('Insufficient balance to settle this utility bill.', 'error');
      return;
    }

    try {
      setPayingId(bill.id);
      await api.payBill({
        accountNumber: activeAccount.accountNumber,
        billerName: bill.name,
        category: bill.category,
        amount: bill.amount,
        referenceNumber: `INV-${Date.now().toString().slice(-6)}`,
      });
      setSettledIds((prev) => [...prev, bill.id]);
      showToast(`Settled $${bill.amount.toFixed(2)} for ${bill.name}!`, 'success');
      await onBillSettled();
    } catch (err) {
      // If endpoint fails, fallback to standard transfer or withdraw
      try {
        await api.withdraw(activeAccount.accountNumber, bill.amount, `Bill Payment - ${bill.name}`);
        setSettledIds((prev) => [...prev, bill.id]);
        showToast(`Settled $${bill.amount.toFixed(2)} for ${bill.name}!`, 'success');
        await onBillSettled();
      } catch (innerErr) {
        showToast(innerErr.message || 'Payment settlement failed.', 'error');
      }
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <Receipt size={20} color="var(--accent-cyan)" /> Utility &amp; Subscription Payments
          </div>
          <div className="panel-subtitle">
            One-touch direct debit payments with instant digital receipt issuance
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bills.map((bill) => {
          const Icon = bill.icon;
          const isSettled = settledIds.includes(bill.id);
          const isPaying = payingId === bill.id;

          return (
            <div
              key={bill.id}
              style={{
                background: isSettled ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: isSettled ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: bill.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{bill.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {bill.category} • <span style={{ color: isSettled ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{isSettled ? 'PAID & SETTLED' : `Due: ${bill.due}`}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-font" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    ${bill.amount.toFixed(2)}
                  </div>
                </div>

                {isSettled ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <CheckCircle size={16} /> Settled
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}
                    onClick={() => handlePay(bill)}
                    disabled={isPaying}
                  >
                    {isPaying ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
