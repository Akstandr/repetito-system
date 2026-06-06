package dev.andrew.repetitobackend.tutorcards.controller;

import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardPageResponse;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardRequest;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardResponse;
import dev.andrew.repetitobackend.tutorcards.service.TutorCardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tutor-cards")
public class TutorCardController {

    private final TutorCardService tutorCardService;

    @GetMapping
    public ResponseEntity<TutorCardPageResponse> search(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Integer grade,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(tutorCardService.search(subject, grade, page, limit));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TutorCardResponse>> myCards(Authentication authentication) {
        return ResponseEntity.ok(tutorCardService.getMyCards((AuthPrincipal) authentication.getPrincipal()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TutorCardResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tutorCardService.getVisibleCard(id));
    }

    @PostMapping
    public ResponseEntity<TutorCardResponse> create(
            Authentication authentication,
            @Valid @RequestBody TutorCardRequest request
    ) {
        return ResponseEntity.ok(tutorCardService.create((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TutorCardResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TutorCardRequest request
    ) {
        return ResponseEntity.ok(tutorCardService.update((AuthPrincipal) authentication.getPrincipal(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        tutorCardService.delete((AuthPrincipal) authentication.getPrincipal(), id);
        return ResponseEntity.noContent().build();
    }
}
