"""HU-14: recomendaciones financieras.

Dos capas:
1. Motor de REGLAS (determinista, siempre disponible): analiza los datos reales
   del usuario y produce recomendaciones con plantillas en español.
2. Redacción con LLM (opcional): si hay ANTHROPIC_API_KEY configurada, se le pide
   al modelo reescribir esas recomendaciones en tono más natural y personalizado.
   Ante cualquier fallo (sin key, timeout, error HTTP) se responde con las
   plantillas: la funcionalidad nunca depende de un servicio externo.
"""
import json
import logging

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import TransactionType
from app.modules.ai import repository
from app.modules.ai.schemas import RecommendationOut, RecommendationsOut
from app.modules.budgets.service import budget_status, month_range

logger = logging.getLogger("budgetwise")

MAX_RECOMMENDATIONS = 5


# --- Motor de reglas --------------------------------------------------------------------

def _rule_month_balance(income: float, expense: float) -> RecommendationOut | None:
    if income == 0 and expense == 0:
        return RecommendationOut(
            type="sin_movimientos",
            severity="info",
            title="Registrá tus movimientos",
            message=(
                "Todavía no hay movimientos este mes. Registrá tus ingresos y gastos "
                "para que podamos darte recomendaciones útiles."
            ),
        )
    if expense > income:
        return RecommendationOut(
            type="mes_en_negativo",
            severity="critical",
            title="Este mes gastaste más de lo que ingresó",
            message=(
                f"Tus gastos del mes (₡{expense:,.0f}) superan tus ingresos (₡{income:,.0f}). "
                "Revisá los gastos más grandes y recortá donde se pueda."
            ),
        )
    if income > 0 and (income - expense) / income < 0.10:
        return RecommendationOut(
            type="ahorro_bajo",
            severity="warning",
            title="Estás ahorrando menos del 10%",
            message=(
                f"De ₡{income:,.0f} que ingresaron este mes te queda menos del 10%. "
                "Un buen punto de partida es apartar el 10-20% apenas recibís tu ingreso."
            ),
        )
    return None


def _rule_budgets(db: Session, user_id: int, start, end) -> list[RecommendationOut]:
    out: list[RecommendationOut] = []
    budgets = repository.list_budgets(db, user_id)
    if not budgets:
        out.append(
            RecommendationOut(
                type="sin_presupuesto",
                severity="info",
                title="Definí un presupuesto mensual",
                message=(
                    "Aún no tenés presupuestos. Definir un límite mensual (global o por "
                    "categoría) te permite recibir alertas antes de pasarte."
                ),
            )
        )
        return out
    for budget in budgets:
        status = budget_status(db, user_id, budget, start, end)
        if status.category_name:
            label = f"el presupuesto de {status.category_name}"
            freno = f"los gastos de {status.category_name}"
        else:
            label = "tu presupuesto general"
            freno = "los gastos"
        if status.status == "exceeded":
            out.append(
                RecommendationOut(
                    type="presupuesto_excedido",
                    severity="critical",
                    title=f"Te pasaste de {label}",
                    message=(
                        f"Llevás ₡{status.spent:,.0f} de un límite de ₡{status.monthly_limit:,.0f} "
                        f"({status.percent_used:.0f}%). Intentá frenar {freno} "
                        "por el resto del mes."
                    ),
                )
            )
        elif status.status == "warning":
            out.append(
                RecommendationOut(
                    type="presupuesto_por_agotarse",
                    severity="warning",
                    title=f"{label[0].upper()}{label[1:]} está por agotarse",
                    message=(
                        f"Ya usaste el {status.percent_used:.0f}% "
                        f"(₡{status.spent:,.0f} de ₡{status.monthly_limit:,.0f}). "
                        f"Te quedan ₡{status.remaining:,.0f} para terminar el mes."
                    ),
                )
            )
    return out


def _rule_top_category(db: Session, user_id: int, start, end, expense: float) -> RecommendationOut | None:
    if expense <= 0:
        return None
    rows = repository.totals_by_category(db, user_id, date_from=start, date_to=end)
    expense_rows = [
        (name or "Sin categoría", amount)
        for _cid, name, tx_type, amount in rows
        if tx_type is TransactionType.expense
    ]
    if not expense_rows:
        return None
    top_name, top_amount = max(expense_rows, key=lambda r: r[1])
    share = top_amount / expense
    if share >= 0.5 and len(expense_rows) > 1:
        return RecommendationOut(
            type="categoria_dominante",
            severity="info",
            title=f"La mitad de tus gastos se va en {top_name}",
            message=(
                f"{top_name} concentra el {share * 100:.0f}% de tus gastos del mes "
                f"(₡{top_amount:,.0f}). Si buscás recortar, ahí está el mayor impacto."
            ),
        )
    return None


