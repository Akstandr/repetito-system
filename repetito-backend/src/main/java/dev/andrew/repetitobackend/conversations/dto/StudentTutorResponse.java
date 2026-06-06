package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.conversations.model.Conversation;

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
    public static StudentTutorResponse from(Conversation conversation) {
        return new StudentTutorResponse(
                conversation.getTutorAccount().getId(),
                conversation.getTutorAccount().getUser().getFirstName(),
                conversation.getTutorAccount().getUser().getLastName(),
                conversation.getApplication().getTutorCard().getSubject(),
                conversation.getApplication().getId(),
                conversation.getId(),
                conversation.getApplication().getUpdatedAt()
        );
    }
}
