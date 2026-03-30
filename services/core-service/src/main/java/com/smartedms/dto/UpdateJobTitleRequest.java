package com.smartedms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request cập nhật chức danh công việc")
public class UpdateJobTitleRequest {

    @Schema(description = "Chức danh mới", example = "Trưởng phòng IT", requiredMode = Schema.RequiredMode.REQUIRED)
    private String jobTitle;
}
