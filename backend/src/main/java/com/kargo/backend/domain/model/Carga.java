package com.kargo.backend.domain.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class Carga {

    private Long id;

    @NotBlank
    private String descricao;

    @NotBlank
    private String origem;

    @NotBlank
    private String destino;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private Double pesoKg;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal valorSugerido;

    private Boolean ativa = true;

    @NotNull
    private Embarcador embarcador;

}

