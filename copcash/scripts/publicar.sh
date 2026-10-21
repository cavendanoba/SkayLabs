#!/usr/bin/env bash
# Publica CopCash en https://skaylabs.site/copcash
# Se ejecuta en el servidor:  bash ~/copcash/scripts/publicar.sh
# Se puede correr más de una vez: lo que ya está hecho no se repite.
set -euo pipefail

APP="$HOME/copcash"
ENV_FILE="$APP/.env"
HOST_ORIGEN="copcash-origen.skaylabs.site"
TUNEL="skaylabs-tunnel"
CFG="/etc/cloudflared/config.yml"

paso() { printf '\n\033[1;32m▶ %s\033[0m\n' "$1"; }
error() { printf '\n\033[1;31m✖ %s\033[0m\n' "$1"; exit 1; }

[ -f "$ENV_FILE" ] || error "No encontré $ENV_FILE"
sudo -v || error "Necesito sudo para el túnel."

paso "1/5 Variables de CopCash (.env)"
sed -i 's/\r$//' "$ENV_FILE"
grep -q '^BASE_PATH=' "$ENV_FILE" || echo 'BASE_PATH=/copcash' >> "$ENV_FILE"
if ! grep -qE '^ORIGEN_SECRETO=.+' "$ENV_FILE"; then
  sed -i '/^ORIGEN_SECRETO=/d' "$ENV_FILE"
  echo "ORIGEN_SECRETO=$(openssl rand -hex 32)" >> "$ENV_FILE"
fi
grep -q '^PERMITIR_REGISTRO=' "$ENV_FILE" || echo 'PERMITIR_REGISTRO=1' >> "$ENV_FILE"
PUERTO="$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]')"
PUERTO="${PUERTO:-3000}"
echo "   BASE_PATH, ORIGEN_SECRETO y PERMITIR_REGISTRO listos (puerto de la app: $PUERTO)"

paso "2/5 Regla del túnel para $HOST_ORIGEN"
sudo test -f "$CFG" || error "No encontré $CFG. Si el túnel se administra desde el panel de Cloudflare, agrega ahí el hostname $HOST_ORIGEN → http://localhost:$PUERTO"
if sudo grep -q "$HOST_ORIGEN" "$CFG"; then
  echo "   Ya estaba."
else
  sudo cp "$CFG" "$CFG.bak-$(date +%Y%m%d%H%M%S)"
  sudo python3 - "$CFG" "$HOST_ORIGEN" "$PUERTO" <<'PY'
import re, sys
ruta, host, puerto = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(ruta).read()
m = re.search(r'^(\s*)- service:\s*http_status:404', s, re.M)
if not m:
    sys.exit('No encontré la regla final "- service: http_status:404" en ' + ruta)
ind = m.group(1)
bloque = f"{ind}- hostname: {host}\n{ind}  service: http://localhost:{puerto}\n"
open(ruta, 'w').write(s[:m.start()] + bloque + s[m.start():])
PY
  echo "   Agregada (copia de respaldo junto al archivo)."
fi
sudo cloudflared tunnel --config "$CFG" ingress validate || error "La configuración del túnel no es válida. Restaura la copia .bak y avísame."

paso "3/5 Registro DNS de $HOST_ORIGEN"
cloudflared tunnel route dns "$TUNEL" "$HOST_ORIGEN" 2>/dev/null \
  || sudo cloudflared tunnel route dns "$TUNEL" "$HOST_ORIGEN" \
  || echo "   (Si dice que el registro ya existe, está bien.)"

paso "4/5 Reiniciar el túnel y CopCash"
sudo systemctl restart cloudflared
cd "$APP"
if pm2 describe copcash >/dev/null 2>&1; then pm2 restart copcash --update-env; else pm2 start server/index.js --name copcash; fi
pm2 save >/dev/null
sleep 3

paso "5/5 Comprobaciones"
if curl -fsS "http://localhost:$PUERTO/copcash/api/salud" >/dev/null; then echo "   ✔ CopCash responde en /copcash"; else echo "   ✖ CopCash no responde. Revisa: pm2 logs copcash --lines 30"; fi
sleep 5
RESP="$(curl -s "https://$HOST_ORIGEN/copcash/api/salud" || true)"
if echo "$RESP" | grep -q 'Entra por skaylabs.site'; then echo "   ✔ El origen está protegido (rechaza entradas directas)"; else echo "   … El túnel aún no responde ($RESP). Puede tardar un par de minutos en propagarse."; fi

SECRETO="$(grep -E '^ORIGEN_SECRETO=' "$ENV_FILE" | cut -d= -f2)"
cat <<FIN

──────────────────────────────────────────────────────────────
Último paso, en Cloudflare Pages (proyecto skaylabs → Settings →
Environment variables → Production), agrega:

  COPCASH_ORIGEN  = https://$HOST_ORIGEN
  COPCASH_SECRETO = $SECRETO      (márcala como Encrypt)

No compartas este secreto en ningún chat.
──────────────────────────────────────────────────────────────
FIN
