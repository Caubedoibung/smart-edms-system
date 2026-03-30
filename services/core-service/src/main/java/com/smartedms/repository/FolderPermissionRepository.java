package com.smartedms.repository;

import com.smartedms.entity.FolderPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderPermissionRepository extends JpaRepository<FolderPermission, Long> {

    Optional<FolderPermission> findByFolderIdAndUserId(Long folderId, Long userId);

    List<FolderPermission> findByFolderId(Long folderId);

    List<FolderPermission> findByUserId(Long userId);

    void deleteByFolderIdAndUserId(Long folderId, Long userId);

    void deleteByFolderId(Long folderId);
}
