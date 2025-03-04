package database

import (
	"fmt"
	"strings"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
)

// ==================== MÉTODOS PARA REGISTROS DE CONSUMO DE CAFEÍNA ====================

// CreateCaffeineIntake crea un nuevo registro de consumo de cafeína
func (r *SQLiteRepo) CreateCaffeineIntake(input models.NewCaffeineIntakeInput) (int, error) {
	// Obtener información de la bebida para calcular total_caffeine
	beverage, err := r.GetCaffeineBeverage(input.BeverageID)
	if err != nil {
		return 0, fmt.Errorf("error al obtener información de la bebida: %w", err)
	}

	// Calcular el total de cafeína basado en la cantidad y el contenido de cafeína de la bebida
	// Fórmula correcta: (cantidad * contenido_cafeína) / unidad_estándar_valor
	totalCaffeine := (input.Amount * beverage.CaffeineContent)

	// Si el input ya tenía un valor para totalCaffeine, respetarlo
	if input.TotalCaffeine > 0 {
		totalCaffeine = input.TotalCaffeine
	}

	// Establecer la unidad predeterminada si no se proporciona
	unit := input.Unit
	if unit == "" {
		unit = beverage.StandardUnit
	}

	timestamp, err := time.Parse(time.RFC3339, input.Timestamp)
	if err != nil {
		return 0, fmt.Errorf("error al parsear timestamp: %w", err)
	}

	// Insertar el registro - CORREGIDO: añadir beverage_name en los campos y valores
	query := `
        INSERT INTO caffeine_intake (
            timestamp, beverage_id, beverage_name, amount, unit, total_caffeine,
            perceived_effects, related_activity, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `

	result, err := r.db.Exec(
		query,
		timestamp,
		input.BeverageID,
		beverage.Name, // AÑADIDO: pasar el nombre de la bebida
		input.Amount,
		unit,
		totalCaffeine,
		input.PerceivedEffects,
		input.RelatedActivity,
		input.Notes,
	)

	if err != nil {
		return 0, fmt.Errorf("error al crear registro de consumo de cafeína: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID de registro insertado: %w", err)
	}

	return int(id), nil
}

// GetCaffeineIntake obtiene un registro de consumo de cafeína por su ID
func (r *SQLiteRepo) GetCaffeineIntake(id int) (models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE id = ?
	`

	var intake models.CaffeineIntake
	var timestamp, createdAt string

	err := r.db.QueryRow(query, id).Scan(
		&intake.ID,
		&timestamp,
		&intake.BeverageID,
		&intake.BeverageName,
		&intake.Amount,
		&intake.Unit,
		&intake.TotalCaffeine,
		&intake.PerceivedEffects,
		&intake.RelatedActivity,
		&intake.Notes,
		&createdAt,
	)
	if err != nil {
		return models.CaffeineIntake{}, fmt.Errorf("error al obtener registro de consumo de cafeína: %w", err)
	}

	// Convertir valores
	intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
	intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

	return intake, nil
}

// GetCaffeineIntakeByDay obtiene todos los registros de consumo de cafeína para una fecha específica
func (r *SQLiteRepo) GetCaffeineIntakeByDay(date string) ([]models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE DATE(timestamp) = DATE(?)
		ORDER BY timestamp DESC
	`

	rows, err := r.db.Query(query, date)
	if err != nil {
		return nil, fmt.Errorf("error al consultar consumo de cafeína: %w", err)
	}
	defer rows.Close()

	var intakes []models.CaffeineIntake
	for rows.Next() {
		var intake models.CaffeineIntake
		var timestamp, createdAt string

		if err := rows.Scan(
			&intake.ID,
			&timestamp,
			&intake.BeverageID,
			&intake.BeverageName,
			&intake.Amount,
			&intake.Unit,
			&intake.TotalCaffeine,
			&intake.PerceivedEffects,
			&intake.RelatedActivity,
			&intake.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear consumo de cafeína: %w", err)
		}

		// Convertir valores
		intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
		intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		intakes = append(intakes, intake)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar consumos de cafeína: %w", err)
	}

	return intakes, nil
}

// GetCaffeineIntakeRange obtiene todos los registros de consumo de cafeína en un rango de fechas
func (r *SQLiteRepo) GetCaffeineIntakeRange(startDate, endDate string) ([]models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE DATE(timestamp) >= DATE(?) AND DATE(timestamp) <= DATE(?)
		ORDER BY timestamp DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar consumo de cafeína en rango: %w", err)
	}
	defer rows.Close()

	var intakes []models.CaffeineIntake
	for rows.Next() {
		var intake models.CaffeineIntake
		var timestamp, createdAt string

		if err := rows.Scan(
			&intake.ID,
			&timestamp,
			&intake.BeverageID,
			&intake.BeverageName,
			&intake.Amount,
			&intake.Unit,
			&intake.TotalCaffeine,
			&intake.PerceivedEffects,
			&intake.RelatedActivity,
			&intake.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear consumo de cafeína: %w", err)
		}

		// Convertir valores
		intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
		intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		intakes = append(intakes, intake)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar consumos de cafeína: %w", err)
	}

	return intakes, nil
}

