# Habit Tracker

Una aplicación de escritorio desarrollada con Wails (Go + React) para monitorizar y analizar hábitos diarios, consumo de cafeína y estado de ánimo, permitiendo identificar correlaciones entre estos factores.

## 🚀 Características

- **Seguimiento de Hábitos**: Crea y monitoriza hábitos personalizados con seguimiento diario
- **Control de Cafeína**: Registra el consumo de diferentes bebidas con cafeína y visualiza patrones
- **Monitoreo del Estado de Ánimo**: Registra y analiza tu estado emocional diario
- **Análisis de Correlaciones**: Identifica relaciones entre hábitos, cafeína y estado de ánimo
- **Dashboard Interactivo**: Visualización clara de datos y estadísticas
- **Calendario Integrado**: Vista temporal de todos tus registros
- **Estadísticas Detalladas**: Métricas y gráficos para analizar tendencias

## 🛠️ Tecnologías

- **Backend**: Go con Wails framework
- **Frontend**: React con Vite
- **Base de Datos**: SQLite
- **UI**: CSS personalizado con diseño responsive

## 📋 Requisitos

- Go 1.19 o superior
- Node.js 16 o superior
- Wails CLI instalado

## 🔧 Instalación

1. **Instalar Wails CLI** (si no lo tienes):
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

2. **Clonar el repositorio**:
```bash
git clone [tu-repositorio]
cd habit-tracker
```

3. **Instalar dependencias del frontend**:
```bash
cd frontend
npm install
cd ..
```

4. **Ejecutar en modo desarrollo**:
```bash
wails dev
```

## 🏗️ Compilar para Producción

```bash
# Compilar para tu plataforma actual
wails build

# Compilar para Windows
wails build -platform windows/amd64

# Compilar para macOS
wails build -platform darwin/amd64

# Compilar para Linux
wails build -platform linux/amd64
```

## 📱 Uso

### Panel Principal
- **Dashboard**: Vista general con resumen diario
- **Hábitos**: Crear, editar y marcar hábitos como completados
- **Cafeína**: Registrar consumo de bebidas con cafeína
- **Estado de Ánimo**: Registrar y visualizar tu estado emocional
- **Estadísticas**: Análisis detallado y correlaciones

### Funcionalidades Principales

1. **Gestión de Hábitos**:
   - Crear hábitos personalizados
   - Establecer frecuencia y recordatorios
   - Seguimiento de streaks y progreso

2. **Registro de Cafeína**:
   - Base de datos de bebidas con contenido de cafeína
   - Registro de cantidad y horario
   - Visualización de patrones de consumo

3. **Monitoreo del Ánimo**:
   - Escala de 1-10 para el estado de ánimo
   - Notas adicionales opcionales
   - Tendencias y promedios

4. **Análisis de Correlaciones**:
   - Relación entre cafeína y estado de ánimo
   - Impacto de hábitos en el bienestar
   - Visualización de patrones temporales

## 🏗️ Estructura del Proyecto

```
habit-tracker/
├── backend/
│   ├── api/          # Controladores de API
│   ├── database/     # Repositorios y SQLite
│   └── models/       # Modelos de datos
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   ├── styles/      # Estilos CSS
│   │   └── utils/       # Utilidades
│   └── wailsjs/      # Bindings auto-generados
├── build/            # Configuración de build
└── main.go          # Punto de entrada principal
```

## 🎨 Personalización

### Agregar Nuevas Bebidas con Cafeína
Modifica el archivo `backend/database/sqlite_caffeine_beverages.go` para agregar nuevas bebidas.

### Modificar la Escala de Estado de Ánimo
Ajusta la lógica en `backend/models/mood.go` y los componentes del frontend.

### Estilos Personalizados
Los estilos se encuentran en `frontend/src/styles/` organizados por componente.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📊 Capturas de Pantalla

[Agregar capturas de pantalla aquí cuando estén disponibles]

## 📝 Roadmap

- [ ] Exportación de datos a CSV/JSON
- [ ] Recordatorios push nativos
- [ ] Modo oscuro
- [ ] Sincronización en la nube
- [ ] Análisis predictivo con IA
- [ ] Integración con dispositivos wearables

## 📄 Licencia

[Especificar licencia]

## 👨‍💻 Autor

@kubaliski

## 🙏 Agradecimientos

- [Wails](https://wails.io/) por el excelente framework
- Comunidad de Go y React por las herramientas y recursos
