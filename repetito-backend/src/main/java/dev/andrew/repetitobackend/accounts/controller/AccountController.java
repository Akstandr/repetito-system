package dev.andrew.repetitobackend.accounts.controller;

import dev.andrew.repetitobackend.accounts.dto.AccountResponse;
import dev.andrew.repetitobackend.accounts.dto.CreateAccountRequest;
import dev.andrew.repetitobackend.accounts.dto.StudentProfileRequest;
import dev.andrew.repetitobackend.accounts.dto.TutorProfileRequest;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.users.dto.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

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
}