// UpdateCaffeineIntake actualiza un registro de consumo de cafeína
func (r *SQLiteRepo) UpdateCaffeineIntake(id int, input models.UpdateCaffeineIntakeInput) error {
	// Preparar la consulta y los parámetros
	query := "UPDATE caffeine_intake SET "
	params := []interface{}{}

	// Campos a actualizar
	updateFields := []string{}

	if input.Timestamp != "" {
		updateFields = append(updateFields, "timestamp = ?")
		params = append(params, input.Timestamp)
	}

	if input.BeverageID > 0 {
		updateFields = append(updateFields, "beverage_id = ?")
		params = append(params, input.BeverageID)

		// Si se actualiza la bebida o la cantidad, recalcular total_caffeine
		if input.Amount > 0 {
			// Obtener información de la bebida
			beverage, err := r.GetCaffeineBeverage(input.BeverageID)
			if err != nil {
				return fmt.Errorf("error al obtener información de la bebida: %w", err)
			}

			// Recalcular total_caffeine
			totalCaffeine := input.Amount * beverage.CaffeineContent

			updateFields = append(updateFields, "total_caffeine = ?")
			params = append(params, totalCaffeine)

			updateFields = append(updateFields, "amount = ?")
			params = append(params, input.Amount)

			if input.Unit != "" {
				updateFields = append(updateFields, "unit = ?")
				params = append(params, input.Unit)
			}
		}
	} else if input.Amount > 0 {
		// Si solo cambia la cantidad pero no la bebida, obtener el ID de bebida actual
		var beverageID int
		err := r.db.QueryRow("SELECT beverage_id FROM caffeine_intake WHERE id = ?", id).Scan(&beverageID)
		if err != nil {
			return fmt.Errorf("error al obtener el registro actual: %w", err)
		}

		// Obtener información de la bebida
		beverage, err := r.GetCaffeineBeverage(beverageID)
		if err != nil {
			return fmt.Errorf("error al obtener información de la bebida: %w", err)
		}

		// Recalcular total_caffeine
		totalCaffeine := (input.Amount / beverage.StandardUnitValue) * beverage.CaffeineContent

		updateFields = append(updateFields, "total_caffeine = ?")
		params = append(params, totalCaffeine)

		updateFields = append(updateFields, "amount = ?")
		params = append(params, input.Amount)

		if input.Unit != "" {
			updateFields = append(updateFields, "unit = ?")
			params = append(params, input.Unit)
		}
	} else if input.TotalCaffeine > 0 {
		// Si se proporciona explícitamente un valor de total_caffeine
		updateFields = append(updateFields, "total_caffeine = ?")
		params = append(params, input.TotalCaffeine)
	}

	if input.PerceivedEffects != "" {
		updateFields = append(updateFields, "perceived_effects = ?")
		params = append(params, input.PerceivedEffects)
	}

	if input.RelatedActivity != "" {
		updateFields = append(updateFields, "related_activity = ?")
		params = append(params, input.RelatedActivity)
	}

	if input.Notes != "" {
		updateFields = append(updateFields, "notes = ?")
		params = append(params, input.Notes)
	}

	// Si no hay campos para actualizar, salir
	if len(updateFields) == 0 {
		return nil
	}

	// Completar la consulta
	query += strings.Join(updateFields, ", ")
	query += " WHERE id = ?"
	params = append(params, id)

	// Ejecutar la actualización
	_, err := r.db.Exec(query, params...)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de consumo de cafeína: %w", err)
	}

	return nil
}

// DeleteCaffeineIntake elimina un registro de consumo de cafeína
func (r *SQLiteRepo) DeleteCaffeineIntake(id int) error {
	query := "DELETE FROM caffeine_intake WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar consumo de cafeína: %w", err)
	}

	return nil
}

// GetDailyCaffeineTotal calcula el consumo total de cafeína para un día específico
func (r *SQLiteRepo) GetDailyCaffeineTotal(date string) (float64, error) {
	var total float64
	query := `
		SELECT COALESCE(SUM(total_caffeine), 0)
		FROM caffeine_intake
		WHERE DATE(timestamp) = DATE(?)
	`

	err := r.db.QueryRow(query, date).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error al calcular consumo total de cafeína: %w", err)
	}

	return total, nil
}