def _rule_uncategorized(db: Session, user_id: int, start, end, expense: float) -> RecommendationOut | None:
    amount = repository.uncategorized_expense(db, user_id, start, end)
    if expense > 0 and amount / expense >= 0.25:
        return RecommendationOut(
            type="gastos_sin_categoria",
            severity="info",
            title="Muchos gastos sin categoría",
            message=(
                f"₡{amount:,.0f} de tus gastos del mes no tienen categoría. "
                "Categorizarlos mejora el desglose del panel y estas recomendaciones."
            ),
        )
    return None


def _rule_goals(db: Session, user_id: int) -> list[RecommendationOut]:
    out: list[RecommendationOut] = []
    for goal in repository.list_goals(db, user_id):
        target = float(goal.target_amount)
        saved = float(goal.saved_amount)
        if target <= 0 or saved >= target:
            continue
        progress = saved / target
        if progress < 0.25:
            out.append(
                RecommendationOut(
                    type="meta_rezagada",
                    severity="warning",
                    title=f"Tu meta «{goal.name}» va lenta",
                    message=(
                        f"Llevás ₡{saved:,.0f} de ₡{target:,.0f} ({progress * 100:.0f}%). "
                        "Un aporte pequeño pero constante cada semana la reactiva."
                    ),
                )
            )
    return out


def analyze(db: Session, user_id: int, month: str | None) -> tuple[str, list[RecommendationOut]]:
    """Corre todas las reglas y devuelve (mes, recomendaciones priorizadas)."""
    label, start, end = month_range(month)
    totals = repository.totals_by_type(db, user_id, date_from=start, date_to=end)
    income = totals.get(TransactionType.income, 0.0)
    expense = totals.get(TransactionType.expense, 0.0)

    recommendations: list[RecommendationOut] = []
    if item := _rule_month_balance(income, expense):
        recommendations.append(item)
    recommendations.extend(_rule_budgets(db, user_id, start, end))
    if item := _rule_top_category(db, user_id, start, end, expense):
        recommendations.append(item)
    if item := _rule_uncategorized(db, user_id, start, end, expense):
        recommendations.append(item)
    recommendations.extend(_rule_goals(db, user_id))

    order = {"critical": 0, "warning": 1, "info": 2}
    recommendations.sort(key=lambda r: order[r.severity])
    return label, recommendations[:MAX_RECOMMENDATIONS]


# --- Redacción opcional con LLM ---------------------------------------------------------

def _rewrite_with_llm(recommendations: list[RecommendationOut]) -> list[RecommendationOut] | None:
    """Reescribe los mensajes con un LLM. Devuelve None ante cualquier problema."""
    if not settings.anthropic_api_key:
        return None
    try:
        payload = {
            "model": settings.ai_model,
            "max_tokens": 1024,
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Sos el asistente financiero de la app BudgetWise (Costa Rica). "
                        "Reescribí el campo message de cada recomendación en tono cercano y "
                        "motivador, en español, máximo 2 frases, conservando cifras y datos. "
                        "Respondé SOLO un arreglo JSON con objetos {type, severity, title, message} "
                        "en el mismo orden.\n\n"
                        + json.dumps([r.model_dump() for r in recommendations], ensure_ascii=False)
                    ),
                }
            ],
        }
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
            json=payload,
            timeout=10.0,
        )
        response.raise_for_status()
        text = response.json()["content"][0]["text"]
        items = json.loads(text)
        rewritten = [RecommendationOut(**item) for item in items]
        return rewritten if len(rewritten) == len(recommendations) else None
    except Exception:  # noqa: BLE001 — cualquier fallo => plantillas
        logger.warning("Fallo la redaccion con LLM; se usan las plantillas", exc_info=True)
        return None


def recommendations(db: Session, user_id: int, month: str | None) -> RecommendationsOut:
    label, items = analyze(db, user_id, month)
    rewritten = _rewrite_with_llm(items) if items else None
    if rewritten is not None:
        return RecommendationsOut(month=label, source="llm", recommendations=rewritten)
    return RecommendationsOut(month=label, source="rules", recommendations=items)
