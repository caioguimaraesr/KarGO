package com.kargo.backend.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvaliacaoDto(
        @NotNull(message = "A nota é obrigatória")
        @Min(value = 1, message = "A nota mínima é 1 estrela")
        @Max(value = 5, message = "A nota máxima é 5 estrelas")
        Integer nota,

        String comentario
) {}
