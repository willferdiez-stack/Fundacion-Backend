# Fundación Backend — Memoria técnica

## 1. Introducción y objetivos

### 1.1. Descripción del proyecto

Fundación Backend es una API REST desarrollada como proyecto individual del Bootcamp de desarrollo backend. Su temática está inspirada en el universo ficticio de la Fundación SCP, una organización dedicada al estudio y contención de fenómenos y entidades anómalas.

La aplicación permite gestionar un archivo de expedientes de anomalías. Cada expediente contiene información como su código identificativo, nombre, descripción, clase de contención, nivel de peligrosidad y protocolos de seguridad.

Además de almacenar y consultar esta información, la API incorpora un sistema de autenticación y permisos para controlar qué usuarios pueden acceder a los expedientes y qué operaciones pueden realizar.

El proyecto está desarrollado en **JavaScript**, utilizando **Node.js y Express** para el servidor y **MongoDB con Mongoose** para la persistencia de datos.

No incluye una interfaz gráfica propia: las funcionalidades se utilizan mediante peticiones HTTP, que durante el desarrollo se han probado principalmente con Postman.

### 1.2. Objetivos del proyecto

El objetivo principal ha sido aplicar los conocimientos adquiridos durante el Bootcamp mediante el desarrollo de una API funcional, organizada y capaz de gestionar información persistente de forma segura.

Para conseguirlo, se han establecido los siguientes objetivos:

- Diseñar una base de datos con MongoDB y definir sus modelos mediante Mongoose.
- Implementar operaciones de creación, consulta, modificación y eliminación de anomalías.
- Desarrollar un sistema de registro e inicio de sesión utilizando bcrypt y tokens JWT.
- Establecer diferentes roles de usuario y controlar los permisos de acceso a los recursos.
- Organizar el código en rutas, controladores, modelos, middlewares y funciones auxiliares.
- Centralizar la gestión de errores y devolver respuestas HTTP adecuadas.
- Incorporar búsquedas opcionales y combinables sin debilitar las restricciones de acceso.
- Crear pruebas unitarias para comprobar reglas de autorización, construcción de filtros y validación de parámetros.
- Documentar la instalación, el funcionamiento y las decisiones técnicas del proyecto.

### 1.3. Funcionalidades principales

La API cuenta con tres roles de usuario:

- **Administrador (`admin`):** puede gestionar usuarios y anomalías, independientemente de quién haya creado cada expediente.
- **Investigador (`user`):** puede registrar anomalías y modificar o eliminar aquellas de las que es propietario.
- **Clase C (`classC`):** tiene acceso de solo lectura y únicamente puede consultar los expedientes para los que ha recibido autorización.

Para gestionar los permisos de lectura de Clase C, cada anomalía dispone de una lista de usuarios autorizados. Los administradores y los investigadores responsables de cada expediente pueden conceder o retirar estos accesos.

La aplicación permite filtrar los expedientes por **clase de contención**, **nivel mínimo de peligrosidad** y **nombre parcial**, combinando criterios en la misma petición. Las restricciones de Clase C se mantienen incluso cuando utiliza filtros.

También incorpora validaciones de datos, respuestas de error centralizadas y **12 pruebas automatizadas** que comprueban reglas de autorización y construcción de consultas.

## 2. Base de datos y modelo de datos

### 2.1. Elección de MongoDB

Para la persistencia de datos del proyecto se ha utilizado **MongoDB**, una base de datos NoSQL orientada a documentos, junto con **Mongoose**, una biblioteca que permite definir modelos, establecer validaciones y realizar consultas desde Node.js.

MongoDB encaja con la estructura de la aplicación porque el recurso principal es el expediente de una anomalía. Cada expediente contiene varios campos y puede incluir una lista de protocolos de seguridad asociados.

Al utilizar documentos, es posible almacenar la información de una anomalía junto con sus protocolos, sin necesidad de crear una colección independiente para estos últimos.

Además, MongoDB permite trabajar con arrays y documentos anidados, características que resultan útiles para representar tanto los protocolos como los usuarios autorizados para consultar cada anomalía.

### 2.2. Comparación con una base de datos relacional

El proyecto también podría haberse desarrollado utilizando una base de datos SQL, como MySQL o PostgreSQL.

En ese caso, probablemente habríamos necesitado varias tablas relacionadas:

