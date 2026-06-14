package dev.andrew.repetitobackend.accounts.repository;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {

    List<Account> findByUserIdOrderByCreatedAtAsc(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<Account> findByPublicProfileTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"user"})
    List<Account> findByPublicProfileTrueAndTypeOrderByCreatedAtDesc(AccountType type);

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    Optional<Account> findByUserIdAndType(Long userId, AccountType type);

    boolean existsByUserIdAndType(Long userId, AccountType type);
}
