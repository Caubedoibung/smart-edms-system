package com.smartedms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "folder_permissions",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"folder_id", "user_id"},
        name = "uk_folder_permissions_folder_user"
    )
)
@Data
@NoArgsConstructor
public class FolderPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "folder_id", nullable = false)
    private Long folderId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_level", nullable = false)
    private PermissionLevel permissionLevel;

    public FolderPermission(Long folderId, Long userId, PermissionLevel permissionLevel) {
        this.folderId = folderId;
        this.userId = userId;
        this.permissionLevel = permissionLevel;
    }
}
