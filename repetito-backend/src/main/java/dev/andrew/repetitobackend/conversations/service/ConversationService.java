package dev.andrew.repetitobackend.conversations.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.dto.ConversationResponse;
import dev.andrew.repetitobackend.conversations.dto.MessageRequest;
import dev.andrew.repetitobackend.conversations.dto.MessageResponse;
import dev.andrew.repetitobackend.conversations.dto.StudentTutorResponse;
import dev.andrew.repetitobackend.conversations.dto.TutorStudentResponse;
import dev.andrew.repetitobackend.conversations.model.Conversation;
import dev.andrew.repetitobackend.conversations.model.Message;
import dev.andrew.repetitobackend.conversations.repository.ConversationRepository;
import dev.andrew.repetitobackend.conversations.repository.MessageRepository;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AccountRepository accountRepository;
    private final TutorApplicationRepository tutorApplicationRepository;
    private final TutorCardRepository tutorCardRepository;

    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(AuthPrincipal principal) {
        List<Conversation> conversations = conversationRepository.findByParticipantUserIdOrderByCreatedAtDesc(principal.userId());

        return conversations.stream()
                .map(conversation -> {
                    var lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
                    return ConversationResponse.from(
                            conversation,
                            lastMessage == null ? null : lastMessage.getText(),
                            lastMessage == null ? null : lastMessage.getCreatedAt(),
                            messageRepository.countByConversation_IdAndSenderAccount_User_IdNotAndReadAtIsNull(conversation.getId(), principal.userId())
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorStudentResponse> getTutorStudents(AuthPrincipal principal) {
        return conversationRepository.findByTutorAccount_User_IdOrderByCreatedAtDesc(principal.userId()).stream()
                .map(TutorStudentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentTutorResponse> getStudentTutors(AuthPrincipal principal) {
        return conversationRepository.findByStudentAccount_User_IdOrderByCreatedAtDesc(principal.userId()).stream()
                .map(StudentTutorResponse::from)
                .toList();
    }

    @Transactional
    public List<MessageResponse> getMessages(AuthPrincipal principal, Long conversationId) {
        Conversation conversation = requireParticipantConversation(principal, conversationId);
        if (conversation.getApplication().getStatus() != ApplicationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Application is not accepted");
        }

        requireParticipantAccount(principal, conversation);
        List<Message> unreadMessages = messageRepository.findByConversation_IdAndSenderAccount_User_IdNotAndReadAtIsNull(
                conversation.getId(),
                principal.userId()
        );
        if (!unreadMessages.isEmpty()) {
            Instant readAt = Instant.now();
            unreadMessages.forEach(message -> message.setReadAt(readAt));
            messageRepository.saveAll(unreadMessages);
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(AuthPrincipal principal, Long conversationId, MessageRequest request) {
        Conversation conversation = requireParticipantConversation(principal, conversationId);
        if (conversation.getApplication().getStatus() != ApplicationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Application is not accepted");
        }

        Account senderAccount = requireParticipantAccount(principal, conversation);
        String text = request.getText().trim();
        if (text.isBlank()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        Message message = messageRepository.save(Message.builder()
                .conversation(conversation)
                .senderAccount(senderAccount)
                .text(text)
                .readAt(null)
                .createdAt(Instant.now())
                .build());
        return MessageResponse.from(message);
    }

    @Transactional
    public ConversationResponse contactTutor(AuthPrincipal principal, Long tutorAccountId) {
        Account studentAccount = resolveStudentAccount(principal);
        Account tutorAccount = accountRepository.findById(tutorAccountId)
                .filter(account -> account.getType() == AccountType.TUTOR)
                .filter(Account::isPublicProfile)
                .orElseThrow(() -> new IllegalArgumentException("Tutor profile not found"));

        if (studentAccount.getUser().getId().equals(tutorAccount.getUser().getId())) {
            throw new IllegalArgumentException("Cannot contact your own tutor profile");
        }

        TutorApplication application = tutorApplicationRepository
                .findByStudentAccountIdAndTutorAccountIdAndStatus(studentAccount.getId(), tutorAccount.getId(), ApplicationStatus.ACCEPTED)
                .orElseGet(() -> {
                    var tutorCard = tutorCardRepository.findByTutorAccountIdAndIsActiveTrueOrderByCreatedAtDesc(tutorAccount.getId()).stream()
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException("Tutor has no active cards"));

                    return tutorApplicationRepository.save(TutorApplication.builder()
                            .tutorCard(tutorCard)
                            .studentAccount(studentAccount)
                            .tutorAccount(tutorAccount)
                            .status(ApplicationStatus.ACCEPTED)
                            .message("Связь через публичный профиль")
                            .build());
                });

        Conversation conversation = ensureConversationForApplication(application);
        var lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
        return ConversationResponse.from(
                conversation,
                lastMessage == null ? null : lastMessage.getText(),
                lastMessage == null ? null : lastMessage.getCreatedAt(),
                messageRepository.countByConversation_IdAndSenderAccount_User_IdNotAndReadAtIsNull(conversation.getId(), principal.userId())
        );
    }

    @Transactional
    public Conversation ensureConversationForApplication(TutorApplication application) {
        return conversationRepository.findByApplicationId(application.getId())
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .application(application)
                        .studentAccount(application.getStudentAccount())
                        .tutorAccount(application.getTutorAccount())
                        .build()));
    }

    private Conversation requireParticipantConversation(AuthPrincipal principal, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        requireParticipantAccount(principal, conversation);
        return conversation;
    }

    private Account requireParticipantAccount(AuthPrincipal principal, Conversation conversation) {
        Account studentAccount = conversation.getStudentAccount();
        Account tutorAccount = conversation.getTutorAccount();

        if (principal.activeAccountId() != null) {
            if (studentAccount.getId().equals(principal.activeAccountId())
                    && studentAccount.getUser().getId().equals(principal.userId())) {
                return studentAccount;
            }
            if (tutorAccount.getId().equals(principal.activeAccountId())
                    && tutorAccount.getUser().getId().equals(principal.userId())) {
                return tutorAccount;
            }
        }

        if (studentAccount.getUser().getId().equals(principal.userId())) {
            return studentAccount;
        }
        if (tutorAccount.getUser().getId().equals(principal.userId())) {
            return tutorAccount;
        }

        throw new IllegalArgumentException("Conversation not found");
    }

    private Account resolveStudentAccount(AuthPrincipal principal) {
        if (principal.activeAccountId() != null) {
            Account activeAccount = accountRepository.findByIdAndUserId(principal.activeAccountId(), principal.userId())
                    .orElseThrow(() -> new IllegalArgumentException("Account not found"));
            if (activeAccount.getType() == AccountType.STUDENT) {
                return activeAccount;
            }
        }

        return accountRepository.findByUserIdAndType(principal.userId(), AccountType.STUDENT)
                .orElseThrow(() -> new IllegalArgumentException("Create a student account first"));
    }
}
