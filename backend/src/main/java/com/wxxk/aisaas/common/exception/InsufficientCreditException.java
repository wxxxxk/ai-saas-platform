package com.wxxk.aisaas.common.exception;

public class InsufficientCreditException extends RuntimeException {

    public InsufficientCreditException(int balance, int required) {
        super("크레딧이 부족합니다. 현재 잔액: " + balance + " cr, 필요: " + required + " cr");
    }
}
