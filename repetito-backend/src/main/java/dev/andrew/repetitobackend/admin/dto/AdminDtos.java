package dev.andrew.repetitobackend.admin.dto;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardFormat;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardModerationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record PageResponse<T>(
            List<T> items,
            int page,
            int limit,
            long total,
            int totalPages
    ) {
    }

    public record AccountPreview(Long id, AccountType type) {
    }

    public record UserItem(
            Long id,
            String email,
            String firstName,
            String lastName,
            boolean isAdmin,
            List<AccountPreview> accounts,
            Instant createdAt
    ) {
    }

    public record AccountItem(
            Long id,
            AccountType type,
            Long userId,
            String email,
            String firstName,
            String lastName,
            long relationsCount,
            long applicationsCount,
            long lessonsCount,
            Instant createdAt
    ) {
    }

    public record RelationItem(
            Long accountId,
            String firstName,
            String lastName,
            String email,
            String subject,
            Long applicationId,
            Instant acceptedAt
    ) {
    }

    public record TutorCardItem(
            Long id,
            Long tutorAccountId,
            String tutorFirstName,
            String tutorLastName,
            String tutorEmail,
            String title,
            String description,
            String subject,
            BigDecimal pricePerLesson,
            List<Integer> supportedGrades,
            TutorCardFormat format,
            boolean isActive,
            TutorCardModerationStatus moderationStatus,
            String rejectionReason,
            Long reviewedByAdminId,
            Instant reviewedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
