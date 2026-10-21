package com.example.aianalytics.data;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity @Table(name="assessments")
public class Assessment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Student student;
    @Column(nullable=false, length=200) private String title;
    @Column(nullable=false, length=40) private String courseCode;
    private LocalDate dueDate;
    @Column(length=40) private String lane;
    @Column(nullable=false, updatable=false) private Instant createdAt=Instant.now();
    protected Assessment() {}
    public Assessment(Student student, String title, String courseCode, LocalDate dueDate, String lane) {
        this.student=student; this.title=title.trim(); this.courseCode=courseCode.trim(); this.dueDate=dueDate;
        this.lane=lane == null || lane.isBlank() ? "Lane 2" : lane.trim();
    }
    public Long getId(){return id;} public Student getStudent(){return student;} public String getTitle(){return title;}
    public String getCourseCode(){return courseCode;} public LocalDate getDueDate(){return dueDate;} public String getLane(){return lane;}
}
