package com.project.staragile.banking;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.staragile.banking.dto.DepositWithdrawRequest;
import com.project.staragile.banking.dto.TransferRequest;

@Service
public class AccountService {

	@Autowired
	AccountRepository accountRepository;

	@Autowired
	TransactionRepository transactionRepository;

	private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

	// --- Preserved Original Methods for Backward Compatibility & Existing Tests ---
	public Account createAccount() {
		Account account = new Account(1010101010, "Shubham", "Saving Account", 20000.0);
		return accountRepository.save(account);
	}

	public Account registerAccount(Account account) {
		if (account == null) {
			throw new IllegalArgumentException("Account cannot be null");
		}
		return accountRepository.save(account);
	}

	public Account getAccountDetails(int accountId) {
		return accountRepository.findById(accountId)
				.orElseThrow(() -> new IllegalArgumentException("Account not found with ID: " + accountId));
	}

	public Account registerDummyAccount() {
		Account account = new Account(1010101010, "Shubham", "Saving Account", 20000.0);
		return account;
	}

	// --- Enterprise Banking Methods ---

	public List<Account> getAllAccounts() {
		return accountRepository.findAll();
	}

	@Transactional
	public Transaction transferFunds(TransferRequest request) {
		if (request.getAmount() <= 0) {
			throw new IllegalArgumentException("Transfer amount must be greater than zero.");
		}
		if (request.getFromAccountNumber() == request.getToAccountNumber()) {
			throw new IllegalArgumentException("Sender and receiver accounts cannot be identical.");
		}

		Account fromAccount = accountRepository.findById(request.getFromAccountNumber())
				.orElseThrow(() -> new IllegalArgumentException("Sender account #" + request.getFromAccountNumber() + " not found."));

		Account toAccount = accountRepository.findById(request.getToAccountNumber())
				.orElseThrow(() -> new IllegalArgumentException("Recipient account #" + request.getToAccountNumber() + " not found."));

		if (fromAccount.getAccountBalance() < request.getAmount()) {
			throw new IllegalArgumentException("Insufficient funds. Current balance: $" + String.format("%.2f", fromAccount.getAccountBalance()));
		}

		// Perform transfer
		fromAccount.setAccountBalance(fromAccount.getAccountBalance() - request.getAmount());
		toAccount.setAccountBalance(toAccount.getAccountBalance() + request.getAmount());

		accountRepository.save(fromAccount);
		accountRepository.save(toAccount);

		String ref = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
		String now = LocalDateTime.now().format(DATE_FORMATTER);
		String desc = (request.getDescription() != null && !request.getDescription().trim().isEmpty())
				? request.getDescription()
				: "Fund Transfer to " + toAccount.getAccountName() + " (Acc: " + toAccount.getAccountNumber() + ")";

		Transaction txn = new Transaction(
				ref,
				fromAccount.getAccountNumber(),
				toAccount.getAccountNumber(),
				"TRANSFER",
				request.getAmount(),
				desc,
				now,
				"SUCCESS",
				fromAccount.getAccountBalance()
		);

		return transactionRepository.save(txn);
	}

	@Transactional
	public Transaction deposit(DepositWithdrawRequest request) {
		if (request.getAmount() <= 0) {
			throw new IllegalArgumentException("Deposit amount must be greater than zero.");
		}

		Account account = accountRepository.findById(request.getAccountNumber())
				.orElseThrow(() -> new IllegalArgumentException("Account #" + request.getAccountNumber() + " not found."));

		account.setAccountBalance(account.getAccountBalance() + request.getAmount());
		accountRepository.save(account);

		String ref = "DEP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
		String now = LocalDateTime.now().format(DATE_FORMATTER);
		String desc = (request.getDescription() != null && !request.getDescription().trim().isEmpty())
				? request.getDescription()
				: "Cash / Wire Deposit";

		Transaction txn = new Transaction(
				ref,
				account.getAccountNumber(),
				account.getAccountNumber(),
				"DEPOSIT",
				request.getAmount(),
				desc,
				now,
				"SUCCESS",
				account.getAccountBalance()
		);

		return transactionRepository.save(txn);
	}

	@Transactional
	public Transaction withdraw(DepositWithdrawRequest request) {
		if (request.getAmount() <= 0) {
			throw new IllegalArgumentException("Withdrawal amount must be greater than zero.");
		}

		Account account = accountRepository.findById(request.getAccountNumber())
				.orElseThrow(() -> new IllegalArgumentException("Account #" + request.getAccountNumber() + " not found."));

		if (account.getAccountBalance() < request.getAmount()) {
			throw new IllegalArgumentException("Insufficient funds. Current balance: $" + String.format("%.2f", account.getAccountBalance()));
		}

		account.setAccountBalance(account.getAccountBalance() - request.getAmount());
		accountRepository.save(account);

		String ref = "WTH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
		String now = LocalDateTime.now().format(DATE_FORMATTER);
		String desc = (request.getDescription() != null && !request.getDescription().trim().isEmpty())
				? request.getDescription()
				: "ATM / Cash Withdrawal";

		Transaction txn = new Transaction(
				ref,
				account.getAccountNumber(),
				account.getAccountNumber(),
				"WITHDRAWAL",
				request.getAmount(),
				desc,
				now,
				"SUCCESS",
				account.getAccountBalance()
		);

		return transactionRepository.save(txn);
	}

	public List<Transaction> getTransactionsForAccount(int accountNumber) {
		return transactionRepository.findByAccountNumber(accountNumber);
	}

	public List<Transaction> getAllTransactions() {
		return transactionRepository.findTop50ByOrderByIdDesc();
	}

	public Map<String, Object> getAnalytics() {
		List<Account> accounts = accountRepository.findAll();
		double totalBalance = accounts.stream().mapToDouble(a -> a != null ? a.getAccountBalance() : 0.0).sum();
		long totalTxns = transactionRepository.count();

		Map<String, Object> stats = new HashMap<>();
		stats.put("totalBalance", totalBalance);
		stats.put("totalAccounts", accounts.size());
		stats.put("totalTransactions", totalTxns);
		return stats;
	}
}
