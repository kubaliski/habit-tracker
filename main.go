package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Crear aplicación
	app := NewApp()

	// Iniciar Wails con opciones
	err := wails.Run(&options.App{
		Title:  "Habit Tracker",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		OnShutdown:       app.Shutdown,
		Bind: []interface{}{
			app,
			app.habitsAPI,
			app.moodAPI,
			app.caffeineAPI,
			app.statsAPI,
			app.databaseAPI, // Añadido el nuevo controlador
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
