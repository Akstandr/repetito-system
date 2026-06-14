package dev.andrew.repetitobackend.applications.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.applications.dto.ApplicationRequest;
import dev.andrew.repetitobackend.applications.dto.ApplicationResponse;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.conversations.model.Conversation;
import dev.andrew.repetitobackend.conversations.repository.ConversationRepository;
import dev.andrew.repetitobackend.conversations.service.ConversationService;
import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardModerationStatus;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final TutorCardRepository tutorCardRepository;
    private final TutorApplicationRepository tutorApplicationRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final AccountService accountService;

    @Transactional
    public ApplicationResponse create(AuthPrincipal principal, ApplicationRequest request) {
        Account studentAccount = accountService.requireActiveAccount(principal, AccountType.STUDENT);
        TutorCard tutorCard = tutorCardRepository.findById(request.getTutorCardId())
                .filter(TutorCard::isActive)
                .filter(card -> card.getModerationStatus() == TutorCardModerationStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found"));

        Account tutorAccount = tutorCard.getTutorAccount();
        if (studentAccount.getUser().getId().equals(tutorAccount.getUser().getId())) {
            throw new IllegalArgumentException("Cannot apply to own card");
        }

        TutorApplication application = tutorApplicationRepository.save(TutorApplication.builder()
                .tutorCard(tutorCard)
                .studentAccount(studentAccount)
                .tutorAccount(tutorAccount)
                .status(ApplicationStatus.PENDING)
                .message(trimToNull(request.getMessage()))
                .build());

        return ApplicationResponse.from(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMy(AuthPrincipal principal) {
        Account studentAccount = accountService.requireActiveAccount(principal, AccountType.STUDENT);
        return tutorApplicationRepository.findByStudentAccountIdOrderByCreatedAtDesc(studentAccount.getId()).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getIncoming(AuthPrincipal principal) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        return tutorApplicationRepository.findByTutorAccountIdOrderByCreatedAtDesc(tutorAccount.getId()).stream()
                .map(ApplicationResponse::from)
                .toList();
    }

    @Transactional
    public ApplicationResponse accept(AuthPrincipal principal, Long id) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        TutorApplication application = tutorApplicationRepository.findByIdAndTutorAccountId(id, tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (application.getStatus() == ApplicationStatus.ACCEPTED) {
            application.setConversation(conversationService.ensureConversationForApplication(application));
            return ApplicationResponse.from(application);
        }
        if (application.getStatus() != ApplicationStatus.PENDING && application.getStatus() != ApplicationStatus.SENT) {
            throw new IllegalArgumentException("Application already processed");
        }
        application.setStatus(ApplicationStatus.ACCEPTED);
        TutorApplication saved = tutorApplicationRepository.save(application);
        saved.setConversation(conversationService.ensureConversationForApplication(saved));
        return ApplicationResponse.from(saved);
    }

    @Transactional
    public ApplicationResponse reject(AuthPrincipal principal, Long id) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        TutorApplication application = tutorApplicationRepository.findByIdAndTutorAccountId(id, tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        if (application.getStatus() != ApplicationStatus.PENDING && application.getStatus() != ApplicationStatus.SENT) {
            throw new IllegalArgumentException("Application already processed");
        }
        application.setStatus(ApplicationStatus.REJECTED);
        return ApplicationResponse.from(tutorApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public TutorApplication requireAcceptedApplicationForConversation(AuthPrincipal principal, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        ensureParticipant(conversation, principal);
        if (conversation.getApplication() == null || conversation.getApplication().getStatus() != ApplicationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Application is not accepted");
        }
        return conversation.getApplication();
    }

    @Transactional(readOnly = true)
    public TutorApplication requireAcceptedApplicationById(AuthPrincipal principal, Long applicationId) {
        Account account = accountService.requireActiveAccount(principal);
        TutorApplication application = tutorApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!application.getStudentAccount().getId().equals(account.getId())
                && !application.getTutorAccount().getId().equals(account.getId())) {
            throw new IllegalArgumentException("Application not found");
        }
        if (application.getStatus() != ApplicationStatus.ACCEPTED) {
            throw new IllegalArgumentException("Application is not accepted");
        }
        application.setConversation(conversationService.ensureConversationForApplication(application));
        return application;
    }

    @Transactional
    public TutorApplication requireTutorOwnedApplication(AuthPrincipal principal, Long applicationId) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        return tutorApplicationRepository.findByIdAndTutorAccountId(applicationId, tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
    }

    @Transactional
    public TutorApplication requireStudentOwnedApplication(AuthPrincipal principal, Long applicationId) {
        Account studentAccount = accountService.requireActiveAccount(principal, AccountType.STUDENT);
        return tutorApplicationRepository.findByIdAndStudentAccountId(applicationId, studentAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
    }

    private void ensureParticipant(Conversation conversation, AuthPrincipal principal) {
        Account account = accountService.requireActiveAccount(principal);
        if ((conversation.getStudentAccount() == null || !conversation.getStudentAccount().getId().equals(account.getId()))
                && (conversation.getTutorAccount() == null || !conversation.getTutorAccount().getId().equals(account.getId()))) {
            throw new IllegalArgumentException("Conversation not found");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
