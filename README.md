# 🛡️ Standby Case Manager

> **Sistema integral para la gestión y monitoreo de casos de operación en tiempo real.**

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20PostgreSQL-blueviolet?style=for-the-badge)

---

## 📋 Descripción

**Standby Case Manager** es una solución robusta diseñada para optimizar el flujo de trabajo de los equipos de operaciones. Permite registrar, monitorear y gestionar incidentes de manera eficiente, asegurando que nada se pierda en el cambio de turno.

### ✨ Características Principales

* **🚀 Gestión en Tiempo Real**: Actualizaciones instantáneas de casos y estados.
* **🔍 Filtrado Avanzado**: Búsqueda potente por fecha (presets 1M/3M/6M), prioridad, estado y responsable.
* **⌨️ Command Palette**: Navegación rápida y acciones globales con `Ctrl + K`.
* **👤 Smart Avatars**: Identificación visual instantánea con avatares generados por hash.
* **📂 Bóveda de Evidencias**: Adjunta imágenes, PDFs y logs a los casos con arrastrar y soltar (Drag & Drop), previsualización y auditoría automática.
* **🌍 Soporte de Zona Horaria**: Detección automática de la zona horaria del usuario para búsquedas precisas.
* **🔒 Seguridad**: Autenticación robusta y gestión de roles (Admin/Ingreso/Consulta).
* **🐳 Dockerizado**: Despliegue sencillo y consistente en cualquier entorno.

---

## 🛠️ Tecnologías

Este proyecto está construido con un stack moderno y eficiente:

* **Backend**: ⚡ [FastAPI](https://fastapi.tiangolo.com/) (Python) + [uv](https://github.com/astral-sh/uv) (Gestor de paquetes ultrarrápido)
* **Frontend**: ⚛️ [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Estilos**: 🎨 [TailwindCSS](https://tailwindcss.com/)
* **Base de Datos**: 🐘 [PostgreSQL](https://www.postgresql.org/)
* **Runtime JS**: 🥯 [Bun](https://bun.sh/) (para builds ultrarrápidos)

---

## 🚀 Guía de Inicio Rápido

La forma más sencilla de ejecutar el proyecto es utilizando **Docker**. Olvídate de instalar dependencias manualmente.

### Requisitos Previos

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

### 1️⃣ Instalación

Clona el repositorio y navega al directorio:

```bash
git clone git@github.com:rortiz-09/standby-case-manager.git
cd standby-case-manager
```

### 2️⃣ Ejecución

Levanta todo el entorno con un solo comando:

```bash
docker compose up --build
```

> ☕ **Nota**: La primera vez puede tardar unos minutos mientras se descargan las imágenes y se construyen los servicios.

### 3️⃣ Acceso

Una vez que los contenedores estén arriba, accede a:

| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Interfaz de usuario principal |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentación interactiva (Swagger) |

---

## 🔐 Credenciales por Defecto

El sistema se inicializa con un usuario administrador para que puedas empezar de inmediato:

* 📧 **Admin**: `admin@standby.com` / 🔑 `admin123`
* 📧 **Ingreso**: `ingreso@standby.com` / 🔑 `ingreso123`
* 📧 **Consulta**: `consulta@standby.com` / 🔑 `consulta123`

> ⚠️ **Importante**: Se recomienda cambiar esta contraseña inmediatamente después del primer inicio de sesión.

---

## 📂 Estructura del Proyecto

```text
standby-case-manager/
├── 📂 backend/          # API RESTful con FastAPI
├── 📂 frontend/         # SPA con React y Tailwind
├── 📄 docker-compose.yml # Orquestación de contenedores
└── 📄 README.md         # Documentación del proyecto
```

---

## 💻 Desarrollo Local (Manual)

Si deseas ejecutar los servicios fuera de Docker para desarrollo:

### Backend

```bash
cd backend
# Crear entorno virtual (opcional pero recomendado)
uv venv

# Activar entorno
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

# Instalar dependencias con uv (¡Ultrarrápido!)
uv pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

---

Hecho con ❤️ por [rortiz-09](https://github.com/rortiz-09)
