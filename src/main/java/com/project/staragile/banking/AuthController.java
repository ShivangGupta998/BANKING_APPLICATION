package com.project.staragile.banking;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.staragile.banking.dto.ApiResponse;
import com.project.staragile.banking.dto.LoginRequest;
import com.project.staragile.banking.dto.LoginResponse;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    AccountRepository accountRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        if (request.getIdentifier() == null || request.getIdentifier().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Account Number or Username is required."));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Security PIN or Password is required."));
        }

        String id = request.getIdentifier().trim();
        String pwd = request.getPassword().trim();

        // 1. Bank Executive / Admin Login
        if (id.equalsIgnoreCase("admin") || id.equalsIgnoreCase("manager")) {
            if ("admin123".equals(pwd) || "admin".equals(pwd)) {
                String token = "cbs_adm_" + UUID.randomUUID().toString();
                LoginResponse resp = new LoginResponse(
                        token, 0, "Executive Manager", "Corporate Administration", 9999999.0, "ROLE_ADMIN");
                return ResponseEntity.ok(ApiResponse.ok("Administrator session authenticated.", resp));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid credentials for Administrator account."));
            }
        }

        // 2. Customer Account Login by Account Number
        Account matchedAccount = null;
        try {
            int accNum = Integer.parseInt(id);
            Optional<Account> opt = accountRepository.findById(accNum);
            if (opt.isPresent()) {
                matchedAccount = opt.get();
            }
        } catch (NumberFormatException ignored) {
            // Identifier is not a pure integer, search by name
        }

        // 3. Customer Account Login by Name match
        if (matchedAccount == null) {
            List<Account> all = accountRepository.findAll();
            for (Account a : all) {
                if (a.getAccountName().toLowerCase().contains(id.toLowerCase())) {
                    matchedAccount = a;
                    break;
                }
            }
        }

        if (matchedAccount == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Account not found. Please verify your Account # or Username."));
        }

        // Validate password/PIN (Supports demo pass123, 1234, or account-specific)
        if (!pwd.equals("pass123") && !pwd.equals("1234") && !pwd.equals("password") && !pwd.equals("admin123")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Incorrect password or security PIN."));
        }

        String token = "cbs_usr_" + UUID.randomUUID().toString();
        LoginResponse resp = new LoginResponse(
                token,
                matchedAccount.getAccountNumber(),
                matchedAccount.getAccountName(),
                matchedAccount.getAccountType(),
                matchedAccount.getAccountBalance(),
                "ROLE_CUSTOMER"
        );

        return ResponseEntity.ok(ApiResponse.ok("Authentication successful. Welcome to CBS Prime.", resp));
    }

    @GetMapping("/demo-users")
    public ResponseEntity<ApiResponse<List<LoginResponse>>> getDemoUsers() {
        List<Account> accounts = accountRepository.findAll();
        List<LoginResponse> list = new ArrayList<>();
        
        // Add Admin Demo
        list.add(new LoginResponse("", 0, "System Administrator", "Executive Admin", 0.0, "ROLE_ADMIN"));

        for (Account a : accounts) {
            list.add(new LoginResponse(
                    "", a.getAccountNumber(), a.getAccountName(), a.getAccountType(), a.getAccountBalance(), "ROLE_CUSTOMER"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Demo users retrieved", list));
    }
}
