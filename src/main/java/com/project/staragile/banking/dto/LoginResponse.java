package com.project.staragile.banking.dto;

public class LoginResponse {
    private String token;
    private int accountNumber;
    private String accountName;
    private String accountType;
    private double balance;
    private String role; // "ROLE_CUSTOMER", "ROLE_ADMIN"

    public LoginResponse() {
    }

    public LoginResponse(String token, int accountNumber, String accountName, String accountType, double balance, String role) {
        this.token = token;
        this.accountNumber = accountNumber;
        this.accountName = accountName;
        this.accountType = accountType;
        this.balance = balance;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public int getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(int accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public double getBalance() {
        return balance;
    }

    public void setBalance(double balance) {
        this.balance = balance;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
