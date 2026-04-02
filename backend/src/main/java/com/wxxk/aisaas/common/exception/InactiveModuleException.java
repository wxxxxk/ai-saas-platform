package com.wxxk.aisaas.common.exception;

public class InactiveModuleException extends RuntimeException {

    public InactiveModuleException(String moduleName) {
        super("Module is not active: " + moduleName);
    }
}
