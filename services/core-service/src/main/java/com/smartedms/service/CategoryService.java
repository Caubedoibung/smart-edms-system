package com.smartedms.service;

import com.smartedms.dto.CategoryRequestDTO;
import com.smartedms.dto.TreeDTO;
import com.smartedms.entity.*;
import com.smartedms.repository.CategoryRepository;
import com.smartedms.repository.DocumentRepository;
import com.smartedms.repository.FolderPermissionRepository;
import com.smartedms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository folderRepository;
    private final DocumentRepository documentRepository;
    private final FolderPermissionRepository permissionRepository;
    private final FolderPermissionService permissionService;
    private final UserRepository userRepository;
    private final AuditLogPublisherService auditLogPublisherService;

    public CategoryService(CategoryRepository folderRepository,
                           DocumentRepository documentRepository,
                           FolderPermissionRepository permissionRepository,
                           FolderPermissionService permissionService,
                           UserRepository userRepository,
                           AuditLogPublisherService auditLogPublisherService) {
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
        this.permissionRepository = permissionRepository;
        this.permissionService = permissionService;
        this.userRepository = userRepository;
        this.auditLogPublisherService = auditLogPublisherService;
    }

    /**
     * Lấy toàn bộ cây thư mục mà user có quyền (cả cá nhân + phòng ban).
     */
    public List<TreeDTO> getTree(Long userId) {
        List<TreeDTO> tree = new ArrayList<>();
        tree.addAll(getPersonalTree(userId));
        tree.addAll(getDepartmentTree(userId));
        return tree;
    }

    /**
     * Lấy cây thư mục CÁ NHÂN: chỉ thư mục do user tạo với type PERSONAL.
     */
    public List<TreeDTO> getPersonalTree(Long userId) {
        List<TreeDTO> tree = new ArrayList<>();

        List<Category> personalRoots = folderRepository
                .findByOwnerIdAndFolderTypeAndParentIdIsNullAndIsDeletedFalse(userId, FolderType.PERSONAL);
        for (Category root : personalRoots) {
            tree.add(buildTree(root, userId));
        }

        // Document ở root level (không thuộc folder nào)
        documentRepository.findByFolderIdAndIsDeletedFalse(null)
                .forEach(doc -> tree.add(toDocumentNode(doc)));

        return tree;
    }

    /**
     * Lấy cây thư mục PHÒNG BAN: thư mục do user tạo (OWNER) + thư mục được share.
     */
    public List<TreeDTO> getDepartmentTree(Long userId) {
        List<TreeDTO> tree = new ArrayList<>();

        // 1. Thư mục phòng ban mà user là OWNER
        List<Category> ownedDeptRoots = folderRepository
                .findByOwnerIdAndFolderTypeAndParentIdIsNullAndIsDeletedFalse(userId, FolderType.DEPARTMENT);
        for (Category root : ownedDeptRoots) {
            tree.add(buildTree(root, userId));
        }

        // 2. Thư mục phòng ban mà user được share
        Set<Long> alreadyIncluded = tree.stream()
                .map(TreeDTO::getId)
                .collect(Collectors.toSet());

        List<FolderPermission> sharedPermissions = permissionRepository.findByUserId(userId);
        for (FolderPermission permission : sharedPermissions) {
            Long rootId = findDepartmentRootId(permission.getFolderId());
            if (rootId != null && !alreadyIncluded.contains(rootId)) {
                Category rootFolder = folderRepository.findByIdAndIsDeletedFalse(rootId).orElse(null);
                if (rootFolder != null) {
                    tree.add(buildTree(rootFolder, userId));
                    alreadyIncluded.add(rootId);
                }
            }
        }

        return tree;
    }

    public List<Category> getByParentId(Long parentId, String folderType, Long ownerId) {
        // Nếu có folderType filter, lọc theo đó
        if (folderType != null && !folderType.isBlank()) {
            FolderType type = parseFolderType(folderType);
            if (ownerId != null && type == FolderType.PERSONAL) {
                // Tài liệu cá nhân: chỉ lấy folder do user sở hữu
                return folderRepository.findByParentIdAndOwnerIdAndFolderTypeAndIsDeletedFalse(parentId, ownerId, type);
            }
            if (ownerId != null && type == FolderType.DEPARTMENT) {
                // Lọc thư mục phòng ban: user là owner HOẶC có quyền truy cập
                List<Category> allDepts = folderRepository.findByParentIdAndFolderTypeAndIsDeletedFalse(parentId, type);
                return allDepts.stream()
                        .filter(cat -> objEquals(cat.getOwnerId(), ownerId) || permissionService.hasPermission(ownerId, cat.getId()))
                        .collect(Collectors.toList());
            }
            return folderRepository.findByParentIdAndFolderTypeAndIsDeletedFalse(parentId, type);
        }
        return folderRepository.findByParentIdAndIsDeletedFalse(parentId);
    }

    private boolean objEquals(Long a, Long b) {
        return a != null && a.equals(b);
    }

    /**
     * Tạo thư mục mới, gán ownerId = user hiện tại.
     * Nếu tạo thư mục con trong thư mục phòng ban, tự kế thừa folderType từ cha.
     */
    public Category create(CategoryRequestDTO dto, Long userId) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setParentId(dto.getParentId());
        category.setOwnerId(userId);

        if (dto.getParentId() != null) {
            // Thư mục con: kế thừa folderType từ thư mục cha
            Category parent = folderRepository.findByIdAndIsDeletedFalse(dto.getParentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục cha không tồn tại"));

            // Kiểm tra quyền EDITOR trên thư mục cha trước khi tạo con
            if (!permissionService.hasMinimumPermission(userId, parent.getId(), PermissionLevel.EDITOR)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tạo thư mục con tại đây");
            }

            category.setFolderType(parent.getFolderType());
        } else {
            // Thư mục gốc: lấy folderType từ DTO
            FolderType folderType = parseFolderType(dto.getFolderType());

            // Chỉ MANAGER mới được tạo thư mục phòng ban
            if (folderType == FolderType.DEPARTMENT) {
                User currentUser = userRepository.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"));
                if (!currentUser.getRoles().contains(Role.ROLE_MANAGER) && !currentUser.getRoles().contains(Role.ROLE_ADMIN)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Manager hoặc Admin mới được tạo thư mục phòng ban");
                }
            }

            category.setFolderType(folderType);
        }

        category = folderRepository.save(category);

        // Audit log – fault tolerant: không để lỗi Kafka/SecurityContext làm rollback thao tác chính
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("CREATE_CATEGORY")
                    .entityType("CATEGORY")
                    .entityId(category.getId())
                    .details(java.util.Map.of("name", category.getName(), "folderType", category.getFolderType().name()))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for CREATE_CATEGORY id=" + category.getId() + ": " + e.getMessage());
        }

        return category;
    }

    public Category rename(Long id, CategoryRequestDTO dto, Long userId) {
        Category category = folderRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại: " + id));

        if (!permissionService.hasMinimumPermission(userId, id, PermissionLevel.EDITOR)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền đổi tên thư mục này");
        }

        category.setName(dto.getName());
        category = folderRepository.save(category);

        // Audit log – fault tolerant
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("RENAME_CATEGORY")
                    .entityType("CATEGORY")
                    .entityId(category.getId())
                    .details(java.util.Map.of("newName", category.getName()))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for RENAME_CATEGORY id=" + id + ": " + e.getMessage());
        }

        return category;
    }

    @Transactional
    public void softDelete(Long id, Long userId) {
        Category category = folderRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại: " + id));

        // Chỉ owner mới được xóa
        if (!userId.equals(category.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ người tạo thư mục mới có quyền xóa");
        }

        softDeleteRecursive(category);

        // Audit log – fault tolerant: không để lỗi Kafka/SecurityContext rollback thao tác xóa
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("DELETE_CATEGORY")
                    .entityType("CATEGORY")
                    .entityId(category.getId())
                    .details(java.util.Map.of("name", category.getName()))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for DELETE_CATEGORY id=" + id + ": " + e.getMessage());
        }
    }

    public List<Category> getDeletedCategories(Long userId) {
        return folderRepository.findByOwnerIdAndIsDeletedTrue(userId);
    }

    @Transactional
    public Category restoreCategory(Long id, Long userId) {
        Category category = folderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại: " + id));

        if (!userId.equals(category.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ owner mới được khôi phục");
        }
        if (!category.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thư mục không nằm trong thùng rác");
        }

        category.setDeleted(false);
        category = folderRepository.save(category);

        // Audit log – fault tolerant
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("RESTORE_CATEGORY")
                    .entityType("CATEGORY")
                    .entityId(category.getId())
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for RESTORE_CATEGORY id=" + id + ": " + e.getMessage());
        }

        return category;
    }

    @Transactional
    public void hardDeleteCategory(Long id, Long userId) {
        Category category = folderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại: " + id));

        if (!userId.equals(category.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ owner mới được xóa vĩnh viễn");
        }
        if (!category.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng xóa mềm trước khi xóa vĩnh viễn");
        }

        // Xóa cascade: child folders, documents, permissions trước khi xóa chính folder
        hardDeleteRecursive(category);

        // Audit log – fault tolerant
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("HARD_DELETE_CATEGORY")
                    .entityType("CATEGORY")
                    .entityId(category.getId())
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for HARD_DELETE_CATEGORY id=" + id + ": " + e.getMessage());
        }
    }

    /**
     * Xóa vĩnh viễn folder và toàn bộ cây con:
     * 1. Đệ quy xóa child folders
     * 2. Xóa documents thuộc folder
     * 3. Xóa permissions liên kết folder
     * 4. Cuối cùng xóa chính folder
     */
    private void hardDeleteRecursive(Category folder) {
        // Xóa đệ quy child folders trước
        List<Category> children = folderRepository.findByParentId(folder.getId());
        for (Category child : children) {
            hardDeleteRecursive(child);
        }

        // Xóa tất cả documents thuộc folder
        List<Document> documents = documentRepository.findByFolderId(folder.getId());
        for (Document doc : documents) {
            documentRepository.delete(doc);
        }

        // Xóa tất cả permissions liên kết folder
        permissionRepository.deleteByFolderId(folder.getId());

        // Xóa chính folder
        folderRepository.delete(folder);
    }

    /**
     * Tìm folder gốc (parentId = null) của một folder phòng ban bất kỳ.
     */
    private Long findDepartmentRootId(Long folderId) {
        Category folder = folderRepository.findByIdAndIsDeletedFalse(folderId).orElse(null);
        if (folder == null) {
            return null;
        }
        if (folder.getParentId() == null) {
            return folder.getId();
        }
        return findDepartmentRootId(folder.getParentId());
    }

    private void softDeleteRecursive(Category category) {
        category.setDeleted(true);
        folderRepository.save(category);

        documentRepository.findByFolderIdAndIsDeletedFalse(category.getId())
                .forEach(doc -> {
                    doc.setDeleted(true);
                    documentRepository.save(doc);
                });

        folderRepository.findByParentIdAndIsDeletedFalse(category.getId())
                .forEach(this::softDeleteRecursive);
    }

    private TreeDTO buildTree(Category folder, Long userId) {
        TreeDTO dto = new TreeDTO();
        dto.setId(folder.getId());
        dto.setName(folder.getName());
        dto.setType("folder");
        dto.setFolderType(folder.getFolderType().name());
        dto.setOwnerId(folder.getOwnerId());

        // Gắn quyền hiệu quả của user hiện tại trên folder
        PermissionLevel effectivePermission = permissionService.getEffectivePermission(userId, folder.getId());
        dto.setPermissionLevel(effectivePermission != null ? effectivePermission.name() : null);

        folderRepository.findByParentIdAndIsDeletedFalse(folder.getId())
                .forEach(child -> dto.getChildren().add(buildTree(child, userId)));

        documentRepository.findByFolderIdAndIsDeletedFalse(folder.getId())
                .forEach(doc -> dto.getChildren().add(toDocumentNode(doc)));

        return dto;
    }

    private TreeDTO toDocumentNode(Document document) {
        TreeDTO dto = new TreeDTO();
        dto.setId(document.getId());
        dto.setName(document.getName());
        dto.setType("file");
        return dto;
    }

    private FolderType parseFolderType(String value) {
        if (value == null || value.isBlank()) {
            return FolderType.PERSONAL;
        }
        try {
            return FolderType.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "folderType phải là PERSONAL hoặc DEPARTMENT");
        }
    }
}
