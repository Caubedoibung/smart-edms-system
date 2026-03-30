package com.smartedms.service;

import com.smartedms.dto.FolderPermissionResponse;
import com.smartedms.entity.*;
import com.smartedms.repository.CategoryRepository;
import com.smartedms.repository.FolderPermissionRepository;
import com.smartedms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class FolderPermissionService {

    private final FolderPermissionRepository permissionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public FolderPermissionService(FolderPermissionRepository permissionRepository,
                                   CategoryRepository categoryRepository,
                                   UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    /**
     * Kiểm tra user có quyền truy cập folder hay không (trực tiếp hoặc kế thừa).
     * - Thư mục cá nhân: chỉ owner mới có quyền
     * - Thư mục phòng ban: kiểm tra quyền trực tiếp → nếu không có thì đệ quy lên cha
     */
    public boolean hasPermission(Long userId, Long folderId) {
        return getEffectivePermission(userId, folderId) != null;
    }

    /**
     * Kiểm tra user có đúng cấp quyền tối thiểu hay không.
     * EDITOR >= VIEWER (EDITOR bao gồm quyền VIEWER)
     */
    public boolean hasMinimumPermission(Long userId, Long folderId, PermissionLevel requiredLevel) {
        PermissionLevel effective = getEffectivePermission(userId, folderId);
        if (effective == null) {
            return false;
        }
        if (requiredLevel == PermissionLevel.VIEWER) {
            return true; // VIEWER hoặc EDITOR đều đạt
        }
        return effective == PermissionLevel.EDITOR;
    }

    /**
     * Trả về quyền hiệu quả (trực tiếp hoặc kế thừa) của user trên folder.
     * Trả về null nếu user không có quyền.
     */
    public PermissionLevel getEffectivePermission(Long userId, Long folderId) {
        Category folder = categoryRepository.findByIdAndIsDeletedFalse(folderId).orElse(null);
        if (folder == null) {
            return null;
        }

        // Owner luôn có toàn quyền
        if (userId.equals(folder.getOwnerId())) {
            return PermissionLevel.EDITOR;
        }

        // Thư mục cá nhân: chỉ owner mới truy cập được (đã check ở trên → trả null)
        if (folder.getFolderType() == FolderType.PERSONAL) {
            return null;
        }

        // Thư mục phòng ban: kiểm tra quyền trực tiếp
        Optional<FolderPermission> directPermission = permissionRepository.findByFolderIdAndUserId(folderId, userId);
        if (directPermission.isPresent()) {
            return directPermission.get().getPermissionLevel();
        }

        // Kế thừa: đệ quy lên thư mục cha
        if (folder.getParentId() != null) {
            return getEffectivePermission(userId, folder.getParentId());
        }

        return null;
    }

    /**
     * Share folder cho user với cấp quyền chỉ định.
     * Chỉ OWNER (người tạo folder) mới được share.
     */
    @Transactional
    public FolderPermission shareFolder(Long folderId, Long targetUserId, String permissionLevelStr, Long currentUserId) {
        Category folder = categoryRepository.findByIdAndIsDeletedFalse(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại"));

        // Chỉ thư mục phòng ban mới share được
        if (folder.getFolderType() == FolderType.PERSONAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể share thư mục cá nhân");
        }

        // Chỉ owner mới có quyền share
        if (!currentUserId.equals(folder.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ người tạo thư mục mới có quyền share");
        }

        // Không cho share cho chính mình
        if (currentUserId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể share cho chính mình");
        }

        // Kiểm tra user đích tồn tại
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        PermissionLevel level = parsePermissionLevel(permissionLevelStr);

        // Nếu đã có quyền thì cập nhật, chưa có thì tạo mới
        Optional<FolderPermission> existing = permissionRepository.findByFolderIdAndUserId(folderId, targetUserId);
        if (existing.isPresent()) {
            FolderPermission permission = existing.get();
            permission.setPermissionLevel(level);
            return permissionRepository.save(permission);
        }

        return permissionRepository.save(new FolderPermission(folderId, targetUserId, level));
    }

    /**
     * Thu hồi quyền truy cập của user trên folder.
     */
    @Transactional
    public void revokePermission(Long folderId, Long targetUserId, Long currentUserId) {
        Category folder = categoryRepository.findByIdAndIsDeletedFalse(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại"));

        if (!currentUserId.equals(folder.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ người tạo thư mục mới có quyền thu hồi");
        }

        permissionRepository.deleteByFolderIdAndUserId(folderId, targetUserId);
    }

    /**
     * Lấy danh sách user + quyền trên folder.
     */
    public List<FolderPermissionResponse> getSharedUsers(Long folderId) {
        categoryRepository.findByIdAndIsDeletedFalse(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại"));

        return permissionRepository.findByFolderId(folderId).stream()
                .map(permission -> {
                    User user = userRepository.findById(permission.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "unknown";
                    String fullName = user != null ? user.getFullName() : "unknown";
                    return new FolderPermissionResponse(
                            permission.getUserId(),
                            username,
                            fullName,
                            permission.getPermissionLevel().name()
                    );
                })
                .toList();
    }

    private PermissionLevel parsePermissionLevel(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "permissionLevel là bắt buộc");
        }
        try {
            return PermissionLevel.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "permissionLevel phải là VIEWER hoặc EDITOR");
        }
    }
}
