package com.smartedms.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class TreeDTO {

    private Long id;
    private String name;

    private List<TreeDTO> children = new ArrayList<>();

}