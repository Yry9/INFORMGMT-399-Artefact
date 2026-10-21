package com.example.aianalytics.data;

import jakarta.persistence.*;

@Entity @Table(name="final_work_sections")
public class FinalWorkSection {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Assessment assessment;
    @Column(nullable=false, length=180) private String title;
    @Column(nullable=false, length=50000) private String content;
    @Column(nullable=false) private int position;
    protected FinalWorkSection() {}
    public FinalWorkSection(Assessment assessment, String title, String content, int position) {
        this.assessment=assessment; this.title=title.trim(); this.content=content.trim(); this.position=position;
    }
    public Long getId(){return id;} public Assessment getAssessment(){return assessment;} public String getTitle(){return title;}
    public String getContent(){return content;} public int getPosition(){return position;}
}
