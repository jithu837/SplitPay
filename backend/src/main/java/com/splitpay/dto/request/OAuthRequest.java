package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthRequest {

    /** The ID token (Google) or authorization code (Apple) from the client-side OAuth flow. */
    @NotBlank(message = "Token is required")
    private String token;

    /** Optional — Apple only sends name on first sign-in; the frontend must forward it. */
    private String name;
}
