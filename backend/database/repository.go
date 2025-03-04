package database

import (
	"github.com/kubaliski/habit-tracker/backend/models"
)

// Repository define la interfaz para acceder a la base de datos
type Repository interface {
	// Métodos para hábitos
	CreateHabit(habit models.NewHabitInput) (int, error)
	GetHabit(id int) (models.Habit, error)
	GetAllHabits() ([]models.Habit, error)
	UpdateHabit(id int, habit models.UpdateHabitInput) error
	DeleteHabit(id int) error

	// Métodos para registros de hábitos
	LogHabit(habitID int, log models.NewHabitLogInput) error
	GetHabitLogs(habitID int, startDate, endDate string) ([]models.HabitLog, error)
	UpdateHabitLog(id int, log models.NewHabitLogInput) error
	DeleteHabitLog(id int) error

	// Métodos para estado de ánimo
	CreateMoodEntry(mood models.NewMoodEntryInput) (int, error)
	GetMoodEntry(id int) (models.MoodEntry, error)
	GetAllMoodEntries(startDate, endDate string) ([]models.MoodEntry, error)
	UpdateMoodEntry(id int, mood models.UpdateMoodEntryInput) error
	DeleteMoodEntry(id int) error

	// Métodos para tipos de bebidas con cafeína
	CreateCaffeineBeverage(beverage models.NewCaffeineBeverageInput) (int, error)
	GetCaffeineBeverage(id int) (models.CaffeineBeverage, error)
	GetAllCaffeineBeverages(includeInactive bool) ([]models.CaffeineBeverage, error)
	UpdateCaffeineBeverage(id int, beverage models.UpdateCaffeineBeverageInput) error
	DeleteCaffeineBeverage(id int) error

	// Métodos para registros de consumo de cafeína
	CreateCaffeineIntake(intake models.NewCaffeineIntakeInput) (int, error)
	GetCaffeineIntake(id int) (models.CaffeineIntake, error)
	GetCaffeineIntakeByDay(date string) ([]models.CaffeineIntake, error)
	GetCaffeineIntakeRange(startDate, endDate string) ([]models.CaffeineIntake, error)
	UpdateCaffeineIntake(id int, intake models.UpdateCaffeineIntakeInput) error
	DeleteCaffeineIntake(id int) error
	GetDailyCaffeineTotal(date string) (float64, error)

	// Métodos para estadísticas
	GetHabitStats(habitID int, period string) (map[string]interface{}, error)
	GetMoodStats(period string) (map[string]interface{}, error)
	GetCaffeineStats(period string) (map[string]interface{}, error)
	GetCorrelationStats() (map[string]interface{}, error)

	// Inicialización y cierre
	InitializeDefaultCaffeineBeverages() error
	Close() error
}
