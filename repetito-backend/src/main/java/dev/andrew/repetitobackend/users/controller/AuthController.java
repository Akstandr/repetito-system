package dev.andrew.repetitobackend.users.controller;

import dev.andrew.repetitobackend.accounts.dto.SelectAccountRequest;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.users.dto.AuthResponse;
import dev.andrew.repetitobackend.users.dto.LoginRequest;
import dev.andrew.repetitobackend.users.dto.RegisterRequest;
import dev.andrew.repetitobackend.users.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication authentication) {
        return ResponseEntity.ok(accountService.buildCurrentResponse((AuthPrincipal) authentication.getPrincipal()));
    }

    @PostMapping("/select-account")
    public ResponseEntity<AuthResponse> selectAccount(
            Authentication authentication,
            @Valid @RequestBody SelectAccountRequest request
    ) {
        return ResponseEntity.ok(accountService.selectAccount((AuthPrincipal) authentication.getPrincipal(), request.getType()));
    }
}
