package uz.forkbomb.academix.shared.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.SneakyThrows;

import java.util.Map;

/**
 * Maps a Map<String, String> (e.g. {"uz":"...","en":"...","ru":"..."})
 * to/from a PostgreSQL JSONB column stored as a JSON string.
 */
@Converter
public class JsonbConverter implements AttributeConverter<Map<String, String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> TYPE = new TypeReference<>() {};

    @Override
    @SneakyThrows
    public String convertToDatabaseColumn(Map<String, String> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        return MAPPER.writeValueAsString(attribute);
    }

    @Override
    @SneakyThrows
    public Map<String, String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return Map.of();
        return MAPPER.readValue(dbData, TYPE);
    }
}
