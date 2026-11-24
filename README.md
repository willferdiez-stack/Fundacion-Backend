# Fundación Backend

API REST desarrollada con Node.js, Express y MongoDB para gestionar usuarios y registros de anomalías. El proyecto incluye autenticación mediante JWT, control de roles y permisos de acceso a las anomalías.

## Tecnologías

- Node.js con módulos ES
- Express 5
- MongoDB y Mongoose
- JSON Web Tokens
- bcrypt
- Vitest
- Docker Compose

## Funcionalidades

- Registro e inicio de sesión de usuarios
- Autenticación mediante tokens JWT
- Gestión de roles: `admin`, `user` y `classC`
- Creación, consulta, actualización y eliminación de anomalías
- Restricción de lecturas para usuarios Clase C
- Concesión y retirada de accesos a anomalías
- Administración de usuarios para cuentas administradoras
- Pruebas unitarias de permisos y autorización

## Requisitos

- Node.js
- npm
- Docker y Docker Compose, para ejecutar MongoDB

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/willferdiez-stack/Fundacion-Backend.git
cd Fundacion-Backend
```

2. Instala las dependencias:

```bash
npm install
```

> En Windows PowerShell, si aparece un error de ejecución de scripts al utilizar `npm`, puedes ejecutar `npm.cmd install` en su lugar. También puedes utilizar `npm.cmd run dev` y `npm.cmd test`.

3. Crea el archivo de variables de entorno:

```bash
cp .env.example .env
```

En Windows, puedes copiarlo manualmente o ejecutar:

```powershell
Copy-Item .env.example .env
```

4. Configura las variables del archivo `.env`:

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/fundacion_backend
JWT_SECRET=tu_clave_secreta_aqui
```

> Utiliza una clave secreta segura y no publiques el valor real de `JWT_SECRET`.

5. Inicia MongoDB con Docker Compose:

```bash
docker compose up -d
```

6. Inicia el servidor:

```bash
npm run dev
```

La API estará disponible en `http://localhost:3001`.

También puedes iniciar el servidor sin el modo de desarrollo:

```bash
npm start
```

## Variables de entorno

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor | `3001` |
| `MONGO_URI` | URL de conexión a MongoDB | `mongodb://127.0.0.1:27017/fundacion_backend` |
| `JWT_SECRET` | Clave utilizada para firmar y verificar los JWT | `tu_clave_secreta_aqui` |

## Uso de autenticación

Las rutas protegidas requieren un token JWT en la cabecera HTTP:

```http
Authorization: Bearer <token>
```

Los tokens tienen una duración de una hora.

## Endpoints

### Estado

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Comprueba que la API está operativa |

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registra un usuario |
| `POST` | `/api/auth/login` | Público | Inicia sesión y devuelve un JWT |
| `GET` | `/api/auth/me` | Autenticado | Devuelve el usuario autenticado |

Ejemplo de registro:

```json
{
  "username": "investigador",
  "email": "investigador@example.com",
  "password": "contraseña-segura"
}
```

Ejemplo de inicio de sesión:

```json
{
  "email": "investigador@example.com",
  "password": "contraseña-segura"
}
```

### Anomalías

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/anomalies` | `user` o `admin` | Crea una anomalía |
| `GET` | `/api/anomalies` | Autenticado | Lista las anomalías disponibles |
| `GET` | `/api/anomalies/:id` | Autenticado | Obtiene una anomalía por ID |
| `PATCH` | `/api/anomalies/:id` | Propietario o `admin` | Actualiza una anomalía |
| `DELETE` | `/api/anomalies/:id` | Propietario o `admin` | Elimina una anomalía |
| `PATCH` | `/api/anomalies/:id/access` | Propietario o `admin` | Concede o retira acceso Clase C |

Ejemplo de creación:

```json
{
  "code": "ANOM-001",
  "name": "Ejemplo de anomalía",
  "description": "Descripción de la anomalía",
  "containmentClass": "Euclid",
  "dangerLevel": 3,
  "protocols": [
    {
      "title": "Protocolo principal",
      "description": "Mantener la anomalía bajo observación"
    }
  ]
}
```

Campos permitidos para `containmentClass`: `Safe`, `Euclid` y `Keter`.

El campo `dangerLevel` debe ser un número comprendido entre `1` y `5`.

Ejemplo para conceder o retirar acceso:

```json
{
  "userId": "ID_DEL_USUARIO_CLASE_C",
  "action": "grant"
}
```

Los valores válidos de `action` son `grant` y `revoke`.

### Administración

Las siguientes rutas están disponibles exclusivamente para usuarios con rol `admin`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/users` | Lista los usuarios |
| `PATCH` | `/api/admin/users/:id/role` | Cambia el rol de un usuario |

Ejemplo de cambio de rol:

```json
{
  "role": "classC"
}
```

Los roles válidos son `admin`, `user` y `classC`. Un administrador no puede cambiar su propio rol.

## Colección de Postman

El proyecto incluye una colección de Postman en
`postman/Fundacion-Backend.postman_collection.json`.

Para utilizarla, importa el archivo JSON en Postman
y configura la variable `baseUrl` con la dirección
del servidor.

La colección incluye peticiones de autenticación,
gestión de anomalías y administración.

Las peticiones que requieren autenticación utilizan
un token JWT, que se guarda automáticamente al
ejecutar una petición de login.

Para probar las operaciones que dependen de usuarios
o anomalías existentes, primero deben crearse los
registros correspondientes en la base de datos.

## Roles y permisos

| Rol | Permisos principales |
|---|---|
| `user` | Crear anomalías y administrar las anomalías de las que es propietario |
| `admin` | Acceso administrativo completo y administración de todas las anomalías |
| `classC` | Solo puede consultar las anomalías a las que ha sido autorizado |

### Preparación de usuarios de prueba

El registro público crea usuarios con el rol `user`. Para probar las funciones administrativas en una base de datos nueva, primero hay que registrar un usuario y asignarle el rol `admin` directamente desde MongoDB.

Una vez exista una cuenta administradora, se podrán utilizar los endpoints administrativos para asignar otros roles, incluido `classC`.

La colección de Postman contiene credenciales de ejemplo, pero **no crea automáticamente esos usuarios**: deben existir previamente en la base de datos.

## Pruebas

Ejecuta las pruebas con:

```bash
npm test
```

Las pruebas actuales cubren los permisos de modificación de anomalías y el middleware de autorización.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia la API con Node.js |
| `npm run dev` | Inicia la API con recarga automática mediante Nodemon |
| `npm test` | Ejecuta las pruebas con Vitest |
| `docker compose up -d` | Inicia MongoDB en segundo plano |
| `docker compose down` | Detiene los contenedores |

## Estructura del proyecto

```text
.
├── __tests__/                 # Pruebas unitarias
├── postman/                   # Colección de peticiones de Postman
│   └── Fundacion-Backend.postman_collection.json
├── src/
│   ├── config/                # Conexión con MongoDB
│   ├── controllers/           # Lógica de las rutas
│   ├── middlewares/           # Autenticación, autorización y errores
│   ├── models/                # Modelos de Mongoose
│   ├── routes/                # Definición de endpoints
│   ├── utils/                # Utilidades y reglas de permisos
│   └── index.js               # Punto de entrada y configuración de Express
├── .env.example
├── compose.yaml
├── package.json
├── MEMORIA.md
└── README.md
```
