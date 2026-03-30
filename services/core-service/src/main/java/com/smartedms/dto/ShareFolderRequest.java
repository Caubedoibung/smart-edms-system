package com.smartedms.dto;

import lombok.Data;

@Data
public class ShareFolderRequest {

    private Long userId;
    private String permissionLevel;
}
