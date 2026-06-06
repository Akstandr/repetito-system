package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.conversations.model.Conversation;

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
    public static TutorStudentResponse from(Conversation conversation) {
        return new TutorStudentResponse(
                conversation.getStudentAccount().getId(),
                conversation.getStudentAccount().getUser().getFirstName(),
                conversation.getStudentAccount().getUser().getLastName(),
                conversation.getApplication().getTutorCard().getSubject(),
                conversation.getApplication().getId(),
                conversation.getId(),
                conversation.getApplication().getUpdatedAt()
        );
    }
}
