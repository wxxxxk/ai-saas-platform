package com.wxxk.aisaas.credit.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record TopUpRequest(
        @Min(1) @Max(10000) int amount
) {}
