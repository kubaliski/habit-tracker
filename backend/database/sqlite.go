package database

import (
	"database/sql"
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
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

// ==================== MÉTODOS PARA HÁBITOS ====================

// CreateHabit crea un nuevo hábito
func (r *SQLiteRepo) CreateHabit(habit models.NewHabitInput) (int, error) {
	query := `
		INSERT INTO habits (name, description, category, frequency, goal, created_at, updated_at, active)
		VALUES (?, ?, ?, ?, ?, ?, ?, 1)
	`
	now := time.Now()

	result, err := r.db.Exec(
		query,
		habit.Name,
		habit.Description,
		habit.Category,
		habit.Frequency,
		habit.Goal,
		now,
		now,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear hábito: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	return int(id), nil
}

// GetHabit obtiene un hábito por su ID
func (r *SQLiteRepo) GetHabit(id int) (models.Habit, error) {
	query := `
		SELECT id, name, description, category, frequency, goal, created_at, updated_at, active
		FROM habits
		WHERE id = ?
	`

	var habit models.Habit
	var createdAt, updatedAt string
	var activeInt int

	err := r.db.QueryRow(query, id).Scan(
		&habit.ID,
		&habit.Name,
		&habit.Description,
		&habit.Category,
		&habit.Frequency,
		&habit.Goal,
		&createdAt,
		&updatedAt,
		&activeInt,
	)
	if err != nil {
		return models.Habit{}, fmt.Errorf("error al obtener hábito: %w", err)
	}

	// Convertir valores
	habit.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	habit.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	habit.Active = activeInt == 1

	return habit, nil
}

// GetAllHabits obtiene todos los hábitos
func (r *SQLiteRepo) GetAllHabits() ([]models.Habit, error) {
	query := `
		SELECT id, name, description, category, frequency, goal, created_at, updated_at, active
		FROM habits
		ORDER BY name
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error al consultar hábitos: %w", err)
	}
	defer rows.Close()

	var habits []models.Habit
	for rows.Next() {
		var habit models.Habit
		var createdAt, updatedAt string
		var activeInt int

		if err := rows.Scan(
			&habit.ID,
			&habit.Name,
			&habit.Description,
			&habit.Category,
			&habit.Frequency,
			&habit.Goal,
			&createdAt,
			&updatedAt,
			&activeInt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear hábito: %w", err)
		}

		// Convertir valores
		habit.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		habit.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
		habit.Active = activeInt == 1

		habits = append(habits, habit)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar hábitos: %w", err)
	}

	return habits, nil
}

// UpdateHabit actualiza un hábito existente
func (r *SQLiteRepo) UpdateHabit(id int, habit models.UpdateHabitInput) error {
	// Construir la consulta dinámicamente basada en los campos proporcionados
	updates := []string{}
	args := []interface{}{}

	if habit.Name != "" {
		updates = append(updates, "name = ?")
		args = append(args, habit.Name)
	}

	if habit.Description != "" {
		updates = append(updates, "description = ?")
		args = append(args, habit.Description)
	}

	if habit.Category != "" {
		updates = append(updates, "category = ?")
		args = append(args, habit.Category)
	}

	if habit.Frequency != "" {
		updates = append(updates, "frequency = ?")
		args = append(args, habit.Frequency)
	}

	if habit.Goal > 0 {
		updates = append(updates, "goal = ?")
		args = append(args, habit.Goal)
	}

	if habit.Active != nil {
		updates = append(updates, "active = ?")
		if *habit.Active {
			args = append(args, 1)
		} else {
			args = append(args, 0)
		}
	}

	// Siempre actualizar la fecha de actualización
	updates = append(updates, "updated_at = ?")
	args = append(args, time.Now())

	// Si no hay nada que actualizar, salir
	if len(updates) <= 1 {
		return nil
	}

	query := fmt.Sprintf("UPDATE habits SET %s WHERE id = ?", strings.Join(updates, ", "))
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("error al actualizar hábito: %w", err)
	}

	return nil
}

// DeleteHabit elimina un hábito
func (r *SQLiteRepo) DeleteHabit(id int) error {
	query := "DELETE FROM habits WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar hábito: %w", err)
	}

	return nil
}

// ==================== MÉTODOS PARA REGISTROS DE HÁBITOS ====================

// LogHabit registra una actividad de hábito
func (r *SQLiteRepo) LogHabit(habitID int, log models.NewHabitLogInput) error {
	// Comprobar si ya existe un registro para esta fecha
	var existingID int
	err := r.db.QueryRow("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?", habitID, log.Date).Scan(&existingID)

	// Si ya existe, actualizar
	if err == nil {
		return r.UpdateHabitLog(existingID, log)
	}

	// Si no existe, insertar
	if err == sql.ErrNoRows {
		query := `
			INSERT INTO habit_logs (habit_id, date, completed, count, notes)
			VALUES (?, ?, ?, ?, ?)
		`

		completedInt := 0
		if log.Completed {
			completedInt = 1
		}

		_, err := r.db.Exec(
			query,
			habitID,
			log.Date,
			completedInt,
			log.Count,
			log.Notes,
		)
		if err != nil {
			return fmt.Errorf("error al registrar hábito: %w", err)
		}

		return nil
	}

	return fmt.Errorf("error al verificar registro existente: %w", err)
}

// GetHabitLogs obtiene los registros de un hábito en un rango de fechas
func (r *SQLiteRepo) GetHabitLogs(habitID int, startDate, endDate string) ([]models.HabitLog, error) {
	query := `
		SELECT id, habit_id, date, completed, count, notes
		FROM habit_logs
		WHERE habit_id = ? AND date >= ? AND date <= ?
		ORDER BY date DESC
	`

	rows, err := r.db.Query(query, habitID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar registros de hábito: %w", err)
	}
	defer rows.Close()

	var logs []models.HabitLog
	for rows.Next() {
		var log models.HabitLog
		var dateStr string
		var completedInt int

		if err := rows.Scan(
			&log.ID,
			&log.HabitID,
			&dateStr,
			&completedInt,
			&log.Count,
			&log.Notes,
		); err != nil {
			return nil, fmt.Errorf("error al escanear registro de hábito: %w", err)
		}

		// Convertir valores
		log.Date, _ = time.Parse("2006-01-02", dateStr)
		log.Completed = completedInt == 1

		logs = append(logs, log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar registros de hábito: %w", err)
	}

	return logs, nil
}

// UpdateHabitLog actualiza un registro de hábito
func (r *SQLiteRepo) UpdateHabitLog(id int, log models.NewHabitLogInput) error {
	query := `
		UPDATE habit_logs
		SET completed = ?, count = ?, notes = ?
		WHERE id = ?
	`

	completedInt := 0
	if log.Completed {
		completedInt = 1
	}

	_, err := r.db.Exec(
		query,
		completedInt,
		log.Count,
		log.Notes,
		id,
	)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de hábito: %w", err)
	}

	return nil
}

// DeleteHabitLog elimina un registro de hábito
func (r *SQLiteRepo) DeleteHabitLog(id int) error {
	query := "DELETE FROM habit_logs WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar registro de hábito: %w", err)
	}

	return nil
}

// ==================== MÉTODOS PARA ESTADOS DE ÁNIMO ====================

// CreateMoodEntry crea un nuevo registro de estado de ánimo
func (r *SQLiteRepo) CreateMoodEntry(mood models.NewMoodEntryInput) (int, error) {
	// Iniciar transacción
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("error al iniciar transacción: %w", err)
	}

	// Función para deshacer la transacción en caso de error
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Insertar entrada de estado de ánimo
	query := `
		INSERT INTO mood_entries (
			date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	now := time.Now()

	result, err := tx.Exec(
		query,
		mood.Date,
		mood.MoodScore,
		mood.EnergyLevel,
		mood.AnxietyLevel,
		mood.StressLevel,
		mood.SleepHours,
		mood.Notes,
		now,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear registro de estado de ánimo: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	// Insertar etiquetas si existen
	if len(mood.Tags) > 0 {
		tagQuery := "INSERT INTO mood_tags (mood_id, tag) VALUES (?, ?)"

		for _, tag := range mood.Tags {
			_, err := tx.Exec(tagQuery, id, tag)
			if err != nil {
				return 0, fmt.Errorf("error al insertar etiqueta: %w", err)
			}
		}
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return int(id), nil
}

// GetMoodEntry obtiene un registro de estado de ánimo por su ID
func (r *SQLiteRepo) GetMoodEntry(id int) (models.MoodEntry, error) {
	// Consulta principal
	query := `
		SELECT id, date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		FROM mood_entries
		WHERE id = ?
	`

	var entry models.MoodEntry
	var dateStr, createdAt string

	err := r.db.QueryRow(query, id).Scan(
		&entry.ID,
		&dateStr,
		&entry.MoodScore,
		&entry.EnergyLevel,
		&entry.AnxietyLevel,
		&entry.StressLevel,
		&entry.SleepHours,
		&entry.Notes,
		&createdAt,
	)
	if err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al obtener registro de estado de ánimo: %w", err)
	}

	// Convertir valores
	entry.Date, _ = time.Parse("2006-01-02", dateStr)
	entry.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

	// Obtener etiquetas
	tagQuery := "SELECT tag FROM mood_tags WHERE mood_id = ?"
	rows, err := r.db.Query(tagQuery, id)
	if err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al consultar etiquetas: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return models.MoodEntry{}, fmt.Errorf("error al escanear etiqueta: %w", err)
		}
		entry.Tags = append(entry.Tags, tag)
	}

	if err := rows.Err(); err != nil {
		return models.MoodEntry{}, fmt.Errorf("error al iterar etiquetas: %w", err)
	}

	return entry, nil
}

// GetAllMoodEntries obtiene todos los registros de estado de ánimo en un rango de fechas
func (r *SQLiteRepo) GetAllMoodEntries(startDate, endDate string) ([]models.MoodEntry, error) {
	query := `
		SELECT id, date, mood_score, energy_level, anxiety_level, stress_level, sleep_hours, notes, created_at
		FROM mood_entries
		WHERE date >= ? AND date <= ?
		ORDER BY date DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar registros de estado de ánimo: %w", err)
	}
	defer rows.Close()

	var entries []models.MoodEntry
	for rows.Next() {
		var entry models.MoodEntry
		var dateStr, createdAt string

		if err := rows.Scan(
			&entry.ID,
			&dateStr,
			&entry.MoodScore,
			&entry.EnergyLevel,
			&entry.AnxietyLevel,
			&entry.StressLevel,
			&entry.SleepHours,
			&entry.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear registro de estado de ánimo: %w", err)
		}

		// Convertir valores
		entry.Date, _ = time.Parse("2006-01-02", dateStr)
		entry.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar registros de estado de ánimo: %w", err)
	}

	// Obtener etiquetas para cada entrada
	for i, entry := range entries {
		tagQuery := "SELECT tag FROM mood_tags WHERE mood_id = ?"
		tagRows, err := r.db.Query(tagQuery, entry.ID)
		if err != nil {
			return nil, fmt.Errorf("error al consultar etiquetas: %w", err)
		}

		for tagRows.Next() {
			var tag string
			if err := tagRows.Scan(&tag); err != nil {
				tagRows.Close()
				return nil, fmt.Errorf("error al escanear etiqueta: %w", err)
			}
			entries[i].Tags = append(entries[i].Tags, tag)
		}

		tagRows.Close()
		if err := tagRows.Err(); err != nil {
			return nil, fmt.Errorf("error al iterar etiquetas: %w", err)
		}
	}

	return entries, nil
}

// UpdateMoodEntry actualiza un registro de estado de ánimo
func (r *SQLiteRepo) UpdateMoodEntry(id int, mood models.UpdateMoodEntryInput) error {
	// Iniciar transacción
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("error al iniciar transacción: %w", err)
	}

	// Función para deshacer la transacción en caso de error
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Actualizar entrada principal
	query := `
		UPDATE mood_entries
		SET mood_score = ?, energy_level = ?, anxiety_level = ?, stress_level = ?, sleep_hours = ?, notes = ?
		WHERE id = ?
	`

	_, err = tx.Exec(
		query,
		mood.MoodScore,
		mood.EnergyLevel,
		mood.AnxietyLevel,
		mood.StressLevel,
		mood.SleepHours,
		mood.Notes,
		id,
	)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de estado de ánimo: %w", err)
	}

	// Actualizar etiquetas si se proporcionaron
	if mood.Tags != nil {
		// Eliminar etiquetas existentes
		_, err = tx.Exec("DELETE FROM mood_tags WHERE mood_id = ?", id)
		if err != nil {
			return fmt.Errorf("error al eliminar etiquetas existentes: %w", err)
		}

		// Insertar nuevas etiquetas
		if len(mood.Tags) > 0 {
			tagQuery := "INSERT INTO mood_tags (mood_id, tag) VALUES (?, ?)"

			for _, tag := range mood.Tags {
				_, err := tx.Exec(tagQuery, id, tag)
				if err != nil {
					return fmt.Errorf("error al insertar etiqueta: %w", err)
				}
			}
		}
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error al confirmar transacción: %w", err)
	}

	return nil
}

// DeleteMoodEntry elimina un registro de estado de ánimo
func (r *SQLiteRepo) DeleteMoodEntry(id int) error {
	// Las etiquetas se eliminarán automáticamente por la restricción ON DELETE CASCADE
	query := "DELETE FROM mood_entries WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar registro de estado de ánimo: %w", err)
	}

	return nil
}

// ==================== MÉTODOS PARA BEBIDAS CON CAFEÍNA ====================

// CreateCaffeineBeverage crea un nuevo tipo de bebida con cafeína
func (r *SQLiteRepo) CreateCaffeineBeverage(beverage models.NewCaffeineBeverageInput) (int, error) {
	query := `
		INSERT INTO caffeine_beverages (
			name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
		) VALUES (?, ?, ?, ?, ?, ?, 1)
	`

	result, err := r.db.Exec(
		query,
		beverage.Name,
		beverage.CaffeineContent,
		beverage.StandardUnit,
		beverage.StandardUnitValue,
		beverage.Category,
		beverage.ImagePath,
	)
	if err != nil {
		return 0, fmt.Errorf("error al crear bebida con cafeína: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID: %w", err)
	}

	return int(id), nil
}

// GetCaffeineBeverage obtiene una bebida con cafeína por su ID
func (r *SQLiteRepo) GetCaffeineBeverage(id int) (models.CaffeineBeverage, error) {
	query := `
        SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
        FROM caffeine_beverages
        WHERE id = ?
    `

	var beverage models.CaffeineBeverage
	var activeInt int
	var imagePath *string // Cambiado a puntero para manejar NULL

	err := r.db.QueryRow(query, id).Scan(
		&beverage.ID,
		&beverage.Name,
		&beverage.CaffeineContent,
		&beverage.StandardUnit,
		&beverage.StandardUnitValue,
		&beverage.Category,
		&imagePath,
		&activeInt,
	)
	if err != nil {
		return models.CaffeineBeverage{}, fmt.Errorf("error al obtener bebida con cafeína: %w", err)
	}

	// Manejar valor NULL
	if imagePath != nil {
		beverage.ImagePath = *imagePath
	} else {
		beverage.ImagePath = "" // Asignar string vacío si es NULL
	}

	beverage.Active = activeInt == 1

	return beverage, nil
}

// GetAllCaffeineBeverages obtiene todas las bebidas con cafeína
func (r *SQLiteRepo) GetAllCaffeineBeverages(includeInactive bool) ([]models.CaffeineBeverage, error) {
	var query string
	if includeInactive {
		query = `
            SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
            FROM caffeine_beverages
            ORDER BY name
        `
	} else {
		query = `
            SELECT id, name, caffeine_content, standard_unit, standard_unit_value, category, image_path, active
            FROM caffeine_beverages
            WHERE active = 1
            ORDER BY name
        `
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error al consultar bebidas con cafeína: %w", err)
	}
	defer rows.Close()

	var beverages []models.CaffeineBeverage
	for rows.Next() {
		var beverage models.CaffeineBeverage
		var activeInt int
		var imagePath *string // Cambiado a puntero para manejar NULL

		if err := rows.Scan(
			&beverage.ID,
			&beverage.Name,
			&beverage.CaffeineContent,
			&beverage.StandardUnit,
			&beverage.StandardUnitValue,
			&beverage.Category,
			&imagePath,
			&activeInt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear bebida con cafeína: %w", err)
		}

		// Manejar valor NULL
		if imagePath != nil {
			beverage.ImagePath = *imagePath
		} else {
			beverage.ImagePath = "" // Asignar string vacío si es NULL
		}

		beverage.Active = activeInt == 1
		beverages = append(beverages, beverage)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar bebidas con cafeína: %w", err)
	}

	return beverages, nil
}

// UpdateCaffeineBeverage actualiza una bebida con cafeína existente
func (r *SQLiteRepo) UpdateCaffeineBeverage(id int, beverage models.UpdateCaffeineBeverageInput) error {
	// Construir la consulta dinámicamente basada en los campos proporcionados
	updates := []string{}
	args := []interface{}{}

	if beverage.Name != "" {
		updates = append(updates, "name = ?")
		args = append(args, beverage.Name)
	}

	if beverage.CaffeineContent > 0 {
		updates = append(updates, "caffeine_content = ?")
		args = append(args, beverage.CaffeineContent)
	}

	if beverage.StandardUnit != "" {
		updates = append(updates, "standard_unit = ?")
		args = append(args, beverage.StandardUnit)
	}

	if beverage.StandardUnitValue > 0 {
		updates = append(updates, "standard_unit_value = ?")
		args = append(args, beverage.StandardUnitValue)
	}

	if beverage.Category != "" {
		updates = append(updates, "category = ?")
		args = append(args, beverage.Category)
	}

	if beverage.ImagePath != "" {
		updates = append(updates, "image_path = ?")
		args = append(args, beverage.ImagePath)
	}

	if beverage.Active != nil {
		updates = append(updates, "active = ?")
		if *beverage.Active {
			args = append(args, 1)
		} else {
			args = append(args, 0)
		}
	}

	// Si no hay nada que actualizar, salir
	if len(updates) == 0 {
		return nil
	}

	query := fmt.Sprintf("UPDATE caffeine_beverages SET %s WHERE id = ?", strings.Join(updates, ", "))
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("error al actualizar bebida con cafeína: %w", err)
	}

	return nil
}

// DeleteCaffeineBeverage elimina una bebida con cafeína
func (r *SQLiteRepo) DeleteCaffeineBeverage(id int) error {
	query := "DELETE FROM caffeine_beverages WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar bebida con cafeína: %w", err)
	}

	return nil
}

// ==================== MÉTODOS PARA REGISTROS DE CONSUMO DE CAFEÍNA ====================

// CreateCaffeineIntake crea un nuevo registro de consumo de cafeína
func (r *SQLiteRepo) CreateCaffeineIntake(input models.NewCaffeineIntakeInput) (int, error) {
	// Obtener información de la bebida para calcular total_caffeine
	beverage, err := r.GetCaffeineBeverage(input.BeverageID)
	if err != nil {
		return 0, fmt.Errorf("error al obtener información de la bebida: %w", err)
	}

	// Calcular el total de cafeína basado en la cantidad y el contenido de cafeína de la bebida
	// Fórmula correcta: (cantidad * contenido_cafeína) / unidad_estándar_valor
	totalCaffeine := (input.Amount * beverage.CaffeineContent)

	// Si el input ya tenía un valor para totalCaffeine, respetarlo
	if input.TotalCaffeine > 0 {
		totalCaffeine = input.TotalCaffeine
	}

	// Establecer la unidad predeterminada si no se proporciona
	unit := input.Unit
	if unit == "" {
		unit = beverage.StandardUnit
	}

	timestamp, err := time.Parse(time.RFC3339, input.Timestamp)
	if err != nil {
		return 0, fmt.Errorf("error al parsear timestamp: %w", err)
	}

	// Insertar el registro - CORREGIDO: añadir beverage_name en los campos y valores
	query := `
        INSERT INTO caffeine_intake (
            timestamp, beverage_id, beverage_name, amount, unit, total_caffeine,
            perceived_effects, related_activity, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `

	result, err := r.db.Exec(
		query,
		timestamp,
		input.BeverageID,
		beverage.Name, // AÑADIDO: pasar el nombre de la bebida
		input.Amount,
		unit,
		totalCaffeine,
		input.PerceivedEffects,
		input.RelatedActivity,
		input.Notes,
	)

	if err != nil {
		return 0, fmt.Errorf("error al crear registro de consumo de cafeína: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID de registro insertado: %w", err)
	}

	return int(id), nil
}

// GetCaffeineIntake obtiene un registro de consumo de cafeína por su ID
func (r *SQLiteRepo) GetCaffeineIntake(id int) (models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE id = ?
	`

	var intake models.CaffeineIntake
	var timestamp, createdAt string

	err := r.db.QueryRow(query, id).Scan(
		&intake.ID,
		&timestamp,
		&intake.BeverageID,
		&intake.BeverageName,
		&intake.Amount,
		&intake.Unit,
		&intake.TotalCaffeine,
		&intake.PerceivedEffects,
		&intake.RelatedActivity,
		&intake.Notes,
		&createdAt,
	)
	if err != nil {
		return models.CaffeineIntake{}, fmt.Errorf("error al obtener registro de consumo de cafeína: %w", err)
	}

	// Convertir valores
	intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
	intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

	return intake, nil
}

// GetCaffeineIntakeByDay obtiene todos los registros de consumo de cafeína para una fecha específica
func (r *SQLiteRepo) GetCaffeineIntakeByDay(date string) ([]models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE DATE(timestamp) = DATE(?)
		ORDER BY timestamp DESC
	`

	rows, err := r.db.Query(query, date)
	if err != nil {
		return nil, fmt.Errorf("error al consultar consumo de cafeína: %w", err)
	}
	defer rows.Close()

	var intakes []models.CaffeineIntake
	for rows.Next() {
		var intake models.CaffeineIntake
		var timestamp, createdAt string

		if err := rows.Scan(
			&intake.ID,
			&timestamp,
			&intake.BeverageID,
			&intake.BeverageName,
			&intake.Amount,
			&intake.Unit,
			&intake.TotalCaffeine,
			&intake.PerceivedEffects,
			&intake.RelatedActivity,
			&intake.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear consumo de cafeína: %w", err)
		}

		// Convertir valores
		intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
		intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		intakes = append(intakes, intake)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar consumos de cafeína: %w", err)
	}

	return intakes, nil
}

// GetCaffeineIntakeRange obtiene todos los registros de consumo de cafeína en un rango de fechas
func (r *SQLiteRepo) GetCaffeineIntakeRange(startDate, endDate string) ([]models.CaffeineIntake, error) {
	query := `
		SELECT id, timestamp, beverage_id, beverage_name, amount, unit,
		       total_caffeine, perceived_effects, related_activity, notes, created_at
		FROM caffeine_intake
		WHERE DATE(timestamp) >= DATE(?) AND DATE(timestamp) <= DATE(?)
		ORDER BY timestamp DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error al consultar consumo de cafeína en rango: %w", err)
	}
	defer rows.Close()

	var intakes []models.CaffeineIntake
	for rows.Next() {
		var intake models.CaffeineIntake
		var timestamp, createdAt string

		if err := rows.Scan(
			&intake.ID,
			&timestamp,
			&intake.BeverageID,
			&intake.BeverageName,
			&intake.Amount,
			&intake.Unit,
			&intake.TotalCaffeine,
			&intake.PerceivedEffects,
			&intake.RelatedActivity,
			&intake.Notes,
			&createdAt,
		); err != nil {
			return nil, fmt.Errorf("error al escanear consumo de cafeína: %w", err)
		}

		// Convertir valores
		intake.Timestamp, _ = time.Parse(time.RFC3339, timestamp)
		intake.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)

		intakes = append(intakes, intake)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar consumos de cafeína: %w", err)
	}

	return intakes, nil
}

// UpdateCaffeineIntake actualiza un registro de consumo de cafeína
func (r *SQLiteRepo) UpdateCaffeineIntake(id int, input models.UpdateCaffeineIntakeInput) error {
	// Preparar la consulta y los parámetros
	query := "UPDATE caffeine_intake SET "
	params := []interface{}{}

	// Campos a actualizar
	updateFields := []string{}

	if input.Timestamp != "" {
		updateFields = append(updateFields, "timestamp = ?")
		params = append(params, input.Timestamp)
	}

	if input.BeverageID > 0 {
		updateFields = append(updateFields, "beverage_id = ?")
		params = append(params, input.BeverageID)

		// Si se actualiza la bebida o la cantidad, recalcular total_caffeine
		if input.Amount > 0 {
			// Obtener información de la bebida
			beverage, err := r.GetCaffeineBeverage(input.BeverageID)
			if err != nil {
				return fmt.Errorf("error al obtener información de la bebida: %w", err)
			}

			// Recalcular total_caffeine
			totalCaffeine := input.Amount * beverage.CaffeineContent

			updateFields = append(updateFields, "total_caffeine = ?")
			params = append(params, totalCaffeine)

			updateFields = append(updateFields, "amount = ?")
			params = append(params, input.Amount)

			if input.Unit != "" {
				updateFields = append(updateFields, "unit = ?")
				params = append(params, input.Unit)
			}
		}
	} else if input.Amount > 0 {
		// Si solo cambia la cantidad pero no la bebida, obtener el ID de bebida actual
		var beverageID int
		err := r.db.QueryRow("SELECT beverage_id FROM caffeine_intake WHERE id = ?", id).Scan(&beverageID)
		if err != nil {
			return fmt.Errorf("error al obtener el registro actual: %w", err)
		}

		// Obtener información de la bebida
		beverage, err := r.GetCaffeineBeverage(beverageID)
		if err != nil {
			return fmt.Errorf("error al obtener información de la bebida: %w", err)
		}

		// Recalcular total_caffeine
		totalCaffeine := (input.Amount / beverage.StandardUnitValue) * beverage.CaffeineContent

		updateFields = append(updateFields, "total_caffeine = ?")
		params = append(params, totalCaffeine)

		updateFields = append(updateFields, "amount = ?")
		params = append(params, input.Amount)

		if input.Unit != "" {
			updateFields = append(updateFields, "unit = ?")
			params = append(params, input.Unit)
		}
	} else if input.TotalCaffeine > 0 {
		// Si se proporciona explícitamente un valor de total_caffeine
		updateFields = append(updateFields, "total_caffeine = ?")
		params = append(params, input.TotalCaffeine)
	}

	if input.PerceivedEffects != "" {
		updateFields = append(updateFields, "perceived_effects = ?")
		params = append(params, input.PerceivedEffects)
	}

	if input.RelatedActivity != "" {
		updateFields = append(updateFields, "related_activity = ?")
		params = append(params, input.RelatedActivity)
	}

	if input.Notes != "" {
		updateFields = append(updateFields, "notes = ?")
		params = append(params, input.Notes)
	}

	// Si no hay campos para actualizar, salir
	if len(updateFields) == 0 {
		return nil
	}

	// Completar la consulta
	query += strings.Join(updateFields, ", ")
	query += " WHERE id = ?"
	params = append(params, id)

	// Ejecutar la actualización
	_, err := r.db.Exec(query, params...)
	if err != nil {
		return fmt.Errorf("error al actualizar registro de consumo de cafeína: %w", err)
	}

	return nil
}

// DeleteCaffeineIntake elimina un registro de consumo de cafeína
func (r *SQLiteRepo) DeleteCaffeineIntake(id int) error {
	query := "DELETE FROM caffeine_intake WHERE id = ?"

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("error al eliminar consumo de cafeína: %w", err)
	}

	return nil
}

