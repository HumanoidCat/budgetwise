"""Casos de uso de transacciones: HU-04 (CRUD) y HU-05 (saldo y resumen).

Toda la lógica de negocio vive aquí; el router solo delega.
"""
import calendar
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.models import Transaction, TransactionType
from app.modules.transactions import repository
from app.modules.transactions.schemas import (
    CategoryTotalsOut,
    MonthlyOut,
    MonthTotalsOut,
    SummaryOut,
    TransactionCreate,
    TransactionListOut,
    TransactionOut,
    TransactionUpdate,
)


def to_out(transaction: Transaction) -> TransactionOut:
    """Convierte el modelo a su contrato HTTP (el monto sale como Decimal de la BD)."""
    return TransactionOut(
        id=transaction.id,
        type=transaction.type.value,
        amount=float(transaction.amount),
        date=transaction.date,
        category_id=transaction.category_id,
        category_name=transaction.category.name if transaction.category else None,
        description=transaction.description,
    )


def _ensure_category(db: Session, user_id: int, category_id: int | None) -> None:
    if category_id is not None and not repository.category_exists(db, user_id, category_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )


def _ensure_date_range(date_from: date | None, date_to: date | None) -> None:
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from no puede ser posterior a date_to")


def _get_owned(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = repository.get_by_id(db, user_id, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada",
        )
    return transaction


def create_transaction(db: Session, user_id: int, payload: TransactionCreate) -> TransactionOut:
    _ensure_category(db, user_id, payload.category_id)
    transaction = repository.create(
        db,
        user_id,
        type_=TransactionType(payload.type),
        amount=payload.amount,
        tx_date=payload.date,
        category_id=payload.category_id,
        description=payload.description,
    )
    return to_out(transaction)


def get_transaction(db: Session, user_id: int, transaction_id: int) -> TransactionOut:
    return to_out(_get_owned(db, user_id, transaction_id))


def list_transactions(
    db: Session,
    user_id: int,
    *,
    type_: str | None = None,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> TransactionListOut:
    _ensure_date_range(date_from, date_to)
    _ensure_category(db, user_id, category_id)
    filters = {
        "type_": TransactionType(type_) if type_ else None,
        "category_id": category_id,
        "date_from": date_from,
        "date_to": date_to,
    }
    items = repository.list_by_user(db, user_id, limit=limit, offset=offset, **filters)
    total = repository.count_by_user(db, user_id, **filters)
    return TransactionListOut(
        items=[to_out(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )


def update_transaction(
    db: Session, user_id: int, transaction_id: int, payload: TransactionUpdate
) -> TransactionOut:
    """Actualización parcial: solo toca los campos que vinieron en el body."""
    transaction = _get_owned(db, user_id, transaction_id)
    changes = payload.model_dump(exclude_unset=True)

    # category_id es el único campo donde null es un cambio real: quita la categoría.
    if "category_id" in changes:
        _ensure_category(db, user_id, changes["category_id"])
        transaction.category_id = changes["category_id"]
    if changes.get("type") is not None:
        transaction.type = TransactionType(changes["type"])
    if changes.get("amount") is not None:
        transaction.amount = changes["amount"]
    if changes.get("date") is not None:
        transaction.date = changes["date"]
    if changes.get("description") is not None:
        transaction.description = changes["description"]

    return to_out(repository.save(db, transaction))


def delete_transaction(db: Session, user_id: int, transaction_id: int) -> None:
    repository.delete(db, _get_owned(db, user_id, transaction_id))


# --- HU-05: cálculo de saldo y resumen ---


def month_bounds(month: str | None) -> tuple[str, date, date]:
    """Devuelve ('YYYY-MM', primer día, último día). month=None → mes actual."""
    if month is None:
        today = date.today()
        year, number = today.year, today.month
    else:
        try:
            year, number = (int(part) for part in month.split("-"))
            date(year, number, 1)
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="El mes debe tener formato YYYY-MM") from None
    last_day = calendar.monthrange(year, number)[1]
    return f"{year:04d}-{number:02d}", date(year, number, 1), date(year, number, last_day)


def _split(totals: dict[TransactionType, float]) -> tuple[float, float, float]:
    """De un dict {tipo: monto} saca (ingresos, gastos, saldo). El saldo es la resta."""
    income = round(totals.get(TransactionType.income, 0.0), 2)
    expense = round(totals.get(TransactionType.expense, 0.0), 2)
    return income, expense, round(income - expense, 2)


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    """Corre (año, mes) `delta` meses. Se hace con aritmética sobre meses totales
    porque restar 30 días por mes se desfasa en febrero y en los meses de 31."""
    total = year * 12 + (month - 1) + delta
    return total // 12, total % 12 + 1


def monthly_series(db: Session, user_id: int, months: int) -> MonthlyOut:
    """HU-19: los últimos `months` meses hasta el actual, del más viejo al más nuevo.

    Los meses sin movimientos van en cero: el gráfico de la pantalla de Inicio
    necesita la serie completa, sin huecos que le corran el eje.
    """
    today = date.today()
    first_year, first_month = _shift_month(today.year, today.month, -(months - 1))
    start = date(first_year, first_month, 1)
    end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

    # {(año, mes): {tipo: monto}} con lo que sí tiene datos.
    encontrados: dict[tuple[int, int], dict[TransactionType, float]] = {}
    for year, month, tx_type, amount in repository.totals_by_month(
        db, user_id, date_from=start, date_to=end
    ):
        encontrados.setdefault((year, month), {})[tx_type] = amount

    serie = []
    for offset in range(months):
        year, month = _shift_month(first_year, first_month, offset)
        income, expense, balance = _split(encontrados.get((year, month), {}))
        serie.append(
            MonthTotalsOut(
                month=f"{year:04d}-{month:02d}", income=income, expense=expense, balance=balance
            )
        )
    return MonthlyOut(months=serie)


def summary(db: Session, user_id: int, month: str | None = None) -> SummaryOut:
    """Saldo histórico del usuario más el detalle del mes consultado."""
    label, start, end = month_bounds(month)

    total_income, total_expense, balance = _split(repository.totals_by_type(db, user_id))
    month_income, month_expense, month_balance = _split(
        repository.totals_by_type(db, user_id, date_from=start, date_to=end)
    )

    # Se acumula por categoría para juntar en una sola fila el ingreso y el gasto de cada una.
    grouped: dict[int | None, dict] = {}
    for category_id, category_name, tx_type, amount in repository.totals_by_category(
        db, user_id, date_from=start, date_to=end
    ):
        row = grouped.setdefault(
            category_id,
            {"category_name": category_name, "income": 0.0, "expense": 0.0},
        )
        row["income" if tx_type is TransactionType.income else "expense"] += amount

    by_category = [
        CategoryTotalsOut(
            category_id=category_id,
            category_name=row["category_name"],
            income=round(row["income"], 2),
            expense=round(row["expense"], 2),
            balance=round(row["income"] - row["expense"], 2),
        )
        for category_id, row in grouped.items()
    ]
    by_category.sort(key=lambda c: (-c.expense, c.category_id or 0))

    return SummaryOut(
        balance=balance,
        total_income=total_income,
        total_expense=total_expense,
        month=MonthTotalsOut(
            month=label, income=month_income, expense=month_expense, balance=month_balance
        ),
        by_category=by_category,
    )
