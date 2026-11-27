# Fundación Backend

API REST desarrollada con **Node.js, Express y MongoDB** para gestionar usuarios y expedientes de anomalías, inspirados en el universo ficticio de la Fundación SCP. Incluye autenticación JWT, control de roles, permisos individuales para usuarios Clase C, filtros de búsqueda y pruebas automatizadas.

## Tecnologías

- Node.js con módulos ES y Express 5
- MongoDB 8 y Mongoose
- JSON Web Tokens (JWT) y bcrypt
- Vitest para pruebas automatizadas
- Docker Compose para ejecutar MongoDB
- Postman para probar los endpoints

## Funcionalidades

- Registro e inicio de sesión; autenticación mediante JWT.
- Roles `admin`, `user` (investigador) y `classC`.
- Creación, consulta, modificación y eliminación de anomalías.
- Consultas con filtros opcionales y combinables por clase de contención, peligrosidad mínima y nombre.
- Lectura restringida a expedientes autorizados para usuarios Clase C, también al aplicar filtros.
- Concesión y retirada de permisos de lectura por anomalía.
- Consulta de usuarios y cambio de roles para administradores.
- Tratamiento centralizado de errores y **12 tests automatizados**.

## Requisitos

- **Node.js 22.12 o posterior dentro de la rama 22, o Node.js 24/26**, con npm (según los requisitos de las dependencias instaladas).
- Docker con Docker Compose para iniciar la base de datos (o una instancia de MongoDB compatible configurada en `MONGO_URI`).
- Postman, opcional, para utilizar la colección incluida.

## Instalación y puesta en marcha

1. Clona el repositorio:

   ```bash
   git clone https://github.com/willferdiez-stack/Fundacion-Backend.git
   cd Fundacion-Backend
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea tu archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell puedes utilizar `Copy-Item .env.example .env`.

4. Comprueba el contenido de `.env` y **sustituye `JWT_SECRET` por una clave secreta propia**:

   ```env
   PORT=3001
   MONGO_URI=mongodb://127.0.0.1:27017/fundacion_backend
   JWT_SECRET=pon_aqui_una_clave_secreta_segura
   ```

   Estas son las tres variables que necesita la aplicación. El archivo `.env` está excluido del repositorio mediante `.gitignore`.

5. Inicia MongoDB:

   ```bash
   docker compose up -d
   ```

6. Inicia la API en modo desarrollo:

   ```bash
   npm run dev
   ```

   También puedes utilizar `npm start` para iniciarla sin recarga automática.

El servidor estará disponible en **`http://localhost:3001`** (salvo que cambies `PORT`). Para comprobarlo, haz una petición `GET http://localhost:3001/api/health`: debe responder con `status: "ok"`.

> **Windows PowerShell:** si la política de ejecución impide usar `npm`, prueba `npm.cmd install`, `npm.cmd run dev` o `npm.cmd test`.

## Primera configuración: crear un administrador

La base de datos comienza vacía. El registro público **siempre crea usuarios con rol `user`**; no es posible registrarse directamente como administrador o Clase C.

Para preparar los roles en una instalación nueva:

1. Ejecuta la petición **Registrar administrador** de la colección de Postman, o registra un usuario mediante `POST /api/auth/register`.
2. Abre una consola de MongoDB desde la carpeta del proyecto:

   ```bash
   docker compose exec mongodb mongosh
   ```

3. En `mongosh`, selecciona la base de datos y cambia el rol de ese usuario (sustituye el correo si has utilizado otro):

   ```javascript
   use fundacion_backend
   db.users.updateOne(
     { email: "admin@fundacion.test" },
     { $set: { role: "admin" } }
   )
   ```

4. Inicia sesión con **Login administrador**. A partir de ese momento podrás cambiar los roles de otras cuentas desde `PATCH /api/admin/users/:id/role?role=classC`, sin volver a utilizar `mongosh`.

