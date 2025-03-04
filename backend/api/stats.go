package api

import (
	"errors"

	"github.com/kubaliski/habit-tracker/backend/database"
)

// StatsController maneja las operaciones relacionadas con estadísticas
type StatsController struct {
	Repo database.Repository
}

// NewStatsController crea un nuevo controlador de estadísticas
func NewStatsController(repo database.Repository) *StatsController {
	return &StatsController{
		Repo: repo,
	}
}

// GetHabitStats obtiene estadísticas para un hábito específico
func (c *StatsController) GetHabitStats(id int, period string) (map[string]interface{}, error) {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(id)
	if err != nil {
		return nil, errors.New("hábito no encontrado")
	}

	// Validar que el período es válido
	if period != "week" && period != "month" && period != "year" {
		period = "month" // Usar valor predeterminado
	}

	return c.Repo.GetHabitStats(id, period)
}

// GetMoodStats obtiene estadísticas de estado de ánimo
func (c *StatsController) GetMoodStats(period string) (map[string]interface{}, error) {
	// Validar que el período es válido
	if period != "week" && period != "month" && period != "year" {
		period = "month" // Usar valor predeterminado
	}

	return c.Repo.GetMoodStats(period)
}

// GetCaffeineStats obtiene estadísticas de consumo de cafeína
func (c *StatsController) GetCaffeineStats(period string) (map[string]interface{}, error) {
	// Validar que el período es válido
	if period != "week" && period != "month" && period != "year" {
		period = "month" // Usar valor predeterminado
	}

	return c.Repo.GetCaffeineStats(period)
}

// GetCorrelationStats obtiene estadísticas de correlación entre hábitos, estado de ánimo y consumo de cafeína
func (c *StatsController) GetCorrelationStats() (map[string]interface{}, error) {
	return c.Repo.GetCorrelationStats()
}
