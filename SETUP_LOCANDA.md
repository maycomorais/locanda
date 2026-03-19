# 🍕 Locanda Pizzeria — Setup Guide (Versão Corrigida)

## 1. Criar novo projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Nome: `locanda-pizzeria`
3. Após criar, vá em **Settings → API** e copie:
   - **Project URL**
   - **anon/public key**

## 2. Preencher supabaseClient.js
```js
const _SUPABASE_URL = 'COLE_AQUI_A_URL_DO_PROJETO';
const _SUPABASE_KEY = 'COLE_AQUI_A_ANON_KEY';
```

## 3. Executar Schema Completo no SQL Editor

### 3.1 Tabelas principais
```sql
-- CATEGORIAS
CREATE TABLE categorias (
  slug         TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  nome_exibicao TEXT,
  ordem        INTEGER DEFAULT 0,
  ativo        BOOLEAN DEFAULT true,
  hora_inicio  TEXT,
  hora_fim     TEXT,
  dias_semana  JSONB
);

-- SUBCATEGORIAS
CREATE TABLE subcategorias (
  slug            TEXT PRIMARY KEY,
  categoria_slug  TEXT REFERENCES categorias(slug) ON DELETE CASCADE,
  nome_exibicao   TEXT NOT NULL,
  ordem           INTEGER DEFAULT 0
);

-- PRODUTOS
CREATE TABLE produtos (
  id              BIGSERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  preco           NUMERIC(10,2) NOT NULL DEFAULT 0,
  imagem_url      TEXT,
  categoria_slug  TEXT REFERENCES categorias(slug),
  subcategoria_slug TEXT REFERENCES subcategorias(slug),
  ativo           BOOLEAN DEFAULT true,
  pausado         BOOLEAN DEFAULT false,
  somente_balcao  BOOLEAN DEFAULT false,
  e_montavel      BOOLEAN DEFAULT false,
  montagem_config JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- MOTOBOYS
CREATE TABLE motoboys (
  id        BIGSERIAL PRIMARY KEY,
  nome      TEXT NOT NULL,
  telefone  TEXT,
  ativo     BOOLEAN DEFAULT true
);

-- PEDIDOS
CREATE TABLE pedidos (
  id                          BIGSERIAL PRIMARY KEY,
  uid_temporal                TEXT,
  status                      TEXT DEFAULT 'pendente',
  tipo_entrega                TEXT DEFAULT 'delivery',
  cliente_nome                TEXT,
  cliente_telefone            TEXT,
  endereco_entrega            TEXT,
  geo_lat                     TEXT,
  geo_lng                     TEXT,
  itens                       JSONB DEFAULT '[]',
  subtotal                    NUMERIC(12,2) DEFAULT 0,
  frete_cobrado_cliente       NUMERIC(10,2) DEFAULT 0,
  frete_motoboy               NUMERIC(10,2) DEFAULT 0,
  desconto_cupom              NUMERIC(10,2) DEFAULT 0,
  total_geral                 NUMERIC(12,2) DEFAULT 0,
  forma_pagamento             TEXT,
  obs_pagamento               TEXT,
  dados_factura               JSONB,
  motoboy_id                  BIGINT REFERENCES motoboys(id),
  -- Timestamps de status
  tempo_recebido              TIMESTAMPTZ,
  tempo_confirmado            TIMESTAMPTZ,
  tempo_preparo_iniciado      TIMESTAMPTZ,
  tempo_pronto                TIMESTAMPTZ,
  tempo_saiu_entrega          TIMESTAMPTZ,
  tempo_entregue              TIMESTAMPTZ,
  -- Cancelamento
  cancelamento_solicitado     BOOLEAN DEFAULT false,
  cancelamento_motivo         TEXT,
  cancelamento_solicitado_por TEXT,
  cancelamento_solicitado_em  TIMESTAMPTZ,
  -- Confirmação pelo funcionário
  entrega_confirmada_em       TIMESTAMPTZ,
  confirmacao_tipo            TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIGURACOES (linha única)
CREATE TABLE configuracoes (
  id                    BIGSERIAL PRIMARY KEY,
  loja_aberta           BOOLEAN DEFAULT true,
  cotacao_real          NUMERIC(10,2) DEFAULT 1100,
  banner_imagem         TEXT,
  banner_produto_id     BIGINT,
  nome_loja             TEXT DEFAULT 'Locanda Pizzeria',
  cor_primaria          TEXT DEFAULT '#1a7a2e',
  icone_url             TEXT,
  horarios_semanais     JSONB,
  tabela_frete          JSONB,
  ajuda_combustivel     INTEGER DEFAULT 20000,
  extras_globais        JSONB DEFAULT '[]',
  -- Controle de delivery pelo admin
  delivery_aberto       BOOLEAN DEFAULT true,
  aviso_delivery        TEXT DEFAULT '',
  horario_extra_hoje    JSONB DEFAULT NULL
);

-- Inserir linha inicial de configurações
INSERT INTO configuracoes (id, loja_aberta) VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- CUPONS
CREATE TABLE cupons (
  id               BIGSERIAL PRIMARY KEY,
  codigo           TEXT UNIQUE NOT NULL,
  tipo             TEXT NOT NULL, -- 'percentual' | 'frete'
  valor            NUMERIC(10,2) DEFAULT 0,
  minimo           NUMERIC(10,2) DEFAULT 0,
  ativo            BOOLEAN DEFAULT true,
  limite_uso       INTEGER,
  usos_realizados  INTEGER DEFAULT 0,
  validade         DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- PERFIS DE ACESSO
CREATE TABLE perfis_acesso (
  id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email  TEXT,
  cargo  TEXT DEFAULT 'funcionario' -- 'dono' | 'gerente' | 'funcionario'
);

-- MOVIMENTAÇÕES DE CAIXA
CREATE TABLE movimentacoes_caixa (
  id             BIGSERIAL PRIMARY KEY,
  tipo           TEXT NOT NULL, -- 'despesa' | 'sangria' | 'suprimento' | 'abertura' | 'fechamento'
  valor          NUMERIC(12,2) NOT NULL,
  descricao      TEXT,
  usuario_email  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- SOLICITAÇÕES DE CANCELAMENTO (tabela auxiliar)
CREATE TABLE IF NOT EXISTS solicitacoes_cancelamento (
  id             BIGSERIAL PRIMARY KEY,
  pedido_id      BIGINT REFERENCES pedidos(id),
  motivo         TEXT,
  solicitado_por TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS) — OBRIGATÓRIO
```sql
-- Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_acesso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_cancelamento ENABLE ROW LEVEL SECURITY;

