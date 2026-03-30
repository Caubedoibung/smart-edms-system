package com.smartedms.filter;

import com.smartedms.repository.UserRepository;
import com.smartedms.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 1. Lấy token từ header Authorization
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Bỏ "Bearer " ra

        // 2. Validate token
        if (!jwtUtils.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Lấy username và roles từ token
        String username = jwtUtils.getUsernameFromToken(token);
        List<String> roles = jwtUtils.getRolesFromToken(token);

        // 4. Tạo UserDetails trực tiếp từ token claims (không cần query DB)
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            com.smartedms.entity.User currentUser = userRepository.findByUsername(username).orElse(null);
            if (currentUser == null) {
                filterChain.doFilter(request, response);
                return;
            }

            String path = request.getServletPath();
            boolean isAllowedPathWhenForceChange = "/api/auth/change-password-first-time".equals(path)
                    || "/api/auth/login".equals(path)
                    || path.startsWith("/swagger-ui")
                    || path.startsWith("/v3/api-docs");
            if (currentUser.isMustChangePassword() && !isAllowedPathWhenForceChange) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Bạn phải đổi mật khẩu ở lần đăng nhập đầu tiên\"}");
                return;
            }

            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            // Sử dụng password placeholder an toàn vì authentication dựa trên token đã
            // validated
            UserDetails userDetails = User.withUsername(username)
                    .password("{noop}") // Password không được sử dụng cho authentication từ token
                    .authorities(authorities)
                    .build();

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
