package com.kargo.backend.application.service;

import com.kargo.backend.api.dto.LoginRequest;
import com.kargo.backend.api.dto.LoginResponse;
import com.kargo.backend.domain.exception.CredenciaisInvalidasException;
import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.repository.UsuarioRepository;
import com.kargo.backend.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        String login = request.login().trim().toLowerCase();
        String loginDigits = login.replaceAll("\\D", "");

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(login)
                .or(() -> usuarioRepository.findByTelefone(loginDigits))
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuario ou senha invalidos"));

        if (!passwordEncoder.matches(request.senha(), usuario.getSenha())) {
            throw new CredenciaisInvalidasException("Usuario ou senha invalidos");
        }

        String token = jwtUtil.generate(usuario.getId(), usuario.getTipoUsuario().name());

        return new LoginResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
            usuario.getTelefone(),
                usuario.getTipoUsuario().name()
        );
    }
}