// GetDailyCaffeineTotal calcula el consumo total de cafeína para un día específico
func (r *SQLiteRepo) GetDailyCaffeineTotal(date string) (float64, error) {
	var total float64
	query := `
		SELECT COALESCE(SUM(total_caffeine), 0)
		FROM caffeine_intake
		WHERE DATE(timestamp) = DATE(?)
	`

	err := r.db.QueryRow(query, date).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error al calcular consumo total de cafeína: %w", err)
	}

	return total, nil
}

// GetHabitStats obtiene estadísticas para un hábito específico
func (r *SQLiteRepo) GetHabitStats(habitID int, period string) (map[string]interface{}, error) {
	// Obtener información del hábito
	habit, err := r.GetHabit(habitID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener información del hábito: %w", err)
	}

	// Determinar rango de fechas según el período
	now := time.Now()
	var startDate time.Time

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, 0, -30) // Valor predeterminado: último mes
	}

	// Formato de fechas para la consulta
	startDateStr := startDate.Format("2006-01-02")
	endDateStr := now.Format("2006-01-02")

	// Obtener registros en el período
	logs, err := r.GetHabitLogs(habitID, startDateStr, endDateStr)
	if err != nil {
		return nil, fmt.Errorf("error al obtener registros del hábito: %w", err)
	}

	// Calcular estadísticas
	totalDays := len(logs)
	completedDays := 0
	totalCount := 0
	streak := 0
	currentStreak := 0
	lastDate := time.Time{}

	for i, log := range logs {
		if log.Completed {
			completedDays++
		}
		totalCount += log.Count

		// Calcular racha actual
		if i == 0 {
			if log.Completed {
				currentStreak = 1
			}
			lastDate = log.Date
		} else {
			dayDiff := int(lastDate.Sub(log.Date).Hours() / 24)
			if log.Completed && dayDiff == 1 {
				currentStreak++
			} else if !log.Completed {
				currentStreak = 0
			}
			lastDate = log.Date
		}

		// Actualizar racha máxima
		if currentStreak > streak {
			streak = currentStreak
		}
	}

	// Calcular tasas
	completionRate := 0.0
	if totalDays > 0 {
		completionRate = float64(completedDays) / float64(totalDays) * 100
	}

	averageCount := 0.0
	if totalDays > 0 {
		averageCount = float64(totalCount) / float64(totalDays)
	}

	// Construir resultado
	stats := map[string]interface{}{
		"habit_id":        habitID,
		"habit_name":      habit.Name,
		"period":          period,
		"total_days":      totalDays,
		"completed_days":  completedDays,
		"completion_rate": completionRate,
		"total_count":     totalCount,
		"average_count":   averageCount,
		"max_streak":      streak,
		"current_streak":  currentStreak,
		"start_date":      startDateStr,
		"end_date":        endDateStr,
	}

	return stats, nil
}

