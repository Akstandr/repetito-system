package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.applications.dto.ApplicationResponse;
import dev.andrew.repetitobackend.conversations.model.Conversation;

import java.time.Instant;

public record ConversationResponse(
        Long id,
        Long applicationId,
        Long studentAccountId,
        Long tutorAccountId,
        String studentFirstName,
        String studentLastName,
        String tutorFirstName,
        String tutorLastName,
        ApplicationResponse application,
        String lastMessageText,
        Instant lastMessageAt,
        long unreadMessagesCount,
        Instant createdAt
) {
    public static ConversationResponse from(
            Conversation conversation,
            String lastMessageText,
            Instant lastMessageAt,
            long unreadMessagesCount
    ) {
        return new ConversationResponse(
                conversation.getId(),
                conversation.getApplication().getId(),
                conversation.getStudentAccount().getId(),
                conversation.getTutorAccount().getId(),
                conversation.getStudentAccount().getUser().getFirstName(),
                conversation.getStudentAccount().getUser().getLastName(),
                conversation.getTutorAccount().getUser().getFirstName(),
                conversation.getTutorAccount().getUser().getLastName(),
                ApplicationResponse.from(conversation.getApplication()),
                lastMessageText,
                lastMessageAt,
                unreadMessagesCount,
                conversation.getCreatedAt()
        );
    }
}
