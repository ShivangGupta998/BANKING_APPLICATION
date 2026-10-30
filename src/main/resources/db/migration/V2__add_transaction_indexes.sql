-- Index for outgoing transactions
CREATE INDEX idx_transactions_source_account
ON transactions (source_account_number);

-- Index for incoming transactions
CREATE INDEX idx_transactions_target_account
ON transactions (target_account_number);
