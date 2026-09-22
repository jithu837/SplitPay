package com.splitpay.config;

import com.mongodb.client.MongoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;

/**
 * Enables @Transactional support for MongoDB multi-document writes
 * (used by payment verification: Payment update + Settlement update
 * must succeed or fail together).
 *
 * IMPORTANT: MongoDB multi-document transactions require the server to be
 * running as a replica set (or a mongos-fronted sharded cluster) — a plain
 * standalone `mongod` will reject transactions. For local development,
 * initialise a single-node replica set, e.g.:
 *   mongod --replSet rs0
 *   mongosh --eval "rs.initiate()"
 * MongoDB Atlas clusters support transactions out of the box.
 */
@Configuration
public class MongoTransactionConfig {

    @Bean
    public MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}
