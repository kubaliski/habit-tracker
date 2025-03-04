package database

import (
	"fmt"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
)

// ==================== MÉTODOS PARA ESTADOS DE ÁNIMO ====================

// CreateMoodEntry crea un nuevo registro de estado de ánimo
func (r *SQLiteRepo) CreateMoodEntry(mood models.NewMoodEntryInput) (int, error) {
	// Iniciar transacción
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("error al iniciar transacción: %w", err)
	}

	// Función para deshacer la transacción en caso de error
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Insertar entrada de estado de ánimo
	query := `
		INSERT INTO mood_entries (
			date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()

	result, err := tx.Exec(
		query,
		mood.Date,
		mood.MoodScore,
		mood.EnergyLevel,
		mood.AnxietyLevel,
		mood.StressLevel,
		mood.SleepHours,
		mood.Notes,
		now,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear registro de estado de ánimo: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	// Insertar etiquetas si existen
	if len(mood.Tags) > 0 {
		tagQuery := "INSERT INTO mood_tags (mood_id, tag) VALUES (?, ?)"

		for _, tag := range mood.Tags {
			_, err := tx.Exec(tagQuery, id, tag)
			if err != nil {
				return 0, fmt.Errorf("error al insertar etiqueta: %w", err)
			}
		}
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return int(id), nil
}

// GetMoodEntry obtiene un registro de estado de ánimo por su ID
func (r *SQLiteRepo) GetMoodEntry(id int) (models.MoodEntry, error) {
	// Consulta principal
	query := `
		SELECT id, date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		FROM mood_entries
		WHERE id = ?
	`

	var entry models.MoodEntry
	var dateStr, createdAt string

	err := r.db.QueryRow(query, id).Scan(
		&entry.ID,
		&dateStr,
		&entry.MoodScore,
		&entry.EnergyLevel,
		&entry.AnxietyLevel,
		&entry.StressLevel,
		&entry.SleepHours,
		&entry.Notes,
		&createdAt,
	)
	if err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al obtener registro de estado de ánimo: %w", err)
	}

	// Convertir valores
	entry.Date, _ = time.Parse("2006-01-02", dateStr)
	entry.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

	// Obtener etiquetas
	tagQuery := "SELECT tag FROM mood_tags WHERE mood_id = ?"
	rows, err := r.db.Query(tagQuery, id)
	if err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al consultar etiquetas: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return models.MoodEntry{}, fmt.Errorf("error al escanear etiqueta: %w", err)
		}
		entry.Tags = append(entry.Tags, tag)
	}

	if err := rows.Err(); err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al iterar etiquetas: %w", err)
	}

	return entry, nil
}

// GetAllMoodEntries obtiene todos los registros de estado de ánimo en un rango de fechas
func (r *SQLiteRepo) GetAllMoodEntries(startDate, endDate string) ([]models.MoodEntry, error) {
	query := `
		SELECT id, date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		FROM mood_entries
		WHERE date >= ? AND date <= ?
		ORDER BY date DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar registros de estado de ánimo: %w", err)
	}
	defer rows.Close()

	var entries []models.MoodEntry
	for rows.Next() {
		var entry models.MoodEntry
		var dateStr, createdAt string

		if err := rows.Scan(
			&entry.ID,
			&dateStr,
			&entry.MoodScore,
			&entry.EnergyLevel,
			&entry.AnxietyLevel,
			&entry.StressLevel,
			&entry.SleepHours,
			&entry.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear registro de estado de ánimo: %w", err)
		}

		// Convertir valores
		entry.Date, _ = time.Parse("2006-01-02", dateStr)
		entry.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar registros de estado de ánimo: %w", err)
	}

	// Obtener etiquetas para cada entrada
	for i, entry := range entries {
		tagQuery := "SELECT tag FROM mood_tags WHERE mood_id = ?"
		tagRows, err := r.db.Query(tagQuery, entry.ID)
		if err != nil {
			return nil, fmt.Errorf("error al consultar etiquetas: %w", err)
		}

		for tagRows.Next() {
			var tag string
			if err := tagRows.Scan(&tag); err != nil {
				tagRows.Close()
				return nil, fmt.Errorf("error al escanear etiqueta: %w", err)
			}
			entries[i].Tags = append(entries[i].Tags, tag)
		}

		tagRows.Close()
		if err := tagRows.Err(); err != nil {
			return nil, fmt.Errorf("error al iterar etiquetas: %w", err)
		}
	}

	return entries, nil
}

// UpdateMoodEntry actualiza un registro de estado de ánimo
func (r *SQLiteRepo) UpdateMoodEntry(id int, mood models.UpdateMoodEntryInput) error {
	// Iniciar transacción
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("error al iniciar transacción: %w", err)
	}

	// Función para deshacer la transacción en caso de error
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Actualizar entrada principal
	query := `
		UPDATE mood_entries
		SET mood_score = ?, energy_level = ?, anxiety_level = ?, stress_level = ?, sleep_hours = ?, notes = ?
		WHERE id = ?
	`

	_, err = tx.Exec(
		query,
		mood.MoodScore,
		mood.EnergyLevel,
		mood.AnxietyLevel,
		mood.StressLevel,
		mood.SleepHours,
		mood.Notes,
		id,
	)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de estado de ánimo: %w", err)
	}

	// Actualizar etiquetas si se proporcionaron
	if mood.Tags != nil {
		// Eliminar etiquetas existentes
		_, err = tx.Exec("DELETE FROM mood_tags WHERE mood_id = ?", id)
		if err != nil {
			return fmt.Errorf("error al eliminar etiquetas existentes: %w", err)
		}

		// Insertar nuevas etiquetas
		if len(mood.Tags) > 0 {
			tagQuery := "INSERT INTO mood_tags (mood_id, tag) VALUES (?, ?)"

			for _, tag := range mood.Tags {
				_, err := tx.Exec(tagQuery, id, tag)
				if err != nil {
					return fmt.Errorf("error al insertar etiqueta: %w", err)
				}
			}
		}
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return nil
}

// DeleteMoodEntry elimina un registro de estado de ánimo
func (r *SQLiteRepo) DeleteMoodEntry(id int) error {
	// Las etiquetas se eliminarán automáticamente por la restricción ON DELETE CASCADE
	query := "DELETE FROM mood_entries WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar registro de estado de ánimo: %w", err)
	}

	return nil
}
