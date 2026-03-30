package com.smartedms.controller;

import com.smartedms.entity.Document;
import com.smartedms.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/storage")
@RequiredArgsConstructor
@Tag(name = "Admin Storage Management", description = "Quản lý lưu trữ và thùng rác hệ thống")
@SecurityRequirement(name = "bearerAuth")
public class AdminStorageController {

    private final DocumentService documentService;

    @GetMapping("/trash")
    @Operation(summary = "Giám sát Thùng rác Tổng (Global Trash Bin)", description = "Admin xem toàn bộ tài liệu đã xóa mềm của hệ thống.")
    public List<Document> getGlobalTrash() {
        return documentService.getDeletedDocuments();
    }

    @DeleteMapping("/trash/empty")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Dọn dẹp hệ thống", description = "Làm rỗng toàn bộ thùng rác, xóa vĩnh viễn file trên MinIO.")
    public void emptyAllTrash() {
        documentService.emptyAllTrash();
    }
}
