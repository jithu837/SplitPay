package com.splitpay.exception;

/** Thrown when an authenticated user tries to act outside their role/group membership. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
