package com.smartedms.repository;

import com.smartedms.entity.Category;
import com.smartedms.entity.FolderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByIdAndIsDeletedFalse(Long id);

    List<Category> findByParentIdAndIsDeletedFalse(Long parentId);

    List<Category> findByParentId(Long parentId);

    List<Category> findByOwnerIdAndFolderTypeAndParentIdIsNullAndIsDeletedFalse(Long ownerId, FolderType folderType);

    List<Category> findByOwnerIdAndIsDeletedFalse(Long ownerId);

    List<Category> findByParentIdAndFolderTypeAndIsDeletedFalse(Long parentId, FolderType folderType);

    List<Category> findByParentIdAndOwnerIdAndFolderTypeAndIsDeletedFalse(Long parentId, Long ownerId, FolderType folderType);

    List<Category> findByOwnerIdAndIsDeletedTrue(Long ownerId);

    List<Category> findByIsDeletedTrue();
}

