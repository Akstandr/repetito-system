package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.applications.model.TutorApplication;

import java.time.Instant;

public record StudentTutorResponse(
        Long tutorAccountId,
        String tutorFirstName,
        String tutorLastName,
        String subject,
        Long applicationId,
        Long conversationId,
        Instant acceptedAt
) {
    public static StudentTutorResponse from(TutorApplication application, Long conversationId) {
        return new StudentTutorResponse(
                application.getTutorAccount().getId(),
                application.getTutorAccount().getUser().getFirstName(),
                application.getTutorAccount().getUser().getLastName(),
                application.getTutorCard().getSubject(),
                application.getId(),
                conversationId,
                application.getUpdatedAt()
        );
    }
}
