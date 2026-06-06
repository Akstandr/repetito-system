package dev.andrew.repetitobackend.reviews.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.applications.model.ApplicationStatus;
import dev.andrew.repetitobackend.applications.repository.TutorApplicationRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.reviews.dto.ReviewReplyRequest;
import dev.andrew.repetitobackend.reviews.dto.ReviewRequest;
import dev.andrew.repetitobackend.reviews.dto.ReviewResponse;
import dev.andrew.repetitobackend.reviews.model.TutorReview;
import dev.andrew.repetitobackend.reviews.repository.TutorReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final TutorReviewRepository reviewRepository;
    private final AccountRepository accountRepository;
    private final TutorApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(AuthPrincipal principal) {
        return reviewRepository.findByStudentAccountUserIdOrderByCreatedAtDesc(principal.userId()).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsAboutMe(AuthPrincipal principal) {
        return reviewRepository.findByTutorAccountUserIdOrderByCreatedAtDesc(principal.userId()).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByTutor(Long tutorAccountId) {
        Account tutorAccount = accountRepository.findById(tutorAccountId)
                .filter(account -> account.getType() == AccountType.TUTOR)
                .orElseThrow(() -> new IllegalArgumentException("Tutor account not found"));

        return reviewRepository.findByTutorAccountIdOrderByCreatedAtDesc(tutorAccount.getId()).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public ReviewResponse create(AuthPrincipal principal, ReviewRequest request) {
        Account studentAccount = accountRepository.findByUserIdAndType(principal.userId(), AccountType.STUDENT)
                .orElseThrow(() -> new IllegalArgumentException("Student account not found"));
        Account tutorAccount = accountRepository.findById(request.getTutorAccountId())
                .filter(account -> account.getType() == AccountType.TUTOR)
                .orElseThrow(() -> new IllegalArgumentException("Tutor account not found"));

        if (!applicationRepository.existsByStudentAccountIdAndTutorAccountIdAndStatus(
                studentAccount.getId(),
                tutorAccount.getId(),
                ApplicationStatus.ACCEPTED
        )) {
            throw new IllegalArgumentException("You can review only accepted tutors");
        }

        reviewRepository.findByStudentAccountIdAndTutorAccountId(studentAccount.getId(), tutorAccount.getId())
                .ifPresent(review -> {
                    throw new IllegalArgumentException("Review already exists");
                });

        TutorReview review = reviewRepository.save(TutorReview.builder()
                .studentAccount(studentAccount)
                .tutorAccount(tutorAccount)
                .rating(request.getRating())
                .text(request.getText().trim())
                .build());
        return ReviewResponse.from(review);
    }

    @Transactional
    public ReviewResponse reply(AuthPrincipal principal, Long reviewId, ReviewReplyRequest request) {
        TutorReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        if (!review.getTutorAccount().getUser().getId().equals(principal.userId())) {
            throw new IllegalArgumentException("Review not found");
        }

        review.setTutorReply(request.getText().trim());
        review.setTutorRepliedAt(Instant.now());
        return ReviewResponse.from(reviewRepository.save(review));
    }
}
