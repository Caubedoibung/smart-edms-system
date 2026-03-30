package com.smartedms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Schema(description = "Response trả về sau khi đăng nhập thành công")
public class AuthResponse {

    @Schema(description = "JWT Access Token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;

    @Schema(description = "Loại token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "Bắt buộc đổi mật khẩu ngay sau lần đăng nhập này", example = "false")
    private boolean mustChangePassword;

    public AuthResponse(String token, String tokenType) {
        this.token = token;
        this.tokenType = tokenType;
        this.mustChangePassword = false;
    }

    public AuthResponse(String token, String tokenType, boolean mustChangePassword) {
        this.token = token;
        this.tokenType = tokenType;
        this.mustChangePassword = mustChangePassword;
    }
}
