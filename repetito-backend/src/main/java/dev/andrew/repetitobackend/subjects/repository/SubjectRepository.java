package dev.andrew.repetitobackend.subjects.repository;

import dev.andrew.repetitobackend.subjects.model.SubjectCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<SubjectCatalog, String> {

    List<SubjectCatalog> findAllByOrderBySortOrderAscTitleAsc();
}
