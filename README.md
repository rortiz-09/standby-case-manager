# Standby Case Manager

Sistema de gestión de casos de operación y standby.

## Requisitos

Para ejecutar este proyecto, lo único que necesitas tener instalado en tu máquina es:

- **Docker Desktop** (o Docker Engine + Docker Compose)

No necesitas instalar Node.js, Python, ni bases de datos localmente si usas Docker, ya que todo se ejecuta dentro de contenedores aislados. Esto garantiza que el entorno sea **idéntico** para todos los desarrolladores, sin importar el sistema operativo o la carpeta donde guarden el proyecto.

## Instalación y Ejecución con Docker (Recomendado)

1. **Clonar el repositorio**: Descarga el código en cualquier carpeta de tu equipo.
2. **Navegar a la carpeta**: Abre una terminal en la raíz del proyecto `standby-case-manager`.
3. **Ejecutar**:

```bash
docker compose up --build
```

Este comando descargará las imágenes necesarias, construirá el frontend (usando Bun) y el backend, y levantará la base de datos.

4. **Acceder**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Usuarios por defecto

El sistema creará automáticamente un usuario administrador al iniciar:

- **Email**: `admin@example.com`
- **Password**: `admin123`

## Estructura del Proyecto

- `backend/`: API FastAPI con SQLModel.
- `frontend/`: Aplicación React + Vite + TailwindCSS (construida con Bun).
- `docker-compose.yml`: Archivo maestro que orquesta los contenedores y asegura la consistencia del entorno.

## Desarrollo Local (Opcional)

Si prefieres ejecutar los servicios manualmente en tu máquina (fuera de Docker):

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

Este proyecto utiliza **Bun** para una gestión de paquetes más rápida.

1. Instalar Bun: [https://bun.sh/](https://bun.sh/)
2. Ejecutar:

```bash
cd frontend
bun install
bun run dev
```
