package database

import (
	"database/sql"
	"fmt"
	"log"
)

// SQLiteRepo implementa la interfaz Repository para SQLite
type SQLiteRepo struct {
	db *sql.DB
}

// NewSQLiteRepo crea una nueva instancia de SQLiteRepo
func NewSQLiteRepo(dbPath string) (*SQLiteRepo, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error al abrir la base de datos: %w", err)
	}

	// Verificar la conexión
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("error al conectar con la base de datos: %w", err)
	}

	repo := &SQLiteRepo{db: db}

	// Inicializar la base de datos
	if err := repo.initDB(); err != nil {
		return nil, fmt.Errorf("error al inicializar la base de datos: %w", err)
	}

	// Inicializar datos predeterminados
	if err := repo.InitializeDefaultCaffeineBeverages(); err != nil {
		log.Printf("Advertencia: error al inicializar bebidas con cafeína predeterminadas: %v", err)
	}

	return repo, nil
}

// initDB crea las tablas necesarias si no existen
func (r *SQLiteRepo) initDB() error {
	// Tabla para los hábitos
	_, err := r.db.Exec(`
	CREATE TABLE IF NOT EXISTS habits (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT,
		category TEXT,
		frequency TEXT NOT NULL,
		goal INTEGER DEFAULT 1,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		active INTEGER DEFAULT 1
	)`)
	if err != nil {
		return err
	}

	// Tabla para el registro diario de hábitos
	_, err = r.db.Exec(`
	CREATE TABLE IF NOT EXISTS habit_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		habit_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		completed INTEGER DEFAULT 0,
		count INTEGER DEFAULT 0,
		notes TEXT,
		FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
		UNIQUE(habit_id, date)
	)`)
	if err != nil {
		return err
	}

	// Tabla para el registro de estados de ánimo
	_, err = r.db.Exec(`
	CREATE TABLE IF NOT EXISTS mood_entries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT NOT NULL UNIQUE,
		mood_score INTEGER NOT NULL,
		energy_level INTEGER,
		anxiety_level INTEGER,
		stress_level INTEGER,
		sleep_hours REAL,
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return err
	}

	// Tabla para etiquetas de estado mental
	_, err = r.db.Exec(`
	CREATE TABLE IF NOT EXISTS mood_tags (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		mood_id INTEGER NOT NULL,
		tag TEXT NOT NULL,
		FOREIGN KEY (mood_id) REFERENCES mood_entries(id) ON DELETE CASCADE,
		UNIQUE(mood_id, tag)
	)`)
	if err != nil {
		return err
	}

	// Tabla para tipos de bebidas con cafeína
	_, err = r.db.Exec(`
	CREATE TABLE IF NOT EXISTS caffeine_beverages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		caffeine_content REAL NOT NULL,
		standard_unit TEXT NOT NULL,
		standard_unit_value REAL NOT NULL,
		category TEXT,
		image_path TEXT,
		active INTEGER DEFAULT 1
	)`)
	if err != nil {
		return err
	}

	// Tabla para registros de consumo de cafeína
	_, err = r.db.Exec(`
	CREATE TABLE IF NOT EXISTS caffeine_intake (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp TIMESTAMP NOT NULL,
		beverage_id INTEGER NOT NULL,
		beverage_name TEXT NOT NULL,
		amount REAL NOT NULL,
		unit TEXT NOT NULL,
		total_caffeine REAL NOT NULL,
		perceived_effects TEXT,
		related_activity TEXT,
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (beverage_id) REFERENCES caffeine_beverages(id) ON DELETE CASCADE
	)`)
	if err != nil {
		return err
	}

	log.Println("Base de datos inicializada correctamente")
	return nil
}

// Close cierra la conexión con la base de datos
func (r *SQLiteRepo) Close() error {
	return r.db.Close()
}

// InitializeDefaultCaffeineBeverages añade bebidas con cafeína predeterminadas si la tabla está vacía
func (r *SQLiteRepo) InitializeDefaultCaffeineBeverages() error {
	// Verificar si ya hay bebidas
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM caffeine_beverages").Scan(&count)
	if err != nil {
		return fmt.Errorf("error al verificar bebidas existentes: %w", err)
	}

	// Si ya hay bebidas, no hacer nada
	if count > 0 {
		return nil
	}

	// Bebidas predeterminadas
	defaultBeverages := []struct {
		Name              string
		CaffeineContent   float64
		StandardUnit      string
		StandardUnitValue float64
		Category          string
	}{
		{"Café Espresso", 63.0, "shot", 30.0, "Café"},
		{"Café Americano", 95.0, "taza", 240.0, "Café"},
		{"Café Latte", 63.0, "taza", 240.0, "Café"},
		{"Café Instantáneo", 57.0, "taza", 240.0, "Café"},
		{"Té Negro", 47.0, "taza", 240.0, "Té"},
		{"Té Verde", 28.0, "taza", 240.0, "Té"},
		{"Bebida Energética", 80.0, "lata", 250.0, "Bebida Energética"},
		{"Refresco de Cola", 34.0, "lata", 330.0, "Refresco"},
		{"Chocolate Negro", 12.0, "onza", 28.0, "Chocolate"},
	}

	// Insertar bebidas predeterminadas
	query := `
		INSERT INTO caffeine_beverages (
			name, caffeine_content, standard_unit, standard_unit_value, category, active
		) VALUES (?, ?, ?, ?, ?, 1)
	`

	for _, beverage := range defaultBeverages {
		_, err := r.db.Exec(
			query,
			beverage.Name,
			beverage.CaffeineContent,
			beverage.StandardUnit,
			beverage.StandardUnitValue,
			beverage.Category,
		)
		if err != nil {
			return fmt.Errorf("error al insertar bebida predeterminada %s: %w", beverage.Name, err)
		}
	}

	log.Println("Bebidas con cafeína predeterminadas inicializadas correctamente")
	return nil
}
