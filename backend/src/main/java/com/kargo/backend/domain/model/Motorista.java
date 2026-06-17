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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "motoristas")
@PrimaryKeyJoinColumn(name = "usuario_id")
@JsonPropertyOrder({"id", "nome", "email", "telefone", "senha", "tipoUsuario", "dataCadastro", "cpf", "cnh", "dataValidadeCnh", "disponivel", "avaliacaoMedia", "quantidadeAvaliacoes"})
@Getter
@Setter
@NoArgsConstructor
public class Motorista extends Usuario {

    @NotBlank
    @Pattern(regexp = "^\\d{11}$", message = "cpf deve conter 11 digitos numericos")
    @Column(unique = true, nullable = false, length = 11)
    private String cpf;

    @NotBlank
    private String cnh;

    @NotNull
    private LocalDate dataValidadeCnh;

    @NotNull
    private Boolean disponivel = true;

    @DecimalMin(value = "0.0")
    private BigDecimal avaliacaoMedia;

    private Integer quantidadeAvaliacoes = 0;

    private String chavePix;
    private String bancoNome;
    private String agencia;
    private String contaNumero;
    private String contaTipo;

    @PrePersist
    @PreUpdate
    void garantirTipoUsuario() {
        setTipoUsuario(TipoUsuario.MOTORISTA);
    }
}

