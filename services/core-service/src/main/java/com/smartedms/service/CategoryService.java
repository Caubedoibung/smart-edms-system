package com.smartedms.service;

import com.smartedms.dto.CategoryRequestDTO;
import com.smartedms.dto.TreeDTO;
import com.smartedms.entity.Category;
import com.smartedms.entity.Document;
import com.smartedms.repository.CategoryRepository;
import com.smartedms.repository.DocumentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository folderRepository;
    private final DocumentRepository documentRepository;

    public CategoryService(CategoryRepository folderRepository, DocumentRepository documentRepository) {
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
    }

    public List<TreeDTO> getTree() {
        List<Category> roots = folderRepository.findByParentIdAndIsDeletedFalse(null);
        return roots.stream().map(this::buildTree).toList();
    }

    public Category create(CategoryRequestDTO dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setParentId(dto.getParentId());
        return folderRepository.save(category);
    }

    public Category rename(Long id, CategoryRequestDTO dto) {
        Category category = folderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));
        category.setName(dto.getName());
        return folderRepository.save(category);
    }

    @Transactional
    public void softDelete(Long id) {
        Category category = folderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));
        softDeleteRecursive(category);
    }

    private void softDeleteRecursive(Category category) {
        // Đánh dấu xóa thư mục hiện tại
        category.setDeleted(true);
        folderRepository.save(category);

        // Đánh dấu xóa tất cả document bên trong
        List<Document> documents = documentRepository.findByFolderId(category.getId());
        for (Document doc : documents) {
            doc.setDeleted(true);
            documentRepository.save(doc);
        }

        // Đệ quy xóa tất cả thư mục con
        List<Category> children = folderRepository.findByParentId(category.getId());
        for (Category child : children) {
            softDeleteRecursive(child);
        }
    }

    private TreeDTO buildTree(Category folder) {
        TreeDTO dto = new TreeDTO();
        dto.setId(folder.getId());
        dto.setName(folder.getName());

        List<Category> children = folderRepository.findByParentIdAndIsDeletedFalse(folder.getId());
        for (Category child : children) {
            dto.getChildren().add(buildTree(child));
        }

        return dto;
    }
}

