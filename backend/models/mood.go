package models

import "time"

// MoodEntry representa un registro del estado de ánimo
type MoodEntry struct {
	ID           int       `json:"id"`
	Date         time.Time `json:"date"`
	MoodScore    int       `json:"mood_score"`    // 1-10
	EnergyLevel  int       `json:"energy_level"`  // 1-10
	AnxietyLevel int       `json:"anxiety_level"` // 1-10
	StressLevel  int       `json:"stress_level"`  // 1-10
	SleepHours   float64   `json:"sleep_hours"`
	Notes        string    `json:"notes"`
	Tags         []string  `json:"tags"`
	CreatedAt    time.Time `json:"created_at"`
}

// NewMoodEntryInput representa los datos de entrada para crear un registro de estado de ánimo
type NewMoodEntryInput struct {
	Date         string   `json:"date" binding:"required"`
	MoodScore    int      `json:"mood_score" binding:"required,min=1,max=10"`
	EnergyLevel  int      `json:"energy_level" binding:"min=1,max=10"`
	AnxietyLevel int      `json:"anxiety_level" binding:"min=1,max=10"`
	StressLevel  int      `json:"stress_level" binding:"min=1,max=10"`
	SleepHours   float64  `json:"sleep_hours"`
	Notes        string   `json:"notes"`
	Tags         []string `json:"tags"`
}

// UpdateMoodEntryInput representa los datos de entrada para actualizar un registro de estado de ánimo
type UpdateMoodEntryInput struct {
	MoodScore    int      `json:"mood_score" binding:"min=1,max=10"`
	EnergyLevel  int      `json:"energy_level" binding:"min=1,max=10"`
	AnxietyLevel int      `json:"anxiety_level" binding:"min=1,max=10"`
	StressLevel  int      `json:"stress_level" binding:"min=1,max=10"`
	SleepHours   float64  `json:"sleep_hours"`
	Notes        string   `json:"notes"`
	Tags         []string `json:"tags"`
}
