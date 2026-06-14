package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.applications.model.TutorApplication;

import java.time.Instant;

public record TutorStudentResponse(
        Long studentAccountId,
        String studentFirstName,
        String studentLastName,
        String subject,
        Long applicationId,
        Long conversationId,
        Instant acceptedAt
) {
    public static TutorStudentResponse from(TutorApplication application, Long conversationId) {
        return new TutorStudentResponse(
                application.getStudentAccount().getId(),
                application.getStudentAccount().getUser().getFirstName(),
                application.getStudentAccount().getUser().getLastName(),
                application.getTutorCard().getSubject(),
                application.getId(),
                conversationId,
                application.getUpdatedAt()
        );
    }
}
