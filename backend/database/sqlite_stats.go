package database

import (
	"fmt"
	"log"
	"sort"
	"time"

	"github.com/kubaliski/habit-tracker/backend/models"
)

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
