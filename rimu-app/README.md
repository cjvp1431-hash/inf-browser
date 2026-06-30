# RIMU App - Productivity All-in-One

## ¿Qué es RIMU?

App de productividad local para iPhone con 5 módulos integrados:
- **Tareas** – To-do list con prioridades Eisenhower
- **Hábitos** – Tracking con rachas (streaks) y calendario
- **Entrenamientos** – Log de ejercicios (sets, reps, peso)
- **Finanzas** – Cuentas multi-moneda, gastos e ingresos
- **Estudios** – Materias + Pomodoro timer + horas acumuladas

**100% offline · SQLite local · Sin servidor · Sin cuenta**

---

## Setup rápido

### 1. Instalar dependencias

```bash
cd rimu-app
npm install
```

### 2. Iniciar en Expo Go (iPhone)

```bash
npx expo start
```

1. Abre **Expo Go** en tu iPhone (descárgalo del App Store si no lo tienes)
2. Escanea el código QR que aparece en la terminal
3. La app carga en segundos directamente en tu iPhone

### 3. (Opcional) Compilar como .ipa nativo

```bash
npm install -g eas-cli
eas build -p ios --local
```

Requiere Mac con Xcode + cuenta Apple Developer.

---

## Stack técnico

| Tech | Uso |
|------|-----|
| React Native + Expo SDK 52 | Framework |
| expo-sqlite v15 | Base de datos local (async API) |
| @react-navigation/bottom-tabs | Navegación |
| react-native-paper | UI components |
| Zustand | State management |
| @expo/vector-icons (Ionicons) | Iconos |
| expo-notifications | Recordatorios |

---

## Estructura del proyecto

```
rimu-app/
├── App.tsx                    # Root: DB init + NavigationContainer
├── src/
│   ├── database/
│   │   └── database.ts        # SQLite + todos los CRUD
│   ├── store/
│   │   ├── tasksStore.ts      # Zustand tasks
│   │   ├── habitsStore.ts     # Zustand habits
│   │   ├── workoutsStore.ts   # Zustand workouts
│   │   ├── financeStore.ts    # Zustand finance
│   │   └── studiesStore.ts    # Zustand studies
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Dashboard del día
│   │   ├── TasksScreen.tsx    # CRUD tareas + Eisenhower
│   │   ├── HabitsScreen.tsx   # Check-in + streaks + calendario
│   │   ├── WorkoutsScreen.tsx # Log ejercicios agrupado por fecha
│   │   ├── FinanceScreen.tsx  # Cuentas + transacciones
│   │   ├── StudiesScreen.tsx  # Materias + Pomodoro timer
│   │   └── SettingsScreen.tsx # Ajustes + notificaciones
│   ├── services/
│   │   └── notificationService.ts
│   └── utils/
│       ├── constants.ts       # Colores, categorías, constantes
│       └── formatters.ts      # Formateo de fechas, monedas, streak
├── package.json
└── app.json
```

---

## Datos de ejemplo precargados

Al primer inicio se crean automáticamente:
- 3 tareas de ejemplo (Trabajo, Salud, Hogar)
- 2 hábitos (Meditar, Leer)
- 1 entrenamiento (Press de Banca)
- 1 cuenta bancaria ($1,000 USD)
- 1 transacción (Supermercado $50)
- 1 materia (Inglés)

---

## Colores RIMU

- **Primary:** `#0A0A0A` (Negro profundo)
- **Accent:** `#00D4FF` (Cyan eléctrico)
- **Background:** `#FFFFFF`
- **Surface:** `#F5F5F5`

---

## Funcionalidades por módulo

### Tareas
- Crear/editar/eliminar tareas
- Filtros: Todas / Pendientes / Completadas
- Prioridades Eisenhower (1=Urgente+Importante, 2=Importante, 3=Urgente, 4=Eliminar)
- Categorías: Personal, Trabajo, Salud, Finanzas, Estudio, Hogar

### Hábitos
- Check-in diario con un toque
- Cálculo automático de racha (streak)
- Calendario visual de los últimos 30 días
- Frecuencias: Diario, Semanal, Mensual

### Entrenamientos
- Log: Ejercicio + Series + Reps + Peso (kg/lbs)
- Historial agrupado por fecha
- Vista "Hoy" diferenciada

### Finanzas
- Múltiples cuentas con distintas monedas
- Ingresos y gastos categorizados
- Balance se actualiza automáticamente
- 8 monedas: USD, DOP, EUR, MXN, COP, ARS, PEN, CLP

### Estudios
- Materias con color personalizado
- Timer Pomodoro (25 min focus + 5 min break)
- Registro automático de sesiones
- Total de horas acumuladas por materia

### Notificaciones
- Recordatorio diario de hábitos a las 20:00 (configurable)
- Se activa desde Settings

---

## Base de datos

SQLite local en `rimu.db` con 7 tablas:
`tasks`, `habits`, `workouts`, `accounts`, `transactions`, `subjects`, `studySessions`

La base de datos se inicializa automáticamente al abrir la app.
No se necesita ninguna configuración adicional.
