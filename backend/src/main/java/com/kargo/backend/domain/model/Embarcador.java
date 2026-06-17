package com.kargo.backend.domain.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@JsonPropertyOrder({"id", "nome", "email", "telefone", "senha", "tipoUsuario", "dataCadastro", "cpfCnpj", "avaliacaoMedia", "quantidadeAvaliacoes"})
@Getter
@Setter
@NoArgsConstructor
public class Embarcador extends Usuario {

    @NotBlank
    @Pattern(regexp = "^(\\d{11}|\\d{14})$", message = "cpfCnpj deve conter 11 ou 14 digitos numericos")
    private String cpfCnpj;

    @DecimalMin(value = "0.0")
    private BigDecimal avaliacaoMedia;

    private Integer quantidadeAvaliacoes = 0;
}


