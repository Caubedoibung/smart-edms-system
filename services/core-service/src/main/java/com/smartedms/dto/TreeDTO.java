package com.smartedms.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class TreeDTO {

    private Long id;
    private String name;
    private String type;
    private String filePath;
    private String folderType;
    private Long ownerId;
    private String permissionLevel;

    private List<TreeDTO> children = new ArrayList<>();
}