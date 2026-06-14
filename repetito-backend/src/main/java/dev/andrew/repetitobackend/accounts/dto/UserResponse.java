package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.users.model.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean isAdmin,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isAdmin(),
                user.getCreatedAt()
        );
    }
}
