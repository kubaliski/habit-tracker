package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/kubaliski/habit-tracker/backend/api"
	"github.com/kubaliski/habit-tracker/backend/database"
	_ "github.com/mattn/go-sqlite3"
)

// App estructura principal de la aplicación
type App struct {
	ctx         context.Context
	habitsAPI   *api.HabitController
	moodAPI     *api.MoodController
	caffeineAPI *api.CaffeineController
	statsAPI    *api.StatsController
	repository  database.Repository
}

// NewApp crea una nueva instancia de App
func NewApp() *App {
	// Obtener directorio de usuario para la base de datos
	homeDir, _ := os.UserHomeDir()
	dbDir := filepath.Join(homeDir, ".habit-tracker")

	// Asegurar que el directorio existe
	os.MkdirAll(dbDir, 0755)

	dbPath := filepath.Join(dbDir, "habits.db")

	// Inicializar repositorio
	repository, err := database.NewSQLiteRepo(dbPath)
	if err != nil {
		panic(err)
	}

	// Crear controladores
	habitsAPI := api.NewHabitController(repository)
	moodAPI := api.NewMoodController(repository)
	caffeineAPI := api.NewCaffeineController(repository)
	statsAPI := api.NewStatsController(repository)

	return &App{
		repository:  repository,
		habitsAPI:   habitsAPI,
		moodAPI:     moodAPI,
		caffeineAPI: caffeineAPI,
		statsAPI:    statsAPI,
	}
}

// Startup se ejecuta cuando la aplicación arranca
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	// Aquí puedes realizar otras inicializaciones
}

// Shutdown se ejecuta cuando la aplicación se cierra
func (a *App) Shutdown(ctx context.Context) {
	// Cerrar la conexión a la base de datos
	if a.repository != nil {
		a.repository.Close()
	}
}

// Método de ejemplo que podría ser llamado desde el frontend
func (a *App) GetAppInfo() map[string]interface{} {
	return map[string]interface{}{
		"name":        "Habit Tracker",
		"version":     "1.0.0",
		"description": "Aplicación para seguimiento de hábitos, estado de ánimo y consumo de cafeína",
	}
}