Las cuentas de ejemplo de Postman se crean con sus peticiones de registro: **importar la colección no introduce usuarios ni anomalías en MongoDB**. Si cambias las credenciales de registro, recuerda utilizar las mismas en los Body de login.

## Autenticación y roles

Las rutas protegidas requieren la cabecera:

```http
Authorization: Bearer <token>
```

El JWT se obtiene mediante `POST /api/auth/login` y tiene una duración de **una hora**.

| Rol | Permisos principales |
|---|---|
| `admin` | Consulta y administración de usuarios y de cualquier anomalía. |
| `user` | Consulta todas las anomalías; puede crear y modificar, eliminar o gestionar permisos únicamente en las suyas. |
| `classC` | Solo puede consultar anomalías para las que figure en `authorizedReaders`. No puede crearlas ni modificarlas. |

## Endpoints

### Estado

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Comprueba que la API responde. |

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registra un usuario nuevo con rol `user`. |
| `POST` | `/api/auth/login` | Público | Comprueba las credenciales y devuelve un JWT. |
| `GET` | `/api/auth/me` | Autenticado | Devuelve el ID y rol del usuario autenticado. |

Ejemplo del Body para registrar un usuario:

```json
{
  "username": "investigador",
  "email": "investigador@example.com",
  "password": "contraseña-segura"
}
```

Para el login se envían `email` y `password` en el Body.

### Anomalías

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/anomalies` | `user`, `admin` | Crea un expediente; el propietario es el usuario autenticado. |
| `GET` | `/api/anomalies` | Autenticado | Lista los expedientes accesibles y admite filtros opcionales. |
| `GET` | `/api/anomalies/:id` | Autenticado | Consulta un expediente por su ID de MongoDB. |
| `PATCH` | `/api/anomalies/:id` | Propietario o `admin` | Actualiza los campos permitidos. |
| `DELETE` | `/api/anomalies/:id` | Propietario o `admin` | Elimina el expediente. |
| `PATCH` | `/api/anomalies/:id/access` | Propietario o `admin` | Concede o retira acceso de lectura a Clase C. |

Ejemplo de Body para crear una anomalía:

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

Las clases de contención válidas son `Safe`, `Euclid` y `Keter`. El nivel de peligrosidad debe estar entre **1 y 5**. Al modificar una anomalía se pueden actualizar `name`, `description`, `containmentClass`, `dangerLevel` y `protocols`, pero no `code` ni `owner`.

#### Filtros para listar anomalías

`GET /api/anomalies` acepta estos **Query Params opcionales y combinables**:

| Parámetro | Valor de ejemplo | Comportamiento |
|---|---|---|
| `containmentClass` | `Keter` | Coincidencia exacta con `Safe`, `Euclid` o `Keter`. |
| `minDanger` | `4` | Devuelve niveles de peligrosidad **mayores o iguales** al indicado; admite enteros de 1 a 5. |
| `name` | `sombra` | Busca una coincidencia parcial sin distinguir mayúsculas y minúsculas. |

Ejemplo con los tres filtros:

```http
GET /api/anomalies?containmentClass=Keter&minDanger=4&name=sombra
```

Los filtros se aplican conjuntamente. Para `classC` se añade **siempre** la restricción de `authorizedReaders`: ningún filtro permite acceder a expedientes no autorizados. Un parámetro inválido provoca un `400 Bad Request`.

#### Conceder y retirar acceso

El identificador de la anomalía va en `:id`, mientras que el del **usuario Clase C destinatario** se indica en el Query Param `userId`:

```http
PATCH /api/anomalies/:id/access?userId=ID_DEL_USUARIO_CLASE_C
```

Para conceder el acceso, el Body contiene:

```json
{
  "action": "grant"
}
```

Para retirarlo, se utiliza `"action": "revoke"`. Solo el administrador o el propietario del expediente pueden gestionar estos permisos. Al conceder un acceso, el destinatario debe tener rol `classC`.

### Administración

Estas rutas requieren autenticación con rol `admin`:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/users` | Lista los usuarios sin mostrar hashes de contraseñas. |
| `PATCH` | `/api/admin/users/:id/role` | Cambia el rol de un usuario. |

