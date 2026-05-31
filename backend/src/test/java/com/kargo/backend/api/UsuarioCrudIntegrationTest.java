package com.kargo.backend.api;

import com.kargo.backend.application.service.UsuarioService;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class UsuarioCrudIntegrationTest {

    @Autowired
    private UsuarioService usuarioService;

    @Test
    void deveCriarEListarUsuarios() {
        Usuario usuario = new Usuario();
        usuario.setNome("Joao Motorista");
        usuario.setEmail("joao@kargo.com");
        usuario.setTelefone("81999999999");
        usuario.setTipo(TipoUsuario.MOTORISTA);
        usuario.setCpf("12345678901");

        Usuario salvo = usuarioService.criar(usuario);
        assertNotNull(salvo.getId());

        var usuarios = usuarioService.listar();
        assertFalse(usuarios.isEmpty());
        assertEquals("joao@kargo.com", usuarios.getFirst().getEmail());
        assertEquals("12345678901", usuarios.getFirst().getCpf());
    }
}


