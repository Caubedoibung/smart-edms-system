package com.smartedms.controller;

import com.smartedms.dto.CreateUserRequest;
import com.smartedms.dto.UpdateJobTitleRequest;
import com.smartedms.entity.User;
import com.smartedms.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "API quản trị tài khoản")
@SecurityRequirement(name = "bearerAuth")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    /**
     * Lấy danh sách người dùng có phân trang và tìm kiếm theo keyword.
     * Frontend hỗ trợ nhận cả array thuần lẫn Page object.
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng",
               description = "Tìm kiếm và phân trang danh sách tất cả người dùng trong hệ thống. " +
                             "Hỗ trợ lọc theo keyword (fullName, username, email).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập"),
            @ApiResponse(responseCode = "403", description = "Không có quyền admin")
    })
    public Page<User> getUsers(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userManagementService.searchUsers(keyword, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Admin tạo tài khoản",
               description = "Admin nhập thông tin, chọn role. Hệ thống tự gán mật khẩu mặc định và bắt buộc đổi mật khẩu ở lần đăng nhập đầu",
               requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                       description = "Thông tin tài khoản cần tạo",
                       required = true,
                       content = @Content(schema = @Schema(implementation = CreateUserRequest.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tạo tài khoản thành công",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @ApiResponse(responseCode = "401", description = "Chưa đăng nhập"),
            @ApiResponse(responseCode = "403", description = "Không có quyền admin"),
            @ApiResponse(responseCode = "409", description = "Username hoặc email đã tồn tại")
    })
    public User createUser(@RequestBody CreateUserRequest request) {
        return userManagementService.createByAdmin(request);
    }

    /**
     * Cập nhật chức danh công việc của nhân viên.
     * Frontend gọi: PUT /api/users/{id}/job-title với body { "jobTitle": "..." }
     */
    @PutMapping("/{id}/job-title")
    @Operation(summary = "Cập nhật chức danh công việc",
               description = "Admin sửa chức danh (Job Title) của nhân viên.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy người dùng")
    })
    public User updateJobTitle(@PathVariable Long id, @RequestBody UpdateJobTitleRequest request) {
        return userManagementService.updateJobTitle(id, request);
    }

    @GetMapping("/org-chart")
    @Operation(summary = "Lấy sơ đồ tổ chức", description = "Lấy danh sách tất cả user trong hệ thống.")
    public List<User> getOrgChart() {
        return userManagementService.getAllUsers();
    }

    @GetMapping("/keystore")
    @Operation(summary = "Quản lý Chứng thư số", description = "Xem danh sách Manager và trạng thái khởi tạo khóa .p12 của họ.")
    public List<User> getManagerKeystoreStatus() {
        return userManagementService.getManagers();
    }

    @PutMapping("/{id}/keystore/reset")
    @Operation(summary = "Reset trạng thái Chứng thư số", description = "Admin reset trạng thái để Manager tự tạo lại khóa nếu bị mất.")
    public void resetKeystoreStatus(@PathVariable Long id) {
        userManagementService.resetKeystoreStatus(id);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Khóa/Mở khóa tài khoản", description = "Đổi trạng thái tài khoản nhân viên (isActive = true/false).")
    public void updateUserStatus(@PathVariable Long id, @RequestParam boolean isActive) {
        userManagementService.updateUserStatus(id, isActive);
    }
}
