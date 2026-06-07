package dev.andrew.repetitobackend.accounts.dto;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.model.StudentProfile;
import dev.andrew.repetitobackend.accounts.model.TutorProfile;

public record PublicProfileSearchResponse(
        Long accountId,
        Long userId,
        AccountType type,
        String firstName,
        String lastName,
        String description,
        String subjects
) {
    public static PublicProfileSearchResponse from(Account account, StudentProfile studentProfile, TutorProfile tutorProfile) {
        return new PublicProfileSearchResponse(
                account.getId(),
                account.getUser().getId(),
                account.getType(),
                account.getUser().getFirstName(),
                account.getUser().getLastName(),
                account.getType() == AccountType.TUTOR
                        ? (tutorProfile == null ? null : tutorProfile.getDescription())
                        : (studentProfile == null ? null : studentProfile.getDescription()),
                account.getType() == AccountType.TUTOR
                        ? (tutorProfile == null ? null : tutorProfile.getSubjects())
                        : (studentProfile == null ? null : studentProfile.getSubjects())
        );
    }
}