El usuario cuyo rol se modifica se identifica mediante `:id` y **el nuevo rol se envía mediante el Query Param `role`**, no en el Body:

```http
PATCH /api/admin/users/:id/role?role=classC
```

Los roles válidos son `admin`, `user` y `classC`. El administrador no puede modificar su propio rol.

## Colección de Postman

La colección exportada está en **`postman/Fundacion Backend.postman_collection.json`**. Para utilizarla:

1. Importa ese archivo JSON en Postman.
2. Abre las variables de la colección y establece **`baseUrl = http://localhost:3001`** (en el JSON exportado su valor está vacío).
3. Comprueba el servidor desde **Preparación → Comprobar servidor**.
4. Registra las cuentas de ejemplo con las peticiones de **Autenticación**. Convierte la primera en administrador siguiendo la sección «Primera configuración» y utiliza la ruta administrativa para asignar `classC` al usuario correspondiente.
5. Ejecuta el login de la cuenta que vayas a utilizar. El script de Postman guarda automáticamente el JWT en `token`; al cambiar de usuario, vuelve a iniciar sesión con la cuenta deseada.
6. Crea una anomalía y copia su `_id` de la respuesta para utilizarlo en **Params → Path Variables → `id`** de las peticiones de consulta, modificación, eliminación o acceso. Para conceder acceso, copia también el ID del usuario destinatario en **Params → Query Params → `userId`**.

Los **Body y Params ya están preparados** en la colección. Se han conservado identificadores de ejemplo en algunas Path Variables: **no corresponden a la base de datos de quien clone el proyecto**, por lo que deben sustituirse antes de enviar las peticiones. En «Cambiar rol», selecciona el Query Param `role` apropiado (solo un valor a la vez). En «Listar anomalías», activa los filtros que desees comprobar, también evitando activar a la vez varios valores del mismo parámetro.

> **Precaución:** antes de ejecutar DELETE, comprueba siempre que `id` apunta a un expediente creado para pruebas. Las credenciales incluidas en la colección son de demostración y no deben reutilizarse en otros entornos.

## Gestión de errores

La API centraliza los errores mediante `HttpError` y un middleware de Express. Algunos ejemplos:

| Situación | Código |
|---|---|
| Datos inválidos o JSON mal formado | `400` |
| Credenciales incorrectas o falta de autenticación válida | `401` |
| Acceso sin autorización | `403` |
| Recurso inexistente o no visible para Clase C | `404` |
| Valor único duplicado | `409` |
| Error inesperado | `500` |

## Pruebas

Ejecuta todas las pruebas automatizadas con:

```bash
npm test
```

Hay **12 tests con Vitest**, distribuidos en tres archivos:

| Archivo | Tests | Qué comprueban |
|---|---:|---|
| `__tests__/permissions.test.js` | 4 | Permisos de modificación por rol y propiedad. |
| `__tests__/authorize.test.js` | 2 | Autorización de una ruta protegida por rol. |
| `__tests__/anomalyFilters.test.js` | 6 | Construcción y validación de filtros y restricciones para Clase C. |

Los tests de filtros utilizan un mock de `Anomaly.find()` y no requieren conexión a MongoDB. Las operaciones completas de autenticación, persistencia y gestión de accesos se han comprobado manualmente mediante Postman; **no existe todavía una suite automatizada de integración**.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia la API con Node.js. |
| `npm run dev` | Inicia la API con recarga automática mediante Nodemon. |
| `npm test` | Ejecuta los 12 tests con Vitest. |
| `docker compose up -d` | Inicia MongoDB en segundo plano. |
| `docker compose down` | Detiene el contenedor de MongoDB sin eliminar el volumen persistente. |
