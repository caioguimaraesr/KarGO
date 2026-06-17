package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Usuario;

import java.util.Optional;
import java.util.List;

public interface UsuarioRepository {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    Optional<Usuario> findByTelefone(String telefone);

    Optional<Usuario> findById(Long id);

    Usuario save(Usuario usuario);

    void delete(Long id);

    void update(Usuario usuario);

    List<Usuario> findAll();
}

