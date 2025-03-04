package models

import "time"

// CaffeineBeverage representa un tipo de bebida con cafeína
type CaffeineBeverage struct {
	ID                int     `json:"id"`
	Name              string  `json:"name"`
	CaffeineContent   float64 `json:"caffeine_content"`    // en mg por unidad estándar
	StandardUnit      string  `json:"standard_unit"`       // ml, oz, taza, etc.
	StandardUnitValue float64 `json:"standard_unit_value"` // cantidad en la unidad estándar
	Category          string  `json:"category"`            // café, té, energética, etc.
	ImagePath         string  `json:"image_path"`          // ruta a un icono o imagen
	Active            bool    `json:"active"`              // disponible para selección
}

// CaffeineIntake representa un registro de consumo de cafeína
type CaffeineIntake struct {
	ID               int       `json:"id"`
	Timestamp        time.Time `json:"timestamp"`         // Fecha y hora del consumo
	BeverageID       int       `json:"beverage_id"`       // Referencia al tipo de bebida
	BeverageName     string    `json:"beverage_name"`     // Nombre de la bebida (para facilidad de uso)
	Amount           float64   `json:"amount"`            // Cantidad consumida
	Unit             string    `json:"unit"`              // Unidad utilizada
	TotalCaffeine    float64   `json:"total_caffeine"`    // Contenido total de cafeína en mg
	PerceivedEffects string    `json:"perceived_effects"` // Efectos percibidos
	RelatedActivity  string    `json:"related_activity"`  // Actividad relacionada
	Notes            string    `json:"notes"`             // Notas adicionales
	CreatedAt        time.Time `json:"created_at"`        // Fecha de creación del registro
}

// NewCaffeineBeverageInput representa los datos para crear un nuevo tipo de bebida con cafeína
type NewCaffeineBeverageInput struct {
	Name              string  `json:"name" binding:"required"`
	CaffeineContent   float64 `json:"caffeine_content" binding:"required"`
	StandardUnit      string  `json:"standard_unit" binding:"required"`
	StandardUnitValue float64 `json:"standard_unit_value" binding:"required"`
	Category          string  `json:"category"`
	ImagePath         string  `json:"image_path"`
}

// UpdateCaffeineBeverageInput representa los datos para actualizar un tipo de bebida con cafeína
type UpdateCaffeineBeverageInput struct {
	Name              string  `json:"name"`
	CaffeineContent   float64 `json:"caffeine_content"`
	StandardUnit      string  `json:"standard_unit"`
	StandardUnitValue float64 `json:"standard_unit_value"`
	Category          string  `json:"category"`
	ImagePath         string  `json:"image_path"`
	Active            *bool   `json:"active"` // Puntero para distinguir entre falso y no proporcionado
}

// NewCaffeineIntakeInput representa los datos para registrar un consumo de cafeína
type NewCaffeineIntakeInput struct {
	Timestamp        string  `json:"timestamp" binding:"required"`
	BeverageID       int     `json:"beverage_id" binding:"required"`
	Amount           float64 `json:"amount" binding:"required"`
	Unit             string  `json:"unit"`
	TotalCaffeine    float64 `json:"total_caffeine"` // Opcional, puede calcularse
	PerceivedEffects string  `json:"perceived_effects"`
	RelatedActivity  string  `json:"related_activity"`
	Notes            string  `json:"notes"`
}

// UpdateCaffeineIntakeInput representa los datos para actualizar un registro de consumo de cafeína
type UpdateCaffeineIntakeInput struct {
	Timestamp        string  `json:"timestamp"`
	BeverageID       int     `json:"beverage_id"`
	Amount           float64 `json:"amount"`
	Unit             string  `json:"unit"`
	TotalCaffeine    float64 `json:"total_caffeine"`
	PerceivedEffects string  `json:"perceived_effects"`
	RelatedActivity  string  `json:"related_activity"`
	Notes            string  `json:"notes"`
}
