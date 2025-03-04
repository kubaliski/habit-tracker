package database

import (
	"fmt"
	"strings"

	"github.com/kubaliski/habit-tracker/backend/models"
)

// ==================== MÉTODOS PARA BEBIDAS CON CAFEÍNA ====================

// CreateCaffeineBeverage crea un nuevo tipo de bebida con cafeína
func (r *SQLiteRepo) CreateCaffeineBeverage(beverage models.NewCaffeineBeverageInput) (int, error) {
	query := `
		INSERT INTO caffeine_beverages (
			name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
		) VALUES (?, ?, ?, ?, ?, ?, 1)
	`

	result, err := r.db.Exec(
		query,
		beverage.Name,
		beverage.CaffeineContent,
		beverage.StandardUnit,
		beverage.StandardUnitValue,
		beverage.Category,
		beverage.ImagePath,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear bebida con cafeína: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	return int(id), nil
}

// GetCaffeineBeverage obtiene una bebida con cafeína por su ID
func (r *SQLiteRepo) GetCaffeineBeverage(id int) (models.CaffeineBeverage, error) {
	query := `
        SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
        FROM caffeine_beverages
        WHERE id = ?
    `

	var beverage models.CaffeineBeverage
	var activeInt int
	var imagePath *string // Cambiado a puntero para manejar NULL

	err := r.db.QueryRow(query, id).Scan(
		&beverage.ID,
		&beverage.Name,
		&beverage.CaffeineContent,
		&beverage.StandardUnit,
		&beverage.StandardUnitValue,
		&beverage.Category,
		&imagePath,
		&activeInt,
	)
	if err != nil {
		return models.CaffeineBeverage{}, fmt.Errorf("error al obtener bebida con cafeína: %w", err)
	}

	// Manejar valor NULL
	if imagePath != nil {
		beverage.ImagePath = *imagePath
	} else {
		beverage.ImagePath = "" // Asignar string vacío si es NULL
	}

	beverage.Active = activeInt == 1

	return beverage, nil
}

// GetAllCaffeineBeverages obtiene todas las bebidas con cafeína
func (r *SQLiteRepo) GetAllCaffeineBeverages(includeInactive bool) ([]models.CaffeineBeverage, error) {
	var query string
	if includeInactive {
		query = `
            SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
            FROM caffeine_beverages
            ORDER BY name
        `
	} else {
		query = `
            SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
            FROM caffeine_beverages
            WHERE active = 1
            ORDER BY name
        `
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error al consultar bebidas con cafeína: %w", err)
	}
	defer rows.Close()

	var beverages []models.CaffeineBeverage
	for rows.Next() {
		var beverage models.CaffeineBeverage
		var activeInt int
		var imagePath *string // Cambiado a puntero para manejar NULL

		if err := rows.Scan(
			&beverage.ID,
			&beverage.Name,
			&beverage.CaffeineContent,
			&beverage.StandardUnit,
			&beverage.StandardUnitValue,
			&beverage.Category,
			&imagePath,
			&activeInt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear bebida con cafeína: %w", err)
		}

		// Manejar valor NULL
		if imagePath != nil {
			beverage.ImagePath = *imagePath
		} else {
			beverage.ImagePath = "" // Asignar string vacío si es NULL
		}

		beverage.Active = activeInt == 1
		beverages = append(beverages, beverage)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar bebidas con cafeína: %w", err)
	}

	return beverages, nil
}

// UpdateCaffeineBeverage actualiza una bebida con cafeína existente
func (r *SQLiteRepo) UpdateCaffeineBeverage(id int, beverage models.UpdateCaffeineBeverageInput) error {
	// Construir la consulta dinámicamente basada en los campos proporcionados
	updates := []string{}
	args := []interface{}{}

	if beverage.Name != "" {
		updates = append(updates, "name = ?")
		args = append(args, beverage.Name)
	}

	if beverage.CaffeineContent > 0 {
		updates = append(updates, "caffeine_content = ?")
		args = append(args, beverage.CaffeineContent)
	}

	if beverage.StandardUnit != "" {
		updates = append(updates, "standard_unit = ?")
		args = append(args, beverage.StandardUnit)
	}

	if beverage.StandardUnitValue > 0 {
		updates = append(updates, "standard_unit_value = ?")
		args = append(args, beverage.StandardUnitValue)
	}

	if beverage.Category != "" {
		updates = append(updates, "category = ?")
		args = append(args, beverage.Category)
	}

	if beverage.ImagePath != "" {
		updates = append(updates, "image_path = ?")
		args = append(args, beverage.ImagePath)
	}

	if beverage.Active != nil {
		updates = append(updates, "active = ?")
		if *beverage.Active {
			args = append(args, 1)
		} else {
			args = append(args, 0)
		}
	}

	// Si no hay nada que actualizar, salir
	if len(updates) == 0 {
		return nil
	}

	query := fmt.Sprintf("UPDATE caffeine_beverages SET %s WHERE id = ?", strings.Join(updates, ", "))
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("error al actualizar bebida con cafeína: %w", err)
	}

	return nil
}

// DeleteCaffeineBeverage elimina una bebida con cafeína
func (r *SQLiteRepo) DeleteCaffeineBeverage(id int) error {
	query := "DELETE FROM caffeine_beverages WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar bebida con cafeína: %w", err)
	}

	return nil
}
