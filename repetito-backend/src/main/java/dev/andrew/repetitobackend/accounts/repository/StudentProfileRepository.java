package dev.andrew.repetitobackend.accounts.repository;

import dev.andrew.repetitobackend.accounts.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByAccountId(Long accountId);
}
