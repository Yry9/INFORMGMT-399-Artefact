package com.example.aianalytics.data;

import com.example.aianalytics.security.Account;
import jakarta.persistence.*;

@Entity @Table(name="students")
public class Student {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) private Account owner;
    @Column(nullable=false, length=160) private String name;
    @Column(length=80) private String studentNumber;
    @Column(length=200) private String course;
    protected Student() {}
    public Student(Account owner, String name, String studentNumber, String course) {
        this.owner=owner; this.name=name.trim(); this.studentNumber=clean(studentNumber); this.course=clean(course);
    }
    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public Long getId(){return id;} public Account getOwner(){return owner;} public String getName(){return name;}
    public String getStudentNumber(){return studentNumber;} public String getCourse(){return course;}
}