- **Usuarios:** para almacenar las cuentas y los roles.
- **Anomalías:** para almacenar los expedientes y sus propietarios.
- **Protocolos:** para almacenar los protocolos asociados a cada anomalía.
- **Accesos autorizados:** para relacionar las anomalías con los usuarios Clase C que pueden consultarlas.

Estas relaciones se establecerían mediante claves primarias y foráneas. Para recuperar toda la información de un expediente podría ser necesario realizar consultas con operaciones `JOIN`.

En MongoDB, en cambio, los protocolos se almacenan directamente dentro del documento de la anomalía y pueden recuperarse junto con ella.

Esto simplifica algunas de las operaciones habituales de nuestra API, especialmente la consulta de expedientes completos.

No obstante, las bases de datos relacionales ofrecen ventajas importantes, como la integridad referencial mediante claves foráneas. En MongoDB, las referencias entre documentos deben gestionarse cuidadosamente desde la aplicación.

Por tanto, MongoDB resulta adecuado para este proyecto, aunque no significa que sea una opción superior a SQL en cualquier situación.

### 2.3. Entidades del proyecto

El modelo de datos está formado por **dos colecciones principales y una entidad embebida**, cumpliendo el requisito de trabajar con al menos tres entidades.

**User — Usuarios**

Representa a las personas registradas en la aplicación.

Sus principales campos son:

- `username`: nombre del usuario.
- `email`: correo electrónico, que debe ser único.
- `passwordHash`: contraseña almacenada mediante un hash de bcrypt.
- `role`: rol del usuario, que puede ser `user`, `admin` o `classC`.

El rol predeterminado de un usuario recién registrado es `user`, por lo que no puede convertirse directamente en administrador o Clase C durante el registro público.

**Anomaly — Anomalías**

Es la entidad principal de la aplicación y representa los expedientes archivados por la Fundación.

Contiene los siguientes campos:

- `code`: código identificativo único de la anomalía.
- `name`: nombre del expediente.
- `description`: descripción de la anomalía.
- `containmentClass`: clase de contención (`Safe`, `Euclid` o `Keter`).
- `dangerLevel`: nivel de peligrosidad comprendido entre 1 y 5.
- `owner`: referencia al usuario responsable del expediente.
- `authorizedReaders`: lista de referencias a usuarios autorizados para consultarlo.
- `protocols`: lista de protocolos asociados a la anomalía.

**Protocol — Protocolos**

Los protocolos son subdocumentos embebidos dentro de cada anomalía.

Cada protocolo contiene:

- `title`: título del protocolo.
- `description`: instrucciones o descripción del procedimiento.

No existe una colección independiente de protocolos, porque estos forman parte del expediente al que pertenecen.

### 2.4. Decisiones de embebido y referenciado

Una de las principales decisiones de diseño ha sido determinar qué información almacenar dentro de un documento y qué información relacionar mediante referencias.

**Protocolos embebidos**

Los protocolos se almacenan dentro del array `protocols` de cada anomalía.

Esta decisión se debe a que un protocolo está directamente relacionado con un expediente concreto y, en nuestra aplicación, se consulta junto con la información de esa anomalía.

De esta manera, podemos obtener el expediente y sus protocolos mediante una misma consulta.

**Usuarios referenciados**

En cambio, los usuarios se almacenan en su propia colección, ya que tienen una existencia independiente de las anomalías.

El campo `owner` contiene un identificador de tipo `ObjectId` que hace referencia al modelo `User`.

Esto permite relacionar cada expediente con su investigador responsable sin duplicar los datos de ese usuario dentro de la anomalía.

Por otra parte, `authorizedReaders` es un array de referencias a usuarios. Su finalidad es controlar qué personas con rol Clase C tienen permiso para consultar un expediente determinado.

Así, un mismo usuario Clase C puede estar autorizado para consultar varias anomalías, y una anomalía puede tener varios lectores autorizados.

### 2.5. Validaciones del modelo

Los modelos están definidos mediante esquemas de Mongoose, que permiten establecer restricciones sobre los datos almacenados.

Entre las validaciones utilizadas destacan:

- `required`: establece qué campos son obligatorios.
- `unique`: permite definir índices únicos para evitar identificadores o correos electrónicos duplicados.
- `enum`: restringe determinados campos a un conjunto de valores permitidos.
- `min` y `max`: limitan el nivel de peligrosidad a valores entre 1 y 5.
- `trim`: elimina espacios al principio y al final de determinadas cadenas de texto.
- `lowercase`: convierte los correos electrónicos a minúsculas.

