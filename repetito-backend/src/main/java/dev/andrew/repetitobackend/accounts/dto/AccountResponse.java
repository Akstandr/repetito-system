package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.model.StudentProfile;
import dev.andrew.repetitobackend.accounts.model.TutorProfile;

import java.time.Instant;

public record AccountResponse(
        Long id,
        AccountType type,
        Instant createdAt,
        boolean active,
        StudentProfileResponse studentProfile,
        TutorProfileResponse tutorProfile
) {
    public static AccountResponse from(Account account, StudentProfile studentProfile, TutorProfile tutorProfile, boolean active) {
        return new AccountResponse(
                account.getId(),
                account.getType(),
                account.getCreatedAt(),
                active,
                StudentProfileResponse.from(studentProfile),
                TutorProfileResponse.from(tutorProfile)
        );
    }
}
