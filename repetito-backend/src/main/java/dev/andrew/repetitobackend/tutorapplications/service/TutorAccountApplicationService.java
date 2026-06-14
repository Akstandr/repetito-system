package dev.andrew.repetitobackend.tutorapplications.service;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.admin.dto.AdminDtos;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.tutorapplications.dto.TutorAccountApplicationRequest;
import dev.andrew.repetitobackend.tutorapplications.dto.TutorAccountApplicationResponse;
import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplication;
import dev.andrew.repetitobackend.tutorapplications.model.TutorAccountApplicationStatus;
import dev.andrew.repetitobackend.tutorapplications.repository.TutorAccountApplicationRepository;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TutorAccountApplicationService {
    private final TutorAccountApplicationRepository repository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    @Transactional
    public TutorAccountApplicationResponse create(AuthPrincipal principal, TutorAccountApplicationRequest request) {
        User user = requireUser(principal.userId());
        if (user.isAdmin()) throw new IllegalArgumentException("Administrator cannot apply for a tutor account");
        if (accountRepository.existsByUserIdAndType(user.getId(), AccountType.TUTOR)) {
            throw new IllegalArgumentException("Tutor account already exists");
        }
        if (repository.existsByUserIdAndStatus(user.getId(), TutorAccountApplicationStatus.PENDING)) {
            throw new IllegalArgumentException("Tutor account application is already pending");
        }
        var subjects = new LinkedHashSet<>(request.getSubjects().stream().map(String::trim).filter(s -> !s.isBlank()).toList());
        if (subjects.isEmpty()) throw new IllegalArgumentException("Select at least one subject");
        return TutorAccountApplicationResponse.from(repository.save(TutorAccountApplication.builder()
                .user(user).fullName(request.getFullName().trim()).age(request.getAge()).subjects(subjects)
                .pricePerLesson(request.getPricePerLesson()).status(TutorAccountApplicationStatus.PENDING).build()));
    }

    @Transactional(readOnly = true)
    public List<TutorAccountApplicationResponse> my(AuthPrincipal principal) {
        return repository.findByUserIdOrderByCreatedAtDesc(principal.userId()).stream()
                .map(TutorAccountApplicationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<TutorAccountApplicationResponse> adminList(
            TutorAccountApplicationStatus status, int page, int limit
    ) {
        int safePage = Math.max(page, 1);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        PageRequest pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<TutorAccountApplication> result = status == null ? repository.findAll(pageable) : repository.findByStatus(status, pageable);
        return new AdminDtos.PageResponse<>(result.getContent().stream().map(TutorAccountApplicationResponse::from).toList(),
                safePage, safeLimit, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public TutorAccountApplicationResponse approve(AuthPrincipal admin, Long id) {
        TutorAccountApplication item = requirePending(id);
        if (!accountRepository.existsByUserIdAndType(item.getUser().getId(), AccountType.TUTOR)) {
            accountService.createAccount(item.getUser().getId(), AccountType.TUTOR);
        }
        item.setStatus(TutorAccountApplicationStatus.APPROVED);
        item.setRejectionReason(null);
        item.setReviewedByAdmin(requireUser(admin.userId()));
        item.setReviewedAt(Instant.now());
        return TutorAccountApplicationResponse.from(repository.save(item));
    }

    @Transactional
    public TutorAccountApplicationResponse reject(AuthPrincipal admin, Long id, String reason) {
        TutorAccountApplication item = requirePending(id);
        String normalized = reason == null ? "" : reason.trim();
        if (normalized.isEmpty()) throw new IllegalArgumentException("Rejection reason is required");
        item.setStatus(TutorAccountApplicationStatus.REJECTED);
        item.setRejectionReason(normalized);
        item.setReviewedByAdmin(requireUser(admin.userId()));
        item.setReviewedAt(Instant.now());
        return TutorAccountApplicationResponse.from(repository.save(item));
    }

    private TutorAccountApplication requirePending(Long id) {
        TutorAccountApplication item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutor account application not found"));
        if (item.getStatus() != TutorAccountApplicationStatus.PENDING) {
            throw new IllegalArgumentException("Tutor account application has already been reviewed");
        }
        return item;
    }

    private User requireUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