También se ha utilizado la opción `timestamps: true` en ambos modelos, que permite registrar automáticamente las fechas de creación y última actualización de los documentos mediante `createdAt` y `updatedAt`.

Estas restricciones ayudan a mantener la coherencia de los datos y evitan almacenar información que no cumple las reglas definidas para la aplicación.

## 3. Arquitectura y organización del código

### 3.1. Estructura general de la aplicación

La API se ha desarrollado utilizando **Node.js y Express**, siguiendo una estructura modular que separa las diferentes responsabilidades de la aplicación.

En lugar de incluir toda la lógica en un único archivo, el proyecto está dividido en carpetas que agrupan los elementos según su función.

Esta organización facilita la lectura del código, permite localizar los problemas con mayor rapidez y evita mezclar la gestión de peticiones HTTP con las operaciones de base de datos y las comprobaciones de seguridad.

Las principales carpetas y archivos son:

- **`src/index.js`:** punto de entrada de la aplicación. Configura Express, registra las rutas y los middlewares, establece la conexión con MongoDB e inicia el servidor.
- **`src/config/`:** contiene la configuración de conexión con la base de datos.
- **`src/routes/`:** define los endpoints disponibles y los middlewares que debe atravesar cada petición.
- **`src/controllers/`:** contiene las funciones que procesan las peticiones, realizan operaciones sobre los datos y generan las respuestas HTTP.
- **`src/models/`:** define los esquemas de Mongoose y las reglas de validación de los documentos.
- **`src/middlewares/`:** contiene las funciones de autenticación, autorización por roles y gestión centralizada de errores.
- **`src/utils/`:** agrupa funciones auxiliares y clases reutilizables, como la comprobación de permisos sobre anomalías y la clase `HttpError`.
- **`__tests__/`:** contiene las pruebas unitarias desarrolladas con Vitest.

La separación entre rutas, controladores y modelos ha sido una de las decisiones principales de organización del proyecto.

### 3.2. Organización de las rutas y controladores

Las rutas se han dividido según el tipo de recurso o funcionalidad que gestionan.

**Autenticación**

El archivo `auth.routes.js` define las rutas de registro, inicio de sesión y consulta del usuario autenticado.

Estas operaciones son atendidas por las funciones de `auth.controller.js`, donde se implementan el registro de usuarios, la comprobación de contraseñas y la generación de tokens JWT.

**Anomalías**

El archivo `anomaly.routes.js` agrupa las operaciones relacionadas con los expedientes.

Su controlador, `anomaly.controller.js`, permite crear, consultar, actualizar y eliminar anomalías, además de conceder o retirar permisos de lectura a usuarios Clase C. En el listado admite filtros opcionales mediante los parámetros de consulta `containmentClass`, `minDanger` y `name`.

**Administración**

El archivo `admin.routes.js` contiene las rutas reservadas a administradores.

Desde `admin.controller.js` se pueden consultar los usuarios registrados y modificar sus roles. En el cambio de rol, el usuario se selecciona mediante `req.params.id` y el nuevo rol se obtiene de `req.query.role`.

**Estado de la API**

El archivo `health.routes.js` incluye un endpoint sencillo que permite comprobar que el servidor está respondiendo correctamente.

Esta distribución evita concentrar todas las operaciones en un mismo controlador y permite mantener relacionadas las funciones que trabajan sobre los mismos recursos.

### 3.3. Recorrido de una petición HTTP

Para entender cómo se relacionan las diferentes partes de la aplicación, podemos utilizar como ejemplo una petición para modificar una anomalía.

Cuando un cliente envía una petición `PATCH /api/anomalies/:id`, el proceso es el siguiente:

1. **Express recibe la petición.** La aplicación identifica la ruta correspondiente y comienza a ejecutar los middlewares asociados.
2. **Se comprueba la autenticación.** El middleware `authenticate` verifica el token JWT y obtiene los datos del usuario autenticado.
3. **Se ejecuta el controlador.** La función `updateAnomaly` busca en MongoDB la anomalía indicada mediante su identificador.
4. **Se comprueban los permisos.** El controlador utiliza `canModifyAnomaly` para determinar si el usuario es administrador o investigador propietario del expediente.
5. **Se actualizan los datos.** Si el usuario tiene permiso, el controlador modifica únicamente los campos admitidos y guarda los cambios mediante Mongoose.
6. **Se devuelve la respuesta.** Si la operación termina correctamente, la API responde con un código `200` y los datos actualizados.

Si durante el proceso se produce un error, este puede enviarse mediante `next(error)` al middleware centralizado, encargado de devolver una respuesta HTTP adecuada.

