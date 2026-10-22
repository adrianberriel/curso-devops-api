# Runbook: alta tasa de errores 5xx

Se asocia a la alerta de _burn rate_ sobre 5xx (ver [README](../../README.md#alerta-sobre-errores-de-servidor)).

## Qué significa

Más del 1.4 % de las requests de producción respondieron 5xx durante los últimos 5 minutos, medido sobre una ventana de
1 hora. Eso consume el presupuesto de errores del SLO de disponibilidad (99.9 %) unas 14 veces más rápido de lo tolerable.

**Impacto:** usuarios reales reciben errores de servidor.

## 1. Confirmar que no es un falso positivo (2 min)

1. Abrir el dashboard **curso-devops-api — Golden Signals** y mirar el panel _Errores_: ¿la línea de 5xx está por encima
   de cero y sostenida, o fue un pico aislado?
2. Mirar _Tráfico_: si casi no hay requests, un solo 5xx puede cruzar el umbral. Si hay pocas peticiones y ya no se
   repite, anotarlo y cerrar.
3. Comprobar que el servicio responde: `curl -i https://curso-devops-api.onrender.com/products`. Si tarda ~40 s en el
   primer intento, es el arranque en frío del plan Free de Render y no una falla.

## 2. Ubicar el origen (5 min)

1. En el panel _Tráfico_ por ruta (o en los logs), identificar **qué ruta** devuelve los 5xx.
2. En Render, pestaña **Logs** del servicio, buscar los eventos con `"level":"error"` (los 5xx se loguean con ese nivel).
   Cada evento trae `path` y `status_code`.
3. En Render, pestaña **Deploys**: ¿hubo un deploy en la última hora? Si los errores empezaron justo después de un
   deploy, la causa más probable es esa release. Comparar el tag desplegado con el último estable.

## 3. Mitigar

- **Si empezó tras un deploy:** revertir. En Render, pestaña **Deploys**, usar **Rollback** en el deploy anterior
  (la imagen del tag previo ya está publicada en Docker Hub). No cortar una release nueva hasta entender la causa.
- **Si no hubo deploy:** revisar el estado de Render y de las dependencias externas, y reiniciar el servicio como último
  recurso.

## 4. Verificar la recuperación

El panel de 5xx debe volver a cero y el indicador de 5xx del dashboard a verde. La alerta se resuelve sola cuando la
proporción baja del umbral.

## 5. Cierre

Escribir un post-mortem sin culpables: qué pasó, cómo se detectó, cuánto presupuesto de errores se consumió y qué se
cambia para que no se repita (por ejemplo, un test que cubra el caso).
