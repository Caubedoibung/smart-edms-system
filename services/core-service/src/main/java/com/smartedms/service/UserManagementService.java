package com.smartedms.service;

import com.smartedms.dto.AuditLogRequest;
import com.smartedms.dto.CreateUserRequest;
import com.smartedms.dto.UpdateJobTitleRequest;
import com.smartedms.entity.Role;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String defaultPassword;
    private final AuditLogPublisherService auditLogPublisherService;

    public UserManagementService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.user.default-password}") String defaultPassword,
            AuditLogPublisherService auditLogPublisherService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultPassword = defaultPassword;
        this.auditLogPublisherService = auditLogPublisherService;
    }

    @Transactional
    public User createByAdmin(CreateUserRequest request) {
        String username = normalize(request.getUsername());
        String email = normalize(request.getEmail());
        String fullName = normalize(request.getFullName());
        String roleValue = normalize(request.getRole());

        if (username.isBlank() || email.isBlank() || fullName.isBlank() || roleValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        if (defaultPassword == null || defaultPassword.trim().length() < 8) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "System default password is not configured correctly");
        }

        if (userRepository.findByUsernameOrEmail(username, email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username or email already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setJobTitle(request.getJobTitle());
        user.setPassword(passwordEncoder.encode(defaultPassword.trim()));
        user.setMustChangePassword(true);
        user.setRoles(resolveRoles(roleValue));

        User savedUser = userRepository.save(user);

        // Audit log – fault tolerant: không để lỗi log làm hỏng luồng tạo user
        try {
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User adminUser = userRepository.findByUsername(adminUsername).orElse(null);
            Long adminId = adminUser != null ? adminUser.getId() : null;

            auditLogPublisherService.publishLog(AuditLogRequest.builder()
                    .actorId(adminId)
                    .actorName(adminUsername)
                    .action("CREATE_USER")
                    .entityType("USER")
                    .entityId(savedUser.getId())
                    .details(Map.of("createdUsername", savedUser.getUsername(), "role", roleValue))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for CREATE_USER: " + e.getMessage());
        }

        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Tìm kiếm người dùng với phân trang và lọc theo từ khóa.
     * Frontend tự xử lý cả hai dạng response: array thuần và Page object.
     */
    public Page<User> searchUsers(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.searchUsers(keyword, pageable);
    }

    public List<User> getManagers() {
        return userRepository.findByRole(Role.ROLE_MANAGER);
    }

    @Transactional
    public void resetKeystoreStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setHasKeystore(false);
        userRepository.save(user);

        // Audit log – fault tolerant
        try {
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(AuditLogRequest.builder()
                    .actorName(adminUsername)
                    .action("RESET_KEYSTORE")
                    .entityType("USER")
                    .entityId(user.getId())
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for RESET_KEYSTORE: " + e.getMessage());
        }
    }

    @Transactional
    public void updateUserStatus(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(isActive);
        userRepository.save(user);

        // Audit log – fault tolerant; dùng TOGGLE_USER_STATUS theo convention Frontend
        try {
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(AuditLogRequest.builder()
                    .actorName(adminUsername)
                    .action("TOGGLE_USER_STATUS")
                    .entityType("USER")
                    .entityId(user.getId())
                    .details(Map.of("isActive", isActive))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for TOGGLE_USER_STATUS: " + e.getMessage());
        }
    }

    /**
     * Cập nhật chức danh (job title) của người dùng.
     * Endpoint: PUT /api/users/{id}/job-title
     */
    @Transactional
    public User updateJobTitle(Long userId, UpdateJobTitleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getJobTitle() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jobTitle không được để trống");
        }

        user.setJobTitle(request.getJobTitle().trim());
        User savedUser = userRepository.save(user);

        // Audit log – fault tolerant
        try {
            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            auditLogPublisherService.publishLog(AuditLogRequest.builder()
                    .actorName(adminUsername)
                    .action("UPDATE_USER")
                    .entityType("USER")
                    .entityId(user.getId())
                    .details(Map.of("field", "jobTitle", "newValue", user.getJobTitle()))
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log failed for UPDATE_USER (job-title): " + e.getMessage());
        }

        return savedUser;
    }

    /**
     * Kiểm tra user đã sở hữu chữ ký số hay chưa.
     * Dùng để chặn việc tạo keystore lần 2 nếu chưa được Admin reset.
     */
    public boolean hasKeystoreByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.isHasKeystore();
    }

    @Transactional
    public void updateKeystoreStatusByUsername(String username, boolean hasKeystore) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setHasKeystore(hasKeystore);
        userRepository.save(user);
    }

    private Set<Role> resolveRoles(String roleValue) {
        String normalized = roleValue.toUpperCase(Locale.ROOT);
        Role selectedRole;
        try {
            selectedRole = Role.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "role must be one of ROLE_USER, ROLE_MANAGER, ROLE_ADMIN");
        }

        if (selectedRole == Role.ROLE_MANAGER || selectedRole == Role.ROLE_ADMIN) {
            return Set.of(selectedRole, Role.ROLE_USER);
        }

        return Set.of(selectedRole);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
