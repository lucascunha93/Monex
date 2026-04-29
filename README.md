# Monex

> Aplicativo de controle financeiro pessoal construído com **Angular 20** e **PrimeNG 20**. Sem backend(por enquanto) — toda a persistência é feita via **IndexedDB** no próprio dispositivo, com suporte a operação offline-first.

---

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Scripts disponíveis](#scripts-disponíveis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Próximos passos](#próximos-passos)

---

## Visão geral

O Monex é uma SPA mobile-first focada em usabilidade e desempenho para o gerenciamento de finanças pessoais. O aplicativo funciona completamente offline e persiste dados no IndexedDB.

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Autenticação** | Login com guard de rota; estrutura preparada para multiusuário simulado |
| **Dashboard** | Resumo mensal, comparativo de período e distribuição por categoria via Chart.js |
| **Transações** | Cadastro de receitas e despesas com filtros, virtual scroll e feedback visual por tipo |
| **Entrada rápida** | Parser de linguagem natural — ex.: `R$ 50 mercado` cria a transação automaticamente |
| **Auto-categorização** | Classificação automática por palavras-chave e histórico do usuário |
| **Recorrência** | Criação automática de transações recorrentes mensais (ex.: aluguel, assinaturas) |
| **Contas** | Gerenciamento de múltiplas contas com saldo consolidado |
| **Categorias** | CRUD completo com ícones e cores personalizadas |
| **Importação CSV** | Parsing e importação de extratos bancários em CSV |
| **Relatórios** | Visões analíticas por período, categoria e conta |
| **Configurações** | Preferências do usuário e gerenciamento de dados locais |
| **Offline-first** | Fila de operações persistida localmente; sincronização simulada ao retornar online |

---

## Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | Angular (standalone + Signals) | `^20.0.0` |
| Componentes UI | PrimeNG | `^20.4.0` |
| Gráficos | Chart.js | `^4.5.1` |
| Persistência | IndexedDB nativo | — |
| Linguagem | TypeScript | `~5.9.0` |
| Testes unitários | Jest + jest-preset-angular | `^30.x` |
| Testes E2E | Cypress | `^15.x` |
| Linting | ESLint + Angular ESLint | `^20.x` |

---

## Arquitetura

O projeto segue uma estrutura **feature-based** com separação clara entre domínio, infraestrutura e apresentação.

```
src/app/
├── core/
│   ├── constants/        # Dados padrão e configurações globais
│   ├── guards/           # Auth guard (auth.guard.ts)
│   ├── models/           # Interfaces de domínio (finance, auth, csv)
│   ├── services/         # Serviços de infraestrutura
│   │   ├── finance-repository.service.ts   # Abstração do IndexedDB
│   │   ├── indexeddb.service.ts            # Wrapper genérico de IndexedDB
│   │   ├── offline-sync.service.ts         # Fila offline e sincronização
│   │   ├── auth.service.ts                 # Autenticação local
│   │   └── csv-parser.service.ts           # Parser de extratos CSV
│   └── utils/
├── features/             # Módulos de funcionalidade (lazy-loaded)
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   ├── accounts/
│   ├── categories/
│   ├── import/
│   ├── reports/
│   └── settings/
├── shared/
│   ├── components/       # Componentes reutilizáveis
│   └── layout/           # App shell e navegação
└── state/
    └── finance.store.ts  # Estado global reativo com Signals
```

### Decisões técnicas

- **`FinanceStore`** — centraliza todo o estado da aplicação usando Angular Signals; inclui computed values e regras de negócio (recorrência, auto-categorização).
- **`FinanceRepositoryService`** — abstrai o acesso ao IndexedDB, desacoplando a camada de persistência do restante da aplicação.
- **`OfflineSyncService`** — mantém uma fila persistida de operações pendentes e as processa automaticamente quando a conectividade é restaurada.
- **`ChangeDetectionStrategy.OnPush`** — aplicado em todas as páginas e componentes para máxima performance de renderização.
- **Virtual scroll** — utilizado em listagens de transações para suportar grandes volumes sem degradação de performance.

---

## Como rodar

### Pré-requisitos

- Node.js `>= 20`
- npm `>= 10`

### Instalação e execução local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:4200)
npm start
```

### Build de produção

```bash
npm run build
```

Os artefatos são gerados em `www/`.

---

## Testes

### Unitários (Jest)

```bash
# Executar todos os testes
npm run test:jest

# Modo watch (desenvolvimento)
npm run test:jest:watch

# Com relatório de cobertura
npm run test:jest:coverage
```

### E2E (Cypress)

```bash
# Abrir Cypress interativo
npm run cy:open

# Executar E2E completo (sobe o servidor automaticamente)
npm run cy:e2e

# Cypress interativo com servidor em background
npm run cy:e2e:open
```

Os testes E2E cobrem os fluxos de **autenticação** (`auth.cy.ts`) e **transações** (`transactions.cy.ts`).

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm start` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run watch` | Build incremental em modo desenvolvimento |
| `npm run test:jest` | Testes unitários com Jest |
| `npm run test:jest:watch` | Testes unitários em modo watch |
| `npm run test:jest:coverage` | Testes unitários com cobertura |
| `npm run cy:open` | Abre Cypress interativo |
| `npm run cy:run` | Executa Cypress em modo headless |
| `npm run cy:e2e` | Sobe servidor + executa E2E headless |
| `npm run cy:e2e:open` | Sobe servidor + abre Cypress interativo |
| `npm run lint` | Análise estática com ESLint |

---

## Variáveis de ambiente

As configurações de ambiente estão em `src/environments/`:

| Arquivo | Uso |
|---|---|
| `environment.ts` | Desenvolvimento local |
| `environment.prod.ts` | Build de produção |

---

## Próximos passos

- [ ] Exportação de relatórios em PDF/Excel
- [ ] PWA instalável com notificações locais (Web Push)
- [ ] Metas financeiras com progresso visual
- [ ] Testes unitários para regras de auto-categorização e recorrência
- [ ] Tema escuro nativo via variáveis CSS do Ionic
