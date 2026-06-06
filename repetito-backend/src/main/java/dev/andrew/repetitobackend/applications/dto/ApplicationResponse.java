package dev.andrew.repetitobackend.applications.dto;

import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardResponse;

import java.time.Instant;

public record ApplicationResponse(
        Long id,
        TutorCardResponse tutorCard,
        Long studentAccountId,
        Long tutorAccountId,
        String studentFirstName,
        String studentLastName,
        String tutorFirstName,
        String tutorLastName,
        ApplicationStatus status,
        String message,
        Long conversationId,
        Instant createdAt,
        Instant updatedAt
) {
    public static ApplicationResponse from(TutorApplication application) {
        return new ApplicationResponse(
                application.getId(),
                TutorCardResponse.from(application.getTutorCard()),
                application.getStudentAccount().getId(),
                application.getTutorAccount().getId(),
                application.getStudentAccount().getUser().getFirstName(),
                application.getStudentAccount().getUser().getLastName(),
                application.getTutorAccount().getUser().getFirstName(),
                application.getTutorAccount().getUser().getLastName(),
                application.getStatus(),
                application.getMessage(),
                application.getConversation() == null ? null : application.getConversation().getId(),
                application.getCreatedAt(),
                application.getUpdatedAt()
        );
    }
}
