package com.splitpay.payment;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Thin wrapper around the Razorpay Java SDK.
 *
 * IMPORTANT: this project is wired for RAZORPAY TEST MODE ONLY.
 * The key secret lives purely in application.properties / env vars and is
 * NEVER sent to the frontend. Only the key id (public) and order id go to React.
 */
@Component
public class RazorpayGateway {

    private final String keyId;
    private final String keySecret;

    public RazorpayGateway(@Value("${razorpay.key-id}") String keyId,
                            @Value("${razorpay.key-secret}") String keySecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates a Razorpay order for the given amount (in rupees). Razorpay's API
     * expects the amount in the smallest currency unit (paise), so we multiply by 100.
     */
    public JSONObject createOrder(BigDecimal amountInRupees, String receiptId) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        int amountInPaise = amountInRupees.multiply(BigDecimal.valueOf(100)).intValueExact();

        Map<String, Object> orderRequestMap = new HashMap<>();
        orderRequestMap.put("amount", amountInPaise);
        orderRequestMap.put("currency", "INR");
        orderRequestMap.put("receipt", receiptId);
        orderRequestMap.put("payment_capture", 1);

        JSONObject request = new JSONObject(orderRequestMap);
        com.razorpay.Order order = client.orders.create(request);
        return order.toJson();
    }

    /**
     * Verifies the HMAC-SHA256 signature Razorpay returns after checkout, using
     * the formula: HMAC_SHA256(order_id + "|" + payment_id, key_secret).
     * This MUST be done server-side; a frontend "success" callback alone is
     * never sufficient proof of payment.
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (RazorpayException e) {
            return false;
        }
    }
}
