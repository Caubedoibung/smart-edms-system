package com.smartedms.controller;

import com.smartedms.dto.FolderPermissionResponse;
import com.smartedms.dto.ShareFolderRequest;
import com.smartedms.entity.FolderPermission;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import com.smartedms.service.FolderPermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@Tag(name = "Folder Permissions", description = "API quản lý quyền truy cập thư mục phòng ban")
@SecurityRequirement(name = "bearerAuth")
public class FolderPermissionController {

    private final FolderPermissionService permissionService;
    private final UserRepository userRepository;

    public FolderPermissionController(FolderPermissionService permissionService,
                                      UserRepository userRepository) {
        this.permissionService = permissionService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Share thư mục", description = "Chia sẻ thư mục phòng ban cho user với quyền VIEWER hoặc EDITOR")
    @PostMapping("/{folderId}/share")
    @ResponseStatus(HttpStatus.CREATED)
    public FolderPermission share(
            @PathVariable Long folderId,
            @RequestBody ShareFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = resolveUserId(userDetails);
        return permissionService.shareFolder(folderId, request.getUserId(), request.getPermissionLevel(), currentUserId);
    }

    @Operation(summary = "Thu hồi quyền", description = "Thu hồi quyền truy cập của user trên thư mục")
    @DeleteMapping("/{folderId}/share/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(
            @PathVariable Long folderId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = resolveUserId(userDetails);
        permissionService.revokePermission(folderId, userId, currentUserId);
    }

    @Operation(summary = "Xem danh sách quyền", description = "Lấy danh sách user và quyền trên thư mục")
    @GetMapping("/{folderId}/permissions")
    public List<FolderPermissionResponse> getPermissions(@PathVariable Long folderId) {
        return permissionService.getSharedUsers(folderId);
    }

    private Long resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"));
        return user.getId();
    }
}
