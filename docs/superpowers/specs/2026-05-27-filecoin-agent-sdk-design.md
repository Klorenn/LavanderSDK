# Filecoin Agent SDK Design

Un monorepo TypeScript para que agentes de IA puedan guardar, recuperar y verificar datos en Filecoin Onchain Cloud sin aprender detalles de Synapse, PDP, pagos, datasets o transportes MCP. La decisión central es construir una capa **agent-native** arriba de Synapse/foc-cli, no duplicar herramientas existentes.

## Quick path

1. Convertir `Lavander` en monorepo preservando la landing actual en `apps/landing`.
2. Crear un SDK core reusable: `@filecoin-agent/core`.
3. Exponer el core como MCP server: `@filecoin-agent/mcp`.
4. Agregar adapters nativos para LangChain y LlamaIndex.
5. Validar todo con mocks/testkit antes de tocar wallets reales.

## Decisión aprobada

| Área | Decisión |
|---|---|
| Forma del repo | Monorepo independiente dentro de `/Users/paukoh/Downloads/Lavander`. |
| Lenguaje | TypeScript primero. |
| Base Filecoin | Filecoin Onchain Cloud + Synapse SDK. |
| Primer transporte | MCP stdio. |
| Primer network | Calibration testnet por defecto. |
| Valor diferencial | Framework-native SDK + seguridad + outputs estructurados para agentes. |
| Landing actual | Preservarla moviéndola a `apps/landing`, no mezclarla con packages SDK. |

## Contexto verificado

- Filecoin 2026 apunta explícitamente a AI agents y “easy agentic pathways”: https://www.filecoin.io/blog/the-2026-filecoin-network-strategy
- Synapse SDK es la capa TypeScript oficial/documentada para Filecoin Onchain Cloud: https://docs.filecoin.cloud/developer-guides/synapse/
- `foc-cli` ya cubre CLI, MCP y AI agent skills; por eso el producto debe diferenciarse como SDK/framework adapters: https://github.com/FIL-Builders/foc-cli
- El repo viejo `@fil-b/foc-storage-mcp` está archivado y redirige a `foc-cli`: https://github.com/FIL-Builders/foc-storage-mcp
- MCP TypeScript SDK registra tools con schemas Zod y stdio transport: https://github.com/modelcontextprotocol/typescript-sdk
- LangChain JS y LlamaIndex TS soportan custom tools con schemas Zod.

## Problema

Los desarrolladores de agentes quieren una interfaz simple:

```ts
await filecoin.store({ text: report })
await filecoin.retrieve({ pieceCid })
await filecoin.verify({ pieceCid })
```

Pero hoy deben entender varias capas antes de llegar a eso:

- wallet y private key handling;
- Calibration vs mainnet;
- storage deposits y pagos;
- datasets y providers;
- PieceCID vs CIDs legacy;
- PDP/proof status;
- diferencias entre MCP, LangChain y LlamaIndex;
- errores crudos de SDK/blockchain poco legibles para agentes.

Eso es demasiado peso cognitivo para el caso de uso “mi agente necesita almacenamiento verificable”. La abstracción correcta no es esconder Filecoin; es darle al agente una API chica, segura y explícita.

## Objetivos

1. Permitir que un agente guarde texto, bytes o archivos en Filecoin Onchain Cloud.
2. Permitir recuperación por `pieceCid`.
3. Permitir verificación de estado de almacenamiento usando semántica FOC/PDP.
4. Exponer las mismas operaciones vía core SDK, MCP, LangChain y LlamaIndex.
5. Hacer que los outputs sean cortos, estructurados y seguros para agentes.
6. Evitar que un agente gaste fondos sin una política explícita.
7. Probar el 80% del flujo sin wallet real usando `testkit`.

## No objetivos del MVP

