package com.smartedms.service;

import com.smartedms.entity.Document;
import com.smartedms.entity.DocumentVersion;
import com.smartedms.repository.DocumentRepository;
import com.smartedms.repository.DocumentVersionRepository;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class DocumentSigningService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final MinioClient minioClient;
    private final String defaultBucket;
    private final DigitalSignatureService digitalSignatureService;
    private final PdfSignatureService pdfSignatureService;
    private final AuditLogPublisherService auditLogPublisherService;

    public DocumentSigningService(
            DocumentRepository documentRepository,
            DocumentVersionRepository documentVersionRepository,
            MinioClient minioClient,
            @Value("${minio.bucket}") String defaultBucket,
            DigitalSignatureService digitalSignatureService,
            PdfSignatureService pdfSignatureService,
            AuditLogPublisherService auditLogPublisherService) {
        this.documentRepository = documentRepository;
        this.documentVersionRepository = documentVersionRepository;
        this.minioClient = minioClient;
        this.defaultBucket = defaultBucket;
        this.digitalSignatureService = digitalSignatureService;
        this.pdfSignatureService = pdfSignatureService;
        this.auditLogPublisherService = auditLogPublisherService;
    }

    @Transactional
    public DocumentVersion signDocument(Long documentId, Long userId, InputStream p12Stream, String password, String reason, String location) {
        Document document = documentRepository.findById(documentId)
                .filter(existing -> !existing.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        DocumentVersion currentVersion = documentVersionRepository.findByDocumentIdAndIsCurrentTrue(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document version not found"));

        try {
            // 1. Giải mã khóa P12
            DigitalSignatureService.KeyStoreData keyStoreData = digitalSignatureService.extractKeyStoreData(p12Stream, password);

            // 2. Fetch V1
            String filePath = currentVersion.getFilePath();
            String objectKey = filePath.substring(filePath.indexOf("/") + 1);
            InputStream pdfStream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(objectKey)
                            .build());

            // 3. Ký PDF
            byte[] signedPdfBytes = pdfSignatureService.signPdf(pdfStream, keyStoreData.getPrivateKey(), keyStoreData.getCertificateChain(), reason, location);

            // 4. Update MinIO V2
            String newObjectKey = buildObjectKey(document.getFolderId(), UUID.randomUUID() + "-signed-" + document.getName());
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(newObjectKey)
                            .stream(new ByteArrayInputStream(signedPdfBytes), signedPdfBytes.length, -1)
                            .contentType(MediaType.APPLICATION_PDF_VALUE)
                            .build());

            // 5. V1 -> false
            currentVersion.setCurrent(false);
            documentVersionRepository.save(currentVersion);

            // 6. Insert V2 -> true
            DocumentVersion newVersion = new DocumentVersion();
            newVersion.setDocumentId(document.getId());
            newVersion.setVersionNumber(currentVersion.getVersionNumber() + 1);
            newVersion.setFilePath(defaultBucket + "/" + newObjectKey);
            newVersion.setCreatedBy(userId);
            newVersion.setCurrent(true);
            
            // 7. Update Document Status (nếu hệ thống có trường status, ở đây dùng name tạm ghi là đã ký hoặc thực tế để Audit Log).
            document.setStatus(com.smartedms.entity.DocumentStatus.SIGNED);
            documentRepository.save(document);
            
            String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(com.smartedms.dto.AuditLogRequest.builder()
                    .actorId(userId)
                    .actorName(username)
                    .action("SIGN_DOCUMENT")
                    .entityType("DOCUMENT")
                    .entityId(document.getId())
                    .details(java.util.Map.of("name", document.getName(), "reason", reason != null ? reason : ""))
                    .build());

            return documentVersionRepository.save(newVersion);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi ký số tài liệu: " + e.getMessage(), e);
        }
    }

    private String buildObjectKey(Long folderId, String storedFileName) {
        LocalDate today = LocalDate.now();
        String folderSegment = folderId == null ? "root" : "folder-" + folderId;
        return "documents/"
                + folderSegment + "/"
                + today.getYear() + "/"
                + String.format("%02d", today.getMonthValue()) + "/"
                + storedFileName;
    }
}
