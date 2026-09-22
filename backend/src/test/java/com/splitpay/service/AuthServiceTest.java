package com.splitpay.service;

import com.splitpay.document.Role;
import com.splitpay.document.User;
import com.splitpay.dto.request.LoginRequest;
import com.splitpay.dto.request.RegisterRequest;
import com.splitpay.dto.response.AuthResponse;
import com.splitpay.exception.ConflictException;
import com.splitpay.exception.UnauthorizedException;
import com.splitpay.repository.UserRepository;
import com.splitpay.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil);
    }

    @Test
    void registerHashesPasswordAndNeverStoresPlainText() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Jithendra");
        req.setEmail("Jithendra@Example.com");
        req.setPassword("plainTextPassword123");

        when(userRepository.existsByEmail("jithendra@example.com")).thenReturn(false);
        when(passwordEncoder.encode("plainTextPassword123")).thenReturn("bcrypt-hash-value");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0, User.class);
            u.setId("user-1");
            return u;
        });
        when(jwtUtil.generateToken("user-1", "jithendra@example.com", Role.USER)).thenReturn("jwt-token");

        AuthResponse response = authService.register(req);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("jithendra@example.com");
        // Verify the persisted user never carries the raw password
        org.mockito.ArgumentCaptor<User> captor = org.mockito.ArgumentCaptor.forClass(User.class);
        org.mockito.Mockito.verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("bcrypt-hash-value");
        assertThat(captor.getValue().getPassword()).isNotEqualTo("plainTextPassword123");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Jithendra");
        req.setEmail("existing@example.com");
        req.setPassword("password123");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req)).isInstanceOf(ConflictException.class);
    }

    @Test
    void loginSucceedsWithCorrectCredentials() {
        User user = User.builder().id("user-1").name("Jithendra").email("jithendra@example.com")
                .password("bcrypt-hash").role(Role.USER).build();

        LoginRequest req = new LoginRequest();
        req.setEmail("jithendra@example.com");
        req.setPassword("correctPassword");

        when(userRepository.findByEmail("jithendra@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPassword", "bcrypt-hash")).thenReturn(true);
        when(jwtUtil.generateToken("user-1", "jithendra@example.com", Role.USER)).thenReturn("jwt-token");

        AuthResponse response = authService.login(req);

        assertThat(response.getToken()).isEqualTo("jwt-token");
    }

    @Test
    void loginFailsWithWrongPassword() {
        User user = User.builder().id("user-1").email("jithendra@example.com").password("bcrypt-hash")
                .role(Role.USER).build();

        LoginRequest req = new LoginRequest();
        req.setEmail("jithendra@example.com");
        req.setPassword("wrongPassword");

        when(userRepository.findByEmail("jithendra@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "bcrypt-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req)).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void loginFailsWhenEmailDoesNotExist() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("anything");

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req)).isInstanceOf(UnauthorizedException.class);
    }
}
