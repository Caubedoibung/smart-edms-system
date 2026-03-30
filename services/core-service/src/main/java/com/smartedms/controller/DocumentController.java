package com.smartedms.controller;

import com.smartedms.entity.Document;
import com.smartedms.entity.DocumentVersion;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import com.smartedms.service.DocumentService;
import com.smartedms.service.DocumentSigningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@Tag(name = "Documents", description = "APIs upload và xem trước tài liệu PDF trên MinIO")
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentSigningService documentSigningService;
    private final UserRepository userRepository;

    public DocumentController(DocumentService documentService, DocumentSigningService documentSigningService, UserRepository userRepository) {
        this.documentService = documentService;
        this.documentSigningService = documentSigningService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các file trong folder", security = @SecurityRequirement(name = "bearerAuth"))
    public List<Document> getByFolderId(@RequestParam(required = false) Long folderId) {
        return documentService.getByFolderId(folderId);
    }

    @PostMapping(consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload PDF lên MinIO", description = "Nhận multipart/form-data, upload file PDF lên MinIO và lưu metadata vào bảng documents.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Upload thành công", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = Document.class))),
            @ApiResponse(responseCode = "400", description = "Thiếu file hoặc dữ liệu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập hoặc token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền upload vào thư mục này"),
            @ApiResponse(responseCode = "404", description = "Folder không tồn tại"),
            @ApiResponse(responseCode = "415", description = "Chỉ hỗ trợ file PDF")
    })
    public Document upload(
            @Parameter(description = "File PDF cần upload", required = true, content = @Content(mediaType = MediaType.APPLICATION_PDF_VALUE, schema = @Schema(type = "string", format = "binary"))) @RequestParam("file") MultipartFile file,
            @Parameter(description = "ID folder cha. Bỏ trống nếu upload vào root", example = "1") @RequestParam(value = "folderId", required = false) Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.uploadPdf(file, folderId, userId);
    }

    @PostMapping(value = "/{id}/versions", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload phiên bản mới", description = "Tải lên file PDF mới làm phiên bản tiếp theo của tài liệu", security = @SecurityRequirement(name = "bearerAuth"))
    public DocumentVersion uploadNewVersion(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.uploadNewVersion(id, file, userId);
    }

    @GetMapping("/{id}/view")
    @Operation(summary = "Lấy luồng PDF để xem trước", description = "Đọc file PDF từ MinIO theo document id và trả về dữ liệu stream.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trả về stream PDF", content = @Content(mediaType = MediaType.APPLICATION_PDF_VALUE, schema = @Schema(type = "string", format = "binary"))),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập hoặc token không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền xem tài liệu này"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy document hoặc file trong MinIO"),
            @ApiResponse(responseCode = "415", description = "Document không phải PDF")
    })
    public ResponseEntity<InputStreamResource> view(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.streamPdf(id, userId);
    }

    private Long resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại"));
        return user.getId();
    }

    @GetMapping("/{id}/versions")
    @Operation(summary = "Lấy lịch sử phiên bản", description = "Trả về danh sách các phiên bản của tài liệu theo thứ tự mới nhất", security = @SecurityRequirement(name = "bearerAuth"))
    public List<DocumentVersion> getVersions(@PathVariable Long id) {
        return documentService.getVersionHistory(id);
    }

    @GetMapping("/{id}/versions/{versionId}/view")
    @Operation(summary = "Xem PDF của phiên bản cụ thể", description = "Đọc file PDF từ MinIO theo document id và version id.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<InputStreamResource> viewVersion(
            @PathVariable Long id,
            @PathVariable Long versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.streamPdfVersion(id, versionId, userId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài liệu", description = "Xóa mềm (soft delete) tài liệu theo id", security = @SecurityRequirement(name = "bearerAuth"))
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        documentService.softDelete(id);
    }

    @PostMapping(value = "/{id}/sign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Ký số tài liệu", description = "Đóng dấu chữ ký điện tử lên bản PDF mới nhất và tạo version mới", security = @SecurityRequirement(name = "bearerAuth"))
    public DocumentVersion signDocument(
            @PathVariable Long id,
            @RequestParam("p12File") MultipartFile p12File,
            @RequestParam("password") String password,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestParam(value = "location", required = false) String location,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        try {
            return documentSigningService.signDocument(id, userId, p12File.getInputStream(), password, reason, location);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File chữ ký không hợp lệ", e);
        }
    }

    @GetMapping("/pending-approvals")
    @Operation(summary = "Lấy danh sách tài liệu chờ duyệt", description = "Trả về các tài liệu đang ở trạng thái PENDING_APPROVAL do user hiện tại duyệt", security = @SecurityRequirement(name = "bearerAuth"))
    public List<Document> getPendingApprovals(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.getPendingApprovals(userId);
    }

    @PutMapping("/{id}/submit-approval")
    @Operation(summary = "Trình ký tài liệu", description = "Chuyển trạng thái sang PENDING_APPROVAL và chỉ định người duyệt", security = @SecurityRequirement(name = "bearerAuth"))
    public Document submitForApproval(
            @PathVariable Long id,
            @RequestParam Long approverId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.submitForApproval(id, approverId, userId);
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Từ chối tài liệu", description = "Chuyển trạng thái sang REJECTED (chỉ dành cho người được chỉ định duyệt)", security = @SecurityRequirement(name = "bearerAuth"))
    public Document rejectDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.rejectDocument(id, userId);
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt tài liệu", description = "Người được chỉ định duyệt tài liệu (chuyển sang APPROVED)", security = @SecurityRequirement(name = "bearerAuth"))
    public Document approveDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = resolveUserId(userDetails);
        return documentService.approveDocument(id, userId);
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm tài liệu", description = "Tìm kiếm tài liệu theo tên, thư mục, trạng thái (có phân trang)", security = @SecurityRequirement(name = "bearerAuth"))
    public org.springframework.data.domain.Page<Document> searchDocuments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) com.smartedms.entity.DocumentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return documentService.searchDocuments(keyword, folderId, status, page, size);
    }

    @GetMapping("/trash")
    @Operation(summary = "Danh sách tài liệu đã xóa", description = "Lấy các tài liệu trong thùng rác", security = @SecurityRequirement(name = "bearerAuth"))
    public List<Document> getDeletedDocuments() {
        return documentService.getDeletedDocuments();
    }

    @PutMapping("/{id}/restore")
    @Operation(summary = "Khôi phục tài liệu", description = "Khôi phục tài liệu từ thùng rác", security = @SecurityRequirement(name = "bearerAuth"))
    public Document restoreDocument(@PathVariable Long id) {
        return documentService.restoreDocument(id);
    }

    @DeleteMapping("/{id}/hard-delete")
    @Operation(summary = "Xóa vĩnh viễn tài liệu", description = "Xóa vĩnh viễn tài liệu và các file vật lý trên MinIO", security = @SecurityRequirement(name = "bearerAuth"))
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hardDeleteDocument(@PathVariable Long id) {
        documentService.hardDeleteDocument(id);
    }

}