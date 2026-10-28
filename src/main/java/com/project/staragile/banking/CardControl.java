package com.project.staragile.banking;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "card_controls")
public class CardControl {

    @Id
    private int accountNumber;

    private boolean isFrozen;
    private boolean onlineTransactions;
    private boolean internationalUsage;
    private boolean contactlessPayments;
    private double dailyAtmLimit;
    private double dailyPosLimit;
    private String cardPin;

    public CardControl() {
    }

    public CardControl(int accountNumber, boolean isFrozen, boolean onlineTransactions, boolean internationalUsage, boolean contactlessPayments, double dailyAtmLimit, double dailyPosLimit, String cardPin) {
        this.accountNumber = accountNumber;
        this.isFrozen = isFrozen;
        this.onlineTransactions = onlineTransactions;
        this.internationalUsage = internationalUsage;
        this.contactlessPayments = contactlessPayments;
        this.dailyAtmLimit = dailyAtmLimit;
        this.dailyPosLimit = dailyPosLimit;
        this.cardPin = cardPin;
    }

    public int getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(int accountNumber) {
        this.accountNumber = accountNumber;
    }

    public boolean isFrozen() {
        return isFrozen;
    }

    public void setFrozen(boolean frozen) {
        isFrozen = frozen;
    }

    public boolean isOnlineTransactions() {
        return onlineTransactions;
    }

    public void setOnlineTransactions(boolean onlineTransactions) {
        this.onlineTransactions = onlineTransactions;
    }

    public boolean isInternationalUsage() {
        return internationalUsage;
    }

    public void setInternationalUsage(boolean internationalUsage) {
        this.internationalUsage = internationalUsage;
    }

    public boolean isContactlessPayments() {
        return contactlessPayments;
    }

    public void setContactlessPayments(boolean contactlessPayments) {
        this.contactlessPayments = contactlessPayments;
    }

    public double getDailyAtmLimit() {
        return dailyAtmLimit;
    }

    public void setDailyAtmLimit(double dailyAtmLimit) {
        this.dailyAtmLimit = dailyAtmLimit;
    }

    public double getDailyPosLimit() {
        return dailyPosLimit;
    }

    public void setDailyPosLimit(double dailyPosLimit) {
        this.dailyPosLimit = dailyPosLimit;
    }

    public String getCardPin() {
        return cardPin;
    }

    public void setCardPin(String cardPin) {
        this.cardPin = cardPin;
    }
}