// GetMoodStats obtiene estadísticas de estado de ánimo para un período
func (r *SQLiteRepo) GetMoodStats(period string) (map[string]interface{}, error) {
	// Determinar rango de fechas según el período
	now := time.Now()
	var startDate time.Time

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, 0, -30) // Valor predeterminado: último mes
	}

	// Formato de fechas para la consulta
	startDateStr := startDate.Format("2006-01-02")
	endDateStr := now.Format("2006-01-02")

	// Obtener registros en el período
	entries, err := r.GetAllMoodEntries(startDateStr, endDateStr)
	if err != nil {
		return nil, fmt.Errorf("error al obtener registros de estado de ánimo: %w", err)
	}

	// Calcular estadísticas
	totalEntries := len(entries)
	if totalEntries == 0 {
		return map[string]interface{}{
			"period":        period,
			"total_entries": 0,
			"start_date":    startDateStr,
			"end_date":      endDateStr,
			"message":       "No hay datos para el período solicitado",
		}, nil
	}

	var sumMood, sumEnergy, sumAnxiety, sumStress, sumSleep float64
	var countSleep int

	// Mapas para contar frecuencia de etiquetas
	tagFrequency := make(map[string]int)

	for _, entry := range entries {
		sumMood += float64(entry.MoodScore)
		sumEnergy += float64(entry.EnergyLevel)
		sumAnxiety += float64(entry.AnxietyLevel)
		sumStress += float64(entry.StressLevel)

		if entry.SleepHours > 0 {
			sumSleep += entry.SleepHours
			countSleep++
		}

		// Contar frecuencia de etiquetas
		for _, tag := range entry.Tags {
			tagFrequency[tag]++
		}
	}

	// Calcular promedios
	avgMood := sumMood / float64(totalEntries)
	avgEnergy := sumEnergy / float64(totalEntries)
	avgAnxiety := sumAnxiety / float64(totalEntries)
	avgStress := sumStress / float64(totalEntries)

	avgSleep := 0.0
	if countSleep > 0 {
		avgSleep = sumSleep / float64(countSleep)
	}

	// Encontrar las etiquetas más comunes
	type tagCount struct {
		Tag   string
		Count int
	}
	var topTags []tagCount

	for tag, count := range tagFrequency {
		topTags = append(topTags, tagCount{Tag: tag, Count: count})
	}

	// Ordenar etiquetas por frecuencia (de mayor a menor)
	sort.Slice(topTags, func(i, j int) bool {
		return topTags[i].Count > topTags[j].Count
	})

	// Limitar a las 5 etiquetas más comunes
	commonTags := []map[string]interface{}{}
	for i, tc := range topTags {
		if i >= 5 {
			break
		}
		commonTags = append(commonTags, map[string]interface{}{
			"tag":   tc.Tag,
			"count": tc.Count,
		})
	}

	// Construir resultado
	stats := map[string]interface{}{
		"period":            period,
		"total_entries":     totalEntries,
		"avg_mood_score":    avgMood,
		"avg_energy_level":  avgEnergy,
		"avg_anxiety_level": avgAnxiety,
		"avg_stress_level":  avgStress,
		"avg_sleep_hours":   avgSleep,
		"common_tags":       commonTags,
		"start_date":        startDateStr,
		"end_date":          endDateStr,
	}

	return stats, nil
}

