package com.kargo.backend.domain.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Veiculo {

    private Long id;

    @NotNull
    private Boolean ativo = true;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private Double capacidadeKg;

    @NotNull
    private TipoVeiculo tipoVeiculo;

    @NotNull
    private Integer ano;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    @NotBlank
    private String placa;

    @NotNull
    private Motorista motorista;
}


