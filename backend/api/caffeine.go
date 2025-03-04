package api

import (
	"errors"
	"time"

	"github.com/kubaliski/habit-tracker/backend/database"
	"github.com/kubaliski/habit-tracker/backend/models"
)

// CaffeineController maneja las operaciones relacionadas con el consumo de cafeína
type CaffeineController struct {
	Repo database.Repository
}

// NewCaffeineController crea un nuevo controlador de consumo de cafeína
func NewCaffeineController(repo database.Repository) *CaffeineController {
	return &CaffeineController{
		Repo: repo,
	}
}

// GetAllCaffeineBeverages obtiene todas las bebidas con cafeína
func (c *CaffeineController) GetAllCaffeineBeverages(includeInactive bool) ([]models.CaffeineBeverage, error) {
	return c.Repo.GetAllCaffeineBeverages(includeInactive)
}

// GetCaffeineBeverage obtiene una bebida con cafeína específica por su ID
func (c *CaffeineController) GetCaffeineBeverage(id int) (models.CaffeineBeverage, error) {
	beverage, err := c.Repo.GetCaffeineBeverage(id)
	if err != nil {
		return models.CaffeineBeverage{}, errors.New("bebida con cafeína no encontrada")
	}
	return beverage, nil
}

// CreateCaffeineBeverage crea una nueva bebida con cafeína
func (c *CaffeineController) CreateCaffeineBeverage(input models.NewCaffeineBeverageInput) (models.CaffeineBeverage, error) {
	// Validar campos requeridos
	if input.Name == "" {
		return models.CaffeineBeverage{}, errors.New("el nombre es obligatorio")
	}

	if input.CaffeineContent <= 0 {
		return models.CaffeineBeverage{}, errors.New("el contenido de cafeína debe ser mayor que cero")
	}

	if input.StandardUnit == "" {
		return models.CaffeineBeverage{}, errors.New("la unidad estándar es obligatoria")
	}

	if input.StandardUnitValue <= 0 {
		return models.CaffeineBeverage{}, errors.New("el valor de unidad estándar debe ser mayor que cero")
	}

	id, err := c.Repo.CreateCaffeineBeverage(input)
	if err != nil {
		return models.CaffeineBeverage{}, err
	}

	// Obtener la bebida creada
	return c.Repo.GetCaffeineBeverage(id)
}

// UpdateCaffeineBeverage actualiza una bebida con cafeína existente
func (c *CaffeineController) UpdateCaffeineBeverage(id int, input models.UpdateCaffeineBeverageInput) (models.CaffeineBeverage, error) {
	// Verificar que la bebida existe
	_, err := c.Repo.GetCaffeineBeverage(id)
	if err != nil {
		return models.CaffeineBeverage{}, errors.New("bebida con cafeína no encontrada")
	}

	if err := c.Repo.UpdateCaffeineBeverage(id, input); err != nil {
		return models.CaffeineBeverage{}, err
	}

	// Obtener la bebida actualizada
	return c.Repo.GetCaffeineBeverage(id)
}

// DeleteCaffeineBeverage elimina una bebida con cafeína
func (c *CaffeineController) DeleteCaffeineBeverage(id int) error {
	// Verificar que la bebida existe
	_, err := c.Repo.GetCaffeineBeverage(id)
	if err != nil {
		return errors.New("bebida con cafeína no encontrada")
	}

	return c.Repo.DeleteCaffeineBeverage(id)
}

// GetCaffeineIntake obtiene un registro de consumo de cafeína específico por su ID
func (c *CaffeineController) GetCaffeineIntake(id int) (models.CaffeineIntake, error) {
	intake, err := c.Repo.GetCaffeineIntake(id)
	if err != nil {
		return models.CaffeineIntake{}, errors.New("registro de consumo de cafeína no encontrado")
	}
	return intake, nil
}

// GetCaffeineIntakeByDay obtiene todos los registros de consumo de cafeína para una fecha específica
func (c *CaffeineController) GetCaffeineIntakeByDay(date string) ([]models.CaffeineIntake, error) {
	// Validar fecha
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	return c.Repo.GetCaffeineIntakeByDay(date)
}

