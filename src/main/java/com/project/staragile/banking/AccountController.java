package com.project.staragile.banking;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.staragile.banking.dto.ApiResponse;
import com.project.staragile.banking.dto.DepositWithdrawRequest;
import com.project.staragile.banking.dto.TransferRequest;

@RestController
@CrossOrigin(origins = "*")
public class AccountController {
	
	@Autowired
	AccountService accountService;
	
	@Autowired
	ObjectMapper objectMapper;

	@Autowired
	DataInitializer dataInitializer;
	
	// --- Legacy Endpoints Preserved for Backward Compatibility ---

	@GetMapping("/sayHello")
	public String sayHello() {
		return "Hello from CBS Bank";
	}
	
	@GetMapping("/createAccount")
	public Account createAccount(){
		return accountService.createAccount();
	}
	
	@PostMapping("/registerAccount")
	public Account registerAccount(@RequestBody Account account) {
		if (account != null) {
			return accountService.registerAccount(account);
		}
		System.out.println("post called");
		return account;
	}
	
	@GetMapping("/getAccount/{accountNumber}")
	public Account getAccountDetails(@PathVariable(value="accountNumber") int accountNumber) {
		return accountService.getAccountDetails(accountNumber);
	}

	// --- Enterprise REST API Endpoints ---

	@GetMapping("/api/accounts")
	public ResponseEntity<ApiResponse<List<Account>>> getAllAccounts() {
		List<Account> accounts = accountService.getAllAccounts();
		return ResponseEntity.ok(ApiResponse.ok("Accounts retrieved successfully", accounts));
	}

	@GetMapping("/api/accounts/{accountNumber}")
	public ResponseEntity<ApiResponse<Account>> getAccountByNumber(@PathVariable int accountNumber) {
		try {
			Account account = accountService.getAccountDetails(accountNumber);
			return ResponseEntity.ok(ApiResponse.ok("Account found", account));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
		}
	}

	@PostMapping("/api/accounts")
	public ResponseEntity<ApiResponse<Account>> createNewAccount(@RequestBody Account account) {
		if (account.getAccountNumber() <= 0) {
			// Auto-generate 10-digit account number if omitted or 0
			int generated = 1000000000 + (int)(Math.random() * 900000000);
			account.setAccountNumber(generated);
		}
		if (account.getAccountName() == null || account.getAccountName().trim().isEmpty()) {
			return ResponseEntity.badRequest().body(ApiResponse.error("Account holder name is required"));
		}
		if (account.getAccountType() == null || account.getAccountType().trim().isEmpty()) {
			account.setAccountType("Savings");
		}
		Account saved = accountService.registerAccount(account);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Account opened successfully", saved));
	}

	@PostMapping("/api/transfers")
	public ResponseEntity<ApiResponse<Transaction>> transferFunds(@RequestBody TransferRequest request) {
		try {
			Transaction txn = accountService.transferFunds(request);
			return ResponseEntity.ok(ApiResponse.ok("Funds transferred successfully", txn));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(ApiResponse.error("Transfer failed: " + ex.getMessage()));
		}
	}

	@PostMapping("/api/deposit")
	public ResponseEntity<ApiResponse<Transaction>> depositFunds(@RequestBody DepositWithdrawRequest request) {
		try {
			Transaction txn = accountService.deposit(request);
			return ResponseEntity.ok(ApiResponse.ok("Deposit completed successfully", txn));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@PostMapping("/api/withdraw")
	public ResponseEntity<ApiResponse<Transaction>> withdrawFunds(@RequestBody DepositWithdrawRequest request) {
		try {
			Transaction txn = accountService.withdraw(request);
			return ResponseEntity.ok(ApiResponse.ok("Withdrawal completed successfully", txn));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
		}
	}

	@GetMapping("/api/transactions")
	public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions() {
		List<Transaction> txns = accountService.getAllTransactions();
		return ResponseEntity.ok(ApiResponse.ok("Transactions retrieved", txns));
	}

	@GetMapping("/api/transactions/{accountNumber}")
	public ResponseEntity<ApiResponse<List<Transaction>>> getTransactionsForAccount(@PathVariable int accountNumber) {
		List<Transaction> txns = accountService.getTransactionsForAccount(accountNumber);
		return ResponseEntity.ok(ApiResponse.ok("Account transactions retrieved", txns));
	}

	@GetMapping("/api/analytics")
	public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
		Map<String, Object> stats = accountService.getAnalytics();
		return ResponseEntity.ok(ApiResponse.ok("Analytics calculated", stats));
	}

	@GetMapping("/api/accounts/count")
	public ResponseEntity<ApiResponse<Map<String, Object>>> getDatabaseCounts() {
		Map<String, Object> counts = new HashMap<>();
		counts.put("totalAccounts", accountService.getAllAccounts().size());
		counts.put("totalTransactions", accountService.getAnalytics().get("totalTransactions"));
		return ResponseEntity.ok(ApiResponse.ok("Database counts retrieved", counts));
	}

	@PostMapping("/api/accounts/seed-1000")
	public ResponseEntity<ApiResponse<Map<String, Object>>> seed1000Entries() {
		dataInitializer.seedEnterpriseData();
		Map<String, Object> counts = new HashMap<>();
		counts.put("totalAccounts", accountService.getAllAccounts().size());
		counts.put("totalTransactions", accountService.getAnalytics().get("totalTransactions"));
		return ResponseEntity.ok(ApiResponse.ok("1000 entries seeded successfully", counts));
	}
}
