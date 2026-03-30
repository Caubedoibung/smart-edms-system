package com.smartedms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request đổi mật khẩu lần đăng nhập đầu tiên")
public class FirstLoginPasswordChangeRequest {

    @Schema(description = "Mật khẩu hiện tại (mật khẩu tạm admin đã cấp)", example = "TempPass@123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String currentPassword;

    @Schema(description = "Mật khẩu mới", example = "NewPass@2026", requiredMode = Schema.RequiredMode.REQUIRED)
    private String newPassword;
}
