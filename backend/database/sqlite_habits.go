package database

import (
	"fmt"
	"strings"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
)

// ==================== MÉTODOS PARA HÁBITOS ====================

// CreateHabit crea un nuevo hábito
func (r *SQLiteRepo) CreateHabit(habit models.NewHabitInput) (int, error) {
	query := `
		INSERT INTO habits (name, description, category, frequency, goal, created_at, updated_at, active)
		VALUES (?, ?, ?, ?, ?, ?, ?, 1)
	`
	now := time.Now()

	result, err := r.db.Exec(
		query,
		habit.Name,
		habit.Description,
		habit.Category,
		habit.Frequency,
		habit.Goal,
		now,
		now,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear hábito: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	return int(id), nil
}

// GetHabit obtiene un hábito por su ID
func (r *SQLiteRepo) GetHabit(id int) (models.Habit, error) {
	query := `
		SELECT id, name, description, category, frequency, goal, created_at, updated_at, active
		FROM habits
		WHERE id = ?
	`

	var habit models.Habit
	var createdAt, updatedAt string
	var activeInt int

	err := r.db.QueryRow(query, id).Scan(
		&habit.ID,
		&habit.Name,
		&habit.Description,
		&habit.Category,
		&habit.Frequency,
		&habit.Goal,
		&createdAt,
		&updatedAt,
		&activeInt,
	)
	if err != nil {
		return models.Habit{}, fmt.Errorf("error al obtener hábito: %w", err)
	}

	// Convertir valores
	habit.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	habit.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	habit.Active = activeInt == 1

	return habit, nil
}

// GetAllHabits obtiene todos los hábitos
func (r *SQLiteRepo) GetAllHabits() ([]models.Habit, error) {
	query := `
		SELECT id, name, description, category, frequency, goal, created_at, updated_at, active
		FROM habits
		ORDER BY name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error al consultar hábitos: %w", err)
	}
	defer rows.Close()

	var habits []models.Habit
	for rows.Next() {
		var habit models.Habit
		var createdAt, updatedAt string
		var activeInt int

		if err := rows.Scan(
			&habit.ID,
			&habit.Name,
			&habit.Description,
			&habit.Category,
			&habit.Frequency,
			&habit.Goal,
			&createdAt,
			&updatedAt,
			&activeInt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear hábito: %w", err)
		}

		// Convertir valores
		habit.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		habit.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
		habit.Active = activeInt == 1

		habits = append(habits, habit)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar hábitos: %w", err)
	}

	return habits, nil
}

// UpdateHabit actualiza un hábito existente
func (r *SQLiteRepo) UpdateHabit(id int, habit models.UpdateHabitInput) error {
	// Construir la consulta dinámicamente basada en los campos proporcionados
	updates := []string{}
	args := []interface{}{}

	if habit.Name != "" {
		updates = append(updates, "name = ?")
		args = append(args, habit.Name)
	}

	if habit.Description != "" {
		updates = append(updates, "description = ?")
		args = append(args, habit.Description)
	}

	if habit.Category != "" {
		updates = append(updates, "category = ?")
		args = append(args, habit.Category)
	}

	if habit.Frequency != "" {
		updates = append(updates, "frequency = ?")
		args = append(args, habit.Frequency)
	}

	if habit.Goal > 0 {
		updates = append(updates, "goal = ?")
		args = append(args, habit.Goal)
	}

	if habit.Active != nil {
		updates = append(updates, "active = ?")
		if *habit.Active {
			args = append(args, 1)
		} else {
			args = append(args, 0)
		}
	}

	// Siempre actualizar la fecha de actualización
	updates = append(updates, "updated_at = ?")
	args = append(args, time.Now())

	// Si no hay nada que actualizar, salir
	if len(updates) <= 1 {
		return nil
	}

	query := fmt.Sprintf("UPDATE habits SET %s WHERE id = ?", strings.Join(updates, ", "))
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("error al actualizar hábito: %w", err)
	}

	return nil
}

// DeleteHabit elimina un hábito
func (r *SQLiteRepo) DeleteHabit(id int) error {
	query := "DELETE FROM habits WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar hábito: %w", err)
	}

	return nil
}
