package com.kargo.backend.api;

import com.kargo.backend.application.service.MotoristaService;
import com.kargo.backend.domain.model.Motorista;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class UsuarioCrudIntegrationTest {

    @Autowired
    private MotoristaService motoristaService;

    @Test
    void deveCriarEListarMotoristas() {
        Motorista motorista = new Motorista();
        motorista.setNome("Joao Motorista");
        motorista.setEmail("joao@kargo.com");
        motorista.setTelefone("81999999999");
        motorista.setSenha("123456");
        motorista.setCpf("12345678901");
        motorista.setCnh("12345678900");
        motorista.setDataValidadeCnh(LocalDate.now().plusYears(2));
        motorista.setDisponivel(true);

        Motorista salvo = motoristaService.criar(motorista);
        assertNotNull(salvo.getId());

        var motoristas = motoristaService.listar();
        assertFalse(motoristas.isEmpty());
        assertEquals("joao@kargo.com", motoristas.getFirst().getEmail());
        assertEquals("12345678901", motoristas.getFirst().getCpf());
    }
}


