package dev.andrew.repetitobackend.tutorcards.dto;

import dev.andrew.repetitobackend.accounts.model.TutorProfile;
import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardFormat;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardModerationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TutorCardResponse(
        Long id,
        Long tutorAccountId,
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
        Instant updatedAt,
        TutorPreview tutor
) {
    public static TutorCardResponse from(TutorCard card) {
        return from(card, null);
    }

    public static TutorCardResponse from(TutorCard card, TutorProfile tutorProfile) {
        return new TutorCardResponse(
                card.getId(),
                card.getTutorAccount().getId(),
                card.getTitle(),
                card.getDescription(),
                card.getSubject(),
                card.getPricePerLesson(),
                card.getSupportedGrades().stream().sorted().toList(),
                card.getFormat(),
                card.isActive(),
                card.getModerationStatus(),
                card.getRejectionReason(),
                card.getReviewedByAdmin() == null ? null : card.getReviewedByAdmin().getId(),
                card.getReviewedAt(),
                card.getCreatedAt(),
                card.getUpdatedAt(),
                new TutorPreview(
                        card.getTutorAccount().getId(),
                        card.getTutorAccount().getUser().getFirstName(),
                        card.getTutorAccount().getUser().getLastName(),
                        tutorProfile == null ? null : tutorProfile.getDescription(),
                        tutorProfile == null ? null : tutorProfile.getExperience(),
                        tutorProfile == null ? null : tutorProfile.getEducation()
                )
        );
    }

    public record TutorPreview(
            Long id,
            String firstName,
            String lastName,
            String description,
            String experience,
            String education
    ) {}
}