// GetCaffeineStats obtiene estadísticas de consumo de cafeína para un período
func (r *SQLiteRepo) GetCaffeineStats(period string) (map[string]interface{}, error) {
	// Determinar rango de fechas según el período
	now := time.Now()
	var startDate time.Time

	switch period {
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, 0, -30) // Valor predeterminado: último mes
	}

	// Formato de fechas para la consulta
	startDateStr := startDate.Format("2006-01-02")
	endDateStr := now.Format("2006-01-02")

	// Obtener registros en el período
	intakes, err := r.GetCaffeineIntakeRange(startDateStr, endDateStr)
	if err != nil {
		return nil, fmt.Errorf("error al obtener registros de consumo de cafeína: %w", err)
	}

	// Calcular estadísticas
	totalIntakes := len(intakes)
	if totalIntakes == 0 {
		return map[string]interface{}{
			"period":        period,
			"total_intakes": 0,
			"start_date":    startDateStr,
			"end_date":      endDateStr,
			"message":       "No hay datos para el período solicitado",
		}, nil
	}

	var totalCaffeine float64
	beverageFrequency := make(map[string]int)
	beverageCaffeine := make(map[string]float64)
	dailyCaffeine := make(map[string]float64)

	// Procesar cada registro
	for _, intake := range intakes {
		totalCaffeine += intake.TotalCaffeine

		// Contar frecuencia y cafeína por bebida
		beverageFrequency[intake.BeverageName]++
		beverageCaffeine[intake.BeverageName] += intake.TotalCaffeine

		// Agrupar por día
		dateStr := intake.Timestamp.Format("2006-01-02")
		dailyCaffeine[dateStr] += intake.TotalCaffeine
	}

	// Calcular promedios y máximos
	avgCaffeinePerIntake := totalCaffeine / float64(totalIntakes)

	// Calcular consumo diario promedio y máximo
	var sumDailyCaffeine float64
	var maxDailyCaffeine float64
	var maxDailyDate string
	uniqueDays := len(dailyCaffeine)

	for date, amount := range dailyCaffeine {
		sumDailyCaffeine += amount
		if amount > maxDailyCaffeine {
			maxDailyCaffeine = amount
			maxDailyDate = date
		}
	}

	avgDailyCaffeine := 0.0
	if uniqueDays > 0 {
		avgDailyCaffeine = sumDailyCaffeine / float64(uniqueDays)
	}

	// Encontrar las bebidas más comunes
	type beverageStats struct {
		Name            string
		Count           int
		TotalCaffeine   float64
		AverageCaffeine float64
		PercentOfTotal  float64
	}

	var topBeverages []beverageStats
	for name, count := range beverageFrequency {
		avg := beverageCaffeine[name] / float64(count)
		percent := (beverageCaffeine[name] / totalCaffeine) * 100

		topBeverages = append(topBeverages, beverageStats{
			Name:            name,
			Count:           count,
			TotalCaffeine:   beverageCaffeine[name],
			AverageCaffeine: avg,
			PercentOfTotal:  percent,
		})
	}

	// Ordenar bebidas por frecuencia (de mayor a menor)
	sort.Slice(topBeverages, func(i, j int) bool {
		return topBeverages[i].Count > topBeverages[j].Count
	})

	// Limitar a las 5 bebidas más comunes
	commonBeverages := []map[string]interface{}{}
	for i, beverage := range topBeverages {
		if i >= 5 {
			break
		}
		commonBeverages = append(commonBeverages, map[string]interface{}{
			"name":             beverage.Name,
			"count":            beverage.Count,
			"total_caffeine":   beverage.TotalCaffeine,
			"average_caffeine": beverage.AverageCaffeine,
			"percent_of_total": beverage.PercentOfTotal,
		})
	}

	// Construir resultado
	stats := map[string]interface{}{
		"period":                  period,
		"total_intakes":           totalIntakes,
		"unique_days":             uniqueDays,
		"total_caffeine":          totalCaffeine,
		"avg_caffeine_per_intake": avgCaffeinePerIntake,
		"avg_daily_caffeine":      avgDailyCaffeine,
		"max_daily_caffeine":      maxDailyCaffeine,
		"max_daily_date":          maxDailyDate,
		"common_beverages":        commonBeverages,
		"start_date":              startDateStr,
		"end_date":                endDateStr,
	}

	return stats, nil
}

