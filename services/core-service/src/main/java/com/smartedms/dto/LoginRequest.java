package com.smartedms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request body cho đăng nhập")
public class LoginRequest {

    @Schema(description = "Email người dùng", example = "admin@smartedms.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(description = "Mật khẩu", example = "password123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
