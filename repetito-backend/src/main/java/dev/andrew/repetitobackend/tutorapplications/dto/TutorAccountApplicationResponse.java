package dev.andrew.repetitobackend.tutorapplications.dto;

import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplication;
import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplicationStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TutorAccountApplicationResponse(
        Long id, Long userId, String email, String fullName, Integer age, List<String> subjects,
        BigDecimal pricePerLesson, TutorAccountApplicationStatus status, String rejectionReason,
        Long reviewedByAdminId, Instant reviewedAt, Instant createdAt, Instant updatedAt
) {
    public static TutorAccountApplicationResponse from(TutorAccountApplication item) {
        return new TutorAccountApplicationResponse(
                item.getId(), item.getUser().getId(), item.getUser().getEmail(), item.getFullName(), item.getAge(),
                item.getSubjects().stream().sorted().toList(), item.getPricePerLesson(), item.getStatus(),
                item.getRejectionReason(), item.getReviewedByAdmin() == null ? null : item.getReviewedByAdmin().getId(),
                item.getReviewedAt(), item.getCreatedAt(), item.getUpdatedAt()
        );
    }
}
