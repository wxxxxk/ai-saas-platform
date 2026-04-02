package com.wxxk.aisaas.common.exception;

public class InsufficientCreditException extends RuntimeException {

    public InsufficientCreditException(int balance, int required) {
        super("Insufficient credits. balance=" + balance + ", required=" + required);
    }
}
