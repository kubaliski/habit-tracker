package api

import (
	"errors"

	"github.com/kubaliski/habit-tracker/backend/database"
)

// DatabaseController maneja las operaciones relacionadas con la base de datos
type DatabaseController struct {
	Repo database.Repository
}

// NewDatabaseController crea un nuevo controlador de base de datos
func NewDatabaseController(repo database.Repository) *DatabaseController {
	return &DatabaseController{
		Repo: repo,
	}
}

// ClearAllData elimina todos los datos de la base de datos
// reinitializeDefaults: si es true, reinicia los datos predeterminados (bebidas con cafeína)
func (c *DatabaseController) ClearAllData(reinitializeDefaults bool) error {
	err := c.Repo.ClearAllData(reinitializeDefaults)
	if err != nil {
		return errors.New("error al limpiar la base de datos: " + err.Error())
	}

	return nil
}
