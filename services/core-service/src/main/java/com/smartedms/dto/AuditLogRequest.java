package com.smartedms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    private Long actorId;
    private String actorName;
    private String action;
    private String entityType;
    private Long entityId;
    private Map<String, Object> details;
}
