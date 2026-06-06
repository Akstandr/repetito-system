package dev.andrew.repetitobackend.accounts.dto;

import lombok.Data;

@Data
public class StudentProfileRequest {

    private String description;
    private String subjects;
    private String gradeLevel;
    private String format;
}
