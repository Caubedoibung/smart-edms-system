package com.smartedms.config;

import com.smartedms.entity.Role;
import com.smartedms.entity.User;
import com.smartedms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("🌱 Starting data seeding...");

            // 1. Tạo Admin User
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Admin User");
            admin.setEmail("admin@smartedms.com");
            admin.setPhoneNumber("0901234567");
            Set<Role> adminRoles = new HashSet<>();
            adminRoles.add(Role.ROLE_ADMIN);
            adminRoles.add(Role.ROLE_USER);
            admin.setRoles(adminRoles);
            admin.setMustChangePassword(false);
            userRepository.save(admin);
            log.info("✅ Created admin user: username=admin, password=admin123");

            // 2. Tạo Manager User
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword(passwordEncoder.encode("manager123"));
            manager.setFullName("Manager User");
            manager.setEmail("manager@smartedms.com");
            manager.setPhoneNumber("0902345678");
            Set<Role> managerRoles = new HashSet<>();
            managerRoles.add(Role.ROLE_MANAGER);
            managerRoles.add(Role.ROLE_USER);
            manager.setRoles(managerRoles);
            manager.setMustChangePassword(false);
            userRepository.save(manager);
            log.info("✅ Created manager user: username=manager, password=manager123");

            // 3. Tạo Regular User
            User user = new User();
            user.setUsername("user");
            user.setPassword(passwordEncoder.encode("user123"));
            user.setFullName("Regular User");
            user.setEmail("user@smartedms.com");
            user.setPhoneNumber("0903456789");
            Set<Role> userRoles = new HashSet<>();
            userRoles.add(Role.ROLE_USER);
            user.setRoles(userRoles);
            user.setMustChangePassword(false);
            userRepository.save(user);
            log.info("✅ Created regular user: username=user, password=user123");

            log.info("🎉 Data seeding completed! Total users: {}", userRepository.count());
        } else {
            log.info("📊 Database already contains {} users. Skipping data seeding.", userRepository.count());
        }
    }
}