// GetCorrelationStats analiza posibles correlaciones entre el consumo de cafeína y el estado de ánimo
func (r *SQLiteRepo) GetCorrelationStats() (map[string]interface{}, error) {
	// Obtener datos de los últimos 90 días para tener suficientes datos para el análisis
	now := time.Now()
	startDate := now.AddDate(0, 0, -90)

	startDateStr := startDate.Format("2006-01-02")
	endDateStr := now.Format("2006-01-02")

	// Obtener registros de estado de ánimo
	moodEntries, err := r.GetAllMoodEntries(startDateStr, endDateStr)
	if err != nil {
		return nil, fmt.Errorf("error al obtener registros de estado de ánimo: %w", err)
	}

	// Mapeo de fecha a estado de ánimo
	moodByDate := make(map[string]models.MoodEntry)
	for _, entry := range moodEntries {
		dateStr := entry.Date.Format("2006-01-02")
		moodByDate[dateStr] = entry
	}

	// Obtener consumo diario de cafeína
	caffeineByDate := make(map[string]float64)

	// Para cada día en el período
	for d := startDate; !d.After(now); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")

		// Obtener consumo de cafeína para este día
		caffeine, err := r.GetDailyCaffeineTotal(dateStr)
		if err != nil {
			// Si hay error, continuar con el siguiente día
			log.Printf("Error al obtener consumo de cafeína para %s: %v", dateStr, err)
			continue
		}

		caffeineByDate[dateStr] = caffeine
	}

	// Analizar correlaciones
	type correlation struct {
		MoodScore    float64
		EnergyLevel  float64
		AnxietyLevel float64
		StressLevel  float64
		SleepHours   float64
	}

	// Dividir los datos en grupos según el consumo de cafeína
	lowCaffeine := correlation{}
	mediumCaffeine := correlation{}
	highCaffeine := correlation{}

	var lowCount, mediumCount, highCount int
	var lowSum, mediumSum, highSum float64

	// Contar días con cafeína
	daysWithCaffeine := 0
	for _, amount := range caffeineByDate {
		if amount > 0 {
			daysWithCaffeine++
		}
	}

	// Si no hay suficientes datos, devolver mensaje
	if daysWithCaffeine < 10 || len(moodEntries) < 10 {
		return map[string]interface{}{
			"message":       "No hay suficientes datos para analizar correlaciones. Se necesitan al menos 10 días con registros de cafeína y estado de ánimo.",
			"caffeine_days": daysWithCaffeine,
			"mood_days":     len(moodEntries),
		}, nil
	}

	// Calcular tercios para clasificar el consumo
	var allCaffeine []float64
	for _, amount := range caffeineByDate {
		if amount > 0 {
			allCaffeine = append(allCaffeine, amount)
		}
	}

	sort.Float64s(allCaffeine)

	var lowThreshold, highThreshold float64
	if len(allCaffeine) >= 3 {
		lowThreshold = allCaffeine[len(allCaffeine)/3]
		highThreshold = allCaffeine[2*len(allCaffeine)/3]
	} else if len(allCaffeine) > 0 {
		// Si hay pocos datos, usar valores arbitrarios
		lowThreshold = allCaffeine[0] * 0.5
		highThreshold = allCaffeine[0] * 1.5
	}

	// Clasificar y acumular datos
	for dateStr, entry := range moodByDate {
		caffeine, exists := caffeineByDate[dateStr]
		if !exists || caffeine == 0 {
			continue // No hay datos de cafeína para este día
		}

		if caffeine <= lowThreshold {
			lowCaffeine.MoodScore += float64(entry.MoodScore)
			lowCaffeine.EnergyLevel += float64(entry.EnergyLevel)
			lowCaffeine.AnxietyLevel += float64(entry.AnxietyLevel)
			lowCaffeine.StressLevel += float64(entry.StressLevel)
			lowCaffeine.SleepHours += entry.SleepHours
			lowCount++
			lowSum += caffeine
		} else if caffeine <= highThreshold {
			mediumCaffeine.MoodScore += float64(entry.MoodScore)
			mediumCaffeine.EnergyLevel += float64(entry.EnergyLevel)
			mediumCaffeine.AnxietyLevel += float64(entry.AnxietyLevel)
			mediumCaffeine.StressLevel += float64(entry.StressLevel)
			mediumCaffeine.SleepHours += entry.SleepHours
			mediumCount++
			mediumSum += caffeine
		} else {
			highCaffeine.MoodScore += float64(entry.MoodScore)
			highCaffeine.EnergyLevel += float64(entry.EnergyLevel)
			highCaffeine.AnxietyLevel += float64(entry.AnxietyLevel)
			highCaffeine.StressLevel += float64(entry.StressLevel)
			highCaffeine.SleepHours += entry.SleepHours
			highCount++
			highSum += caffeine
		}
	}

	// Calcular promedios
	if lowCount > 0 {
		lowCaffeine.MoodScore /= float64(lowCount)
		lowCaffeine.EnergyLevel /= float64(lowCount)
		lowCaffeine.AnxietyLevel /= float64(lowCount)
		lowCaffeine.StressLevel /= float64(lowCount)
		lowCaffeine.SleepHours /= float64(lowCount)
	}

	if mediumCount > 0 {
		mediumCaffeine.MoodScore /= float64(mediumCount)
		mediumCaffeine.EnergyLevel /= float64(mediumCount)
		mediumCaffeine.AnxietyLevel /= float64(mediumCount)
		mediumCaffeine.StressLevel /= float64(mediumCount)
		mediumCaffeine.SleepHours /= float64(mediumCount)
	}

	if highCount > 0 {
		highCaffeine.MoodScore /= float64(highCount)
		highCaffeine.EnergyLevel /= float64(highCount)
		highCaffeine.AnxietyLevel /= float64(highCount)
		highCaffeine.StressLevel /= float64(highCount)
		highCaffeine.SleepHours /= float64(highCount)
	}

	// Construir resultado
	lowCaffeineAvg := 0.0
	if lowCount > 0 {
		lowCaffeineAvg = lowSum / float64(lowCount)
	}

	mediumCaffeineAvg := 0.0
	if mediumCount > 0 {
		mediumCaffeineAvg = mediumSum / float64(mediumCount)
	}

	highCaffeineAvg := 0.0
	if highCount > 0 {
		highCaffeineAvg = highSum / float64(highCount)
	}

	result := map[string]interface{}{
		"period":         "últimos 90 días",
		"start_date":     startDateStr,
		"end_date":       endDateStr,
		"threshold_low":  lowThreshold,
		"threshold_high": highThreshold,
		"low_caffeine": map[string]interface{}{
			"count":             lowCount,
			"avg_caffeine":      lowCaffeineAvg,
			"avg_mood_score":    lowCaffeine.MoodScore,
			"avg_energy_level":  lowCaffeine.EnergyLevel,
			"avg_anxiety_level": lowCaffeine.AnxietyLevel,
			"avg_stress_level":  lowCaffeine.StressLevel,
			"avg_sleep_hours":   lowCaffeine.SleepHours,
		},
		"medium_caffeine": map[string]interface{}{
			"count":             mediumCount,
			"avg_caffeine":      mediumCaffeineAvg,
			"avg_mood_score":    mediumCaffeine.MoodScore,
			"avg_energy_level":  mediumCaffeine.EnergyLevel,
			"avg_anxiety_level": mediumCaffeine.AnxietyLevel,
			"avg_stress_level":  mediumCaffeine.StressLevel,
			"avg_sleep_hours":   mediumCaffeine.SleepHours,
		},
		"high_caffeine": map[string]interface{}{
			"count":             highCount,
			"avg_caffeine":      highCaffeineAvg,
			"avg_mood_score":    highCaffeine.MoodScore,
			"avg_energy_level":  highCaffeine.EnergyLevel,
			"avg_anxiety_level": highCaffeine.AnxietyLevel,
			"avg_stress_level":  highCaffeine.StressLevel,
			"avg_sleep_hours":   highCaffeine.SleepHours,
		},
	}

	return result, nil
}