// GetCaffeineIntakeRange obtiene todos los registros de consumo de cafeína en un rango de fechas
func (c *CaffeineController) GetCaffeineIntakeRange(startDate string, endDate string) ([]models.CaffeineIntake, error) {
	// Si no se proporcionan fechas, usar valores predeterminados
	if startDate == "" {
		startDate = time.Now().AddDate(0, 0, -7).Format("2006-01-02")
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

	return c.Repo.GetCaffeineIntakeRange(startDate, endDate)
}

// GetDailyCaffeineTotal obtiene el consumo total de cafeína para una fecha específica
func (c *CaffeineController) GetDailyCaffeineTotal(date string) (map[string]interface{}, error) {
	// Validar fecha
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, errors.New("formato de fecha inválido. Usar YYYY-MM-DD")
	}

	total, err := c.Repo.GetDailyCaffeineTotal(date)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"date":           date,
		"total_caffeine": total,
	}, nil
}

// CreateCaffeineIntake crea un nuevo registro de consumo de cafeína
func (c *CaffeineController) CreateCaffeineIntake(input models.NewCaffeineIntakeInput) (models.CaffeineIntake, error) {
	// Validar campos requeridos
	if input.BeverageID <= 0 {
		return models.CaffeineIntake{}, errors.New("el ID de bebida es obligatorio")
	}

	// Verificar que la bebida existe
	_, err := c.Repo.GetCaffeineBeverage(input.BeverageID)
	if err != nil {
		return models.CaffeineIntake{}, errors.New("la bebida especificada no existe")
	}

	if input.Amount <= 0 {
		return models.CaffeineIntake{}, errors.New("la cantidad debe ser mayor que cero")
	}

	// Si no se proporciona una marca de tiempo, usar el momento actual
	if input.Timestamp == "" {
		input.Timestamp = time.Now().Format(time.RFC3339)
	} else {
		// Validar formato de timestamp
		_, err := time.Parse(time.RFC3339, input.Timestamp)
		if err != nil {
			return models.CaffeineIntake{}, errors.New("formato de timestamp inválido. Usar ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)")
		}
	}

	id, err := c.Repo.CreateCaffeineIntake(input)
	if err != nil {
		return models.CaffeineIntake{}, err
	}

	// Obtener el registro creado
	return c.Repo.GetCaffeineIntake(id)
}

// UpdateCaffeineIntake actualiza un registro de consumo de cafeína existente
func (c *CaffeineController) UpdateCaffeineIntake(id int, input models.UpdateCaffeineIntakeInput) (models.CaffeineIntake, error) {
	// Verificar que el registro existe
	_, err := c.Repo.GetCaffeineIntake(id)
	if err != nil {
		return models.CaffeineIntake{}, errors.New("registro de consumo de cafeína no encontrado")
	}

	// Validar beverage_id si se proporciona
	if input.BeverageID > 0 {
		_, err := c.Repo.GetCaffeineBeverage(input.BeverageID)
		if err != nil {
			return models.CaffeineIntake{}, errors.New("la bebida especificada no existe")
		}
	}

	// Validar timestamp si se proporciona
	if input.Timestamp != "" {
		_, err := time.Parse(time.RFC3339, input.Timestamp)
		if err != nil {
			return models.CaffeineIntake{}, errors.New("formato de timestamp inválido. Usar ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)")
		}
	}

	if err := c.Repo.UpdateCaffeineIntake(id, input); err != nil {
		return models.CaffeineIntake{}, err
	}

	// Obtener el registro actualizado
	return c.Repo.GetCaffeineIntake(id)
}

// DeleteCaffeineIntake elimina un registro de consumo de cafeína
func (c *CaffeineController) DeleteCaffeineIntake(id int) error {
	// Verificar que el registro existe
	_, err := c.Repo.GetCaffeineIntake(id)
	if err != nil {
		return errors.New("registro de consumo de cafeína no encontrado")
	}

	return c.Repo.DeleteCaffeineIntake(id)
}
