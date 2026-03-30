package com.smartedms.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit Logs", description = "Proxy cho Node.js Audit Log")
@SecurityRequirement(name = "bearerAuth")
public class AuditProxyController {

    private static final Logger log = LoggerFactory.getLogger(AuditProxyController.class);
    private static final String AUDIT_SERVICE_URL = "http://localhost:3000/api/audit/logs";
    private static final String API_KEY = "SmartEDMS_SuperSecret_2026";

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/logs")
    @Operation(summary = "Lấy log hệ thống", description = "Gửi request proxy qua Node.js service ở cổng 3000")
    public ResponseEntity<String> getAuditLogs(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String action) {

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(AUDIT_SERVICE_URL);
        if (limit != null) builder.queryParam("limit", limit);
        if (action != null) builder.queryParam("action", action);

        // Tạo header kèm x-api-key để xác thực với dịch vụ Audit
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", API_KEY);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(), HttpMethod.GET, requestEntity, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            log.error("Audit service trả về lỗi HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return ResponseEntity.status(ex.getStatusCode())
                    .body("{\"error\": \"Audit service lỗi: " + ex.getStatusCode() + "\"}");
        } catch (ResourceAccessException ex) {
            log.error("Không thể kết nối tới Audit service tại cổng 3000: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("{\"error\": \"Không thể kết nối tới dịch vụ Audit. Vui lòng kiểm tra service đã chạy chưa.\"}");
        } catch (Exception ex) {
            log.error("Lỗi không xác định khi gọi Audit service: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Lỗi hệ thống khi truy vấn audit logs.\"}");
        }
    }
}

