package com.smartedms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @JsonIgnore // Không bao giờ trả về hash password qua API
    @Column(nullable = false)
    private String password;

    private String fullName;
    private String email;
    private String phoneNumber;
    private String jobTitle;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    @Column(name = "has_keystore", columnDefinition = "boolean default false")
    private boolean hasKeystore = false;

    @Column(name = "is_active", columnDefinition = "boolean default true")
    private boolean isActive = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<Role> roles = new HashSet<>();

    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.roles = new HashSet<>();
        this.roles.add(Role.ROLE_USER); // Mặc định ROLE_USER
        this.mustChangePassword = true;
        this.isActive = true;
        this.hasKeystore = false;
    }
}
