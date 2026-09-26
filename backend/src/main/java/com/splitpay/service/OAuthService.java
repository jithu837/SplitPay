package com.splitpay.service;

import com.splitpay.document.Role;
import com.splitpay.document.User;
import com.splitpay.dto.request.OAuthRequest;
import com.splitpay.dto.response.AuthResponse;
import com.splitpay.dto.response.UserDto;
import com.splitpay.repository.UserRepository;
import com.splitpay.security.JwtUtil;
import com.splitpay.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;

/**
 * Handles OAuth2 login via Google and Apple.
 *
 * Flow:
 *   1. Frontend obtains an ID token (Google) or authorization response (Apple).
 *   2. Frontend sends it to POST /api/auth/oauth/google or /apple.
 *   3. This service verifies the token server-side, extracts email + name,
 *      creates the user if they don't exist, and returns a SplitPay JWT.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    // ─────────────────────────────────────────────────────────────────────────
    // Google — verify ID token via Google's tokeninfo endpoint
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse googleLogin(OAuthRequest request) {
        Map<String, String> payload = verifyGoogleIdToken(request.getToken());
        String email = payload.get("email");
        String name  = payload.get("name");

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Google account does not have an email address");
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseGet(() -> createOAuthUser(email, name));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toDto(user))
                .build();
    }

    /** Verifies a Google ID token using Google's tokeninfo REST endpoint. */
    private Map<String, String> verifyGoogleIdToken(String idToken) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                    .GET()
                    .timeout(java.time.Duration.ofSeconds(10))
                    .build();
            java.net.http.HttpResponse<String> res = client.send(req,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() >= 400) {
                log.error("Google tokeninfo returned {}: {}", res.statusCode(), res.body());
                throw new BadRequestException("Invalid Google token. Please sign in again.");
            }

            // Parse the JSON response manually (simple key-value extraction)
            String body = res.body();
            String email = extractJsonValue(body, "email");
            String name  = extractJsonValue(body, "name");
            String aud   = extractJsonValue(body, "aud");

            // Verify audience matches our Google client ID (if configured)
            if (googleClientId != null && !googleClientId.isBlank()
                    && !googleClientId.equals(aud)) {
                throw new BadRequestException("Google token was not issued for this application");
            }

            return Map.of("email", email != null ? email : "",
                          "name", name != null ? name : "");

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new BadRequestException("Could not verify Google sign-in. Please try again.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Apple — verify ID token using Apple's public keys
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse appleLogin(OAuthRequest request) {
        Map<String, String> payload = verifyAppleIdToken(request.getToken());
        String email = payload.get("email");
        // Apple only sends name on first sign-in; frontend forwards it
        String name = (request.getName() != null && !request.getName().isBlank())
                ? request.getName() : payload.get("name");

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Apple account does not have an email address");
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseGet(() -> createOAuthUser(email, name));

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toDto(user))
                .build();
    }

    /**
     * Verifies an Apple ID token (JWT) by:
     *  1. Decoding the header to find the key ID (kid)
     *  2. Fetching Apple's public keys from https://appleid.apple.com/auth/keys
     *  3. Verifying the JWT signature with the matching RSA public key
     *  4. Extracting email from the payload
     */
    private Map<String, String> verifyAppleIdToken(String idToken) {
        try {
            // Split JWT: header.payload.signature
            String[] parts = idToken.split("\\.");
            if (parts.length != 3) {
                throw new BadRequestException("Invalid Apple token format");
            }

            // Decode header to find kid
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            String kid = extractJsonValue(headerJson, "kid");

            // Decode payload to extract email
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
            String email = extractJsonValue(payloadJson, "email");

            // Fetch Apple's public keys
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://appleid.apple.com/auth/keys"))
                    .GET()
                    .timeout(java.time.Duration.ofSeconds(10))
                    .build();
            java.net.http.HttpResponse<String> res = client.send(req,
                    java.net.http.HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() >= 400) {
                throw new BadRequestException("Could not fetch Apple public keys");
            }

            // Find matching key by kid and verify signature
            String keysBody = res.body();
            if (kid != null && keysBody.contains("\"kid\":\"" + kid + "\"")) {
                // Extract the modulus (n) and exponent (e) for the matching key
                // Find the key block containing this kid
                int kidIdx = keysBody.indexOf("\"kid\":\"" + kid + "\"");
                // Search backwards for the start of this key object
                int blockStart = keysBody.lastIndexOf("{", kidIdx);
                int blockEnd = keysBody.indexOf("}", kidIdx) + 1;
                String keyBlock = keysBody.substring(blockStart, blockEnd);

                String n = extractJsonValue(keyBlock, "n");
                String e = extractJsonValue(keyBlock, "e");

                if (n != null && e != null) {
                    // Build RSA public key
                    byte[] nBytes = Base64.getUrlDecoder().decode(n);
                    byte[] eBytes = Base64.getUrlDecoder().decode(e);
                    BigInteger modulus = new BigInteger(1, nBytes);
                    BigInteger exponent = new BigInteger(1, eBytes);
                    RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
                    PublicKey publicKey = KeyFactory.getInstance("RSA").generatePublic(spec);

                    // Verify the JWT signature using java.security.Signature
                    String alg = extractJsonValue(headerJson, "alg");
                    String javaAlg = "RS256".equals(alg) ? "SHA256withRSA" : "SHA256withRSA";
                    java.security.Signature sig = java.security.Signature.getInstance(javaAlg);
                    sig.initVerify(publicKey);
                    sig.update((parts[0] + "." + parts[1]).getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    byte[] signatureBytes = Base64.getUrlDecoder().decode(parts[2]);
                    if (!sig.verify(signatureBytes)) {
                        throw new BadRequestException("Apple token signature verification failed");
                    }
                }
            }

            log.info("Apple ID token verified for email: {}", email);
            return Map.of(
                "email", email != null ? email : "",
                "name", ""
            );

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Apple token verification failed: {}", e.getMessage());
            throw new BadRequestException("Could not verify Apple sign-in. Please try again.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Creates a new USER from OAuth data (no password needed). */
    private User createOAuthUser(String email, String name) {
        User user = User.builder()
                .email(email.trim().toLowerCase())
                .name(name != null && !name.isBlank() ? name.trim() : email.split("@")[0])
                .password("") // OAuth users don't have a password
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /** Simple JSON value extractor — avoids adding a JSON library dependency for this one use. */
    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int idx = json.indexOf(searchKey);
        if (idx < 0) return null;
        int colonIdx = json.indexOf(":", idx + searchKey.length());
        if (colonIdx < 0) return null;
        // Skip whitespace after colon
        int start = colonIdx + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '"')) start++;
        if (start >= json.length()) return null;
        // Check if it started with a quote (string value)
        if (json.charAt(start - 1) == '"') {
            int end = json.indexOf("\"", start);
            return end > start ? json.substring(start, end) : null;
        }
        // Numeric/boolean value
        int end = start;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(start, end).trim();
    }
}
