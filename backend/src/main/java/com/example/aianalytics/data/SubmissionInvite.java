package com.example.aianalytics.data;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "submission_invites", indexes = @Index(columnList = "assessment_id, created_at"))
public class SubmissionInvite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Assessment assessment;
    @Column(nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();
    private Instant submittedAt;
    @Column(nullable = false) private boolean revoked = false;

    protected SubmissionInvite() {}
    public SubmissionInvite(Assessment assessment, String tokenHash) {
        this.assessment = assessment;
        this.tokenHash = tokenHash;
    }
    public Long getId() { return id; }
    public Assessment getAssessment() { return assessment; }
    public String getTokenHash() { return tokenHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSubmittedAt() { return submittedAt; }
    public boolean isRevoked() { return revoked; }
    public void revoke() { this.revoked = true; }
    public void markSubmitted() { this.submittedAt = Instant.now(); }
}