Este recorrido muestra cómo colaboran las rutas, los middlewares, los controladores y los modelos sin que cada uno tenga que asumir todas las responsabilidades.

### 3.4. Uso de middlewares

Los middlewares son funciones que intervienen durante el procesamiento de una petición HTTP.

En el proyecto se utilizan principalmente tres:

**`authenticate`**

Comprueba que la petición incluye un token JWT válido. También consulta al usuario en la base de datos y añade su identificador y rol a `req.user`, para que las siguientes funciones puedan utilizarlos.

**`authorize`**

Comprueba que el usuario autenticado tiene uno de los roles permitidos para acceder a una ruta.

Se utiliza especialmente para proteger las operaciones de administración, que están reservadas al rol `admin`.

**`errorHandler`**

Recibe los errores enviados desde los controladores y los transforma en respuestas HTTP.

Permite centralizar los mensajes y códigos de error, evitando repetir la misma lógica en distintos controladores.

Además, se utiliza el middleware `express.json()` para interpretar los datos JSON enviados en el cuerpo de las peticiones.

### 3.5. Funciones auxiliares y reutilización de código

Durante el desarrollo se detectó que varios controladores repetían las mismas comprobaciones de permisos.

Por ese motivo se creó la función `canModifyAnomaly`, ubicada en `src/utils/permissions.js`.

Esta función recibe un usuario y una anomalía, y devuelve un valor booleano que indica si el usuario tiene permiso para modificar ese expediente.

La función se utiliza en las operaciones de actualización, eliminación y gestión de accesos.

Separar esta comprobación permite mantener la regla de autorización en un único lugar y facilita su verificación mediante pruebas unitarias.

También se creó la clase `HttpError`, ubicada en `src/utils/HttpError.js`, para representar errores que tienen asociado un código HTTP y un mensaje.

Su utilización permite que los controladores indiquen qué error se ha producido sin encargarse directamente de construir todas las respuestas de error.

### 3.6. Configuración e inicio del servidor

La aplicación utiliza el paquete `dotenv` para cargar las variables de entorno necesarias, como el puerto del servidor, la dirección de conexión a MongoDB y la clave secreta utilizada para los JWT.

La conexión a la base de datos se realiza desde `src/config/db.js`, mediante Mongoose.

En `src/index.js` se registran las rutas de autenticación, anomalías, administración y comprobación del estado del servidor.

El middleware centralizado de errores se registra después de las rutas para que pueda recibir los errores que se produzcan durante su ejecución.

Por último, el servidor comienza a escuchar peticiones una vez que se ha establecido correctamente la conexión con MongoDB.

Esta organización permite separar la configuración inicial de la aplicación de la lógica que procesa las peticiones.

### 3.7. Filtros de búsqueda de anomalías

El endpoint `GET /api/anomalies` acepta tres parámetros de consulta opcionales:

- **`containmentClass`**: limita la búsqueda a una clase válida: `Safe`, `Euclid` o `Keter`.
- **`minDanger`**: busca expedientes cuyo `dangerLevel` sea mayor o igual que un entero comprendido entre 1 y 5. En Mongoose se utiliza el operador `$gte`.
- **`name`**: permite buscar una coincidencia parcial del nombre, sin distinguir mayúsculas y minúsculas. Para ello se usa `$regex` con la opción `i`; se escapan los caracteres especiales introducidos por el cliente para tratarlos como texto literal.

Los criterios pueden combinarse en una misma petición, por ejemplo:

```http
GET /api/anomalies?containmentClass=Keter&minDanger=4&name=sombra
```

El controlador construye un único objeto `filter` que se entrega a `Anomaly.find(filter)`. Si el usuario es Clase C, se añade primero la condición `authorizedReaders: req.user.id` y después se incorporan los filtros solicitados. De esta manera, la búsqueda nunca amplía los expedientes que puede consultar ese usuario.

Los parámetros incorrectos se rechazan mediante `HttpError(400, ...)` antes de consultar MongoDB.

## 4. Autenticación, seguridad y permisos

### 4.1. Registro y autenticación de usuarios

La API utiliza **bcrypt** para proteger las contraseñas y **JSON Web Tokens (JWT)** para autenticar las peticiones.

Durante el registro, la contraseña se transforma mediante bcrypt antes de almacenarse en MongoDB. De esta manera, la base de datos guarda un hash en el campo `passwordHash`, en lugar de la contraseña original.

