package com.splitpay.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/** Enables @CreatedDate / @LastModifiedDate population on documents. */
@Configuration
@EnableMongoAuditing
public class MongoAuditConfig {
}
