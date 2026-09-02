# Kubernetes con k3d — HU-17

Exploración de Kubernetes como estrategia de despliegue y escalabilidad (rúbrica: Contenerización y despliegue). Usamos **k3d** (k3s dentro de Docker): clúster real de Kubernetes, local y desechable, sin instalar nada más que lo que ya usa el proyecto.

## Qué hay

| Archivo | Recursos |
|---|---|
| `00-namespace.yaml` | Namespace `budgetwise` que aísla todo lo del proyecto |
| `01-secrets.yaml` | Secret con credenciales de BD y `SECRET_KEY` (solo para el clúster local) |
| `02-postgres.yaml` | PVC de 1 Gi + Deployment de PostgreSQL (1 réplica) + Service |
| `03-api.yaml` | Deployment del API (**2 réplicas**) + Service; probes de readiness/liveness contra `/health` |

Decisiones que se explican en la presentación: el API escala horizontalmente (2 réplicas detrás de un Service que balancea), la BD no (1 réplica con volumen persistente); las probes usan el `/health` de HU-16, así Kubernetes saca de servicio un pod cuya BD no responde — observabilidad y orquestación trabajando juntas.

## Levantar todo (5 comandos)

```bash
# 1. Construir la imagen del API (la misma de docker compose)
docker compose build api

# 2. Crear el clúster (una sola vez)
k3d cluster create budgetwise

# 3. Meter la imagen local al clúster (no hay registry: se importa)
k3d image import budgetwise-api:latest -c budgetwise

# 4. Aplicar los manifiestos
kubectl apply -f k8s/

# 5. Esperar los pods y exponer el API en el puerto 8002 local
kubectl -n budgetwise wait --for=condition=ready pod --all --timeout=120s
kubectl -n budgetwise port-forward svc/budgetwise-api 8002:8000
```

Verificar: `http://localhost:8002/health` → `{"status":"ok","checks":{"database":"ok"}}` y `/docs`. Los pods: `kubectl -n budgetwise get pods` (deben verse `postgres-...` y dos `budgetwise-api-...`).

## Demo de escalabilidad y self-healing (30 segundos)

```bash
# escalar de 2 a 4 réplicas
kubectl -n budgetwise scale deployment/budgetwise-api --replicas=4
kubectl -n budgetwise get pods            # aparecen 2 pods nuevos en segundos

# matar un pod y ver cómo Kubernetes lo repone solo
kubectl -n budgetwise delete pod $(kubectl -n budgetwise get pod -l app=budgetwise-api -o jsonpath='{.items[0].metadata.name}')
kubectl -n budgetwise get pods
```

## Limpiar

```bash
kubectl delete namespace budgetwise      # borra todo lo del proyecto
k3d cluster delete budgetwise            # borra el clúster completo
```

## Notas

- El clúster `budgetwise` es independiente del clúster `geoguardian` que pueda existir en la misma máquina; no comparten nada.
- `imagePullPolicy: Never` en el API: la imagen se importa con `k3d image import`, no se descarga. Si cambiás el código, repetí los pasos 1 y 3 y luego `kubectl -n budgetwise rollout restart deployment/budgetwise-api`.
- El Secret va commiteado en claro **solo** porque es un clúster local desechable con datos de prueba; en producción se crea con `kubectl create secret` o un gestor de secretos (también se menciona en la presentación).
- Producción real del proyecto sigue siendo Render (docs/deploy.md); esto es la exploración de K8s que pide la rúbrica, con evidencia ejecutable.
