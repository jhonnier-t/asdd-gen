export { promptOrchestrate, promptTddBackend, promptTddFrontend, promptBackend, promptFrontend, promptDocumentation, promptQaScenarios }

// .prompt.md files — reusable task prompts for each ASDD agent

function promptOrchestrate() {
  const lines = [
    '---',
    'name: orchestrate',
    'description: Orquesta el pipeline ASDD completo para un feature. Requiere spec con status approved.',
    'argument-hint: "<nombre-feature>"',
    'agent: orchestrator',
    'tools:',
    '  - read/readFile',
    '  - search/listDirectory',
    '  - search',
    '  - agent',
    '---',
    '',
    'Ejecuta el pipeline ASDD completo para el feature especificado.',
    '',
    '**Feature**: ${input:featureName:nombre del feature en kebab-case}',
    '',
    '## Pasos obligatorios:',
    '',
    '1. **Lee la spec** en `.github/specs/${input:featureName}.spec.md`.',
    '2. **Verifica** que el campo `status` sea `approved` y que las 10 secciones estén completas.',
    '   - Si no está aprobada → indica qué falta y detente.',
    '3. **Red Phase (paralelo)** — lanza en paralelo:',
    '   - @tdd-backend: escribe pruebas de backend que DEBEN FALLAR',
    '   - @tdd-frontend: escribe pruebas de frontend que DEBEN FALLAR',
    '   Verifica que todas las pruebas FALLAN antes de continuar.',
    '4. **Green Phase (paralelo)** — lanza en paralelo:',
    '   - @backend: implementa el backend para hacer pasar las pruebas del paso 3',
    '   - @frontend: implementa el frontend para hacer pasar las pruebas del paso 3',
    '   Verifica que TODAS las pruebas PASAN antes de continuar.',
    '5. **Post-implementación (paralelo)**:',
    '   - @qa: genera escenarios Gherkin y matriz de riesgos',
    '   - @documentation: genera CHANGELOG, README y ADR (si aplica)',
    '',
    '## Verificación final:',
    '- Todos los tests pasan',
    '- Ninguna sección de la spec quedó sin implementar',
    '- CHANGELOG.md actualizado',
    '- Commits referencian el ID de la spec (ej: `feat(FEAT-042): ...`)',
  ]
  return lines.join('\n')
}

function promptTddBackend() {
  return `---
name: tdd-backend
description: Escribe pruebas de backend que deben FALLAR antes de cualquier implementación (TDD Red phase).
argument-hint: "<nombre-feature>"
agent: tdd-backend
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---

Escribe pruebas de backend que DEBEN FALLAR para el feature especificado (TDD Red phase).

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en \`.github/specs/\${input:featureName}.spec.md\` \u2014 sección de criterios de aceptación.
2. **Explora el código existente** para entender patrones de test actuales sin copiar implementación.
3. **Escribe una prueba por criterio de aceptación**. Cubre además:
   - Errores de validación (400/422)
   - No autorizado (401)
   - No encontrado (404)
4. **Verifica que FALLAN** antes de entregar. Si alguna pasa, es un error \u2014 no hay implementación aún.
5. **NO escribir código de implementación** \u2014 solo pruebas.

## Restricciones:
- Referencia el ID de la spec en el encabezado del archivo: \`# Spec: FEAT-XXX\`
- No modificar pruebas existentes
- No crear stubs de implementación que hagan pasar las pruebas
`
}

function promptTddFrontend() {
  return `---
name: tdd-frontend
description: Escribe pruebas de frontend/UI que deben FALLAR antes de cualquier implementación (TDD Red phase).
argument-hint: "<nombre-feature>"
agent: tdd-frontend
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---

Escribe pruebas de frontend que DEBEN FALLAR para el feature especificado (TDD Red phase).

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en \`.github/specs/\${input:featureName}.spec.md\` \u2014 sección de UI/UX y criterios de aceptación.
2. **Explora componentes existentes** para entender patrones sin implementar.
3. **Escribe pruebas de componente/integración** para cada criterio de aceptación de UI. Cubre:
   - Estado de carga (loading)
   - Estado de error
   - Estado vacío
   - Estado con datos
4. **Mockea todas las llamadas API** \u2014 no dependencias reales en pruebas.
5. **Verifica que FALLAN** antes de entregar. Si alguna pasa, es un error.
6. **NO escribir código de componentes** \u2014 solo pruebas.

## Restricciones:
- Referencia el ID de la spec en el encabezado del archivo: \`// Spec: FEAT-XXX\`
- No modificar pruebas existentes
- No crear implementaciones que hagan pasar las pruebas
`
}

