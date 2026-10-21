package com.example.aianalytics.security;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "accounts", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String displayName;
    @Column(nullable = false, length = 254) private String email;
    @Column(nullable = false, length = 100) private String passwordHash;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected Account() {}
    public Account(String displayName, String email, String passwordHash) {
        this.displayName = displayName;
        this.email = email.toLowerCase(java.util.Locale.ROOT);
        this.passwordHash = passwordHash;
    }
    public Long getId() { return id; }
    public String getDisplayName() { return displayName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
}
