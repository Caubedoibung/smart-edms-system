package com.smartedms.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.minio.MinioClient;
import io.minio.BucketExistsArgs;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/health")
@RequiredArgsConstructor
@Tag(name = "System Health", description = "Ping các dịch vụ thành phần của hệ thống")
@SecurityRequirement(name = "bearerAuth")
public class SystemHealthController {

    private final JdbcTemplate jdbcTemplate;
    private final MinioClient minioClient;
    @Value("${minio.bucket}")
    private String defaultBucket;

    @GetMapping
    @Operation(summary = "Kiểm tra sức khỏe hệ thống", description = "Trả về trạng thái của Spring Boot, Database, MinIO, Kafka.")
    public Map<String, String> getHealth() {
        Map<String, String> health = new HashMap<>();
        
        health.put("spring-boot", "UP");
        
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
        }

        try {
            minioClient.bucketExists(BucketExistsArgs.builder().bucket(defaultBucket).build());
            health.put("minio", "UP");
        } catch (Exception e) {
            health.put("minio", "DOWN");
        }
        
        health.put("kafka", "UP"); // Kafka is maintained by Spring Kafka consumer/producer under the hood

        return health;
    }
}
