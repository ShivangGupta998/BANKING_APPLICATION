package com.project.staragile.banking;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

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

    @Override
    public void run(String... args) throws Exception {
        if (accountRepository.count() == 0) {
            seedEnterpriseData();
        }
    }

    public void seedEnterpriseData() {
        // --- 1. SEED 1,000 ACCOUNTS ---
        List<Account> accounts = new ArrayList<>(1000);

        // Core sample enterprise accounts (preserved for unit tests & demo views)
        Account a1 = new Account(1010101010, "Shubham", "Saving Account", 20000.0);
        Account a2 = new Account(1001002001, "Sarah Jenkins", "Premium Savings", 45850.0);
        Account a3 = new Account(1001002002, "Michael Chen", "Checking Account", 12420.5);
        Account a4 = new Account(1001002003, "Elena Rodriguez", "Business Corporate", 185900.0);

        accounts.add(a1);
        accounts.add(a2);
        accounts.add(a3);
        accounts.add(a4);

        String[] firstNames = {
            "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
            "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
            "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
            "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
            "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah",
            "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia",
            "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen",
            "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
            "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel",
            "Raymond", "Catherine", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria"
        };

        String[] lastNames = {
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
            "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
            "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
            "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
            "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
            "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
            "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
            "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
            "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
            "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"
        };

        String[] accountTypes = {
            "Saving Account", "Checking Account", "Premium Savings", "Business Corporate", "Money Market"
        };

        int startAccNum = 1001002004;
        for (int i = 0; i < 996; i++) {
            int accNum = startAccNum + i;
            String name = firstNames[i % firstNames.length] + " " + lastNames[(i * 7 + 3) % lastNames.length];
            String type = accountTypes[i % accountTypes.length];
            double balance = Math.round((1500.0 + ((i * 243.65) % 98500.0)) * 100.0) / 100.0;
            accounts.add(new Account(accNum, name, type, balance));
        }

        accountRepository.saveAll(accounts);

        // --- 2. SEED 1,000 TRANSACTIONS ---
        List<Transaction> transactions = new ArrayList<>(1000);

        Transaction t1 = new Transaction(
                "DEP-918234", 1001002001, 1001002001, "DEPOSIT", 5000.0,
                "Direct Deposit - Payroll", "2026-10-10 09:30:15", "SUCCESS", 45850.0);
        Transaction t2 = new Transaction(
                "TXN-482910", 1001002001, 1001002002, "TRANSFER", 1200.0,
                "Client Invoice Payment", "2026-10-11 14:22:40", "SUCCESS", 44650.0);
        Transaction t3 = new Transaction(
                "WTH-102948", 1001002002, 1001002002, "WITHDRAWAL", 350.0,
                "ATM Cash Withdrawal", "2026-10-12 11:15:02", "SUCCESS", 12420.5);
        Transaction t4 = new Transaction(
                "DEP-738291", 1001002003, 1001002003, "DEPOSIT", 25000.0,
                "Commercial Wire Transfer", "2026-10-14 16:45:10", "SUCCESS", 185900.0);
        Transaction t5 = new Transaction(
                "DEP-558291", 1010101010, 1010101010, "DEPOSIT", 20000.0,
                "Initial Account Opening Deposit", "2026-10-14 17:00:00", "SUCCESS", 20000.0);

        transactions.add(t1);
        transactions.add(t2);
        transactions.add(t3);
        transactions.add(t4);
        transactions.add(t5);

        String[] txnTypes = {"DEPOSIT", "WITHDRAWAL", "TRANSFER"};
        String[] descriptions = {
            "Direct Deposit - Payroll", "Client Invoice Payment", "ATM Cash Withdrawal",
            "Commercial Wire Transfer", "Online Utility Bill Payment", "Peer-to-Peer Transfer",
            "Grocery POS Payment", "Software Subscription", "Investment Dividend", "Merchant Settlement"
        };

        for (int i = 0; i < 995; i++) {
            int srcAcc = startAccNum + (i % 996);
            int targetAcc = (i % 3 == 0) ? startAccNum + ((i + 17) % 996) : srcAcc;
            String type = txnTypes[i % txnTypes.length];
            double amount = Math.round((25.0 + ((i * 37.89) % 3500.0)) * 100.0) / 100.0;
            String desc = descriptions[i % descriptions.length];
            String ref = (type.startsWith("D") ? "DEP-" : (type.startsWith("W") ? "WTH-" : "TXN-")) + (100000 + i);
            int day = 1 + (i % 28);
            int hour = (i * 3) % 24;
            int min = (i * 7) % 60;
            String timestamp = String.format("2026-10-%02d %02d:%02d:00", day, hour, min);
            double balanceAfter = Math.round((2500.0 + ((i * 123.45) % 80000.0)) * 100.0) / 100.0;

            transactions.add(new Transaction(ref, srcAcc, targetAcc, type, amount, desc, timestamp, "SUCCESS", balanceAfter));
        }

        transactionRepository.saveAll(transactions);

        // --- 3. SEED ENTERPRISE SUBSIDIARY MODULES ---
        Beneficiary b1 = new Beneficiary(1001002001, "Michael Chen (Checking)", 1001002002, "CBS Prime", "021000021", 15000.0);
        Beneficiary b2 = new Beneficiary(1001002001, "Elena Corp Global", 1001002003, "CBS Prime", "021000021", 50000.0);
        Beneficiary b3 = new Beneficiary(1001002001, "Apex Real Estate Ltd", 1099887766, "Chase Morgan", "011000015", 25000.0);
        beneficiaryRepository.save(b1);
        beneficiaryRepository.save(b2);
        beneficiaryRepository.save(b3);

        BillPayment bp1 = new BillPayment(1001002001, "Electricity", "Consolidated Edison", "NYC-998842", 185.40, "2026-10-08 10:15:00", "PAID", "BIL-EL9021");
        BillPayment bp2 = new BillPayment(1001002001, "Broadband", "Verizon Fios Fiber", "VRZ-551209", 89.99, "2026-10-09 16:20:00", "PAID", "BIL-FI3310");
        billPaymentRepository.save(bp1);
        billPaymentRepository.save(bp2);

        FixedDeposit fd1 = new FixedDeposit(1001002001, 10000.0, 12, 7.1, 10710.0, "2026-05-15", "2027-05-15", "ACTIVE", "FD-CERT-884920");
        fixedDepositRepository.save(fd1);

        Loan ln1 = new Loan(1001002001, "Auto Loan", 25000.0, 8.5, 36, 789.24, 18500.0, "2026-01-10", "DISBURSED", "LN-AUTO-94021");
        loanRepository.save(ln1);

        cardControlRepository.save(new CardControl(1001002001, false, true, true, true, 3000.0, 7500.0, "1234"));
        cardControlRepository.save(new CardControl(1001002002, false, true, false, true, 1500.0, 3000.0, "1234"));
        cardControlRepository.save(new CardControl(1001002003, false, true, true, true, 10000.0, 25000.0, "4321"));
        cardControlRepository.save(new CardControl(1010101010, false, true, false, true, 2000.0, 5000.0, "1234"));

        SupportTicket st1 = new SupportTicket(1001002001, "Card Limit", "Increase International POS Limit", "Requesting higher travel spending limit for upcoming overseas conference.", "OPEN", "2026-10-14 11:20:00", "TCK-881920");
        supportTicketRepository.save(st1);

        System.out.println(">>> Core Banking Enterprise: 1,000 Accounts & 1,000 Transactions Seeded Successfully!");
    }
}
