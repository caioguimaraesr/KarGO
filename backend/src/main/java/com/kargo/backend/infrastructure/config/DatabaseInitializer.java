package com.kargo.backend.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Inicializa o banco de dados PostgreSQL quando a aplicação inicia.
 * Executa automaticamente na inicialização da aplicação através do @PostConstruct.
 */
@Slf4j
@Configuration
public class DatabaseInitializer {

    static {
        try {
            initializeDatabase();
        } catch (Exception e) {
            log.error("Erro durante inicialização do banco de dados: {}", e.getMessage(), e);
        }
    }

    private static void initializeDatabase() {
        String datasourceUrl = System.getProperty("spring.datasource.url",
            System.getenv("SPRING_DATASOURCE_URL") != null ?
                System.getenv("SPRING_DATASOURCE_URL") :
                "jdbc:postgresql://localhost:5432/kargo");

        String username = System.getProperty("spring.datasource.username",
            System.getenv("POSTGRES_USERNAME") != null ?
                System.getenv("POSTGRES_USERNAME") :
                "postgres");

        String password = System.getProperty("spring.datasource.password",
            System.getenv("POSTGRES_PASSWORD") != null ?
                System.getenv("POSTGRES_PASSWORD") :
                "postgres");

        try {
            log.info("========================================");
            log.info("Iniciando inicialização do banco de dados");
            log.info("URL: {}", datasourceUrl);
            log.info("========================================");

            String databaseName = extractDatabaseName(datasourceUrl);
            if (databaseName == null || databaseName.isEmpty()) {
                log.warn("Não foi possível extrair o nome do banco de dados da URL");
                return;
            }

            String postgresUrl = datasourceUrl.substring(0, datasourceUrl.lastIndexOf('/') + 1) + "postgres";

            if (!databaseExists(postgresUrl, username, password, databaseName)) {
                log.info("Banco de dados '{}' não encontrado. Criando...", databaseName);
                createDatabase(postgresUrl, username, password, databaseName);
                log.info("✓ Banco de dados '{}' criado com sucesso!", databaseName);
            } else {
                log.info("✓ Banco de dados '{}' já existe.", databaseName);
            }

            // Pausa de 2 segundos para garantir que o banco está pronto
            Thread.sleep(2000);

            // Executar script de schema no banco recém-criado
            executeSchemaScript(datasourceUrl, username, password);

            log.info("========================================");
            log.info("Banco de dados inicializado com sucesso!");
            log.info("========================================");

        } catch (Exception e) {
            log.error("ERRO FATAL ao verificar/criar banco de dados: {}", e.getMessage(), e);
        }
    }

    private static String extractDatabaseName(String url) {
        try {
            return url.substring(url.lastIndexOf('/') + 1);
        } catch (Exception e) {
            log.error("Erro ao extrair nome do banco de dados da URL: {}", url);
            return null;
        }
    }

    private static boolean databaseExists(String postgresUrl, String username, String password, String databaseName) {
        try (Connection conn = DriverManager.getConnection(postgresUrl, username, password);
             Statement stmt = conn.createStatement()) {

            String query = "SELECT 1 FROM pg_database WHERE datname = '" + databaseName.replace("'", "''") + "'";
            ResultSet rs = stmt.executeQuery(query);
            boolean exists = rs.next();
            log.info("Verificação do banco: {} -> {}", databaseName, exists ? "EXISTE" : "NÃO EXISTE");
            return exists;
        } catch (Exception e) {
            log.error("Erro ao verificar existência do banco de dados: {}", e.getMessage());
            return false;
        }
    }

    private static void createDatabase(String postgresUrl, String username, String password, String databaseName) throws Exception {
        try (Connection conn = DriverManager.getConnection(postgresUrl, username, password);
             Statement stmt = conn.createStatement()) {

            String createDbQuery = "CREATE DATABASE \"" + databaseName + "\" ENCODING 'UTF8'";
            log.info("Executando: {}", createDbQuery);
            stmt.executeUpdate(createDbQuery);
            log.info("Banco de dados criado com sucesso");
        } catch (Exception e) {
            if (e.getMessage().contains("already exists")) {
                log.info("Banco de dados já existia");
            } else {
                log.error("Erro ao criar banco de dados: {}", e.getMessage());
                throw e;
            }
        }
    }

    private static void executeSchemaScript(String datasourceUrl, String username, String password) {
        try (Connection conn = DriverManager.getConnection(datasourceUrl, username, password)) {

            log.info("Executando script de schema...");
            String schema = readResourceFile("schema.sql");

            // Dividir o script em statements individuais, ignorando comentários
            java.util.List<String> statements = parseSQL(schema);
            int successCount = 0;
            int skipCount = 0;

            for (String statement : statements) {
                if (!statement.trim().isEmpty()) {
                    try (Statement stmt = conn.createStatement()) {
                        stmt.execute(statement);
                        successCount++;
                    } catch (Exception e) {
                        String errorMsg = e.getMessage();
                        if (errorMsg.contains("already exists") || errorMsg.contains("já existe")) {
                            skipCount++;
                        } else {
                            log.warn("Erro ao executar statement: {}", errorMsg);
                        }
                    }
                }
            }

            log.info("✓ Schema verificado/criado: {} criados, {} já existiam", successCount, skipCount);
        } catch (Exception e) {
            log.error("Erro ao executar script de schema: {}", e.getMessage(), e);
        }
    }

    private static java.util.List<String> parseSQL(String sql) {
        java.util.List<String> statements = new java.util.ArrayList<>();
        StringBuilder currentStatement = new StringBuilder();
        boolean inString = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);
            char next = (i + 1 < sql.length()) ? sql.charAt(i + 1) : '\0';

            // Controlar comentários de linha
            if (!inString && !inBlockComment && c == '-' && next == '-') {
                inLineComment = true;
                i++; // Skip next char
                continue;
            }
            if (inLineComment && (c == '\n' || c == '\r')) {
                inLineComment = false;
                continue;
            }
            if (inLineComment) {
                continue;
            }

            // Controlar comentários de bloco
            if (!inString && !inLineComment && c == '/' && next == '*') {
                inBlockComment = true;
                i++; // Skip next char
                continue;
            }
            if (inBlockComment && c == '*' && next == '/') {
                inBlockComment = false;
                i++; // Skip next char
                continue;
            }
            if (inBlockComment) {
                continue;
            }

            // Controlar strings
            if (!inLineComment && !inBlockComment && c == '\'') {
                inString = !inString;
            }

            // Adicionar caractere ao statement atual
            if (!inLineComment && !inBlockComment) {
                currentStatement.append(c);
            }

            // Finalizar statement com ;
            if (!inString && !inLineComment && !inBlockComment && c == ';') {
                String statement = currentStatement.toString().trim();
                if (!statement.isEmpty()) {
                    statements.add(statement);
                }
                currentStatement = new StringBuilder();
            }
        }

        // Adicionar último statement, se houver
        String lastStatement = currentStatement.toString().trim();
        if (!lastStatement.isEmpty()) {
            statements.add(lastStatement);
        }

        return statements;
    }

    private static String readResourceFile(String filename) throws Exception {
        ClassPathResource resource = new ClassPathResource(filename);
        try (InputStreamReader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8);
             BufferedReader br = new BufferedReader(reader)) {

            StringBuilder content = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                content.append(line).append("\n");
            }
            return content.toString();
        }
    }
}





