package dev.andrew.repetitobackend.admin.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.admin.dto.AdminDtos;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.model.TutorApplication;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.lessons.repository.LessonRepository;
import dev.andrew.repetitobackend.tutorcards.model.TutorCard;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TutorApplicationRepository applicationRepository;
    private final LessonRepository lessonRepository;
    private final TutorCardRepository tutorCardRepository;

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.UserItem> getUsers(String query, int page, int limit) {
        Page<User> result = userRepository.findAll(userSpecification(query), pageRequest(page, limit, "createdAt"));
        List<AdminDtos.UserItem> items = result.getContent().stream().map(user -> new AdminDtos.UserItem(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isAdmin(),
                accountRepository.findByUserIdOrderByCreatedAtAsc(user.getId()).stream()
                        .map(account -> new AdminDtos.AccountPreview(account.getId(), account.getType()))
                        .toList(),
                user.getCreatedAt()
        )).toList();
        return toPage(items, result, page, limit);
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.AccountItem> getAccounts(AccountType type, int page, int limit) {
        Specification<Account> specification = type == null
                ? Specification.unrestricted()
                : (root, query, builder) -> builder.equal(root.get("type"), type);
        Page<Account> result = accountRepository.findAll(specification, pageRequest(page, limit, "createdAt"));
        List<AdminDtos.AccountItem> items = result.getContent().stream().map(this::toAccountItem).toList();
        return toPage(items, result, page, limit);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.RelationItem> getTutorStudents(Long tutorAccountId) {
        requireAccount(tutorAccountId, AccountType.TUTOR);
        return uniqueRelations(
                applicationRepository.findByTutorAccountIdAndStatusOrderByUpdatedAtDesc(tutorAccountId, ApplicationStatus.ACCEPTED),
                true
        );
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.RelationItem> getStudentTutors(Long studentAccountId) {
        requireAccount(studentAccountId, AccountType.STUDENT);
        return uniqueRelations(
                applicationRepository.findByStudentAccountIdAndStatusOrderByUpdatedAtDesc(studentAccountId, ApplicationStatus.ACCEPTED),
                false
        );
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.TutorCardItem> getTutorCards(
            String query,
            String subject,
            Boolean active,
            int page,
            int limit
    ) {
        Page<TutorCard> result = tutorCardRepository.findAll(
                tutorCardSpecification(query, subject, active),
                pageRequest(page, limit, "createdAt")
        );
        return toPage(result.getContent().stream().map(this::toTutorCardItem).toList(), result, page, limit);
    }

    @Transactional(readOnly = true)
    public AdminDtos.TutorCardItem getTutorCard(Long id) {
        return toTutorCardItem(tutorCardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found")));
    }

    @Transactional
    public AdminDtos.TutorCardItem deactivateTutorCard(Long id) {
        TutorCard card = tutorCardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutor card not found"));
        card.setActive(false);
        return toTutorCardItem(tutorCardRepository.save(card));
    }

    private AdminDtos.AccountItem toAccountItem(Account account) {
        boolean tutor = account.getType() == AccountType.TUTOR;
        long relations = tutor
                ? applicationRepository.countDistinctStudents(account.getId(), ApplicationStatus.ACCEPTED)
                : applicationRepository.countDistinctTutors(account.getId(), ApplicationStatus.ACCEPTED);
        long applications = tutor
                ? applicationRepository.countByTutorAccountId(account.getId())
                : applicationRepository.countByStudentAccountId(account.getId());
        long lessons = tutor
                ? lessonRepository.countByTutorAccountId(account.getId())
                : lessonRepository.countByStudentAccountId(account.getId());
        User user = account.getUser();
        return new AdminDtos.AccountItem(
                account.getId(), account.getType(), user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                relations, applications, lessons, account.getCreatedAt()
        );
    }

    private List<AdminDtos.RelationItem> uniqueRelations(List<TutorApplication> applications, boolean students) {
        Map<Long, AdminDtos.RelationItem> relations = new LinkedHashMap<>();
        for (TutorApplication application : applications) {
            Account related = students ? application.getStudentAccount() : application.getTutorAccount();
            relations.putIfAbsent(related.getId(), new AdminDtos.RelationItem(
                    related.getId(),
                    related.getUser().getFirstName(),
                    related.getUser().getLastName(),
                    related.getUser().getEmail(),
                    application.getTutorCard().getSubject(),
                    application.getId(),
                    application.getUpdatedAt()
            ));
        }
        return List.copyOf(relations.values());
    }

    private AdminDtos.TutorCardItem toTutorCardItem(TutorCard card) {
        User owner = card.getTutorAccount().getUser();
        return new AdminDtos.TutorCardItem(
                card.getId(),
                card.getTutorAccount().getId(),
                owner.getFirstName(),
                owner.getLastName(),
                owner.getEmail(),
                card.getTitle(),
                card.getDescription(),
                card.getSubject(),
                card.getPricePerLesson(),
                card.getSupportedGrades().stream().sorted().toList(),
                card.getFormat(),
                card.isActive(),
                card.getCreatedAt(),
                card.getUpdatedAt()
        );
    }

    private Specification<User> userSpecification(String queryText) {
        String query = normalize(queryText);
        if (query == null) {
            return Specification.unrestricted();
        }
        return (root, criteriaQuery, builder) -> {
            String pattern = "%" + query + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("email")), pattern),
                    builder.like(builder.lower(root.get("firstName")), pattern),
                    builder.like(builder.lower(root.get("lastName")), pattern),
                    builder.like(builder.lower(builder.concat(builder.concat(root.get("firstName"), " "), root.get("lastName"))), pattern),
                    builder.like(builder.lower(builder.concat(builder.concat(root.get("lastName"), " "), root.get("firstName"))), pattern)
            );
        };
    }

    private Specification<TutorCard> tutorCardSpecification(String queryText, String subjectText, Boolean active) {
        String query = normalize(queryText);
        String subject = normalize(subjectText);
        return (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (query != null) {
                String pattern = "%" + query + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("subject")), pattern),
                        builder.like(builder.lower(root.get("tutorAccount").get("user").get("firstName")), pattern),
                        builder.like(builder.lower(root.get("tutorAccount").get("user").get("lastName")), pattern)
                ));
            }
            if (subject != null) {
                predicates.add(builder.equal(builder.lower(root.get("subject")), subject));
            }
            if (active != null) {
                predicates.add(builder.equal(root.get("isActive"), active));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Account requireAccount(Long id, AccountType type) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getType() != type) {
            throw new IllegalArgumentException("Account type does not match");
        }
        return account;
    }

    private PageRequest pageRequest(int page, int limit, String sort) {
        int safePage = Math.max(page, 1) - 1;
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return PageRequest.of(safePage, safeLimit, Sort.by(Sort.Direction.DESC, sort));
    }

    private <T> AdminDtos.PageResponse<T> toPage(List<T> items, Page<?> result, int page, int limit) {
        return new AdminDtos.PageResponse<>(items, Math.max(page, 1), Math.min(Math.max(limit, 1), 100), result.getTotalElements(), result.getTotalPages());
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
