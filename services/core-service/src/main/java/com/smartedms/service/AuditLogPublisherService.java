package com.smartedms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartedms.dto.AuditLogRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditLogPublisherService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private static final String TOPIC = "smartedms.audit.logs";

    public AuditLogPublisherService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Async
    public void publishLog(AuditLogRequest request) {
        try {
            String jsonLogMessage = objectMapper.writeValueAsString(request);
            kafkaTemplate.send(TOPIC, jsonLogMessage);
        } catch (Exception e) {
            // Fault Tolerance: Fire-and-Forget
            System.err.println("Lỗi gửi Audit Log tới Kafka: " + e.getMessage());
        }
    }
}
