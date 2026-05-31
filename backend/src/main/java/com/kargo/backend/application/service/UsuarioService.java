package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private static final String CPF_REGEX = "^\\d{11}$";
    private static final String CNPJ_REGEX = "^\\d{14}$";


    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado: " + id));
    }

    @Transactional
    public Usuario criar(Usuario usuario) {
        usuario.setId(null);
        validarDocumentoPorTipo(usuario);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario atualizar(Long id, Usuario usuarioAtualizado) {
        Usuario usuario = buscarPorId(id);
        usuario.setNome(usuarioAtualizado.getNome());
        usuario.setEmail(usuarioAtualizado.getEmail());
        usuario.setTelefone(usuarioAtualizado.getTelefone());
        usuario.setTipo(usuarioAtualizado.getTipo());
        usuario.setCpf(usuarioAtualizado.getCpf());
        usuario.setCnpj(usuarioAtualizado.getCnpj());
        validarDocumentoPorTipo(usuario);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void deletar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuarioRepository.delete(usuario);
    }

    private void validarDocumentoPorTipo(Usuario usuario) {
        String cpf = normalizarDigitos(usuario.getCpf());
        String cnpj = normalizarDigitos(usuario.getCnpj());

        if (usuario.getTipo() == TipoUsuario.MOTORISTA) {
            if (cpf == null || !cpf.matches(CPF_REGEX)) {
                throw new IllegalArgumentException("Motorista precisa informar um CPF valido com 11 digitos");
            }
            usuario.setCpf(cpf);
            usuario.setCnpj(null);
            return;
        }

        if (usuario.getTipo() == TipoUsuario.EMBARCADOR || usuario.getTipo() == TipoUsuario.PME) {
            if (cnpj == null || !cnpj.matches(CNPJ_REGEX)) {
                throw new IllegalArgumentException("Embarcador/PME precisa informar um CNPJ valido com 14 digitos");
            }
            usuario.setCnpj(cnpj);
            usuario.setCpf(null);
        }
    }

    private String normalizarDigitos(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.replaceAll("\\D", "");
    }
}