-- Produtos e categorias: leitura pública (cardápio), escrita apenas autenticados
ALTER TABLE produtos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoboys    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_leitura_publica"  ON produtos    FOR SELECT TO anon      USING (ativo = true AND pausado = false);
CREATE POLICY "produtos_admin"            ON produtos    FOR ALL    TO authenticated USING (true);
CREATE POLICY "categorias_leitura_publica" ON categorias FOR SELECT TO anon      USING (ativo = true);
CREATE POLICY "categorias_admin"          ON categorias  FOR ALL    TO authenticated USING (true);
CREATE POLICY "subcategorias_pub"         ON subcategorias FOR SELECT TO anon    USING (true);
CREATE POLICY "subcategorias_admin"       ON subcategorias FOR ALL   TO authenticated USING (true);

-- Pedidos: anon pode inserir (cliente faz pedido), autenticado pode fazer tudo
CREATE POLICY "pedidos_insert_anon"  ON pedidos FOR INSERT TO anon          WITH CHECK (true);
CREATE POLICY "pedidos_select_anon"  ON pedidos FOR SELECT TO anon          USING (true);
CREATE POLICY "pedidos_update_anon"  ON pedidos FOR UPDATE TO anon          USING (true);
CREATE POLICY "pedidos_admin"        ON pedidos FOR ALL    TO authenticated USING (true);

-- Configurações: leitura pública (horário/banner), escrita autenticada
CREATE POLICY "config_leitura_publica" ON configuracoes FOR SELECT TO anon         USING (true);
CREATE POLICY "config_admin"           ON configuracoes FOR ALL    TO authenticated USING (true);

-- Cupons: verificação pública (aplicar cupom), escrita autenticada
CREATE POLICY "cupons_select_anon" ON cupons FOR SELECT TO anon          USING (ativo = true);
CREATE POLICY "cupons_admin"       ON cupons FOR ALL    TO authenticated USING (true);

-- Motoboys: autenticados apenas
CREATE POLICY "motoboys_auth" ON motoboys FOR ALL TO authenticated USING (true);

