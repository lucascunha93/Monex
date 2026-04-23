# Monex

Aplicativo de controle financeiro pessoal em Angular + Ionic com foco em arquitetura senior, UX de produto e persistencia local em IndexedDB.

## Principais recursos

- Cadastro de receitas/despesas, contas, categorias e metas
- Dashboard com comparativo mensal e distribuicao por categoria
- Entrada rapida: `R$ 50 mercado`
- Auto-categorizacao por palavras-chave e historico
- Recorrencia mensal automatica (ex: aluguel)
- Fila offline-first com sincronizacao simulada
- Filtros, virtual scroll e feedback visual por tipo de transacao

## Stack

- Angular 20 (standalone + Signals)
- Ionic 8 (container/app shell mobile-friendly)
- PrimeNG 20 (componentes UI)
- IndexedDB nativo (persistencia robusta sem backend)

## Arquitetura

```text
src/app
	core/
		constants/
		models/
		services/
		utils/
	shared/
		components/
		layout/
	features/
		dashboard/
		transactions/
		accounts/
		categories/
		reports/
		settings/
	state/
```

### Decisoes tecnicas

- `FinanceStore` centraliza estado global com Signals e regras de negocio.
- `FinanceRepositoryService` abstrai acesso a dados via IndexedDB.
- `OfflineSyncService` mantém fila local e processa quando online.
- Estrutura por features para facilitar escalabilidade e manutencao.

## Como rodar

```bash
npm install
npm start
```

## Qualidade e performance

- `ChangeDetectionStrategy.OnPush` em paginas e componentes
- Lista virtual para grande volume de transacoes
- Carga inicial com bootstrap de dados padrao

## Proximos passos sugeridos

- Autenticacao fake + multiusuario simulado
- Importacao de CSV de extrato
- Testes unitarios para regras de auto-categorizacao e recorrencia
- PWA instalavel e notificacoes locais
