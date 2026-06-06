package dev.andrew.repetitobackend.subjects.service;

import dev.andrew.repetitobackend.subjects.dto.SubjectResponse;
import dev.andrew.repetitobackend.subjects.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectResponse> getAll() {
        return subjectRepository.findAllByOrderBySortOrderAscTitleAsc()
                .stream()
                .map(SubjectResponse::from)
                .toList();
    }
}
