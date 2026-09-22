package com.splitpay.security;

import org.springframework.security.core.context.SecurityContextHolder;

/** Small helper so controllers don't repeat SecurityContext boilerplate. */
public final class CurrentUser {

    private CurrentUser() {}

    public static UserPrincipal get() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public static String id() {
        return get().getUserId();
    }
}
