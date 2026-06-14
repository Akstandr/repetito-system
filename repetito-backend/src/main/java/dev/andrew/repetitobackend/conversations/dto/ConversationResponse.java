package dev.andrew.repetitobackend.conversations.dto;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.applications.dto.ApplicationResponse;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.model.Conversation;
import dev.andrew.repetitobackend.conversations.model.ParticipantType;
import dev.andrew.repetitobackend.users.model.User;

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
        Long counterpartUserId,
        Long counterpartAccountId,
        ParticipantType counterpartType,
        String counterpartFirstName,
        String counterpartLastName,
        String lastMessageText,
        Instant lastMessageAt,
        long unreadMessagesCount,
        Instant createdAt
) {
    public static ConversationResponse from(Conversation conversation, AuthPrincipal principal, String lastMessageText, Instant lastMessageAt, long unreadMessagesCount) {
        boolean currentIsA = conversation.getParticipantAUser().getId().equals(principal.userId())
                && (conversation.getParticipantAAccount() == null || conversation.getParticipantAAccount().getId().equals(principal.activeAccountId()) || principal.admin());
        User counterpartUser = currentIsA ? conversation.getParticipantBUser() : conversation.getParticipantAUser();
        Account counterpartAccount = currentIsA ? conversation.getParticipantBAccount() : conversation.getParticipantAAccount();
        ParticipantType counterpartType = currentIsA ? conversation.getParticipantBType() : conversation.getParticipantAType();
        Account student = conversation.getStudentAccount();
        Account tutor = conversation.getTutorAccount();
        return new ConversationResponse(
                conversation.getId(),
                conversation.getApplication() == null ? null : conversation.getApplication().getId(),
                student == null ? null : student.getId(),
                tutor == null ? null : tutor.getId(),
                student == null ? null : student.getUser().getFirstName(),
                student == null ? null : student.getUser().getLastName(),
                tutor == null ? null : tutor.getUser().getFirstName(),
                tutor == null ? null : tutor.getUser().getLastName(),
                conversation.getApplication() == null ? null : ApplicationResponse.from(conversation.getApplication()),
                counterpartUser.getId(),
                counterpartAccount == null ? null : counterpartAccount.getId(),
                counterpartType,
                counterpartUser.getFirstName(),
                counterpartUser.getLastName(),
                lastMessageText,
                lastMessageAt,
                unreadMessagesCount,
                conversation.getCreatedAt()
        );
    }
}
