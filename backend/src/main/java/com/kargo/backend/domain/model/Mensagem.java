package com.kargo.backend.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensagens")
@Getter
@Setter
@NoArgsConstructor
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long motoristaId;

    @NotNull
    private Long embarcadorId;

    private Long freteId;

    private Long cargaId;

    @NotBlank
    private String remetente; // "MOTORISTA" ou "EMBARCADOR"

    @NotBlank
    @jakarta.persistence.Column(length = 2000)
    private String texto;

    @NotNull
    private LocalDateTime dataEnvio = LocalDateTime.now();

    private String rota;

}
