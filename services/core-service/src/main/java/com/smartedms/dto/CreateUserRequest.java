package com.smartedms.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request admin tạo tài khoản")
public class CreateUserRequest {

    @Schema(description = "Tên đăng nhập", example = "member01", requiredMode = Schema.RequiredMode.REQUIRED)
    private String username;

    @Schema(description = "Email", example = "member01@smartedms.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @Schema(description = "Họ tên", example = "Member One", requiredMode = Schema.RequiredMode.REQUIRED)
    private String fullName;

    @Schema(description = "Số điện thoại", example = "0909123456")
    private String phoneNumber;

    @Schema(description = "Chức danh", example = "Trưởng phòng IT")
    private String jobTitle;

    @Schema(description = "Role tài khoản do admin chọn", example = "ROLE_USER", requiredMode = Schema.RequiredMode.REQUIRED)
    private String role;
}
