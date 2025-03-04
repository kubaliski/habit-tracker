package api

import (
	"errors"
	"time"

	"github.com/kubaliski/habit-tracker/backend/database"
	"github.com/kubaliski/habit-tracker/backend/models"
)

// HabitController maneja las operaciones relacionadas con hábitos
type HabitController struct {
	Repo database.Repository
}

// NewHabitController crea un nuevo controlador de hábitos
func NewHabitController(repo database.Repository) *HabitController {
	return &HabitController{
		Repo: repo,
	}
}

// GetAllHabits obtiene todos los hábitos
func (c *HabitController) GetAllHabits() ([]models.Habit, error) {
	return c.Repo.GetAllHabits()
}

// GetHabit obtiene un hábito específico por su ID
func (c *HabitController) GetHabit(id int) (models.Habit, error) {
	habit, err := c.Repo.GetHabit(id)
	if err != nil {
		return models.Habit{}, errors.New("hábito no encontrado")
	}
	return habit, nil
}

// CreateHabit crea un nuevo hábito
func (c *HabitController) CreateHabit(input models.NewHabitInput) (models.Habit, error) {
	// Validar campos requeridos
	if input.Name == "" {
		return models.Habit{}, errors.New("el nombre es obligatorio")
	}

	if input.Frequency == "" {
		return models.Habit{}, errors.New("la frecuencia es obligatoria")
	}

	// Asegurarse de que el objetivo tiene un valor válido
	if input.Goal <= 0 {
		input.Goal = 1 // Valor por defecto
	}

	id, err := c.Repo.CreateHabit(input)
	if err != nil {
		return models.Habit{}, err
	}

	// Obtener el hábito creado
	return c.Repo.GetHabit(id)
}

// UpdateHabit actualiza un hábito existente
func (c *HabitController) UpdateHabit(id int, input models.UpdateHabitInput) (models.Habit, error) {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(id)
	if err != nil {
		return models.Habit{}, errors.New("hábito no encontrado")
	}

	if err := c.Repo.UpdateHabit(id, input); err != nil {
		return models.Habit{}, err
	}

	// Obtener el hábito actualizado
	return c.Repo.GetHabit(id)
}

// DeleteHabit elimina un hábito
func (c *HabitController) DeleteHabit(id int) error {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(id)
	if err != nil {
		return errors.New("hábito no encontrado")
	}

	return c.Repo.DeleteHabit(id)
}

// LogHabit registra una entrada para un hábito
func (c *HabitController) LogHabit(habitID int, input models.NewHabitLogInput) error {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(habitID)
	if err != nil {
		return errors.New("hábito no encontrado")
	}

	// Si no se proporciona una fecha, usar la fecha actual
	if input.Date == "" {
		input.Date = time.Now().Format("2006-01-02")
	}

	// Validar fecha
	_, err = time.Parse("2006-01-02", input.Date)
	if err != nil {
		return errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	return c.Repo.LogHabit(habitID, input)
}

// GetHabitLogs obtiene los registros de un hábito en un rango de fechas
func (c *HabitController) GetHabitLogs(habitID int, startDate string, endDate string) ([]models.HabitLog, error) {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(habitID)
	if err != nil {
		return nil, errors.New("hábito no encontrado")
	}

	// Si no se proporcionan fechas, usar valores predeterminados
	if startDate == "" {
		startDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	// Validar fechas
	_, err = time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, errors.New("formato de fecha inicial inválido. Usar YYYY-MM-DD")
	}

	_, err = time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, errors.New("formato de fecha final inválido. Usar YYYY-MM-DD")
	}

	return c.Repo.GetHabitLogs(habitID, startDate, endDate)
}

// CompleteHabit marca un hábito como completado para una fecha específica
func (c *HabitController) CompleteHabit(habitID int, date string) error {
	// Verificar que el hábito existe
	habit, err := c.Repo.GetHabit(habitID)
	if err != nil {
		return errors.New("hábito no encontrado")
	}

	// Si no se proporciona una fecha, usar la fecha actual
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	// Validar fecha
	_, err = time.Parse("2006-01-02", date)
	if err != nil {
		return errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	// Crear entrada de registro
	logEntry := models.NewHabitLogInput{
		Date:      date,
		Completed: true,
		Count:     habit.Goal,
		Notes:     "",
	}

	return c.Repo.LogHabit(habitID, logEntry)
}

// UncompleteHabit marca un hábito como no completado para una fecha específica
func (c *HabitController) UncompleteHabit(habitID int, date string) error {
	// Verificar que el hábito existe
	_, err := c.Repo.GetHabit(habitID)
	if err != nil {
		return errors.New("hábito no encontrado")
	}

	// Si no se proporciona una fecha, usar la fecha actual
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	// Validar fecha
	_, err = time.Parse("2006-01-02", date)
	if err != nil {
		return errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	// Crear entrada de registro
	logEntry := models.NewHabitLogInput{
		Date:      date,
		Completed: false,
		Count:     0,
		Notes:     "",
	}

	return c.Repo.LogHabit(habitID, logEntry)
}
