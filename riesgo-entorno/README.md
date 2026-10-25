# Riesgo del entorno del sector

Evaluación **independiente de la pauta SAG**, basada en la planilla «Riesgo Externo» (criterios A–J) desarrollada para sectores de pavos.

- **10 criterios** (A traspatio cercano · B granjas comerciales · C circulación del jefe de terreno · D aves acuáticas · E cuerpos de agua · F brotes de denuncia obligatoria · G agua estancada · H vehículos de servicio · I ingreso de personas · J ingreso de vehículos).
- Cada criterio tiene **3 niveles**: riesgo alto 1 punto, moderado 2, bajo 3. **Máximo 30**: más alto = mejor protegido.
- Niveles del sector (cortes **propuestos**, constantes `CORTE_BAJO` y `CORTE_MEDIO` en el HTML): ≥25 bajo · 18–24 moderado · <18 alto.
- Los sectores se guardan **solo en el dispositivo** (localStorage), se ordenan de mayor a menor riesgo y se exportan a CSV. No se envía nada a internet.
- Los criterios D, E y F enlazan a [Riesgo Influenza Aviar](../riesgo-ia/) como apoyo (mapa, cuerpos de agua, aves silvestres, brotes).

Se accede desde la [plataforma de bioseguridad](../plataforma/).