Cuando un usuario inicia sesión, se compara la contraseña introducida con el hash almacenado. Si las credenciales son correctas, el servidor genera un JWT con una duración de una hora.

Las rutas protegidas utilizan el middleware `authenticate`, que comprueba la validez del token y busca al usuario en la base de datos para obtener su rol actual.

Esta última comprobación permite que un cambio de rol tenga efecto sin necesidad de esperar a que caduque el token.

### 4.2. Roles y control de acceso

Se han implementado tres roles:

| Rol | Permisos principales |
|---|---|
| `admin` | Gestionar usuarios, cambiar roles y administrar cualquier anomalía. |
| `user` | Crear anomalías y modificar, eliminar o gestionar los accesos de sus propios expedientes. |
| `classC` | Consultar únicamente las anomalías para las que tiene autorización. |

El registro público asigna siempre el rol `user`. Los cambios de rol se realizan desde una ruta administrativa protegida por el middleware `authorize`; en ella, el nuevo rol se obtiene del parámetro de consulta `role`.

Para las operaciones sobre anomalías se utiliza la función auxiliar `canModifyAnomaly`, que comprueba si el usuario es administrador o investigador propietario.

Esta función permite mantener las reglas de modificación en un único lugar, evitando repetirlas en varios controladores.

### 4.3. Autorización individual de Clase C

Una de las funcionalidades añadidas durante el desarrollo fue la posibilidad de conceder permisos de lectura individuales a los usuarios Clase C.

Para ello, el modelo `Anomaly` contiene un array llamado `authorizedReaders`, que almacena referencias a los usuarios autorizados.

Los administradores y los investigadores propietarios pueden conceder o retirar estos permisos mediante `PATCH /api/anomalies/:id/access`: `req.params.id` identifica la anomalía, `req.query.userId` indica el usuario destinatario y `req.body.action` determina si se concede (`grant`) o retira (`revoke`) el acceso. La concesión solo se permite a cuentas con rol `classC`.

Cuando un usuario Clase C consulta las anomalías, la API filtra los resultados para mostrar únicamente los expedientes en los que aparece su identificador.

Si intenta consultar directamente una anomalía sin autorización, recibe una respuesta `404 Not Found`, evitando mostrar información sobre ese expediente.

Los permisos de lectura no permiten crear, modificar ni eliminar anomalías.

### 4.4. Consideraciones de seguridad

La aplicación incorpora varias medidas para proteger los recursos:

- Las contraseñas no se almacenan en texto plano.
- Los JWT tienen una duración limitada.
- Las rutas protegidas comprueban la identidad del usuario.
- Las operaciones administrativas requieren el rol `admin`.
- Los investigadores no pueden modificar expedientes ajenos.
- Los usuarios Clase C tienen acceso exclusivamente de lectura.
- Las variables sensibles, como `JWT_SECRET`, se almacenan fuera del código fuente mediante un archivo `.env`.

Estas medidas proporcionan una base de seguridad adecuada para el alcance del proyecto, aunque no sustituyen las comprobaciones adicionales que serían necesarias en una aplicación de producción.

## 5. Gestión centralizada de errores

### 5.1. Objetivo

Durante el desarrollo inicial de la API, cada controlador gestionaba sus propios errores mediante bloques `try...catch`, devolviendo directamente las respuestas HTTP.

Este planteamiento funcionaba, pero provocaba que se repitieran instrucciones similares en distintos archivos.

Para mejorar la organización del código se implementó un sistema de gestión centralizada de errores, siguiendo el funcionamiento de los middlewares de Express.

### 5.2. Implementación

El sistema utiliza dos componentes principales:

- **`HttpError.js`:** define una clase personalizada que permite crear errores con un código HTTP y un mensaje.
- **`error.middleware.js`:** contiene el middleware `errorHandler`, encargado de recibir los errores y generar las respuestas correspondientes.

Cuando un controlador detecta una situación prevista, como un usuario sin permisos o una anomalía inexistente, puede lanzar un `HttpError` con el código adecuado.

Los errores capturados se envían mediante `next(error)` al middleware centralizado, que decide qué respuesta devolver.

También se reconocen los errores de formato JSON enviados por el cliente y determinados errores de Mongoose y MongoDB:

| Error | Código HTTP |
|---|---|
| Datos incorrectos, JSON mal formado o errores de validación | `400 Bad Request` |
| Credenciales incorrectas | `401 Unauthorized` |
| Acceso no permitido | `403 Forbidden` |
| Recurso inexistente | `404 Not Found` |
| Valor duplicado en un campo único | `409 Conflict` |
| Error inesperado del servidor | `500 Internal Server Error` |

