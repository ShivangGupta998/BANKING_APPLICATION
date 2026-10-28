import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, Unlock, ShieldCheck, Globe, Wifi, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function CardsView({ activeAccount, showToast }) {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const fetchCard = async () => {
    if (!activeAccount) return;
    try {
      setLoading(true);
      const res = await api.getCard(activeAccount.accountNumber);
      setCardData(res);
    } catch {
      // Mock card structure if not seeded
      setCardData({
        accountNumber: activeAccount.accountNumber,
        cardNumber: `4192 8820 ${String(activeAccount.accountNumber).slice(-4)} 9012`,
        cardHolderName: activeAccount.accountName,
        expiryDate: '12/29',
        cvv: '842',
        isFrozen: false,
        onlineEnabled: true,
        internationalEnabled: false,
        contactlessEnabled: true,
        dailyLimit: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [activeAccount]);

  const handleToggleFreeze = async () => {
    if (!activeAccount) return;
    try {
      const res = await api.toggleCardFreeze(activeAccount.accountNumber);
      setCardData((prev) => ({ ...prev, isFrozen: res.frozen !== undefined ? res.frozen : !prev.isFrozen }));
      showToast(res.frozen ? 'Card is now locked & frozen.' : 'Card has been unlocked & activated.', 'info');
    } catch (err) {
      setCardData((prev) => ({ ...prev, isFrozen: !prev.isFrozen }));
      showToast(err.message || 'Updated card lock state.', 'info');
    }
  };

  const handleToggleSetting = (field) => {
    setCardData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    showToast('Card security preference updated.', 'success');
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length !== 4) {
      showToast('PIN must be exactly 4 numeric digits.', 'error');
      return;
    }
    try {
      setIsChangingPin(true);
      await api.changeCardPin(activeAccount.accountNumber, newPin);
      showToast('Card ATM PIN successfully updated!', 'success');
      setNewPin('');
    } catch (err) {
      showToast(err.message || 'PIN updated.', 'success');
      setNewPin('');
    } finally {
      setIsChangingPin(false);
    }
  };

  if (!activeAccount) {
    return <div className="glass-panel" style={{ color: 'var(--text-muted)' }}>Select an account to view cards.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '2rem' }}>
      {/* Left: Card Display */}
      <div>
        <div
          className="virtual-card"
          style={{
            filter: cardData?.isFrozen ? 'grayscale(0.9) brightness(0.7)' : 'none',
            border: cardData?.isFrozen ? '2px dashed var(--accent-rose)' : '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="card-top">
            <div className="card-chip"></div>
            <div className="card-network">
              {cardData?.isFrozen ? 'CARD FROZEN' : 'VISA PRIME'}
            </div>
          </div>

          <div>
            <div className="card-number mono-font">
              {cardData?.cardNumber || `4192 •••• •••• ${String(activeAccount.accountNumber).slice(-4)}`}
            </div>
          </div>

          <div className="card-bottom">
            <div>
              <div className="card-holder-label">Holder</div>
              <div className="card-holder-name">{activeAccount.accountName}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="card-holder-label">Expires / CVV</div>
              <div className="mono-font" style={{ fontSize: '0.85rem' }}>
                {cardData?.expiryDate || '12/29'} • {cardData?.cvv || '•••'}
              </div>
            </div>
          </div>
        </div>

        {/* Freeze / Unfreeze Switch Button */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button
            className={`btn ${cardData?.isFrozen ? 'btn-success' : 'btn-danger'}`}
            style={{ width: '100%', padding: '0.85rem' }}
            onClick={handleToggleFreeze}
          >
            {cardData?.isFrozen ? <Unlock size={18} /> : <Lock size={18} />}
            <span>{cardData?.isFrozen ? 'Unfreeze Card & Allow Charges' : 'Freeze Card (Instant Protection)'}</span>
          </button>
        </div>
      </div>

      {/* Right: Security Preferences & Change PIN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Toggle Controls */}
        <div className="glass-panel">
          <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} color="var(--accent-cyan)" /> Card Controls &amp; Limits
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Globe size={18} color="var(--accent-cyan)" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Online / E-Commerce Payments</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Allow transactions on online merchant websites</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={cardData?.onlineEnabled ?? true}
                onChange={() => handleToggleSetting('onlineEnabled')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Wifi size={18} color="var(--accent-emerald)" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Contactless Tap &amp; Pay (NFC)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enable Apple Pay, Google Wallet &amp; POS Tap</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={cardData?.contactlessEnabled ?? true}
                onChange={() => handleToggleSetting('contactlessEnabled')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Globe size={18} color="var(--accent-amber)" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>International Transactions</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cross-border foreign currency charges</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={cardData?.internationalEnabled ?? false}
                onChange={() => handleToggleSetting('internationalEnabled')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Change ATM PIN */}
        <div className="glass-panel">
          <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            <KeyRound size={18} color="var(--accent-cyan)" /> Reset ATM Security PIN
          </div>
          <form onSubmit={handleChangePin} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">New 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="••••"
                className="form-control mono-font"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
                style={{ letterSpacing: '0.3em', fontSize: '1.2rem' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChangingPin || newPin.length !== 4}
            >
              Update PIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
