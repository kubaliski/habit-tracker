package database

import (
	"fmt"
	"log"
)

// ClearAllData vacía todas las tablas de la base de datos
// Si reinitializeDefaults es true, reinicializa los datos predeterminados (bebidas con cafeína)
func (r *SQLiteRepo) ClearAllData(reinitializeDefaults bool) error {
	// Iniciar transacción para asegurar que todo se elimina o nada
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

	// Lista de tablas a vaciar
	tables := []string{
		"habit_logs",
		"habits",
		"mood_tags",
		"mood_entries",
		"caffeine_intake",
		"caffeine_beverages",
	}

	// Deshabilitar restricciones de clave foránea temporalmente para evitar errores de integridad referencial
	_, err = tx.Exec("PRAGMA foreign_keys = OFF;")
	if err != nil {
		return fmt.Errorf("error al deshabilitar claves foráneas: %w", err)
	}

	// Vaciar cada tabla
	for _, table := range tables {
		_, err := tx.Exec(fmt.Sprintf("DELETE FROM %s;", table))
		if err != nil {
			return fmt.Errorf("error al vaciar tabla %s: %w", table, err)
		}

		// Restablecer la secuencia del autoincremento
		_, err = tx.Exec(fmt.Sprintf("DELETE FROM sqlite_sequence WHERE name='%s';", table))
		if err != nil {
			log.Printf("Advertencia: error al reiniciar autoincremento para tabla %s: %v", table, err)
			// No retornamos error aquí, ya que esto no es crítico
		}
	}

	// Volver a habilitar las restricciones de clave foránea
	_, err = tx.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return fmt.Errorf("error al habilitar claves foráneas: %w", err)
	}

	// Confirmar la transacción
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error al confirmar transacción: %w", err)
	}

	// Si se solicita, reinicializar datos predeterminados
	if reinitializeDefaults {
		if err := r.InitializeDefaultCaffeineBeverages(); err != nil {
			return fmt.Errorf("error al reinicializar datos predeterminados: %w", err)
		}
	}

	log.Println("Base de datos vaciada exitosamente")
	return nil
}