El middleware registra los errores en la consola del servidor. En los casos inesperados, el cliente recibe un mensaje genérico para evitar exponer detalles internos.

### 5.3. Resultado

La centralización ha permitido reducir la repetición de código y mantener una gestión de errores más uniforme.

Además, ha facilitado la separación de responsabilidades: los controladores identifican los problemas y el middleware centralizado se encarga de construir las respuestas HTTP.

Durante la implementación se comprobó el funcionamiento del sistema provocando errores controlados y verificando sus respuestas mediante Postman.

## 6. Pruebas y validación

### 6.1. Tests unitarios con Vitest

Para comprobar determinados comportamientos de la aplicación se ha utilizado **Vitest**, una herramienta que permite ejecutar pruebas automatizadas de JavaScript.

Se han desarrollado **12 tests**, distribuidos en tres archivos:

**`permissions.test.js` — Cuatro tests**

Comprueban el comportamiento de `canModifyAnomaly`:

- Un investigador puede modificar una anomalía propia.
- Un administrador puede modificar una anomalía ajena.
- Un investigador no puede modificar una anomalía ajena.
- Un usuario Clase C no puede modificar anomalías, aunque figure como propietario.

**`authorize.test.js` — Dos tests**

Comprueban el middleware de autorización por roles:

- Un administrador puede continuar hacia una ruta reservada a administradores.
- Un investigador recibe `403 Forbidden` y no continúa hacia el controlador protegido.

**`anomalyFilters.test.js` — Seis tests**

Ejecutan el controlador `getAnomalies` con peticiones y respuestas simuladas. Comprueban que:

- Se construye correctamente el filtro de clase de contención.
- El valor de `minDanger` se convierte de texto a número y utiliza `$gte`.
- La búsqueda por nombre utiliza `$regex` y la opción `i`.
- Una clase de contención inválida genera un `HttpError` con estado `400`.
- Un nivel de peligrosidad fuera de rango genera un error `400`.
- Los filtros de un usuario Clase C conservan la condición `authorizedReaders` junto con los demás criterios.

En las pruebas de filtros se utiliza `vi.spyOn(Anomaly, "find").mockResolvedValue([])` para **simular la consulta de Mongoose**, ejecutar el controlador sin una base de datos y comprobar qué objeto de filtro recibe `Anomaly.find()`. También se emplea `vi.restoreAllMocks()` después de cada test, para evitar que una simulación afecte a las siguientes.

Los casos inválidos comprueban que el controlador envía el error a `next(error)` y no intenta consultar la base de datos.

Las pruebas se ejecutan con:

```bash
npm test
```

Los 12 tests se han ejecutado correctamente. Como son pruebas aisladas, no necesitan iniciar Express ni conectarse a MongoDB.

### 6.2. Pruebas manuales con Postman

Además de los tests automatizados, se ha utilizado **Postman** para comprobar el funcionamiento de la API mediante peticiones HTTP reales.

La colección está organizada en cuatro carpetas: **Preparación**, **Autenticación**, **Anomalías** y **Administración**. Incluye las peticiones de comprobación del servidor, registro, inicio de sesión, consulta del perfil, CRUD de anomalías, gestión de accesos y consulta o cambio de roles.

Entre las operaciones comprobadas se encuentran:

- Registro, inicio de sesión y acceso a rutas protegidas mediante JWT.
- Creación, consulta, actualización y eliminación de anomalías.
- Consultas con filtros combinables por clase, peligrosidad y nombre.
- Restricciones de acceso según el rol y la propiedad del expediente.
- Concesión y retirada de permisos individuales a usuarios Clase C; comprobación de que dejan de poder consultar los expedientes cuando se revoca el acceso.
- Cambio de rol de usuarios y respuestas de error ante operaciones no autorizadas o parámetros incorrectos.
- Rechazo de JSON mal formado con `400 Bad Request`.

Las peticiones incluyen los Body y Params necesarios. Se utilizan **Path Variables** para seleccionar las anomalías o usuarios (`:id`) y **Query Params** para aplicar filtros, elegir el destinatario de un acceso (`userId`) o seleccionar un rol (`role`).