function promptBackend() {
  return `---
name: backend-task
description: Implementa el backend para hacer pasar las pruebas existentes (TDD Green phase). Requiere pruebas en Red phase previamente.
argument-hint: "<nombre-feature>"
agent: backend
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---

Implementa el backend para hacer pasar las pruebas existentes del feature especificado (TDD Green phase).

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en \`.github/specs/\${input:featureName}.spec.md\`.
2. **Lee las pruebas fallidas** — son el contrato de implementación.
3. **Implementa en orden de dependencias**:
   - Modelos / entidades de dominio
   - Repositorios (acceso a datos)
   - Servicios (lógica de negocio)
   - Controladores / rutas (API)
4. **Verifica que TODAS las pruebas pasan** antes de entregar.
5. **NO modificar pruebas** para hacerlas pasar — solo implementación.

## Restricciones:
- Seguir los patrones arquitectónicos del proyecto (ver \`.github/instructions/backend.instructions.md\`)
- Validar todos los inputs en los boundaries de la API (OWASP)
- Referencia el ID de la spec en los encabezados: \`// Spec: FEAT-XXX\`
`
}

function promptFrontend() {
  return `---
name: frontend-task
description: Implementa el frontend/UI para hacer pasar las pruebas existentes (TDD Green phase). Requiere pruebas en Red phase previamente.
argument-hint: "<nombre-feature>"
agent: frontend
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
  - execute/runInTerminal
---

Implementa el frontend para hacer pasar las pruebas existentes del feature especificado (TDD Green phase).

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en \`.github/specs/\${input:featureName}.spec.md\` \u2014 sección de UI/UX.
2. **Lee las pruebas fallidas** \u2014 son el contrato de los componentes a implementar.
3. **Implementa los componentes** que satisfagan las expectativas de las pruebas:
   - Maneja los 3 estados asíncronos: carga, error, éxito
   - Validación de formularios con mensajes de error inline
   - Accesibilidad: HTML semántico, etiquetas ARIA, navegación por teclado
4. **Verifica que TODAS las pruebas pasan** antes de entregar.
5. **NO modificar pruebas** para hacerlas pasar \u2014 solo implementación.

## Restricciones:
- Seguir patrones de componentes existentes (ver \`.github/instructions/frontend.instructions.md\`)
- Sin lógica de negocio en componentes \u2014 extraer a hooks o servicios
- Referencia el ID de la spec en los encabezados: \`// Spec: FEAT-XXX\`
`
}

function promptDocumentation() {
  return `---
name: doc-task
description: Genera documentación técnica para un feature completado (changelog, README, ADR, docs de API).
argument-hint: "<nombre-feature>"
agent: documentation
tools:
  - edit/createFile
  - edit/editFiles
  - read/readFile
  - search/listDirectory
  - search
---

Genera la documentación técnica del feature especificado.

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Entregables obligatorios:

1. **CHANGELOG.md** \u2014 entrada bajo \`[Unreleased]\` con formato:
   \`\`\`
   ### Added
   - FEAT-XXX: <descripción breve del feature>
   \`\`\`
2. **README.md** \u2014 actualizar si hay cambios visibles para el usuario final.
3. **ADR** \u2014 crear \`docs/adr/ADR-XXX-<slug>.md\` si se tomaron decisiones arquitectónicas.
4. **Docs de API** \u2014 comentarios/anotaciones en los endpoints si se agregaron nuevas rutas.

## Pasos:
1. Lee la spec en \`.github/specs/\${input:featureName}.spec.md\`.
2. Revisa los archivos implementados para identificar cambios visibles al usuario.
3. Genera los entregables aplicables.

## Restricciones:
- Solo documentar \u2014 NO modificar código de implementación
- Lenguaje claro y técnicamente preciso
`
}

function promptQaScenarios() {
  return `---
name: qa-task
description: Genera escenarios Gherkin y matriz de riesgos para un feature basado en la spec ASDD.
argument-hint: "<nombre-feature>"
agent: qa
tools:
  - edit/createFile
  - read/readFile
  - search/listDirectory
  - search
---

Genera escenarios de aceptación y matriz de riesgos para el feature especificado.

**Feature**: \${input:featureName:nombre del feature en kebab-case}

## Pasos obligatorios:

1. **Lee la spec** en \`.github/specs/\${input:featureName}.spec.md\` — sección de criterios de aceptación.
2. **Genera escenarios Gherkin** — un escenario por criterio de aceptación:
   - Etiqueta caminos críticos con \`@smoke @critical\`
   - Etiqueta errores con \`@error-path\`
   - Etiqueta edge cases con \`@edge-case\`
   - Lenguaje de negocio — sin rutas de API ni detalles técnicos
   - Guarda en \`.github/specs/scenarios/\${input:featureName}.feature\`
3. **Genera matriz de riesgos** con la Regla ASD (Probabilidad × Impacto: Alto/Medio/Bajo):
   - Vectores: Seguridad, Integridad de Datos, Performance, Disponibilidad, UX
   - Todo riesgo ALTO debe tener una acción de mitigación concreta
   - Guarda en \`.github/specs/scenarios/\${input:featureName}-risks.md\`

## Restricciones:
- Solo generar artefactos QA — NO modificar código ni specs
- Escenarios independientes entre sí (sin estado compartido mutable)
`
}

// ---------------------------------------------------------------------------
// Instruction files (Copilot skills)
// ---------------------------------------------------------------------------
