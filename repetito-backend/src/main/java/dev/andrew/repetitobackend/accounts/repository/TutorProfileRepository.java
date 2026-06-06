package dev.andrew.repetitobackend.accounts.repository;

import dev.andrew.repetitobackend.accounts.model.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorProfileRepository extends JpaRepository<TutorProfile, Long> {

    Optional<TutorProfile> findByAccountId(Long accountId);
}
