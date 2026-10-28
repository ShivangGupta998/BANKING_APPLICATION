package com.project.staragile.banking;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankingOperationsService {

    @Autowired
    AccountRepository accountRepository;

    @Autowired
    TransactionRepository transactionRepository;

    @Autowired
    BeneficiaryRepository beneficiaryRepository;

    @Autowired
    BillPaymentRepository billPaymentRepository;

    @Autowired
    FixedDepositRepository fixedDepositRepository;

    @Autowired
    LoanRepository loanRepository;

    @Autowired
    CardControlRepository cardControlRepository;

    @Autowired
    SupportTicketRepository supportTicketRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // =========================================================================
    // Beneficiary Management
    // =========================================================================

    public List<Beneficiary> getBeneficiaries(int accountNumber) {
        return beneficiaryRepository.findByUserAccountNumber(accountNumber);
    }

    public Beneficiary addBeneficiary(Beneficiary beneficiary) {
        if (beneficiary.getBeneficiaryName() == null || beneficiary.getBeneficiaryName().trim().isEmpty()) {
            throw new IllegalArgumentException("Beneficiary name is required.");
        }
        if (beneficiary.getBeneficiaryAccountNumber() <= 0) {
            throw new IllegalArgumentException("Valid beneficiary account number is required.");
        }
        if (beneficiary.getDailyLimit() <= 0) {
            beneficiary.setDailyLimit(10000.0);
        }
        return beneficiaryRepository.save(beneficiary);
    }

    public void deleteBeneficiary(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Beneficiary ID cannot be null.");
        }
        beneficiaryRepository.deleteById(id);
    }

    // =========================================================================
    // Bill Payments & Utilities
    // =========================================================================

    @Transactional
    public BillPayment payBill(BillPayment payment) {
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Bill amount must be greater than zero.");
        }

        Account account = accountRepository.findById(payment.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account #" + payment.getAccountNumber() + " not found."));

        if (account.getAccountBalance() < payment.getAmount()) {
            throw new IllegalArgumentException("Insufficient funds to settle bill of $" + String.format("%.2f", payment.getAmount()));
        }

        // Deduct balance
        account.setAccountBalance(account.getAccountBalance() - payment.getAmount());
        accountRepository.save(account);

        String ref = "BIL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String now = LocalDateTime.now().format(DATE_TIME_FORMATTER);

        payment.setReferenceId(ref);
        payment.setPaymentDate(now);
        payment.setStatus("PAID");

        BillPayment saved = billPaymentRepository.save(payment);

        // Record in transaction audit ledger
        Transaction txn = new Transaction(
                ref,
                account.getAccountNumber(),
                0,
                "BILL_PAYMENT",
                payment.getAmount(),
                "Utility Bill: " + payment.getBillerCategory() + " (" + payment.getBillerName() + ")",
                now,
                "SUCCESS",
                account.getAccountBalance()
        );
        transactionRepository.save(txn);

        return saved;
    }

    public List<BillPayment> getBillPayments(int accountNumber) {
        return billPaymentRepository.findByAccountNumberOrderByIdDesc(accountNumber);
    }

    // =========================================================================
    // Fixed Deposits & Investments
    // =========================================================================

    @Transactional
    public FixedDeposit createFixedDeposit(FixedDeposit fd) {
        if (fd.getDepositAmount() <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero.");
        }
        if (fd.getTenureMonths() < 3) {
            throw new IllegalArgumentException("Minimum tenure for Fixed Deposit is 3 months.");
        }

        Account account = accountRepository.findById(fd.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account #" + fd.getAccountNumber() + " not found."));

        if (account.getAccountBalance() < fd.getDepositAmount()) {
            throw new IllegalArgumentException("Insufficient balance to book Fixed Deposit of $" + String.format("%.2f", fd.getDepositAmount()));
        }

        // Interest rate determination based on tenure
        double rate = 6.5;
        if (fd.getTenureMonths() >= 12) rate = 7.1;
        if (fd.getTenureMonths() >= 36) rate = 7.75;
        if (fd.getTenureMonths() >= 60) rate = 8.25;

        fd.setInterestRate(rate);

        // Calculate maturity amount: A = P * (1 + (r/100) * (t/12))
        double maturity = fd.getDepositAmount() * (1 + (rate / 100.0) * (fd.getTenureMonths() / 12.0));
        fd.setMaturityAmount(Math.round(maturity * 100.0) / 100.0);

        String cert = "FD-CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDate today = LocalDate.now();
        LocalDate maturityDate = today.plusMonths(fd.getTenureMonths());

        fd.setCertificateNumber(cert);
        fd.setStartDate(today.toString());
        fd.setMaturityDate(maturityDate.toString());
        fd.setStatus("ACTIVE");

        // Deduct from account balance
        account.setAccountBalance(account.getAccountBalance() - fd.getDepositAmount());
        accountRepository.save(account);

        FixedDeposit saved = fixedDepositRepository.save(fd);

        // Record in ledger
        Transaction txn = new Transaction(
                cert,
                account.getAccountNumber(),
                0,
                "INVESTMENT",
                fd.getDepositAmount(),
                "Fixed Deposit Created: " + fd.getTenureMonths() + " Months @ " + rate + "% p.a.",
                LocalDateTime.now().format(DATE_TIME_FORMATTER),
                "SUCCESS",
                account.getAccountBalance()
        );
        transactionRepository.save(txn);

        return saved;
    }

    public List<FixedDeposit> getFixedDeposits(int accountNumber) {
        return fixedDepositRepository.findByAccountNumberOrderByIdDesc(accountNumber);
    }

    @Transactional
    public FixedDeposit breakDeposit(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Fixed Deposit ID cannot be null.");
        }
        FixedDeposit fd = fixedDepositRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fixed Deposit not found."));

        if (!"ACTIVE".equals(fd.getStatus())) {
            throw new IllegalArgumentException("Fixed Deposit is already closed.");
        }

        Account account = accountRepository.findById(fd.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));

        // Premature withdrawal penalty: 1% deduction from interest
        double refundAmount = fd.getDepositAmount() + (fd.getDepositAmount() * (fd.getInterestRate() - 1.0) / 100.0 * 0.5);
        refundAmount = Math.round(refundAmount * 100.0) / 100.0;

        account.setAccountBalance(account.getAccountBalance() + refundAmount);
        accountRepository.save(account);

        fd.setStatus("CLOSED");
        fixedDepositRepository.save(fd);

        Transaction txn = new Transaction(
                "BRK-" + fd.getCertificateNumber(),
                account.getAccountNumber(),
                account.getAccountNumber(),
                "DEPOSIT",
                refundAmount,
                "Liquidated Fixed Deposit (" + fd.getCertificateNumber() + ")",
                LocalDateTime.now().format(DATE_TIME_FORMATTER),
                "SUCCESS",
                account.getAccountBalance()
        );
        transactionRepository.save(txn);

        return fd;
    }

    // =========================================================================
    // Loans & Credit Facilities
    // =========================================================================

    @Transactional
    public Loan applyForLoan(Loan loan) {
        if (loan.getLoanAmount() <= 0) {
            throw new IllegalArgumentException("Loan amount must be greater than zero.");
        }
        if (loan.getTenureMonths() <= 0) {
            throw new IllegalArgumentException("Tenure must be at least 1 month.");
        }

        Account account = accountRepository.findById(loan.getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Account #" + loan.getAccountNumber() + " not found."));

        double rate = 9.5; // Standard 9.5% p.a.
        if ("Home Loan".equalsIgnoreCase(loan.getLoanType())) rate = 7.5;
        if ("Auto Loan".equalsIgnoreCase(loan.getLoanType())) rate = 8.5;
        if ("Personal Loan".equalsIgnoreCase(loan.getLoanType())) rate = 11.5;

        loan.setInterestRate(rate);

        // Monthly EMI calculation formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
        double monthlyRate = (rate / 100.0) / 12.0;
        int n = loan.getTenureMonths();
        double emi = (loan.getLoanAmount() * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        loan.setMonthlyEmi(Math.round(emi * 100.0) / 100.0);
        loan.setRemainingBalance(loan.getLoanAmount());

        String ref = "LN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        loan.setReferenceNumber(ref);
        loan.setApplicationDate(LocalDate.now().toString());
        loan.setStatus("DISBURSED");

        // Immediately disburse loan proceeds into customer's account!
        account.setAccountBalance(account.getAccountBalance() + loan.getLoanAmount());
        accountRepository.save(account);

        Loan saved = loanRepository.save(loan);

        Transaction txn = new Transaction(
                ref,
                0,
                account.getAccountNumber(),
                "LOAN_DISBURSED",
                loan.getLoanAmount(),
                "Loan Disbursed: " + loan.getLoanType() + " (" + n + " Mos @ " + rate + "%)",
                LocalDateTime.now().format(DATE_TIME_FORMATTER),
                "SUCCESS",
                account.getAccountBalance()
        );
        transactionRepository.save(txn);

        return saved;
    }

    public List<Loan> getLoans(int accountNumber) {
        return loanRepository.findByAccountNumberOrderByIdDesc(accountNumber);
    }

    // =========================================================================
    // Card Controls & Security
    // =========================================================================

    public CardControl getCardControl(int accountNumber) {
        return cardControlRepository.findById(accountNumber)
                .orElseGet(() -> {
                    CardControl def = new CardControl(accountNumber, false, true, false, true, 2500.0, 5000.0, "1234");
                    return cardControlRepository.save(def);
                });
    }

    public CardControl updateCardControl(CardControl control) {
        if (control == null) {
            throw new IllegalArgumentException("Card control settings cannot be null.");
        }
        return cardControlRepository.save(control);
    }

    public CardControl toggleFreeze(int accountNumber) {
        CardControl ctrl = getCardControl(accountNumber);
        ctrl.setFrozen(!ctrl.isFrozen());
        return cardControlRepository.save(ctrl);
    }

    public CardControl changePin(int accountNumber, String newPin) {
        if (newPin == null || newPin.length() != 4 || !newPin.matches("\\d+")) {
            throw new IllegalArgumentException("PIN must be exactly 4 numeric digits.");
        }
        CardControl ctrl = getCardControl(accountNumber);
        ctrl.setCardPin(newPin);
        return cardControlRepository.save(ctrl);
    }

    // =========================================================================
    // Support Tickets & Disputes
    // =========================================================================

    public SupportTicket createTicket(SupportTicket ticket) {
        if (ticket.getSubject() == null || ticket.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        ticket.setTicketNumber("TCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticket.setCreatedAt(LocalDateTime.now().format(DATE_TIME_FORMATTER));
        ticket.setStatus("OPEN");
        return supportTicketRepository.save(ticket);
    }

    public List<SupportTicket> getTickets(int accountNumber) {
        return supportTicketRepository.findByAccountNumberOrderByIdDesc(accountNumber);
    }
}
