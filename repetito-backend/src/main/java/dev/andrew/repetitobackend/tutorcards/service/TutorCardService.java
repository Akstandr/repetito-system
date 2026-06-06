package dev.andrew.repetitobackend.tutorcards.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.model.TutorProfile;
import dev.andrew.repetitobackend.accounts.repository.TutorProfileRepository;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.lessons.repository.LessonRepository;
import dev.andrew.repetitobackend.subjects.repository.SubjectRepository;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardPageResponse;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardRequest;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardResponse;
import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import dev.andrew.repetitobackend.tutorcards.model.TutorCardFormat;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class TutorCardService {

    private final TutorCardRepository tutorCardRepository;
    private final TutorApplicationRepository tutorApplicationRepository;
    private final LessonRepository lessonRepository;
    private final AccountService accountService;
    private final SubjectRepository subjectRepository;
    private final TutorProfileRepository tutorProfileRepository;

    @Transactional(readOnly = true)
    public TutorCardPageResponse search(String subject, Integer grade, int page, int limit) {
        int normalizedPage = Math.max(page, 1);
        int normalizedLimit = Math.min(Math.max(limit, 1), 50);
        var pageResult = tutorCardRepository.searchActiveCards(
                normalizeSubject(subject),
                grade,
                PageRequest.of(normalizedPage - 1, normalizedLimit, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return new TutorCardPageResponse(
                pageResult.getContent().stream().map(this::toResponse).toList(),
                normalizedPage,
                normalizedLimit,
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public List<TutorCardResponse> getMyCards(AuthPrincipal principal) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        return tutorCardRepository.findByTutorAccountIdOrderByCreatedAtDesc(tutorAccount.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TutorCardResponse create(AuthPrincipal principal, TutorCardRequest request) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        String subject = normalizeSubject(request.getSubject());
        ensureSubjectAllowed(subject, null);
        TutorCard card = tutorCardRepository.save(TutorCard.builder()
                .tutorAccount(tutorAccount)
                .title(request.getTitle().trim())
                .description(blankToNull(request.getDescription()))
                .subject(subject)
                .pricePerLesson(request.getPricePerLesson())
                .supportedGrades(normalizeSupportedGrades(request.getSupportedGrades(), defaultSupportedGrades()))
                .format(request.getFormat() == null ? TutorCardFormat.ONLINE : request.getFormat())
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build());
        return toResponse(card);
    }

    @Transactional
    public TutorCardResponse update(AuthPrincipal principal, Long id, TutorCardRequest request) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        TutorCard card = tutorCardRepository.findByIdAndTutorAccountId(id, tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found"));
        String subject = normalizeSubject(request.getSubject());
        ensureSubjectAllowed(subject, card);

        card.setTitle(request.getTitle().trim());
        card.setDescription(blankToNull(request.getDescription()));
        card.setSubject(subject);
        card.setPricePerLesson(request.getPricePerLesson());
        card.setSupportedGrades(normalizeSupportedGrades(request.getSupportedGrades(), card.getSupportedGrades()));
        if (request.getFormat() != null) {
            card.setFormat(request.getFormat());
        }
        if (request.getIsActive() != null) {
            card.setActive(request.getIsActive());
        }

        return toResponse(tutorCardRepository.save(card));
    }

    @Transactional
    public void delete(AuthPrincipal principal, Long id) {
        Account tutorAccount = accountService.requireActiveAccount(principal, AccountType.TUTOR);
        TutorCard card = tutorCardRepository.findByIdAndTutorAccountId(id, tutorAccount.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found"));

        if (tutorApplicationRepository.existsByTutorCardId(card.getId())) {
            throw new IllegalArgumentException("Cannot delete card with applications");
        }
        if (lessonRepository.existsByApplication_TutorCard_Id(card.getId())) {
            throw new IllegalArgumentException("Cannot delete card with lessons");
        }

        tutorCardRepository.delete(card);
    }

    @Transactional(readOnly = true)
    public TutorCardResponse getVisibleCard(Long id) {
        return tutorCardRepository.findById(id)
                .filter(TutorCard::isActive)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found"));
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSubject(String value) {
        String normalized = blankToNull(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private void ensureSubjectAllowed(String subject, TutorCard existingCard) {
        if (subject == null || !subjectRepository.existsById(subject)) {
            String existingSubject = existingCard == null ? null : normalizeSubject(existingCard.getSubject());
            if (existingSubject == null || !existingSubject.equals(subject)) {
                throw new IllegalArgumentException("Unknown subject");
            }
        }
    }

    private Set<Integer> defaultSupportedGrades() {
        Set<Integer> grades = new LinkedHashSet<>();
        IntStream.rangeClosed(1, 11).forEach(grades::add);
        return grades;
    }

    private Set<Integer> normalizeSupportedGrades(Set<Integer> requestedGrades, Set<Integer> fallbackGrades) {
        if (requestedGrades == null) {
            return new LinkedHashSet<>(fallbackGrades);
        }

        Set<Integer> grades = new LinkedHashSet<>();
        requestedGrades.stream()
                .filter(grade -> grade != null && grade >= 1 && grade <= 12)
                .sorted()
                .forEach(grades::add);

        if (grades.isEmpty()) {
            throw new IllegalArgumentException("Supported grades must not be empty");
        }

        return grades;
    }

    private TutorCardResponse toResponse(TutorCard card) {
        TutorProfile profile = tutorProfileRepository.findByAccountId(card.getTutorAccount().getId()).orElse(null);
        return TutorCardResponse.from(card, profile);
    }
}
