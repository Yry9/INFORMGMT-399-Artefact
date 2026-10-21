package com.example.aianalytics.data;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="interactions", indexes=@Index(columnList="assessment_id, occurred_at"))
public class Interaction {
    public enum Type { PROMPT, AI_OUTPUT, REVISION, REFLECTION }
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Assessment assessment;
    @ManyToOne(fetch=FetchType.LAZY) private FinalWorkSection section;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private Type type;
    @Column(nullable=false, length=180) private String title;
    @Column(nullable=false, length=50000) private String content;
    @Column(nullable=false) private Instant occurredAt=Instant.now();
    @Column(length=120) private String model;
    protected Interaction() {}
    public Interaction(Assessment assessment, Type type, String title, String content, String model, FinalWorkSection section) {
        this.assessment=assessment; this.type=type; this.section=section; this.title=title.trim(); this.content=content.trim();
        this.model=model == null || model.isBlank() ? null : model.trim();
    }
    public Long getId(){return id;} public Assessment getAssessment(){return assessment;} public FinalWorkSection getSection(){return section;} public Type getType(){return type;}
    public String getTitle(){return title;} public String getContent(){return content;} public Instant getOccurredAt(){return occurredAt;}
    public String getModel(){return model;}
}
