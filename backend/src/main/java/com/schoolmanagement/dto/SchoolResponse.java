package com.schoolmanagement.dto;

import lombok.Data;

@Data
public class SchoolResponse {
    private String id;
    private String name;
    private String city;
    private String region;
    private String level;
    private String status;
    private String address;
    private Integer students;
}
