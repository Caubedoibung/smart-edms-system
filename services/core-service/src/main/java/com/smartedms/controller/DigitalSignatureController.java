package com.smartedms.controller;

import com.smartedms.service.DigitalSignatureService;
import com.smartedms.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.security.cert.X509Certificate;
import java.util.List;
import com.smartedms.service.PdfSignatureVerificationService;

@RestController
@RequestMapping("/api/v1/signature")
@RequiredArgsConstructor
@Tag(name = "Digital Signature API", description = "Endpoints cho việc tạo và xử lý Chứng thư số (Keystore .p12)")
public class DigitalSignatureController {

    private final DigitalSignatureService signatureService;
    private final PdfSignatureVerificationService verificationService;
    private final UserManagementService userManagementService;

    @Operation(summary = "Tạo mới cặp khóa RSA và trả về file .p12 (Keystore)")
    @PostMapping("/generate-keystore")
    public ResponseEntity<?> generateKeyStore(
            @RequestParam String commonName,
            @RequestParam String password,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Chặn tạo keystore lần 2 – yêu cầu Admin reset trước
            if (userDetails != null && userManagementService.hasKeystoreByUsername(userDetails.getUsername())) {
                return ResponseEntity.status(409)
                        .body("Tài khoản đã được cấp chữ ký số. Vui lòng liên hệ Admin để reset trước khi tạo mới.");
            }

            byte[] p12Bytes = signatureService.generateKeyStore(commonName, password);
            if (userDetails != null) {
                userManagementService.updateKeystoreStatusByUsername(userDetails.getUsername(), true);
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"keystore.p12\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(p12Bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Xác minh file .p12 và lấy thông tin chủ thể")
    @PostMapping(value = "/verify-keystore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> verifyKeyStore(
            @RequestPart("file") MultipartFile file,
            @RequestParam("password") String password) {
        try {
            DigitalSignatureService.KeyStoreData data = signatureService.extractKeyStoreData(file.getInputStream(), password);
            X509Certificate cert = (X509Certificate) data.getCertificateChain()[0];
            return ResponseEntity.ok("Xác minh thành công. Chủ thể chứng thư: " 
                    + cert.getSubjectX500Principal().getName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Xác minh keystore thất bại: " + e.getMessage());
        }
    }

    @Operation(summary = "Xác minh các chữ ký đính kèm trong file PDF")
    @PostMapping(value = "/verify-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<PdfSignatureVerificationService.SignatureVerificationResult>> verifyPdf(
            @RequestPart("pdfFile") MultipartFile pdfFile) {
        try {
            List<PdfSignatureVerificationService.SignatureVerificationResult> results = verificationService.verifySignatures(pdfFile.getInputStream());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
