package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.users.model.User;

import java.time.Instant;

public record PublicUserResponse(
        Long id,
        String firstName,
        String lastName,
        Instant createdAt
) {
    public static PublicUserResponse from(User user) {
        return new PublicUserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getCreatedAt()
        );
    }
}
