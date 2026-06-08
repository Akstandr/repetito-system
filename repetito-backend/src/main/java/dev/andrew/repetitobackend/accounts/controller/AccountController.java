package dev.andrew.repetitobackend.accounts.controller;

import dev.andrew.repetitobackend.accounts.dto.AccountResponse;
import dev.andrew.repetitobackend.accounts.dto.CreateAccountRequest;
import dev.andrew.repetitobackend.accounts.dto.PublicProfileResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicProfileSearchResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicProfileSettingsRequest;
import dev.andrew.repetitobackend.accounts.dto.StudentProfileRequest;
import dev.andrew.repetitobackend.accounts.dto.TutorProfileRequest;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.users.dto.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/public/{accountId}")
    public ResponseEntity<PublicProfileResponse> publicProfile(@PathVariable Long accountId) {
        return ResponseEntity.ok(accountService.getPublicProfile(accountId));
    }

    @GetMapping("/public")
    public ResponseEntity<List<PublicProfileSearchResponse>> searchPublicProfiles(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AccountType type,
            Authentication authentication
    ) {
        return ResponseEntity.ok(accountService.searchPublicProfiles(query, type, currentUserId(authentication)));
    }

    @PostMapping
    public ResponseEntity<AuthResponse> createAccount(
            Authentication authentication,
            @Valid @RequestBody CreateAccountRequest request
    ) {
        return ResponseEntity.ok(accountService.createAccount((AuthPrincipal) authentication.getPrincipal(), request.getType()));
    }

    @PutMapping("/me/student-profile")
    public ResponseEntity<AuthResponse> updateStudentProfile(
            Authentication authentication,
            @Valid @RequestBody StudentProfileRequest request
    ) {
        return ResponseEntity.ok(accountService.updateStudentProfile((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @PutMapping("/me/tutor-profile")
    public ResponseEntity<AuthResponse> updateTutorProfile(
            Authentication authentication,
            @Valid @RequestBody TutorProfileRequest request
    ) {
        return ResponseEntity.ok(accountService.updateTutorProfile((AuthPrincipal) authentication.getPrincipal(), request));
    }

    @PatchMapping("/me/public-profile")
    public ResponseEntity<AuthResponse> updatePublicProfile(
            Authentication authentication,
            @Valid @RequestBody PublicProfileSettingsRequest request
    ) {
        return ResponseEntity.ok(accountService.updatePublicProfile(
                (AuthPrincipal) authentication.getPrincipal(),
                request.getPublicProfile()
        ));
    }

    private Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return null;
        }
        return principal.userId();
    }
}
