package dev.andrew.repetitobackend.reviews.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.reviews.dto.ReviewReplyRequest;
import dev.andrew.repetitobackend.reviews.dto.ReviewRequest;
import dev.andrew.repetitobackend.reviews.dto.ReviewResponse;
import dev.andrew.repetitobackend.reviews.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/my")
    public ResponseEntity<List<ReviewResponse>> my(Authentication authentication) {
        return ResponseEntity.ok(reviewService.getMyReviews((AuthPrincipal) authentication.getPrincipal()));
    }

    @GetMapping("/about-me")
    public ResponseEntity<List<ReviewResponse>> aboutMe(Authentication authentication) {
        return ResponseEntity.ok(reviewService.getReviewsAboutMe((AuthPrincipal) authentication.getPrincipal()));
    }

    @GetMapping("/tutor/{tutorAccountId}")
    public ResponseEntity<List<ReviewResponse>> byTutor(@PathVariable Long tutorAccountId) {
        return ResponseEntity.ok(reviewService.getReviewsByTutor(tutorAccountId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> create(
            Authentication authentication,
            @Valid @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.ok(reviewService.create((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @PatchMapping("/{id}/reply")
    public ResponseEntity<ReviewResponse> reply(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewReplyRequest request
    ) {
        return ResponseEntity.ok(reviewService.reply((AuthPrincipal) authentication.getPrincipal(), id, request));
    }
}