- No crear una blockchain/Filecoin client propio.
- No reemplazar Synapse SDK.
- No competir con `foc-cli` como CLI generalista.
- No soportar Python en el primer corte.
- No soportar HTTP MCP en el primer corte.
- No implementar UI nueva para la landing en esta fase.
- No abstraer todos los comandos de Filecoin; sólo el flujo agentic mínimo.

## Arquitectura propuesta

```txt
apps/
  landing/
    # App actual React/Vite preservada como sitio del producto.

packages/
  core/
    # Dominio: store, retrieve, verify, prepare, balance.
  mcp/
    # MCP server stdio construido sobre core.
  langchain/
    # LangChain tools construidas sobre core.
  llamaindex/
    # LlamaIndex tools construidas sobre core.
  testkit/
    # Fake clients, fixtures y helpers para tests sin wallet real.

examples/
  mcp-claude/
  langchain-agent/
  llamaindex-agent/

docs/
  architecture.md
  quickstart.md
  security.md
  superpowers/specs/2026-05-27-filecoin-agent-sdk-design.md
```

### Regla de dependencia

```txt
mcp ───────┐
langchain ─┼──> core ───> Synapse SDK / Filecoin Onchain Cloud
llamaindex ┘

testkit ─────> core test seams
```

Los adapters no hablan directo con Synapse. Si lo hacen, rompimos la arquitectura. El core define el contrato estable; los adapters sólo traducen ese contrato a cada framework.

## Paquetes

### `@filecoin-agent/core`

Responsabilidad: núcleo estable de operaciones Filecoin para agentes.

API pública inicial:

```ts
export type FilecoinAgentConfig = {
  network?: "calibration" | "mainnet";
  privateKey?: `0x${string}`;
  source?: string;
  spendingPolicy?: SpendingPolicy;
};

export type SpendingPolicy = {
  allowPaidOperations: boolean;
  maxStorageBytesPerCall: number;
  requireConfirmation: boolean;
};

export type StoreTextInput = {
  text: string;
  metadata?: Record<string, string>;
  copies?: number;
  confirmPaidOperation?: boolean;
};

export type StoreFileInput = {
  path: string;
  metadata?: Record<string, string>;
  copies?: number;
  confirmPaidOperation?: boolean;
};

export type RetrieveInput = {
  pieceCid: string;
  outputPath?: string;
};

export type VerifyInput = {
  pieceCid: string;
};

export type StoreResult = {
  pieceCid: string;
  size: number;
  complete: boolean;
  copies: Array<{ providerId?: number; status: string }>;
  failedAttempts: Array<{ providerId?: number; reason: string }>;
};

export type RetrieveResult = {
  pieceCid: string;
  size: number;
  bytes?: Uint8Array;
  outputPath?: string;
};

export type VerifyResult = {
  pieceCid: string;
  verified: boolean;
  status: "stored" | "pending" | "missing" | "unknown";
  copies: number;
  checkedAt: string;
  evidence: Array<{ type: "pdp" | "dataset" | "provider"; status: string; detail: string }>;
};

export interface FilecoinAgentStorage {
  storeText(input: StoreTextInput): Promise<StoreResult>;
  storeFile(input: StoreFileInput): Promise<StoreResult>;
  retrieve(input: RetrieveInput): Promise<RetrieveResult>;
  verify(input: VerifyInput): Promise<VerifyResult>;
  prepareStorage(input: { bytes: number; months?: number }): Promise<{ ready: boolean; requiredDeposit?: string; message: string }>;
  getBalance(): Promise<{ fil?: string; usdfc?: string; runwayDays?: number }>;
}
```

Diseño clave:

- Zod valida inputs en el borde.
- Errores salen normalizados como `FilecoinAgentError`.
- El core recibe una dependencia tipo `StorageBackend`; en producción usa Synapse, en tests usa fake backend.
- Las operaciones pagas respetan `spendingPolicy`.
- Ningún resultado incluye private keys, raw env o stack traces por defecto.

### `@filecoin-agent/mcp`

