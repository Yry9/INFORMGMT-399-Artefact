package com.example.aianalytics.common;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}
    public record UserDto(Long id, String displayName, String email) {}
    public record StudentDto(Long id, String name, String studentNumber, String course, long assessmentCount) {}
    public record AssessmentDto(Long id, Long studentId, String title, String courseCode, LocalDate dueDate, String lane, String studentName, String studentNumber, String reviewStatus) {}
    public record SummaryDto(long interactions, long prompts, long outputs, long revisions, long reflections, Instant lastActivity) {}
    public record InteractionDto(Long id, Long sectionId, String type, String title, String content, Instant occurredAt, String model, int wordCount) {}
    public record SectionDto(Long id, String title, String content, int position, int wordCount) {}
    public record FindingDto(String id, Long interactionId, Long sectionId, String section, String interactionTitle, Integer similarityPercent, List<String> matchingPhrases, String aiText, String finalText, String reviewStatus, String note, boolean enoughText) {}
    public record RegisterRequest(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=120) String displayName,
                                  @jakarta.validation.constraints.Email @jakarta.validation.constraints.NotBlank String email,
                                  @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min=10,max=72) String password) {}
    public record LoginRequest(@jakarta.validation.constraints.Email @jakarta.validation.constraints.NotBlank String email,
                               @jakarta.validation.constraints.NotBlank String password) {}
    public record CreateStudentRequest(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=160) String name,
                                       @jakarta.validation.constraints.Size(max=80) String studentNumber,
                                       @jakarta.validation.constraints.Size(max=200) String course) {}
    public record CreateAssessmentRequest(@jakarta.validation.constraints.NotNull Long studentId,
                                          @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=200) String title,
                                          @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=40) String courseCode,
                                          LocalDate dueDate,
                                          @jakarta.validation.constraints.Size(max=40) String lane) {}
    public record CreateInteractionRequest(@jakarta.validation.constraints.NotBlank String type,
                                           @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=180) String title,
                                           @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=50000) String content,
                                           @jakarta.validation.constraints.Size(max=120) String model, Long sectionId) {}
    public record CreateSectionRequest(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=180) String title,
                                       @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=50000) String content,
                                       @jakarta.validation.constraints.Min(0) int position) {}
    public record ReviewUpdateRequest(@jakarta.validation.constraints.NotBlank String status,
                                      @jakarta.validation.constraints.Size(max=10000) String note) {}
}
