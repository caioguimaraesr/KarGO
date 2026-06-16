package com.kargo.backend.domain.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "embarcadores")
@PrimaryKeyJoinColumn(name = "usuario_id")
@JsonPropertyOrder({"id", "nome", "email", "telefone", "senha", "tipoUsuario", "dataCadastro", "cpfCnpj", "avaliacaoMedia", "quantidadeAvaliacoes"})
@Getter
@Setter
@NoArgsConstructor
public class Embarcador extends Usuario {

    @NotBlank
    @Pattern(regexp = "^(\\d{11}|\\d{14})$", message = "cpfCnpj deve conter 11 ou 14 digitos numericos")
    @Column(unique = true, nullable = false)
    private String cpfCnpj;

    @jakarta.validation.constraints.DecimalMin(value = "0.0")
    private java.math.BigDecimal avaliacaoMedia;

    private Integer quantidadeAvaliacoes = 0;

    @PrePersist
    @PreUpdate
    void garantirTipoUsuario() {
        setTipoUsuario(TipoUsuario.EMBARCADOR);
    }
}