Responsabilidad: exponer el core como tools MCP.

Tools del MVP:

| Tool | Uso |
|---|---|
| `filecoin_store_text` | Guardar texto generado por un agente. |
| `filecoin_store_file` | Guardar archivo local. |
| `filecoin_retrieve` | Recuperar bytes o escribir a archivo. |
| `filecoin_verify` | Verificar almacenamiento/proofs por `pieceCid`. |
| `filecoin_prepare_storage` | Preparar balance/aprobaciones antes de subir. |
| `filecoin_balance` | Consultar salud de wallet/storage balance. |

Reglas de diseño MCP:

- Usar `McpServer.registerTool` con schemas Zod.
- Usar `StdioServerTransport` en el MVP.
- Devolver contenido textual + JSON compacto cuando el host lo soporte.
- Las descripciones deben enseñar al agente cuándo usar cada tool.
- Las tools con costo requieren `confirmPaidOperation: true` cuando la policy lo demande.

### `@filecoin-agent/langchain`

Responsabilidad: exportar tools LangChain JS.

API pública:

```ts
export function createFilecoinTools(config: FilecoinAgentConfig) {
  return [
    filecoinStoreTextTool,
    filecoinStoreFileTool,
    filecoinRetrieveTool,
    filecoinVerifyTool,
    filecoinPrepareStorageTool,
    filecoinBalanceTool,
  ];
}
```

Diseño:

- Usar `tool` de LangChain con schema Zod.
- Reusar exactamente los schemas del core.
- Output como string JSON estable para que LangChain lo pueda pasar entre pasos.
- No depender de MCP para LangChain; el adapter llama al core directamente.

### `@filecoin-agent/llamaindex`

Responsabilidad: exportar tools LlamaIndex TS.

API pública:

```ts
export function createFilecoinTools(config: FilecoinAgentConfig) {
  return [
    filecoinStoreTextTool,
    filecoinStoreFileTool,
    filecoinRetrieveTool,
    filecoinVerifyTool,
    filecoinPrepareStorageTool,
    filecoinBalanceTool,
  ];
}
```

Diseño:

- Usar `tool` o `FunctionTool.from` según la API estable de LlamaIndex TS.
- Mantener nombres y descripciones equivalentes a LangChain/MCP.
- Reusar schemas del core.

### `@filecoin-agent/testkit`

Responsabilidad: hacer que el desarrollo sea rápido y seguro.

Incluye:

- `createFakeStorageBackend()`;
- fixtures de `pieceCid` válidos para tests;
- simulación de errores de balance insuficiente;
- simulación de provider failure parcial;
- helpers para tests MCP sin conectarse a Filecoin.

## Flujos principales

### Store text

1. Adapter recibe input del agente.
2. Adapter valida schema.
3. Core revisa spending policy.
4. Core convierte texto a bytes.
5. Backend Synapse ejecuta upload.
6. Core normaliza `pieceCid`, copies y failed attempts.
7. Adapter devuelve JSON compacto.

### Store file

1. Adapter recibe path.
2. Core valida path readable y tamaño.
3. Core revisa spending policy.
4. Backend Synapse ejecuta upload.
5. Resultado incluye `pieceCid`, `size`, `complete`, `copies`.

### Retrieve

1. Adapter recibe `pieceCid`.
2. Core valida formato básico.
3. Backend recupera bytes.
4. Si hay `outputPath`, escribe archivo; si no, devuelve bytes cuando el runtime lo permita.
5. Resultado evita imprimir contenido grande en la respuesta del agente.

### Verify

1. Adapter recibe `pieceCid`.
2. Core consulta estado disponible en FOC/Synapse.
3. Core devuelve semántica agent-friendly: `verified`, `status`, `copies`, `evidence`.
4. Si la verificación no es concluyente, responde `unknown` y explica por qué.

## Seguridad

