package com.smartedms.dto;

import lombok.Data;

@Data
public class CategoryRequestDTO {

    private String name;
    private Long parentId;
    private String folderType;
}

