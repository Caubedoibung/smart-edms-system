package com.smartedms.controller;

import com.smartedms.dto.CategoryRequestDTO;
import com.smartedms.dto.TreeDTO;
import com.smartedms.entity.Category;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import com.smartedms.service.CategoryService;
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
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "API quản lý thư mục/danh mục")
@SecurityRequirement(name = "bearerAuth")
public class ManagementController {

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    public ManagementController(CategoryService categoryService, UserRepository userRepository) {
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Lấy cây thư mục", description = "Trả về cây thư mục mà user hiện tại có quyền truy cập")
    @GetMapping("/tree")
    public List<TreeDTO> getTree(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.getTree(userId);
    }

    @Operation(summary = "Cây thư mục cá nhân", description = "Trả về cây thư mục cá nhân của user hiện tại")
    @GetMapping("/tree/personal")
    public List<TreeDTO> getPersonalTree(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.getPersonalTree(userId);
    }

    @Operation(summary = "Cây thư mục phòng ban", description = "Trả về cây thư mục phòng ban mà user có quyền truy cập")
    @GetMapping("/tree/department")
    public List<TreeDTO> getDepartmentTree(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.getDepartmentTree(userId);
    }

    @GetMapping
    public List<Category> getByParentId(
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) String folderType,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.getByParentId(parentId, folderType, userId);
    }

    @Operation(summary = "Tạo thư mục mới", description = "Tạo thư mục mới, gán người tạo là user hiện tại")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@RequestBody CategoryRequestDTO dto,
                           @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.create(dto, userId);
    }

    @Operation(summary = "Đổi tên thư mục", description = "Đổi tên thư mục (cần quyền EDITOR)")
    @PutMapping("/{id}")
    public Category rename(@PathVariable Long id,
                           @RequestBody CategoryRequestDTO dto,
                           @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.rename(id, dto, userId);
    }

    @Operation(summary = "Xóa thư mục", description = "Xóa mềm thư mục (chỉ owner mới được xóa)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        categoryService.softDelete(id, userId);
    }

    @Operation(summary = "Danh sách thư mục trong thùng rác", description = "Trả về các thư mục do user đã xóa")
    @GetMapping("/trash")
    public List<Category> getDeletedCategories(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.getDeletedCategories(userId);
    }

    @Operation(summary = "Khôi phục thư mục", description = "Khôi phục thư mục từ thùng rác")
    @PutMapping("/{id}/restore")
    public Category restoreCategory(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return categoryService.restoreCategory(id, userId);
    }

    @Operation(summary = "Xóa vĩnh viễn thư mục", description = "Chỉ owner mới xóa được")
    @DeleteMapping("/{id}/hard-delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hardDeleteCategory(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        categoryService.hardDeleteCategory(id, userId);
    }

    private Long resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"));
        return user.getId();
    }
}