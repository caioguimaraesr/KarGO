package com.kargo.backend.api.dto;

import jakarta.validation.constraints.NotNull;

public record FreteRespostaRequest(
    @NotNull Boolean aceitar
) {
}
