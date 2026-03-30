package com.smartedms.controller;

import com.smartedms.dto.LoginRequest;
import com.smartedms.dto.AuthResponse;
import com.smartedms.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // 1. Xác thực User/Pass (Spring Security tự làm bước check DB)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()));

        // 2. Nếu đúng Pass -> Sinh Token với roles từ Authentication
        String token = jwtUtils.generateToken(
                authentication.getName(),
                authentication.getAuthorities());

        // 3. Trả về cho Client
        return ResponseEntity.ok(new AuthResponse(token, "Bearer"));
    }
}
