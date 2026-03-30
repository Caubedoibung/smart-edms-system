package com.smartedms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FolderPermissionResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String permissionLevel;
}
