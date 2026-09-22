package com.splitpay.security;

import com.splitpay.document.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Lightweight authenticated-principal wrapper built directly from JWT claims,
 * so we don't need a DB round-trip on every request.
 */
@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final String userId;
    private final String email;
    private final Role role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
