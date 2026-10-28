import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, ShieldCheck, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { api } from '../api';

export default function LoansView({ activeAccount, onLoanApproved, showToast }) {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [interestRate, setInterestRate] = useState(7.5);
  const [loanType, setLoanType] = useState('Personal Loan');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoans, setActiveLoans] = useState([]);

  // Calculate EMI
  const monthlyRate = interestRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? loanAmount / tenureMonths
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - loanAmount;

  const fetchLoans = async () => {
    if (!activeAccount) return;
    try {
      const res = await api.getLoans(activeAccount.accountNumber);
      setActiveLoans(res || []);
    } catch {
      setActiveLoans([]);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [activeAccount]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!activeAccount) {
      showToast('Please select an account first.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.applyLoan({
        accountNumber: activeAccount.accountNumber,
        loanType,
        loanAmount: Number(loanAmount),
        tenureMonths: Number(tenureMonths),
        interestRate: Number(interestRate),
        monthlyEmi: Number(emi.toFixed(2)),
        purpose: purpose || 'General Financing',
      });
      showToast(`Loan approved! $${Number(loanAmount).toLocaleString()} disbursed into your account.`, 'success');
      await onLoanApproved();
      await fetchLoans();
      setPurpose('');
    } catch (err) {
      showToast(err.message || 'Loan application error.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 460px) 1fr', gap: '2rem' }}>
      {/* Left: EMI Calculator & Apply Form */}
      <div className="glass-panel">
        <div className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
          <Calculator size={20} color="var(--accent-cyan)" /> Real-Time Loan &amp; EMI Calculator
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.5rem' }}>
          Instant algorithmic pre-approval with zero credit score penalty
        </p>

        <form onSubmit={handleApply}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label">Principal Loan Amount</label>
              <span className="mono-font" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                ${Number(loanAmount).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="500"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label">Tenure Duration</label>
              <span className="mono-font" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {tenureMonths} Months ({Math.round((tenureMonths / 12) * 10) / 10} Yrs)
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="60"
              step="6"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Loan Facility Category</label>
            <select
              className="form-control"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
            >
              <option value="Personal Loan">Personal Flexi Loan (7.5% APR)</option>
              <option value="Home Mortgage">Home Purchase &amp; Mortgage (6.2% APR)</option>
              <option value="Auto / Vehicle">Auto &amp; Vehicle Financing (5.8% APR)</option>
              <option value="Business Line">Business Working Capital (8.0% APR)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Memo</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Home renovation, startup equipment"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* EMI Calculation Summary Box */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Monthly EMI:</span>
              <span className="mono-font" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${emi.toFixed(2)}/mo
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Interest Payable:</span>
              <span className="mono-font">${totalInterest.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Repayment:</span>
              <span className="mono-font" style={{ fontWeight: 600 }}>${totalRepayment.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={isSubmitting}
          >
            <ShieldCheck size={18} />
            <span>{isSubmitting ? 'Verifying & Disbursing...' : `Instant Approval & Disburse $${Number(loanAmount).toLocaleString()}`}</span>
          </button>
        </form>
      </div>

      {/* Right: Active Loans Portfolio */}
      <div className="glass-panel">
        <div className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          <TrendingUp size={20} color="var(--accent-cyan)" /> Active Loan Portfolio
        </div>

        {activeLoans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No active loans on file for Account #{activeAccount?.accountNumber}. Use the calculator to apply for instant pre-approved credit.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeLoans.map((loan, idx) => (
              <div
                key={loan.id || idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{loan.loanType}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tenure: {loan.tenureMonths} Months • EMI: ${Number(loan.monthlyEmi || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={13} /> Active &amp; Disbursed
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Principal Disbursed</div>
                  <div className="mono-font" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    ${Number(loan.loanAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
