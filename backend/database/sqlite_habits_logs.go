package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
)

// ==================== MÉTODOS PARA REGISTROS DE HÁBITOS ====================

// LogHabit registra una actividad de hábito
func (r *SQLiteRepo) LogHabit(habitID int, log models.NewHabitLogInput) error {
	// Comprobar si ya existe un registro para esta fecha
	var existingID int
	err := r.db.QueryRow("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?", habitID, log.Date).Scan(&existingID)

	// Si ya existe, actualizar
	if err == nil {
		return r.UpdateHabitLog(existingID, log)
	}

	// Si no existe, insertar
	if err == sql.ErrNoRows {
		query := `
			INSERT INTO habit_logs (habit_id, date, completed, count, notes)
			VALUES (?, ?, ?, ?, ?)
		`

		completedInt := 0
		if log.Completed {
			completedInt = 1
		}

		_, err := r.db.Exec(
			query,
			habitID,
			log.Date,
			completedInt,
			log.Count,
			log.Notes,
		)
		if err != nil {
			return fmt.Errorf("error al registrar hábito: %w", err)
		}

		return nil
	}

	return fmt.Errorf("error al verificar registro existente: %w", err)
}

// GetHabitLogs obtiene los registros de un hábito en un rango de fechas
func (r *SQLiteRepo) GetHabitLogs(habitID int, startDate, endDate string) ([]models.HabitLog, error) {
	query := `
		SELECT id, habit_id, date, completed, count, notes
		FROM habit_logs
		WHERE habit_id = ? AND date >= ? AND date <= ?
		ORDER BY date DESC
	`

	rows, err := r.db.Query(query, habitID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar registros de hábito: %w", err)
	}
	defer rows.Close()

	var logs []models.HabitLog
	for rows.Next() {
		var log models.HabitLog
		var dateStr string
		var completedInt int

		if err := rows.Scan(
			&log.ID,
			&log.HabitID,
			&dateStr,
			&completedInt,
			&log.Count,
			&log.Notes,
		); err != nil {
			return nil, fmt.Errorf("error al escanear registro de hábito: %w", err)
		}

		// Convertir valores
		log.Date, _ = time.Parse("2006-01-02", dateStr)
		log.Completed = completedInt == 1

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar registros de hábito: %w", err)
	}

	return logs, nil
}

// UpdateHabitLog actualiza un registro de hábito
func (r *SQLiteRepo) UpdateHabitLog(id int, log models.NewHabitLogInput) error {
	query := `
		UPDATE habit_logs
		SET completed = ?, count = ?, notes = ?
		WHERE id = ?
	`

	completedInt := 0
	if log.Completed {
		completedInt = 1
	}

	_, err := r.db.Exec(
		query,
		completedInt,
		log.Count,
		log.Notes,
		id,
	)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de hábito: %w", err)
	}

	return nil
}

// DeleteHabitLog elimina un registro de hábito
func (r *SQLiteRepo) DeleteHabitLog(id int) error {
	query := "DELETE FROM habit_logs WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar registro de hábito: %w", err)
	}

	return nil
}
