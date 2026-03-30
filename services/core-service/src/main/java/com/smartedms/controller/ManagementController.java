package com.smartedms.controller;

import com.smartedms.dto.CategoryRequestDTO;
import com.smartedms.dto.TreeDTO;
import com.smartedms.entity.Category;
import com.smartedms.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class ManagementController {

    private final CategoryService categoryService;

    public ManagementController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/tree")
    public List<TreeDTO> getTree() {
        return categoryService.getTree();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@RequestBody CategoryRequestDTO dto) {
        return categoryService.create(dto);
    }

    @PutMapping("/{id}")
    public Category rename(@PathVariable Long id, @RequestBody CategoryRequestDTO dto) {
        return categoryService.rename(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        categoryService.softDelete(id);
    }
}