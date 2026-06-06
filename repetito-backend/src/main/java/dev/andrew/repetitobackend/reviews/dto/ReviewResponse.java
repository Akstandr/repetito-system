package dev.andrew.repetitobackend.reviews.dto;

import dev.andrew.repetitobackend.reviews.model.TutorReview;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long studentAccountId,
        String studentFirstName,
        String studentLastName,
        Long tutorAccountId,
        String tutorFirstName,
        String tutorLastName,
        Integer rating,
        String text,
        String tutorReply,
        Instant tutorRepliedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static ReviewResponse from(TutorReview review) {
        return new ReviewResponse(
                review.getId(),
                review.getStudentAccount().getId(),
                review.getStudentAccount().getUser().getFirstName(),
                review.getStudentAccount().getUser().getLastName(),
                review.getTutorAccount().getId(),
                review.getTutorAccount().getUser().getFirstName(),
                review.getTutorAccount().getUser().getLastName(),
                review.getRating(),
                review.getText(),
                review.getTutorReply(),
                review.getTutorRepliedAt(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