La colección define `baseUrl` y `token`; el script posterior al login guarda automáticamente el JWT en `token`. El valor exportado de `baseUrl` está vacío, por lo que debe establecerse al importarla. Para simplificar el uso, varios identificadores de ejemplo se mantienen directamente en Params y deben sustituirse por los IDs reales de la base de datos utilizada. La colección no crea automáticamente los usuarios ni las anomalías, y el primer administrador debe configurarse una vez desde MongoDB.

### 6.3. Alcance y limitaciones

Las **12 pruebas automatizadas** comprueban reglas de permisos y autorización, además de la construcción y validación de los filtros. No prueban todas las rutas, el controlador de login ni la interacción real con MongoDB.

Por eso se han complementado con pruebas manuales mediante Postman. Como mejora futura, sería conveniente incorporar **pruebas de integración** que ejecutasen automáticamente el registro, la autenticación y las operaciones de persistencia sobre una base de datos de pruebas.

## 7. Problemas encontrados y soluciones

Durante el desarrollo del proyecto aparecieron diferentes dificultades relacionadas con la programación en JavaScript, el control de permisos, la gestión de errores y las pruebas automatizadas.

Resolver estos problemas ha formado parte del proceso de aprendizaje y ha permitido mejorar tanto el funcionamiento de la API como la organización de su código.

### 7.1. Control de acceso a las anomalías

Uno de los principales retos fue implementar correctamente los permisos de los distintos usuarios, especialmente el acceso limitado de Clase C.

Inicialmente, al consultar una anomalía para la que un usuario Clase C no tenía autorización, la API devolvía una respuesta `200 OK` con el valor `null` en lugar de indicar que el expediente no estaba disponible.

El problema se encontraba en el controlador de consulta: Mongoose devolvía `null` cuando no encontraba un documento que cumpliera las condiciones del filtro, pero el controlador respondía igualmente con un código de éxito.

La solución consistió en comprobar el resultado de la consulta y devolver `404 Not Found` cuando no se encontrase una anomalía accesible para ese usuario.

También fue necesario verificar que Clase C no pudiera crear, modificar ni eliminar expedientes, aunque anteriormente hubiera sido propietario de alguno.

### 7.2. Repetición de las comprobaciones de permisos

Durante la implementación del CRUD se detectó que varios controladores utilizaban condiciones similares para comprobar si un usuario era administrador o propietario de una anomalía.

Para evitar esta repetición, se creó la función auxiliar `canModifyAnomaly`, encargada de determinar si un usuario puede realizar operaciones de modificación sobre un expediente.

Posteriormente, esta función se incorporó a los controladores de actualización, eliminación y gestión de accesos.

Este cambio permitió comprender la utilidad de separar responsabilidades y reutilizar funciones, en lugar de repetir las mismas reglas en diferentes partes de la aplicación.

### 7.3. Aprendizaje y utilización de los tests

Al comenzar a utilizar Vitest, una de las dificultades fue comprender qué se estaba comprobando realmente y cuál era la diferencia entre ejecutar pruebas unitarias y realizar peticiones con Postman.

Se empezó probando una función sencilla que devolvía `true` o `false`, utilizando objetos de ejemplo sin necesidad de iniciar Express ni MongoDB.

Posteriormente, se aprendió a utilizar funciones simuladas de Vitest para comprobar el comportamiento del middleware `authorize`.

Durante este proceso también apareció un error de sintaxis al declarar un test: Vitest lo identificaba como pendiente (`todo`) porque la función de prueba no se había pasado correctamente como argumento de `it()`.

Corregirlo ayudó a comprender mejor la estructura de las pruebas y a interpretar sus resultados. Más adelante, al implementar los filtros de búsqueda, se aprendió a utilizar `vi.spyOn()` y `mockResolvedValue()` para comprobar qué consultas intenta construir un controlador sin ejecutar realmente MongoDB.

### 7.4. Error en el inicio de sesión durante una refactorización

Uno de los errores más significativos apareció al implementar la gestión centralizada de errores.

Durante la modificación del controlador de inicio de sesión, se intentó comprobar el contenido de `email` y `password` antes de declarar esas variables.

Como consecuencia, JavaScript producía un error y el servidor respondía con `500 Internal Server Error`, impidiendo iniciar sesión.

El problema se solucionó reorganizando el código: primero se obtienen los datos de `req.body`, después se validan y finalmente se consulta al usuario.

Lo más interesante fue que **los seis tests automatizados seguían pasando mientras el login estaba roto**.

Esto permitió comprender una limitación importante de las pruebas unitarias: solo verifican los comportamientos para los que han sido diseñadas. En nuestro caso, los tests comprobaban permisos, pero no ejecutaban el controlador del login.

