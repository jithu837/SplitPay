package com.splitpay.service;

import com.splitpay.document.User;
import com.splitpay.dto.request.ChangePasswordRequest;
import com.splitpay.dto.request.UpdateProfileRequest;
import com.splitpay.dto.response.UserDto;
import com.splitpay.exception.BadRequestException;
import com.splitpay.exception.ResourceNotFoundException;
import com.splitpay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDto getProfile(String userId) {
        return toDto(findById(userId));
    }

    public UserDto updateProfile(String userId, UpdateProfileRequest request) {
        User user = findById(userId);
        user.setName(request.getName().trim());
        return toDto(userRepository.save(user));
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public User findById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("No user registered with email: " + email));
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
