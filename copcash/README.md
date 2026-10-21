# CopCash 2

Control de gastos personal y del hogar, pensado para el periodo de pago (del 20 al 19), con proyección mes a mes y escenarios.

- **Periodo**: cuánto te consignaron, cuánto llevas gastado por categoría contra tu presupuesto y cuánto puedes gastar al día.
- **Movimientos**: cada gasto, ingreso o pago de deuda. Lo que compras con una tarjeta sube su saldo automáticamente.
- **Proyección**: ahorro acumulado periodo a periodo, con primas, cesantías, créditos por nómina, mudanza, aporte de la pareja, un crédito nuevo y gastos únicos. Puedes guardar varios escenarios y compararlos.
- **Deudas**: saldos, cuotas, tasa efectiva anual, fecha de fin y simulador de créditos con comisiones (FGA, seguro).
- **Hogar**: tú y tu pareja con cuentas separadas; los gastos marcados como compartidos se reparten por porcentaje y la app lleva las cuentas claras.

Solo depende de `pg` y `bcryptjs`. Requiere **Node 20.12 o superior** y PostgreSQL 13+.

## Instalación en el servidor

1. Crea la base de datos (o reutiliza la de la versión anterior; sus tablas no se tocan):

   ```sql
   CREATE DATABASE copcash;
   ```

2. Copia la carpeta del proyecto al servidor e instala dependencias:

   ```bash
   npm install
   ```

3. Crea `.env` a partir de `.env.example`:

   ```bash
   cp .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # pega el resultado en JWT_SECRET
   ```

   Ajusta `DATABASE_URL` con tu usuario y clave de PostgreSQL.

4. Carga tus datos iniciales (nómina, deudas, gastos fijos, gastos de octubre y los dos escenarios de mudanza):

   ```bash
   npm run cargar-datos -- --email tu@correo.com --password "una-clave-segura" --nombre "Cristhian"
   ```

   Si la cuenta ya existe (por ejemplo, la de la versión anterior), no hace falta `--password`. Para volver a cargar desde cero, agrega `--reiniciar`. Los datos están en `scripts/datos-iniciales.js`.

5. Arranca:

   ```bash
   npm start
   ```

   Abre `http://IP-DEL-SERVIDOR:3000` desde el PC o el celular conectado al mismo wifi. En el celular, “Agregar a pantalla de inicio” la deja como app.

Las tablas se crean solas al arrancar (`server/migrations/*.sql`). Para hacerlo a mano: `npm run migrar`.

### Dejarla corriendo siempre

Con systemd (Linux), crea `/etc/systemd/system/copcash.service`:

```ini
[Unit]
Description=CopCash
After=network.target postgresql.service

[Service]
WorkingDirectory=/ruta/a/copcash
ExecStart=/usr/bin/node server/index.js
Restart=always
User=TU_USUARIO

[Install]
WantedBy=multi-user.target
```

y luego `sudo systemctl enable --now copcash`. En Windows o si prefieres algo más simple: `npx pm2 start server/index.js --name copcash`.

### Usarla desde fuera de la casa

No expongas el puerto 3000 directo a internet. Pon delante algo que le dé HTTPS:

- **Cloudflare Tunnel** (no abre puertos en el router): `cloudflared tunnel --url http://localhost:3000`, y luego asígnale un subdominio (por ejemplo `plata.skaylabs.site`).
- **Caddy o Nginx** como proxy inverso con certificado.

En ambos casos agrega `TRUST_PROXY=1` al `.env` para que el límite de intentos de inicio de sesión vea la IP real.

### Copias de seguridad

```bash
pg_dump -h 192.168.1.46 -U USUARIO copcash > copcash-$(date +%F).sql
```

## Cómo piensa la proyección

- Un **periodo** va del día de pago al día anterior del siguiente pago. Su nombre es el mes en que empieza: “Pago oct 2026” es del 20 de octubre al 19 de noviembre.
- **Salario consignado** = neto sin créditos de nómina − cuotas de los créditos marcados “por nómina” que sigan activos. Cuando un crédito termina, el salario sube solo.
- **Primas**: legal (medio básico) en junio y diciembre, extralegal en diciembre; **intereses de cesantías** (12 % del básico) en enero.
- **Gasto variable** = presupuesto de cada categoría. **Gastos fijos** salen de Ajustes; los “del hogar” se cobran según tu porcentaje, que puede cambiar desde un periodo (por ejemplo, si pagas el 100 % desde febrero).
- **Deudas**: con saldo y tasa se amortizan mes a mes; con número de cuotas terminan cuando se acaban; sin saldo ni cuotas se cobran siempre (como Icetex).

## Estructura

```
server/          API (Node sin framework), migraciones SQL, validación
public/          Frontend (HTML, CSS y módulos JS, sin compilación)
public/js/motor.js   Motor de proyección, compartido por navegador y pruebas
scripts/         Carga de datos iniciales y migraciones
test/            Pruebas del motor (npm test)
legacy/          Archivos de la versión 1 que se reemplazaron
```

## Versión anterior

Las tablas de la versión 1 (`user_data`, `shared_resources`) siguen en la base sin cambios, y las cuentas (`users`) se reutilizan: entra con el mismo correo y clave. Los archivos de la v1 que se reemplazaron están en `legacy/`. Los que no se reemplazaron (`index.html`, `js/`, `css/`, `data/` y los `.md` de la raíz) ya no se usan y puedes moverlos a `legacy/` o borrarlos.
