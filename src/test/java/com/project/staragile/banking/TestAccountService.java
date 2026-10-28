package com.project.staragile.banking;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.project.staragile.banking.dto.DepositWithdrawRequest;
import com.project.staragile.banking.dto.TransferRequest;

@SpringBootTest
public class TestAccountService {

	@Autowired
	AccountService accountService;

	@Autowired
	BankingOperationsService operationsService;
	
	@Test
	public void testAccountRegistraiton() {
		Account account = new Account(1010101010,"Shubham","Saving Account",20000.0);
		assertEquals(account.getAccountNumber(),accountService.registerDummyAccount().getAccountNumber());
		assertEquals(account.getAccountName(),accountService.registerDummyAccount().getAccountName());
	}

	@Test
	public void testDepositAndWithdraw() {
		Account acc = new Account(990011, "Test User", "Savings", 500.0);
		accountService.registerAccount(acc);

		// Deposit
		Transaction dep = accountService.deposit(new DepositWithdrawRequest(990011, 200.0, "Test Deposit"));
		assertNotNull(dep);
		assertEquals(700.0, dep.getBalanceAfter());

		// Withdraw
		Transaction wth = accountService.withdraw(new DepositWithdrawRequest(990011, 100.0, "Test Withdraw"));
		assertNotNull(wth);
		assertEquals(600.0, wth.getBalanceAfter());
	}

	@Test
	public void testTransferFunds() {
		Account sender = new Account(880011, "Sender User", "Savings", 1000.0);
		Account receiver = new Account(880022, "Receiver User", "Checking", 200.0);
		accountService.registerAccount(sender);
		accountService.registerAccount(receiver);

		TransferRequest req = new TransferRequest(880011, 880022, 350.0, "Rent Payment");
		Transaction txn = accountService.transferFunds(req);

		assertNotNull(txn);
		assertEquals(650.0, txn.getBalanceAfter());
		assertEquals(550.0, accountService.getAccountDetails(880022).getAccountBalance());
	}

	@Test
	public void testInsufficientFundsException() {
		Account sender = new Account(770011, "Broke User", "Savings", 50.0);
		Account receiver = new Account(770022, "Rich User", "Checking", 5000.0);
		accountService.registerAccount(sender);
		accountService.registerAccount(receiver);

		TransferRequest req = new TransferRequest(770011, 770022, 500.0, "Overdraft attempt");
		assertThrows(IllegalArgumentException.class, () -> {
			accountService.transferFunds(req);
		});
	}

	@Test
	public void testBillPaymentAndFixedDeposit() {
		Account acc = new Account(660011, "Wealth Client", "Savings", 15000.0);
		accountService.registerAccount(acc);

		// Bill Payment
		BillPayment bp = new BillPayment(660011, "Electricity", "Power Grid", "PG-1002", 200.0, null, null, null);
		BillPayment paid = operationsService.payBill(bp);
		assertNotNull(paid);
		assertEquals(14800.0, accountService.getAccountDetails(660011).getAccountBalance());

		// Fixed Deposit
		FixedDeposit fd = new FixedDeposit(660011, 5000.0, 12, 0.0, 0.0, null, null, null, null);
		FixedDeposit booked = operationsService.createFixedDeposit(fd);
		assertNotNull(booked);
		assertEquals(9800.0, accountService.getAccountDetails(660011).getAccountBalance());
		assertEquals(7.1, booked.getInterestRate());
	}

	@Test
	public void testLoanDisbursementAndCardControls() {
		Account acc = new Account(550011, "Borrower User", "Savings", 1000.0);
		accountService.registerAccount(acc);

		// Loan application
		Loan loan = new Loan(550011, "Personal Loan", 5000.0, 0.0, 12, 0.0, 0.0, null, null, null);
		Loan disbursed = operationsService.applyForLoan(loan);
		assertNotNull(disbursed);
		assertEquals(6000.0, accountService.getAccountDetails(550011).getAccountBalance());
		assertTrue(disbursed.getMonthlyEmi() > 0);

		// Card controls
		CardControl ctrl = operationsService.getCardControl(550011);
		assertNotNull(ctrl);
		assertFalse(ctrl.isFrozen());

		CardControl toggled = operationsService.toggleFreeze(550011);
		assertTrue(toggled.isFrozen());
	}

	@Test
	public void testThousandDatabaseEntriesSeeded() {
		assertTrue(accountService.getAllAccounts().size() >= 1000, "Account table must contain at least 1,000 entries");
		long totalTxns = (Long) accountService.getAnalytics().get("totalTransactions");
		assertTrue(totalTxns >= 1000, "Transaction table must contain at least 1,000 entries");
	}
}
