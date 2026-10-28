package com.project.staragile.banking.dto;

public class DepositWithdrawRequest {
    private int accountNumber;
    private double amount;
    private String description;

    public DepositWithdrawRequest() {
    }

    public DepositWithdrawRequest(int accountNumber, double amount, String description) {
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.description = description;
    }

    public int getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(int accountNumber) {
        this.accountNumber = accountNumber;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
