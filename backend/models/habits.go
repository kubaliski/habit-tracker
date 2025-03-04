package models

import "time"

// Habit representa un hábito que el usuario quiere seguir
type Habit struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Frequency   string    `json:"frequency"` // daily, weekly, monthly
	Goal        int       `json:"goal"`      // objetivo diario (veces)
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Active      bool      `json:"active"`
}

// HabitLog representa un registro diario de un hábito
type HabitLog struct {
	ID        int       `json:"id"`
	HabitID   int       `json:"habit_id"`
	Date      time.Time `json:"date"`
	Completed bool      `json:"completed"`
	Count     int       `json:"count"` // número de veces completado
	Notes     string    `json:"notes"`
}

// NewHabitInput representa los datos de entrada para crear un nuevo hábito
type NewHabitInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Frequency   string `json:"frequency" binding:"required"`
	Goal        int    `json:"goal"`
}

// UpdateHabitInput representa los datos de entrada para actualizar un hábito
type UpdateHabitInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Frequency   string `json:"frequency"`
	Goal        int    `json:"goal"`
	Active      *bool  `json:"active"` // Puntero para distinguir entre falso y no proporcionado
}

// NewHabitLogInput representa los datos de entrada para registrar un hábito
type NewHabitLogInput struct {
	Date      string `json:"date" binding:"required"`
	Completed bool   `json:"completed"`
	Count     int    `json:"count"`
	Notes     string `json:"notes"`
}
