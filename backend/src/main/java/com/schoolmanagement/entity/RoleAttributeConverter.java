package com.schoolmanagement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converts between database role string values and the Role enum in a case-insensitive way.
 *
 * - When writing to the database we store lowercase values (to match existing migrations).
 * - When reading from the database we normalize the value to uppercase and map to the enum.
 */
@Converter(autoApply = false)
public class RoleAttributeConverter implements AttributeConverter<UserRole.Role, String> {

    @Override
    public String convertToDatabaseColumn(UserRole.Role attribute) {
        if (attribute == null) return null;
        // store lowercase in DB (existing migrations use lowercase)
        return attribute.name().toLowerCase();
    }

    @Override
    public UserRole.Role convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return UserRole.Role.valueOf(dbData.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Unknown role in DB - fallback to TEACHER as safe default
            return UserRole.Role.TEACHER;
        }
    }
}
