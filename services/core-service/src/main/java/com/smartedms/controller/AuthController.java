package com.smartedms.controller;

import com.smartedms.dto.LoginRequest;
import com.smartedms.dto.FirstLoginPasswordChangeRequest;
import com.smartedms.dto.AuthResponse;
import com.smartedms.dto.AuditLogRequest;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import com.smartedms.service.AuditLogPublisherService;
import com.smartedms.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API xác thực người dùng")
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final JwtUtils jwtUtils;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final AuditLogPublisherService auditLogPublisherService;

        @Operation(summary = "Đăng nhập", description = "Xác thực người dùng và trả về JWT token")
        @SecurityRequirements
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
                        @ApiResponse(responseCode = "401", description = "Sai email hoặc mật khẩu"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ")
        })
        @PostMapping("/login")
        public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
                // 1. Xác thực User/Pass (Spring Security tự làm bước check DB)
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                loginRequest.getEmail(),
                                                loginRequest.getPassword()));

                // 2. Nếu đúng Pass -> Sinh Token với roles từ Authentication
                String token = jwtUtils.generateToken(
                                authentication.getName(),
                                authentication.getAuthorities());

                User user = userRepository.findByUsername(authentication.getName())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                                "User not found"));

                // Ghi audit log LOGIN – fire-and-forget, không để lỗi log cản đăng nhập
                try {
                        auditLogPublisherService.publishLog(AuditLogRequest.builder()
                                        .actorId(user.getId())
                                        .actorName(user.getUsername())
                                        .action("LOGIN")
                                        .entityType("USER")
                                        .entityId(user.getId())
                                        .build());
                } catch (Exception e) {
                        System.err.println("Audit log failed for LOGIN: " + e.getMessage());
                }

                // 3. Trả về cho Client
                return ResponseEntity.ok(new AuthResponse(token, "Bearer", user.isMustChangePassword()));
        }

        @Operation(summary = "Đổi mật khẩu lần đầu", description = "User đổi mật khẩu tạm do admin cấp ở lần đăng nhập đầu tiên")
        @SecurityRequirement(name = "bearerAuth")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Map.class))),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "401", description = "Chưa đăng nhập hoặc token không hợp lệ")
        })
        @PostMapping("/change-password-first-time")
        public ResponseEntity<Map<String, String>> changePasswordFirstTime(
                        @RequestBody FirstLoginPasswordChangeRequest request) {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
                }

                if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 8) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "New password must be at least 8 characters");
                }

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                user.setMustChangePassword(false);
                userRepository.save(user);

                return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }
}