-- Caixa e perfis: autenticados apenas
CREATE POLICY "caixa_auth"   ON movimentacoes_caixa FOR ALL TO authenticated USING (true);
CREATE POLICY "perfis_auth"  ON perfis_acesso       FOR ALL TO authenticated USING (true);
CREATE POLICY "cancel_auth"  ON solicitacoes_cancelamento FOR ALL TO authenticated USING (true);
```

### 3.3 Índices de performance
```sql
CREATE INDEX idx_pedidos_status      ON pedidos (status);
CREATE INDEX idx_pedidos_created_at  ON pedidos (created_at DESC);
CREATE INDEX idx_pedidos_tipo        ON pedidos (tipo_entrega);
CREATE INDEX idx_produtos_categoria  ON produtos (categoria_slug);
CREATE INDEX idx_produtos_ativo      ON produtos (ativo, pausado);
```

### 3.4 Realtime (habilitar para polling/live)
```sql
-- No painel Supabase: Database → Replication
-- Habilitar Realtime para a tabela 'pedidos'
-- Ou via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
```

## 4. Configurar Storage
1. Supabase → **Storage** → **New Bucket**
2. Nome: `produtos`
3. Marcar como **Public bucket**
4. Adicionar policy de upload para autenticados:
```sql
CREATE POLICY "upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produtos');
```

## 5. Criar primeiro usuário Admin
1. Supabase → **Authentication** → **Users** → **Add user**
2. Email + senha seguros
3. Execute no SQL Editor para dar cargo de dono:
```sql
INSERT INTO perfis_acesso (id, email, cargo)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI'),
  'SEU_EMAIL_AQUI',
  'dono'
);
```

## 6. Deploy no GitHub Pages

### 6.1 Subir arquivos
```bash
git clone https://github.com/SEU_USUARIO/locanda-pizzeria.git
cd locanda-pizzeria
# Copiar TODOS os arquivos para a pasta
git add .
git commit -m "🚀 Locanda Pizzeria — versão corrigida"
git push
```

### 6.2 Ativar GitHub Pages
- Repositório → **Settings** → **Pages**
- Source: **Deploy from a branch** → `main` → `/ (root)`

### 6.3 Domínio personalizado
O arquivo `CNAME` contém `locanda.online` — altere se necessário.
Aponte o DNS do domínio para o GitHub Pages:
```
CNAME  www   seu-usuario.github.io
A      @     185.199.108.153
A      @     185.199.109.153
A      @     185.199.110.153
A      @     185.199.111.153
```

## 7. Arquivos entregues

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Cardápio do cliente (PWA) |
| `app.js` | Lógica do cardápio |
| `style.css` | Estilos do cardápio |
| `admin.html` | Painel administrativo |
| `admin.js` | Lógica do admin |
| `admin.css` | Estilos do admin |
| `login.html` | Tela de login |
| `imprimir.html` | Comprovante de pedido |
| `translations.js` | Sistema de tradução (ES/PT/EN/DE) |
| `supabaseClient.js` | Conexão com banco de dados |
| `sw.js` | Service Worker (cache offline) |
| `manifest.json` | PWA do cardápio |
| `manifest-admin.json` | PWA do admin |
| `CNAME` | Domínio personalizado |

## 8. Variáveis a personalizar

| Variável | Arquivo | Valor atual |
|----------|---------|-------------|
| `FONE_LOJA` | `app.js` L1 | `595984692537` |
| `COORD_LOJA` | `app.js` L2 | Assunção, PY |
| `CHAVE_PIX` | `app.js` L8 | Email Pix |
| `NOME_PIX` | `app.js` L9 | Nome do titular |
| `DADOS_ALIAS` | `app.js` L10 | Alias banco Ueno |
| `ALIAS_PY` | `app.js` L11 | Nome titular PY |
| `LOGO_URL` | `imprimir.html` | URL da logo na impressão |
| `COORD_LOJA` | `admin.js` L3 | Para cálculo de rota |
| `TAXA_MOTOBOY` | `admin.js` L4 | Gs por entrega |

## 9. Bugs corrigidos nesta versão
- Shake: validação e preço corretos no carrinho
- "Fechar Delivery" no admin agora funciona no cardápio
- "Estender Horário" no admin agora funciona no cardápio
- XSS eliminado em toda renderização de dados do cliente na cozinha/relatório
- Controle de acesso por cargo (dono/gerente/funcionário) funcionando
- Timer da cozinha usa hora de início do preparo (não do pedido)
- enviarRotaZap com await e tratamento de erro
- Login com suporte a tecla Enter
- Service Worker registrado uma vez, cache v3
- Manifests separados para cliente e admin
- Todas as referências ao projeto anterior (sushi) removidas

## Cores do tema
- **Primary:** `#1a7a2e` (Verde Locanda)
- **Dark:** `#1a252f` (Fundo sidebar admin)
- **Logo URL:** configurável via painel admin → Configurações → Personalização
- **Telefone:** +595 984 692537
