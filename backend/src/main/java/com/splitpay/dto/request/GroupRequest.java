package com.splitpay.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class GroupRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 300)
    private String description;

    /** Optional list of member userIds to add at creation time (creator is always added). */
    private List<String> memberIds;
}
