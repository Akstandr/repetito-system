package dev.andrew.repetitobackend.conversations.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.dto.ConversationResponse;
import dev.andrew.repetitobackend.conversations.dto.MessageRequest;
import dev.andrew.repetitobackend.conversations.dto.MessageResponse;
import dev.andrew.repetitobackend.conversations.dto.MessagePageResponse;
import dev.andrew.repetitobackend.conversations.dto.StartConversationRequest;
import dev.andrew.repetitobackend.conversations.dto.StudentTutorResponse;
import dev.andrew.repetitobackend.conversations.dto.TutorStudentResponse;
import dev.andrew.repetitobackend.conversations.model.Conversation;
import dev.andrew.repetitobackend.conversations.model.Message;
import dev.andrew.repetitobackend.conversations.model.ParticipantType;
import dev.andrew.repetitobackend.conversations.repository.ConversationRepository;
import dev.andrew.repetitobackend.conversations.repository.MessageRepository;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TutorApplicationRepository applicationRepository;
    private final AccountService accountService;

    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(AuthPrincipal principal) {
        return conversationRepository.findByParticipantUserIdOrderByUpdatedAtDesc(principal.userId()).stream()
                .filter(conversation -> canAccess(principal, conversation))
                .map(conversation -> toResponse(principal, conversation))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorStudentResponse> getTutorStudents(AuthPrincipal principal) {
        Account tutor = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        Map<Long, TutorStudentResponse> students = new LinkedHashMap<>();
        applicationRepository.findByTutorAccountIdAndStatusOrderByUpdatedAtDesc(tutor.getId(), ApplicationStatus.ACCEPTED)
                .forEach(application -> students.putIfAbsent(
                        application.getStudentAccount().getId(),
                        TutorStudentResponse.from(application, findConversationId(application.getStudentAccount(), application.getTutorAccount()))
                ));
        return List.copyOf(students.values());
    }

    @Transactional(readOnly = true)
    public List<StudentTutorResponse> getStudentTutors(AuthPrincipal principal) {
        Account student = accountService.requireActiveAccount(principal, AccountType.STUDENT);
        Map<Long, StudentTutorResponse> tutors = new LinkedHashMap<>();
        applicationRepository.findByStudentAccountIdAndStatusOrderByUpdatedAtDesc(student.getId(), ApplicationStatus.ACCEPTED)
                .forEach(application -> tutors.putIfAbsent(
                        application.getTutorAccount().getId(),
                        StudentTutorResponse.from(application, findConversationId(application.getStudentAccount(), application.getTutorAccount()))
                ));
        return List.copyOf(tutors.values());
    }

    @Transactional
    public ConversationResponse startConversation(AuthPrincipal principal, StartConversationRequest request) {
        Participant sender = resolveSender(principal);
        Participant target = resolveTarget(principal, request);
        if (sender.user().getId().equals(target.user().getId())) {
            throw new IllegalArgumentException("Cannot start a conversation with yourself");
        }

        Conversation conversation = findConversation(sender, target);
        if (conversation == null) {
            conversation = conversationRepository.save(buildConversation(sender, target));
        }

        String initialMessage = trimToNull(request.getInitialMessage());
        if (initialMessage != null) {
            saveMessage(conversation, sender, initialMessage);
        }
        return toResponse(principal, conversation);
    }

    @Transactional
    public MessagePageResponse getMessages(AuthPrincipal principal, Long conversationId, Long beforeMessageId, int limit) {
        Conversation conversation = requireParticipantConversation(principal, conversationId);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        List<Message> descending = beforeMessageId == null
                ? messageRepository.findByConversationIdOrderByIdDesc(conversationId, PageRequest.of(0, safeLimit + 1))
                : messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, beforeMessageId, PageRequest.of(0, safeLimit + 1));
        boolean hasMore = descending.size() > safeLimit;
        List<Message> page = descending.stream().limit(safeLimit).toList();

        List<Message> unreadMessages = page.stream()
                .filter(message -> !message.getSenderUser().getId().equals(principal.userId()))
                .filter(message -> message.getReadAt() == null)
                .toList();
        if (!unreadMessages.isEmpty()) {
            Instant readAt = Instant.now();
            unreadMessages.forEach(message -> message.setReadAt(readAt));
            messageRepository.saveAll(unreadMessages);
        }
        List<MessageResponse> items = page.stream()
                .sorted((left, right) -> Long.compare(left.getId(), right.getId()))
                .map(MessageResponse::from)
                .toList();
        Long nextCursor = items.isEmpty() ? null : items.get(0).id();
        return new MessagePageResponse(items, hasMore, nextCursor);
    }

    @Transactional
    public MessageResponse sendMessage(AuthPrincipal principal, Long conversationId, MessageRequest request) {
        Conversation conversation = requireParticipantConversation(principal, conversationId);
        Participant sender = participantForPrincipal(principal, conversation);
        String text = trimToNull(request.getText());
        if (text == null) throw new IllegalArgumentException("Message cannot be empty");
        return MessageResponse.from(saveMessage(conversation, sender, text));
    }

    @Transactional
    public Conversation ensureConversationForApplication(TutorApplication application) {
        Conversation byApplication = conversationRepository.findByApplicationId(application.getId()).orElse(null);
        if (byApplication != null) return byApplication;

        Participant student = participant(application.getStudentAccount());
        Participant tutor = participant(application.getTutorAccount());
        Conversation conversation = findConversation(student, tutor);
        if (conversation == null) {
            conversation = buildConversation(student, tutor);
        }
        if (conversation.getApplication() == null) {
            conversation.setApplication(application);
        }
        conversation.setStudentAccount(application.getStudentAccount());
        conversation.setTutorAccount(application.getTutorAccount());
        return conversationRepository.save(conversation);
    }

    private ConversationResponse toResponse(AuthPrincipal principal, Conversation conversation) {
        Message last = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversation.getId()).orElse(null);
        return ConversationResponse.from(
                conversation,
                principal,
                last == null ? null : last.getText(),
                last == null ? null : last.getCreatedAt(),
                messageRepository.countByConversation_IdAndSenderUser_IdNotAndReadAtIsNull(conversation.getId(), principal.userId())
        );
    }

    private Participant resolveSender(AuthPrincipal principal) {
        User user = userRepository.findById(principal.userId()).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (principal.admin()) return new Participant(user, null, ParticipantType.ADMIN);
        Account account = accountService.requireActiveAccount(principal);
        return participant(account);
    }

    private Participant resolveTarget(AuthPrincipal principal, StartConversationRequest request) {
        if (request.getTargetType() == null) throw new IllegalArgumentException("Target type is required");
        if (request.getTargetType() == ParticipantType.USER) {
            if (!principal.admin()) throw new IllegalArgumentException("Only administrator can contact a user directly");
            if (request.getTargetUserId() == null) throw new IllegalArgumentException("Target user is required");
            User user = userRepository.findById(request.getTargetUserId()).orElseThrow(() -> new IllegalArgumentException("User not found"));
            return new Participant(user, null, ParticipantType.USER);
        }
        if (request.getTargetType() != ParticipantType.STUDENT && request.getTargetType() != ParticipantType.TUTOR) {
            throw new IllegalArgumentException("Unsupported target type");
        }
        if (request.getTargetAccountId() == null) throw new IllegalArgumentException("Target account is required");
        Account account = accountRepository.findById(request.getTargetAccountId()).orElseThrow(() -> new IllegalArgumentException("Account not found"));
        AccountType expected = request.getTargetType() == ParticipantType.STUDENT ? AccountType.STUDENT : AccountType.TUTOR;
        if (account.getType() != expected) throw new IllegalArgumentException("Account type does not match");
        if (!principal.admin() && expected == AccountType.TUTOR && !account.isPublicProfile()) {
            throw new IllegalArgumentException("Tutor profile not found");
        }
        return participant(account);
    }

    private Conversation requireParticipantConversation(AuthPrincipal principal, Long id) {
        Conversation conversation = conversationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        if (!canAccess(principal, conversation)) throw new IllegalArgumentException("Conversation not found");
        return conversation;
    }

    private boolean canAccess(AuthPrincipal principal, Conversation conversation) {
        try {
            participantForPrincipal(principal, conversation);
            return true;
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    private Participant participantForPrincipal(AuthPrincipal principal, Conversation conversation) {
        if (matchesPrincipal(principal, conversation.getParticipantAUser(), conversation.getParticipantAAccount(), conversation.getParticipantAType())) {
            return new Participant(conversation.getParticipantAUser(), conversation.getParticipantAAccount(), conversation.getParticipantAType());
        }
        if (matchesPrincipal(principal, conversation.getParticipantBUser(), conversation.getParticipantBAccount(), conversation.getParticipantBType())) {
            return new Participant(conversation.getParticipantBUser(), conversation.getParticipantBAccount(), conversation.getParticipantBType());
        }
        throw new IllegalArgumentException("Conversation not found");
    }

    private boolean matchesPrincipal(AuthPrincipal principal, User user, Account account, ParticipantType type) {
        if (!user.getId().equals(principal.userId())) return false;
        if (type == ParticipantType.ADMIN) return principal.admin() && account == null;
        if (type == ParticipantType.USER) return account == null;
        return !principal.admin() && account != null && account.getId().equals(principal.activeAccountId());
    }

    private Conversation findConversation(Participant first, Participant second) {
        return conversationRepository.findByParticipantUserIdOrderByUpdatedAtDesc(first.user().getId()).stream()
                .filter(conversation -> samePair(conversation, first, second))
                .findFirst()
                .orElse(null);
    }

    private boolean samePair(Conversation conversation, Participant first, Participant second) {
        return (sameParticipant(conversation.getParticipantAUser(), conversation.getParticipantAAccount(), conversation.getParticipantAType(), first)
                && sameParticipant(conversation.getParticipantBUser(), conversation.getParticipantBAccount(), conversation.getParticipantBType(), second))
                || (sameParticipant(conversation.getParticipantAUser(), conversation.getParticipantAAccount(), conversation.getParticipantAType(), second)
                && sameParticipant(conversation.getParticipantBUser(), conversation.getParticipantBAccount(), conversation.getParticipantBType(), first));
    }

    private boolean sameParticipant(User user, Account account, ParticipantType type, Participant participant) {
        return user.getId().equals(participant.user().getId())
                && type == participant.type()
                && (account == null ? participant.account() == null : participant.account() != null && account.getId().equals(participant.account().getId()));
    }

    private Conversation buildConversation(Participant first, Participant second) {
        Account student = first.type() == ParticipantType.STUDENT ? first.account() : second.type() == ParticipantType.STUDENT ? second.account() : null;
        Account tutor = first.type() == ParticipantType.TUTOR ? first.account() : second.type() == ParticipantType.TUTOR ? second.account() : null;
        return Conversation.builder()
                .participantAUser(first.user()).participantAAccount(first.account()).participantAType(first.type())
                .participantBUser(second.user()).participantBAccount(second.account()).participantBType(second.type())
                .studentAccount(student).tutorAccount(tutor)
                .build();
    }

    private Message saveMessage(Conversation conversation, Participant sender, String text) {
        Message message = messageRepository.save(Message.builder()
                .conversation(conversation)
                .senderUser(sender.user())
                .senderAccount(sender.account())
                .senderType(sender.type())
                .text(text)
                .build());
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);
        return message;
    }

    private Participant participant(Account account) {
        return new Participant(account.getUser(), account, account.getType() == AccountType.STUDENT ? ParticipantType.STUDENT : ParticipantType.TUTOR);
    }

    private Long findConversationId(Account student, Account tutor) {
        Conversation conversation = findConversation(participant(student), participant(tutor));
        return conversation == null ? null : conversation.getId();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private record Participant(User user, Account account, ParticipantType type) {
    }
}
