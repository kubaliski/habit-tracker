/**
 * Obtiene información del emoji y descripción basado en la puntuación de estado de ánimo
 * Esta función se usa en múltiples componentes para mantener consistencia
 *
 * @param {number} score - Puntuación del estado de ánimo (1-10)
 * @returns {Object} Objeto con emoji y descripción correspondientes
 */
export const getMoodInfo = (score) => {
    const moodMap = {
      1: { emoji: '😩', description: 'Muy mal' },
      2: { emoji: '😟', description: 'Mal' },
      3: { emoji: '😕', description: 'Regular bajo' },
      4: { emoji: '😐', description: 'Regular' },
      5: { emoji: '😐', description: 'Neutral' },
      6: { emoji: '🙂', description: 'Regular alto' },
      7: { emoji: '😊', description: 'Bien' },
      8: { emoji: '😄', description: 'Muy bien' },
      9: { emoji: '😁', description: 'Excelente' },
      10: { emoji: '🤩', description: 'Increíble' }
    };

    return moodMap[score] || { emoji: '😐', description: 'Neutral' };
  };

  export default getMoodInfo;