Por ello, las pruebas con Postman siguieron siendo necesarias para verificar el funcionamiento general de la API.

### 7.5. Filtros combinables y mantenimiento de los permisos

La incorporación de filtros en `getAnomalies` planteó un problema de diseño: el usuario Clase C solo puede ver determinados expedientes y una búsqueda no debía eliminar esa condición de seguridad.

La solución fue construir un único objeto `filter`: primero se incorpora la condición `authorizedReaders` cuando corresponde y después se agregan las condiciones por clase, peligrosidad y nombre. Se añadieron validaciones para rechazar clases o niveles incorrectos y se escaparon los caracteres especiales de la búsqueda por nombre.

Para verificarlo se desarrollaron seis tests que comprueban los filtros construidos y, en particular, que un usuario Clase C sigue limitado a sus expedientes autorizados. Las operaciones reales de concesión y retirada también se comprobaron mediante Postman.

### 7.6. Tratamiento del JSON mal formado

Durante la revisión final se detectó que un Body con JSON sintácticamente incorrecto provocaba una respuesta `500`, aunque el fallo era responsabilidad de la petición del cliente. Se añadió al middleware centralizado el tratamiento del tipo de error `entity.parse.failed`, de modo que devuelve `400 Bad Request` con un mensaje comprensible. La corrección se comprobó enviando una petición con JSON mal formado.

### 7.7. Conclusiones del proceso de desarrollo

Los problemas encontrados han demostrado la importancia de comprobar los cambios de forma progresiva, interpretar los mensajes de error y comprender el funcionamiento del código antes de modificarlo.

También han permitido familiarizarse con herramientas como Git, Postman y Vitest, así como con conceptos de JavaScript y Express que inicialmente resultaban difíciles.

Una de las principales conclusiones es que conseguir que una funcionalidad responda correctamente no siempre significa comprenderla por completo. Revisar el código, analizar los errores y realizar pruebas ha sido fundamental para consolidar los conocimientos adquiridos durante el proyecto.

## 8. Mejoras futuras y conclusiones

### 8.1. Posibles mejoras

Aunque la API cumple los objetivos principales del proyecto, existen varias funcionalidades que podrían incorporarse en futuras versiones.

**Ampliación de las pruebas automatizadas**

Los tests actuales comprueban permisos, autorización y filtros de búsqueda, pero no cubren automáticamente las operaciones completas de extremo a extremo. Una mejora importante sería añadir pruebas de integración que comprobaran el registro, el inicio de sesión y las operaciones sobre MongoDB.

Esto permitiría detectar errores en partes de la aplicación que actualmente se comprueban de forma manual mediante Postman.

**Ampliación de búsquedas y paginación**

Ya se han incorporado filtros combinables por nombre, clase de contención y peligrosidad mínima. En futuras versiones podría añadirse la búsqueda por código de anomalía u otros criterios.

También sería conveniente incorporar paginación para evitar devolver demasiados expedientes en una sola respuesta si la base de datos creciera.

**Mejora de las validaciones**

Aunque Mongoose ya establece restricciones sobre los datos, podrían añadirse validaciones más específicas para comprobar la información recibida antes de procesarla.

Por ejemplo, se podría exigir que el nivel de peligrosidad fuese un número entero, además de estar comprendido entre 1 y 5.

**Interfaz gráfica**

Actualmente, la aplicación se utiliza mediante peticiones HTTP. Una posible ampliación sería desarrollar un frontend que permitiera consultar los expedientes, gestionar usuarios y administrar permisos desde una interfaz visual.

### 8.2. Conclusiones personales

El desarrollo de Fundación Backend ha permitido aplicar de manera práctica los conocimientos adquiridos durante el Bootcamp y comprender mejor cómo se relacionan las diferentes partes de una API.

A lo largo del proyecto se ha trabajado con Express, MongoDB, Mongoose, autenticación mediante JWT, control de permisos, filtros de consulta, gestión de errores y pruebas automatizadas.

Uno de los mayores aprendizajes ha sido la importancia de organizar el código de forma clara y separar las responsabilidades. También se ha comprobado que probar una funcionalidad, interpretar los errores y comprender las decisiones técnicas son partes fundamentales del desarrollo.

Aunque todavía existen aspectos que podrían mejorarse, el resultado es una API funcional que cumple los objetivos planteados y proporciona una base sobre la que continuar aprendiendo y desarrollando nuevas funcionalidades.