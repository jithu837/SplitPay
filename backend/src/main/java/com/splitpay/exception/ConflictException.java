package com.splitpay.exception;

/** Thrown for state conflicts, e.g. duplicate email on registration, duplicate payment verification. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
