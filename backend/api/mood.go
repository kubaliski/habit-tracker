package api

import (
	"errors"
	"time"

	"github.com/kubaliski/habit-tracker/backend/database"
	"github.com/kubaliski/habit-tracker/backend/models"
)

// MoodController maneja las operaciones relacionadas con el estado de ánimo
type MoodController struct {
	Repo database.Repository
}

// NewMoodController crea un nuevo controlador de estado de ánimo
func NewMoodController(repo database.Repository) *MoodController {
	return &MoodController{
		Repo: repo,
	}
}

// GetAllMoodEntries obtiene todos los registros de estado de ánimo en un rango de fechas
func (c *MoodController) GetAllMoodEntries(startDate string, endDate string) ([]models.MoodEntry, error) {
	// Si no se proporcionan fechas, usar valores predeterminados
	if startDate == "" {
		startDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	// Validar fechas
	_, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, errors.New("formato de fecha inicial inválido. Usar YYYY-MM-DD")
	}

	_, err = time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, errors.New("formato de fecha final inválido. Usar YYYY-MM-DD")
	}

	return c.Repo.GetAllMoodEntries(startDate, endDate)
}

// GetMoodEntry obtiene un registro de estado de ánimo específico por ID
func (c *MoodController) GetMoodEntry(id int) (models.MoodEntry, error) {
	entry, err := c.Repo.GetMoodEntry(id)
	if err != nil {
		return models.MoodEntry{}, errors.New("registro de estado de ánimo no encontrado")
	}
	return entry, nil
}

// GetMoodEntryByDate busca un registro de estado de ánimo por fecha
func (c *MoodController) GetMoodEntryByDate(date string) (models.MoodEntry, error) {
	// Validar fecha
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return models.MoodEntry{}, errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	entries, err := c.Repo.GetAllMoodEntries(date, date)
	if err != nil {
		return models.MoodEntry{}, err
	}

	if len(entries) == 0 {
		return models.MoodEntry{}, errors.New("no hay registro de estado de ánimo para esta fecha")
	}

	return entries[0], nil
}

// CreateMoodEntry crea un nuevo registro de estado de ánimo
func (c *MoodController) CreateMoodEntry(input models.NewMoodEntryInput) (models.MoodEntry, error) {
	// Validar campos requeridos
	if input.Date == "" {
		// Si no se proporciona una fecha, usar la fecha actual
		input.Date = time.Now().Format("2006-01-02")
	}

	// Validar fecha
	_, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return models.MoodEntry{}, errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	// Validar puntuación de estado de ánimo
	if input.MoodScore < 1 || input.MoodScore > 10 {
		return models.MoodEntry{}, errors.New("la puntuación de estado de ánimo debe estar entre 1 y 10")
	}

	// Validar otros campos que requieran estar en el rango 1-10
	if input.EnergyLevel != 0 && (input.EnergyLevel < 1 || input.EnergyLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de energía debe estar entre 1 y 10")
	}

	if input.AnxietyLevel != 0 && (input.AnxietyLevel < 1 || input.AnxietyLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de ansiedad debe estar entre 1 y 10")
	}

	if input.StressLevel != 0 && (input.StressLevel < 1 || input.StressLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de estrés debe estar entre 1 y 10")
	}

	id, err := c.Repo.CreateMoodEntry(input)
	if err != nil {
		return models.MoodEntry{}, err
	}

	// Obtener el registro creado
	return c.Repo.GetMoodEntry(id)
}

// UpdateMoodEntry actualiza un registro de estado de ánimo existente
func (c *MoodController) UpdateMoodEntry(id int, input models.UpdateMoodEntryInput) (models.MoodEntry, error) {
	// Verificar que el registro existe
	_, err := c.Repo.GetMoodEntry(id)
	if err != nil {
		return models.MoodEntry{}, errors.New("registro de estado de ánimo no encontrado")
	}

	// Validar campos si han sido proporcionados
	if input.MoodScore != 0 && (input.MoodScore < 1 || input.MoodScore > 10) {
		return models.MoodEntry{}, errors.New("la puntuación de estado de ánimo debe estar entre 1 y 10")
	}

	if input.EnergyLevel != 0 && (input.EnergyLevel < 1 || input.EnergyLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de energía debe estar entre 1 y 10")
	}

	if input.AnxietyLevel != 0 && (input.AnxietyLevel < 1 || input.AnxietyLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de ansiedad debe estar entre 1 y 10")
	}

	if input.StressLevel != 0 && (input.StressLevel < 1 || input.StressLevel > 10) {
		return models.MoodEntry{}, errors.New("el nivel de estrés debe estar entre 1 y 10")
	}

	if err := c.Repo.UpdateMoodEntry(id, input); err != nil {
		return models.MoodEntry{}, err
	}

	// Obtener el registro actualizado
	return c.Repo.GetMoodEntry(id)
}

// DeleteMoodEntry elimina un registro de estado de ánimo
func (c *MoodController) DeleteMoodEntry(id int) error {
	// Verificar que el registro existe
	_, err := c.Repo.GetMoodEntry(id)
	if err != nil {
		return errors.New("registro de estado de ánimo no encontrado")
	}

	return c.Repo.DeleteMoodEntry(id)
}
