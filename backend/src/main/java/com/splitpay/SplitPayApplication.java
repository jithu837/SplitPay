package com.splitpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SplitPay - Smart Split-Bill & UPI Settlement Platform.
 *
 * Entry point for the Spring Boot backend. See README.md at the project root
 * for full setup instructions (MongoDB, environment variables, Razorpay test keys).
 */
@SpringBootApplication
public class SplitPayApplication {
    public static void main(String[] args) {
        SpringApplication.run(SplitPayApplication.class, args);
    }
}
