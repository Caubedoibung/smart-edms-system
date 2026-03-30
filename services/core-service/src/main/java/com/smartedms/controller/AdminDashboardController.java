package com.smartedms.controller;

import com.smartedms.entity.DocumentStatus;
import com.smartedms.repository.CategoryRepository;
import com.smartedms.repository.DocumentRepository;
import com.smartedms.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Các chỉ số tổng quan hệ thống dành cho Admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminDashboardController {

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final DocumentService documentService;

    @GetMapping("/overview")
    @Operation(summary = "Tổng quan cấu trúc dữ liệu", description = "Lấy tổng số thư mục, tổng số tài liệu (chia theo status).")
    public Map<String, Object> getOverview() {
        Map<String, Object> response = new HashMap<>();
        
        long totalFolders = categoryRepository.count();
        long totalDocuments = documentRepository.count();
        
        response.put("totalFolders", totalFolders);
        response.put("totalDocuments", totalDocuments);

        // Document status ratios
        Map<String, Long> statusBreakdown = new HashMap<>();
        for (DocumentStatus status : DocumentStatus.values()) {
            statusBreakdown.put(status.name(), documentRepository.countByStatus(status));
        }
        response.put("statusBreakdown", statusBreakdown);

        return response;
    }

    @GetMapping("/storage")
    @Operation(summary = "Thống kê Dung lượng MinIO", description = "Lấy tổng dung lượng các file PDF đã lưu (Bytes).")
    public Map<String, Object> getStorageUsage() {
        long usedBytes = documentService.getSystemStorageUsage();
        double usedGb = (double) usedBytes / (1024 * 1024 * 1024);
        return Map.of(
            "usedBytes", usedBytes,
            "usedGb", Math.round(usedGb * 100.0) / 100.0
        );
    }
}
