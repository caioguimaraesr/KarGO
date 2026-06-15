package com.kargo.backend.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MeResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String tipoUsuario,
        LocalDateTime dataCadastro,
        // Motorista-specific
        String cpf,
        String cnh,
        LocalDate dataValidadeCnh,
        Boolean disponivel,
        BigDecimal avaliacaoMedia,
        Integer quantidadeAvaliacoes,
        // Embarcador-specific
        String cpfCnpj,
        // Dados Bancários
        String chavePix,
        String bancoNome,
        String agencia,
        String contaNumero,
        String contaTipo
) {}
