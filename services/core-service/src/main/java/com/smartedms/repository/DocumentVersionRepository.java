package com.smartedms.repository;

import com.smartedms.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {

    Optional<DocumentVersion> findByDocumentIdAndIsCurrentTrue(Long documentId);

    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(Long documentId);

    int countByDocumentId(Long documentId);
}
