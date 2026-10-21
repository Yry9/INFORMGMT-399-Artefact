package com.example.aianalytics.data;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="review_records", uniqueConstraints=@UniqueConstraint(columnNames={"assessment_id","interaction_id","section_id"}))
public class ReviewRecord {
    public enum Status { OPEN, FLAGGED, REVIEWED }
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Assessment assessment;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Interaction interaction;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private FinalWorkSection section;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private Status status=Status.OPEN;
    @Column(length=10000) private String note;
    @Column(nullable=false) private Instant updatedAt=Instant.now();
    protected ReviewRecord() {}
    public ReviewRecord(Assessment assessment, Interaction interaction, FinalWorkSection section) {
        this.assessment=assessment; this.interaction=interaction; this.section=section;
    }
    public void update(Status status, String note) { this.status=status; this.note=note == null || note.isBlank() ? null : note.trim(); this.updatedAt=Instant.now(); }
    public Long getId(){return id;} public Status getStatus(){return status;} public String getNote(){return note;}
}
