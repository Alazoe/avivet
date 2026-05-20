#!/usr/bin/env python3
"""
Calculadora de dosis: Oxitetraciclina — Zanil® HCL 80%
Vía oral en agua de bebida · Aves (pollos / pavos)

Dosis:  27 – 80 mg de Zanil® HCL 80% / kg PV / día
        (equivale a 20 – 59 mg de Oxitetraciclina base / kg PV / día)
Duración: 7 – 14 días
"""

DOSIS_MIN_ZANIL = 27   # mg Zanil® HCL 80% / kg PV / día
DOSIS_MAX_ZANIL = 80

# Consumo estimado de agua por semana de edad (mL / ave / día)
# Fuente: tablas de referencia para broilers / pavos de engorda
ETAPAS = {
    1: ("Semana 1  (1-7 días)",    65),
    2: ("Semana 2  (8-14 días)",  120),
    3: ("Semana 3  (15-21 días)", 175),
    4: ("Semana 4  (22-28 días)", 220),
    5: ("Semana 5  (29-35 días)", 270),
    6: ("Semana 6+ (>35 días)",   310),
    7: ("Consumo personalizado",    0),
}


# ── helpers de entrada ────────────────────────────────────────────────────────

def leer_float(prompt: str, min_val: float = None, max_val: float = None) -> float:
    while True:
        try:
            val = float(input(prompt))
            if min_val is not None and val < min_val:
                print(f"  ! Mínimo permitido: {min_val}")
                continue
            if max_val is not None and val > max_val:
                print(f"  ! Máximo permitido: {max_val}")
                continue
            return val
        except ValueError:
            print("  Ingresa un número válido.")


def leer_int(prompt: str, opciones: list = None,
             min_val: int = None, max_val: int = None) -> int:
    while True:
        try:
            val = int(input(prompt))
            if opciones and val not in opciones:
                print(f"  Opciones válidas: {opciones}")
                continue
            if min_val is not None and val < min_val:
                print(f"  ! Mínimo: {min_val}")
                continue
            if max_val is not None and val > max_val:
                print(f"  ! Máximo: {max_val}")
                continue
            return val
        except ValueError:
            print("  Ingresa un número entero válido.")


# ── lógica principal ──────────────────────────────────────────────────────────

def calcular(n_aves: float, peso_kg: float, consumo_ml: float,
             duracion: int, dosis_mg_kg: float) -> dict:
    peso_total = n_aves * peso_kg
    dosis_dia_mg = peso_total * dosis_mg_kg
    dosis_dia_g = dosis_dia_mg / 1000
    agua_total_L = (consumo_ml * n_aves) / 1000
    concentracion_g_L = dosis_dia_g / agua_total_L
    total_g = dosis_dia_g * duracion
    return {
        "peso_total": peso_total,
        "dosis_dia_g": dosis_dia_g,
        "agua_total_L": agua_total_L,
        "concentracion_g_L": concentracion_g_L,
        "concentracion_mg_L": concentracion_g_L * 1000,
        "total_g": total_g,
        "total_kg": total_g / 1000,
    }


def imprimir_resultado(r: dict, n_aves: float, peso_kg: float,
                       etapa_desc: str, duracion: int,
                       dosis_mg_kg: float, consumo_ml: float) -> None:
    sep = "─" * 54
    print(f"\n{sep}")
    print("  RESULTADO  —  Zanil® HCL 80%  (Oxitetraciclina)")
    print(sep)
    print(f"  Lote             : {n_aves:,.0f} aves × {peso_kg:.3f} kg"
          f" = {r['peso_total']:,.1f} kg PV")
    print(f"  Etapa            : {etapa_desc}")
    print(f"  Consumo agua/ave : {consumo_ml:.0f} mL/ave/día"
          f"  →  {r['agua_total_L']:,.1f} L/día (lote)")
    print(f"  Dosis aplicada   : {dosis_mg_kg} mg Zanil®/kg PV/día")
    print(f"  Duración         : {duracion} días")
    print(sep)
    print(f"  Zanil® / día     : {r['dosis_dia_g']:,.2f} g")
    print(f"  Concentración    : {r['concentracion_g_L']:.4f} g/L"
          f"  ({r['concentracion_mg_L']:.2f} mg/L)")
    print(f"  TOTAL tratamiento: {r['total_g']:,.1f} g"
          f"  ({r['total_kg']:.3f} kg)")
    print(sep)
    print("  INSTRUCCIÓN: disuelve los gramos indicados en los litros")
    print(f"  de agua que consume el lote ese día ({r['agua_total_L']:,.1f} L).")
    print(sep)


# ── flujo de usuario ──────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 54)
    print("  CALCULADORA DE DOSIS — OXITETRACICLINA (AVES)")
    print("  AviVet · MV Andrés Lazo Escobar")
    print("=" * 54)

    # Datos del lote
    n_aves = leer_float("\nNúmero de aves en el lote: ", min_val=1)
    peso_kg = leer_float("Peso promedio por ave (kg): ", min_val=0.01)

    # Etapa / consumo de agua
    print("\nEtapa de edad (consumo estimado de agua):")
    for k, (desc, ml) in ETAPAS.items():
        if k < 7:
            print(f"  {k}. {desc:<28}  ~{ml} mL/ave/día")
        else:
            print(f"  {k}. {desc}")
    etapa_key = leer_int("Selecciona etapa (1-7): ", opciones=list(ETAPAS.keys()))

    etapa_desc, consumo_ml = ETAPAS[etapa_key]
    if etapa_key == 7:
        consumo_ml = leer_float("Consumo real de agua (mL/ave/día): ", min_val=1)
        etapa_desc = f"Personalizado ({consumo_ml:.0f} mL/ave/día)"

    # Duración
    duracion = leer_int("\nDuración del tratamiento (días, 7-14): ",
                        min_val=7, max_val=14)

    # Dosis
    dosis_media = round((DOSIS_MIN_ZANIL + DOSIS_MAX_ZANIL) / 2)
    print(f"\nDosis de Zanil® HCL 80% a usar (rango: {DOSIS_MIN_ZANIL}–{DOSIS_MAX_ZANIL} mg/kg/día):")
    print(f"  1. Mínima      — {DOSIS_MIN_ZANIL} mg/kg/día")
    print(f"  2. Media       — {dosis_media} mg/kg/día")
    print(f"  3. Máxima      — {DOSIS_MAX_ZANIL} mg/kg/día")
    print("  4. Personalizada")
    opcion = leer_int("Selecciona (1-4): ", opciones=[1, 2, 3, 4])

    if opcion == 1:
        dosis = float(DOSIS_MIN_ZANIL)
    elif opcion == 2:
        dosis = float(dosis_media)
    elif opcion == 3:
        dosis = float(DOSIS_MAX_ZANIL)
    else:
        dosis = leer_float(
            f"Ingresa dosis ({DOSIS_MIN_ZANIL}–{DOSIS_MAX_ZANIL} mg/kg/día): ",
            min_val=DOSIS_MIN_ZANIL, max_val=DOSIS_MAX_ZANIL,
        )

    resultado = calcular(n_aves, peso_kg, consumo_ml, duracion, dosis)
    imprimir_resultado(resultado, n_aves, peso_kg, etapa_desc,
                       duracion, dosis, consumo_ml)

    # Repetir
    otra = input("\n¿Calcular otro escenario? (s/n): ").strip().lower()
    if otra == "s":
        print()
        main()
    else:
        print("\nFin del cálculo. ¡Éxito con el tratamiento!\n")


if __name__ == "__main__":
    main()
