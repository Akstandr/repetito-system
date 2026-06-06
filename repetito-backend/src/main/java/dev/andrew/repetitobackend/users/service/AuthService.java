package dev.andrew.repetitobackend.users.service;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.accounts.service.AccountService;
import dev.andrew.repetitobackend.common.security.JwtService;
import dev.andrew.repetitobackend.users.dto.AuthResponse;
import dev.andrew.repetitobackend.users.dto.LoginRequest;
import dev.andrew.repetitobackend.users.dto.RegisterRequest;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AccountService accountService;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User already exists");
        }

        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .build());

        return accountService.buildResponse(user, null, jwtService.generateSessionToken(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!matches) {
            throw new BadCredentialsException("Invalid credentials");
        }

        var accounts = accountRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        if (accounts.size() == 1) {
            Account account = accounts.get(0);
            return accountService.buildResponse(user, account.getId(), jwtService.generateAccountToken(user, account));
        }

        return accountService.buildResponse(user, null, jwtService.generateSessionToken(user));
    }
}
