package com.smartedms.repository;

import com.smartedms.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByFolderIdAndIsDeletedFalse(Long folderId);

    List<Document> findByFolderId(Long folderId);

}
