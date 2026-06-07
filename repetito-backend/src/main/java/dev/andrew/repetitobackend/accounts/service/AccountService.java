package dev.andrew.repetitobackend.accounts.service;

import dev.andrew.repetitobackend.accounts.dto.AccountResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicAccountResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicProfileResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicProfileSearchResponse;
import dev.andrew.repetitobackend.accounts.dto.PublicUserResponse;
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
import dev.andrew.repetitobackend.reviews.dto.ReviewResponse;
import dev.andrew.repetitobackend.reviews.repository.TutorReviewRepository;
import dev.andrew.repetitobackend.tutorcards.dto.TutorCardResponse;
import dev.andrew.repetitobackend.tutorcards.repository.TutorCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TutorCardRepository tutorCardRepository;
    private final TutorReviewRepository tutorReviewRepository;

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

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(Long accountId) {
        Account requestedAccount = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (!requestedAccount.isPublicProfile()) {
            throw new IllegalArgumentException("Profile not found");
        }
        User user = requestedAccount.getUser();

        List<Account> accounts = accountRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        List<PublicAccountResponse> publicAccounts = accounts.stream()
                .filter(Account::isPublicProfile)
                .map(account -> PublicAccountResponse.from(
                        account,
                        studentProfileRepository.findByAccountId(account.getId()).orElse(null),
                        tutorProfileRepository.findByAccountId(account.getId()).orElse(null)
                ))
                .toList();

        List<TutorCardResponse> tutorCards = new ArrayList<>();
        List<ReviewResponse> reviews = new ArrayList<>();
        accounts.stream()
                .filter(Account::isPublicProfile)
                .filter(account -> account.getType() == AccountType.TUTOR)
                .forEach(account -> {
                    TutorProfile tutorProfile = tutorProfileRepository.findByAccountId(account.getId()).orElse(null);
                    tutorCardRepository.findByTutorAccountIdAndIsActiveTrueOrderByCreatedAtDesc(account.getId()).stream()
                            .map(card -> TutorCardResponse.from(card, tutorProfile))
                            .forEach(tutorCards::add);
                    tutorReviewRepository.findByTutorAccountIdOrderByCreatedAtDesc(account.getId()).stream()
                            .map(ReviewResponse::from)
                            .forEach(reviews::add);
                });

        return new PublicProfileResponse(PublicUserResponse.from(user), publicAccounts, tutorCards, reviews);
    }

    @Transactional(readOnly = true)
    public List<PublicProfileSearchResponse> searchPublicProfiles(String query, AccountType type) {
        List<Account> accounts = type == null
                ? accountRepository.findByPublicProfileTrueOrderByCreatedAtDesc()
                : accountRepository.findByPublicProfileTrueAndTypeOrderByCreatedAtDesc(type);
        List<String> tokens = searchTokens(query);

        return accounts.stream()
                .filter(account -> matchesName(account, tokens))
                .map(account -> PublicProfileSearchResponse.from(
                        account,
                        studentProfileRepository.findByAccountId(account.getId()).orElse(null),
                        tutorProfileRepository.findByAccountId(account.getId()).orElse(null)
                ))
                .toList();
    }

    public AuthResponse updatePublicProfile(AuthPrincipal principal, boolean publicProfile) {
        Account account = requireActiveAccount(principal);
        account.setPublicProfile(publicProfile);
        accountRepository.save(account);

        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return buildResponse(user, principal.activeAccountId(), currentToken(user, principal));
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

    private List<String> searchTokens(String query) {
        String normalized = trimToNull(query);
        if (normalized == null) {
            return List.of();
        }

        return List.of(normalized.toLowerCase(Locale.ROOT).split("\\s+")).stream()
                .filter(token -> !token.isBlank())
                .toList();
    }

    private boolean matchesName(Account account, List<String> tokens) {
        if (tokens.isEmpty()) {
            return true;
        }

        String fullName = (account.getUser().getFirstName() + " " + account.getUser().getLastName()).toLowerCase(Locale.ROOT);
        String reverseName = (account.getUser().getLastName() + " " + account.getUser().getFirstName()).toLowerCase(Locale.ROOT);
        return tokens.stream().allMatch(token -> fullName.contains(token) || reverseName.contains(token));
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
