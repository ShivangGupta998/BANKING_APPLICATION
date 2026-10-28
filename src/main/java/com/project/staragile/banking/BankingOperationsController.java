package com.project.staragile.banking;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.staragile.banking.dto.ApiResponse;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class BankingOperationsController {

    @Autowired
    BankingOperationsService operationsService;

    // --- Beneficiary Endpoints ---

    @GetMapping("/beneficiaries/{accountNumber}")
    public ResponseEntity<ApiResponse<List<Beneficiary>>> getBeneficiaries(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Beneficiaries fetched", operationsService.getBeneficiaries(accountNumber)));
    }

    @PostMapping("/beneficiaries")
    public ResponseEntity<ApiResponse<Beneficiary>> addBeneficiary(@RequestBody Beneficiary beneficiary) {
        try {
            Beneficiary saved = operationsService.addBeneficiary(beneficiary);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Beneficiary added successfully", saved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @DeleteMapping("/beneficiaries/{id}")
    public ResponseEntity<ApiResponse<String>> deleteBeneficiary(@PathVariable Long id) {
        operationsService.deleteBeneficiary(id);
        return ResponseEntity.ok(ApiResponse.ok("Beneficiary removed successfully", null));
    }

    // --- Bill Payment Endpoints ---

    @PostMapping("/bills/pay")
    public ResponseEntity<ApiResponse<BillPayment>> payBill(@RequestBody BillPayment payment) {
        try {
            BillPayment result = operationsService.payBill(payment);
            return ResponseEntity.ok(ApiResponse.ok("Bill payment settled successfully", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/bills/{accountNumber}")
    public ResponseEntity<ApiResponse<List<BillPayment>>> getBillPayments(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Bill history retrieved", operationsService.getBillPayments(accountNumber)));
    }

    // --- Fixed Deposits Endpoints ---

    @PostMapping("/deposits/create")
    public ResponseEntity<ApiResponse<FixedDeposit>> createFixedDeposit(@RequestBody FixedDeposit fd) {
        try {
            FixedDeposit created = operationsService.createFixedDeposit(fd);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Fixed Deposit created successfully", created));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/deposits/{accountNumber}")
    public ResponseEntity<ApiResponse<List<FixedDeposit>>> getFixedDeposits(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Fixed Deposits retrieved", operationsService.getFixedDeposits(accountNumber)));
    }

    @PostMapping("/deposits/{id}/break")
    public ResponseEntity<ApiResponse<FixedDeposit>> breakDeposit(@PathVariable Long id) {
        try {
            FixedDeposit broken = operationsService.breakDeposit(id);
            return ResponseEntity.ok(ApiResponse.ok("Fixed Deposit liquidated and refunded to balance", broken));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    // --- Loans & EMI Facilities Endpoints ---

    @PostMapping("/loans/apply")
    public ResponseEntity<ApiResponse<Loan>> applyLoan(@RequestBody Loan loan) {
        try {
            Loan approved = operationsService.applyForLoan(loan);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Loan approved and funds disbursed", approved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/loans/{accountNumber}")
    public ResponseEntity<ApiResponse<List<Loan>>> getLoans(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Loans retrieved", operationsService.getLoans(accountNumber)));
    }

    // --- Card Controls Endpoints ---

    @GetMapping("/cards/{accountNumber}")
    public ResponseEntity<ApiResponse<CardControl>> getCardControl(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Card controls retrieved", operationsService.getCardControl(accountNumber)));
    }

    @PostMapping("/cards/settings")
    public ResponseEntity<ApiResponse<CardControl>> updateCardControl(@RequestBody CardControl control) {
        CardControl updated = operationsService.updateCardControl(control);
        return ResponseEntity.ok(ApiResponse.ok("Card security preferences updated", updated));
    }

    @PostMapping("/cards/{accountNumber}/freeze-toggle")
    public ResponseEntity<ApiResponse<CardControl>> toggleCardFreeze(@PathVariable int accountNumber) {
        CardControl updated = operationsService.toggleFreeze(accountNumber);
        String msg = updated.isFrozen() ? "Card has been FROZEN for safety." : "Card has been UNFROZEN and is active.";
        return ResponseEntity.ok(ApiResponse.ok(msg, updated));
    }

    @PostMapping("/cards/{accountNumber}/change-pin")
    public ResponseEntity<ApiResponse<CardControl>> changePin(@PathVariable int accountNumber, @RequestBody Map<String, String> payload) {
        try {
            String newPin = payload.get("newPin");
            CardControl updated = operationsService.changePin(accountNumber, newPin);
            return ResponseEntity.ok(ApiResponse.ok("ATM Security PIN changed successfully", updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    // --- Support & Dispute Tickets Endpoints ---

    @PostMapping("/support/tickets")
    public ResponseEntity<ApiResponse<SupportTicket>> createTicket(@RequestBody SupportTicket ticket) {
        try {
            SupportTicket created = operationsService.createTicket(ticket);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Support ticket submitted", created));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/support/tickets/{accountNumber}")
    public ResponseEntity<ApiResponse<List<SupportTicket>>> getTickets(@PathVariable int accountNumber) {
        return ResponseEntity.ok(ApiResponse.ok("Support tickets retrieved", operationsService.getTickets(accountNumber)));
    }
}