El SDK debe asumir que un agente puede equivocarse. Por eso:

- Mainnet nunca es default.
- Private keys sólo entran por env/config explícita.
- Logs redaccionan secretos.
- Operaciones con costo pasan por `SpendingPolicy`.
- `store_file` sólo lee paths permitidos por el proceso host.
- Respuestas de error no exponen stack traces salvo `debug: true`.
- Docs explican cuánto puede gastar una operación y cómo limitarla.

Política inicial recomendada:

```ts
const defaultSpendingPolicy = {
  allowPaidOperations: false,
  maxStorageBytesPerCall: 10 * 1024 * 1024,
  requireConfirmation: true,
};
```

Esto fuerza al dev a decidir conscientemente cuándo habilita pagos. La comodidad no puede ganarle a la seguridad cuando hay wallets involucradas.

## Testing

Estrategia TDD:

1. Tests del core con fake backend.
2. Tests de schema para inputs inválidos.
3. Tests de spending policy.
4. Tests de adapters verificando nombres, schemas y outputs.
5. Tests MCP con server inicializado en memoria cuando sea viable.
6. Tests de integración real marcados como opt-in con env vars.

Comandos esperados del monorepo:

```bash
npm test
npm run build
npm run lint
```

Tests opt-in para Filecoin real:

```bash
FILECOIN_AGENT_ENABLE_INTEGRATION=1 FILECOIN_PRIVATE_KEY=0x... npm run test:integration
```

## Documentación pública

Docs mínimas del MVP:

- `README.md`: instalación y “primer store”.
- `docs/quickstart.md`: MCP, LangChain y LlamaIndex.
- `docs/security.md`: wallets, pagos, mainnet, confirmations.
- `docs/architecture.md`: por qué core/adapters separados.
- `examples/*`: ejemplos ejecutables con instrucciones cortas.

## Roadmap

### Milestone 1 — Monorepo + core fake

Resultado verificable: `@filecoin-agent/core` funciona contra fake backend con tests pasando.

### Milestone 2 — MCP local

Resultado verificable: un cliente MCP puede listar y llamar tools usando fake backend.

### Milestone 3 — Synapse real en Calibration

Resultado verificable: `storeText` real devuelve `pieceCid` en Calibration con integración opt-in.

### Milestone 4 — LangChain/LlamaIndex

Resultado verificable: ambos adapters ejecutan `storeText` y `verify` usando el mismo core.

### Milestone 5 — Docs y release preview

Resultado verificable: un dev nuevo puede seguir el quickstart sin leer código interno.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Duplicar `foc-cli` | Posicionar este proyecto como SDK/adapters, no CLI generalista. |
| Agente gastando fondos | `SpendingPolicy` restrictiva por defecto. |
| Cambios en Synapse SDK | Aislar Synapse detrás de `StorageBackend`. |
| MCP tool bloat | Mantener seis tools iniciales, no mapear todo Filecoin. |
| Outputs demasiado grandes | Resumir resultados y escribir archivos cuando el contenido sea grande. |
| Tests lentos/caros | Fake backend por defecto; integración real opt-in. |

## Criterios de aceptación del MVP

- `npm test` pasa sin wallet real.
- `npm run build` genera todos los packages.
- MCP server expone las seis tools iniciales.
- LangChain adapter exporta seis tools con schemas equivalentes.
- LlamaIndex adapter exporta seis tools con schemas equivalentes.
- `storeText` real funciona en Calibration cuando se habilitan env vars de integración.
- Ningún test o log imprime private keys.
- README permite primer uso en menos de cinco minutos.

## Próximo paso

Cuando esta spec sea aprobada, el siguiente artefacto debe ser el plan de implementación en:

```txt
docs/superpowers/plans/2026-05-27-filecoin-agent-sdk.md
```

Ese plan debe dividir el trabajo en tareas TDD pequeñas, con archivos exactos, comandos exactos y checkpoints de commit.
