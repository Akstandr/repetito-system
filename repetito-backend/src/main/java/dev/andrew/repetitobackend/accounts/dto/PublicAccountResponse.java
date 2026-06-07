package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.model.StudentProfile;
import dev.andrew.repetitobackend.accounts.model.TutorProfile;

import java.time.Instant;

public record PublicAccountResponse(
        Long id,
        AccountType type,
        Instant createdAt,
        StudentProfileResponse studentProfile,
        TutorProfileResponse tutorProfile
) {
    public static PublicAccountResponse from(Account account, StudentProfile studentProfile, TutorProfile tutorProfile) {
        return new PublicAccountResponse(
                account.getId(),
                account.getType(),
                account.getCreatedAt(),
                StudentProfileResponse.from(studentProfile),
                TutorProfileResponse.from(tutorProfile)
        );
    }
}
