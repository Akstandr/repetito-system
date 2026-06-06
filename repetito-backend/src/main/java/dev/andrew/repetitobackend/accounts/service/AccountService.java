package dev.andrew.repetitobackend.accounts.service;

import dev.andrew.repetitobackend.accounts.dto.AccountResponse;
import dev.andrew.repetitobackend.accounts.dto.StudentProfileRequest;
import dev.andrew.repetitobackend.accounts.dto.TutorProfileRequest;
import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.accounts.model.StudentProfile;
import dev.andrew.repetitobackend.accounts.model.TutorProfile;
import dev.andrew.repetitobackend.accounts.repository.AccountRepository;
import dev.andrew.repetitobackend.accounts.repository.StudentProfileRepository;
import dev.andrew.repetitobackend.accounts.repository.TutorProfileRepository;
import dev.andrew.repetitobackend.common.security.AuthPrincipal;
import dev.andrew.repetitobackend.common.security.JwtService;
import dev.andrew.repetitobackend.users.model.User;
import dev.andrew.repetitobackend.users.repository.UserRepository;
import dev.andrew.repetitobackend.users.dto.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public List<AccountResponse> getAccounts(Long userId, Long activeAccountId) {
        return accountRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(account -> toResponse(account, account.getId().equals(activeAccountId)))
                .toList();
    }

    public AccountResponse getActiveAccount(Long userId, Long activeAccountId) {
        if (activeAccountId == null) {
            return null;
        }

        return accountRepository.findByIdAndUserId(activeAccountId, userId)
                .map(account -> toResponse(account, true))
                .orElse(null);
    }

    public Account createAccount(Long userId, AccountType type) {
        if (accountRepository.existsByUserIdAndType(userId, type)) {
            throw new IllegalArgumentException("Account already exists");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account account = accountRepository.save(Account.builder()
                .user(user)
                .type(type)
                .build());

        if (type == AccountType.STUDENT) {
            studentProfileRepository.save(StudentProfile.builder()
                    .account(account)
                    .build());
        } else if (type == AccountType.TUTOR) {
            tutorProfileRepository.save(TutorProfile.builder()
                    .account(account)
                    .build());
        }

        return account;
    }

    public AuthResponse buildResponse(User user, Long activeAccountId, String token) {
        List<AccountResponse> accounts = getAccounts(user.getId(), activeAccountId);
        AccountResponse activeAccount = accounts.stream().filter(AccountResponse::active).findFirst().orElse(null);
        boolean requiresAccountSelection = activeAccount == null && accounts.size() > 1;

        return AuthResponse.builder()
                .token(token)
                .user(dev.andrew.repetitobackend.accounts.dto.UserResponse.from(user))
                .accounts(accounts)
                .activeAccount(activeAccount)
                .requiresAccountSelection(requiresAccountSelection)
                .build();
    }

    public AuthResponse buildCurrentResponse(AuthPrincipal principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return buildResponse(user, principal.activeAccountId(), currentToken(user, principal));
    }

    public AuthResponse createAccount(AuthPrincipal principal, AccountType type) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account createdAccount = createAccount(user.getId(), type);
        Long activeAccountId = principal.activeAccountId();
        String token = currentToken(user, principal);

        if (activeAccountId == null) {
            token = jwtService.generateAccountToken(user, createdAccount);
            activeAccountId = createdAccount.getId();
        }

        return buildResponse(user, activeAccountId, token);
    }

    public AuthResponse selectAccount(AuthPrincipal principal, AccountType type) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account account = accountRepository.findByUserIdAndType(user.getId(), type)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        return buildResponse(user, account.getId(), jwtService.generateAccountToken(user, account));
    }

    public AuthResponse updateStudentProfile(AuthPrincipal principal, StudentProfileRequest request) {
        Account account = requireActiveAccount(principal, AccountType.STUDENT);
        StudentProfile profile = studentProfileRepository.findByAccountId(account.getId())
                .orElseGet(() -> studentProfileRepository.save(StudentProfile.builder().account(account).build()));

        profile.setDescription(trimToNull(request.getDescription()));
        profile.setSubjects(trimToNull(request.getSubjects()));
        profile.setGradeLevel(trimToNull(request.getGradeLevel()));
        profile.setFormat(trimToNull(request.getFormat()));
        studentProfileRepository.save(profile);

        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return buildResponse(user, principal.activeAccountId(), currentToken(user, principal));
    }

    public AuthResponse updateTutorProfile(AuthPrincipal principal, TutorProfileRequest request) {
        Account account = requireActiveAccount(principal, AccountType.TUTOR);
        TutorProfile profile = tutorProfileRepository.findByAccountId(account.getId())
                .orElseGet(() -> tutorProfileRepository.save(TutorProfile.builder().account(account).build()));

        profile.setDescription(trimToNull(request.getDescription()));
        profile.setSubjects(trimToNull(request.getSubjects()));
        profile.setExperience(trimToNull(request.getExperience()));
        profile.setPrice(request.getPrice());
        profile.setEducation(trimToNull(request.getEducation()));
        profile.setAchievements(trimToNull(request.getAchievements()));
        tutorProfileRepository.save(profile);

        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return buildResponse(user, principal.activeAccountId(), currentToken(user, principal));
    }

    private String currentToken(User user, AuthPrincipal principal) {
        if (principal.hasActiveAccount()) {
            Account account = requireActiveAccount(principal);
            return jwtService.generateAccountToken(user, account);
        }

        return jwtService.generateSessionToken(user);
    }

    public User requireUser(AuthPrincipal principal) {
        return userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public Account requireActiveAccount(AuthPrincipal principal) {
        if (!principal.hasActiveAccount()) {
            throw new IllegalArgumentException("Select an account first");
        }

        Account account = accountRepository.findByIdAndUserId(principal.activeAccountId(), principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        return account;
    }

    public Account requireActiveAccount(AuthPrincipal principal, AccountType expectedType) {
        Account account = requireActiveAccount(principal);

        if (account.getType() != expectedType) {
            throw new IllegalArgumentException("Selected account type does not match");
        }

        return account;
    }

    public Account requireAccount(AuthPrincipal principal, Long accountId) {
        return accountRepository.findByIdAndUserId(accountId, principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private AccountResponse toResponse(Account account, boolean active) {
        return AccountResponse.from(
                account,
                studentProfileRepository.findByAccountId(account.getId()).orElse(null),
                tutorProfileRepository.findByAccountId(account.getId()).orElse(null),
                active
        );
    }
}
