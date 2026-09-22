package com.splitpay.exception;

/** Thrown for domain validation failures (e.g. split amounts don't add up). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
