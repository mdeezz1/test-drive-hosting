# Documentação Completa - Sistema de Venda de Ingressos GuicheWeb

## 📋 Visão Geral

Sistema completo de venda de ingressos online com:
- Múltiplos eventos configuráveis via painel admin
- Pagamento via PIX (FreePay Brasil)
- Rastreamento de vendas (Utmify)
- Geração de ingressos em PDF com QR Code e código de barras
- Busca de pedidos por CPF/Email

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `events`
Armazena informações dos eventos.

```sql
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  opening_time TIME,
  location TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  cover_url TEXT,
  event_map_url TEXT,
  map_url TEXT,
  google_maps_embed TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  is_active BOOLEAN DEFAULT true,
  show_on_home BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT USING (true);

CREATE POLICY "Events can be managed by authenticated users"
ON public.events FOR ALL USING (true);
```

### Tabela: `ticket_types`
Tipos de ingressos por evento.

```sql
CREATE TABLE public.ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  price NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  available INTEGER DEFAULT 0,
  batch TEXT,
  color TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket types are viewable by everyone"
ON public.ticket_types FOR SELECT USING (true);

CREATE POLICY "Ticket types can be managed by authenticated users"
ON public.ticket_types FOR ALL USING (true);
```

### Tabela: `orders`
Pedidos/compras realizadas.

```sql
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  event_id UUID REFERENCES public.events(id),
  customer_name TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders are viewable by everyone"
ON public.orders FOR SELECT USING (true);

CREATE POLICY "Orders can be inserted by anyone"
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders can be updated by anyone"
ON public.orders FOR UPDATE USING (true);
```

---

## 🔐 Secrets/Variáveis de Ambiente Necessárias

Configure estas secrets no Lovable Cloud:

| Secret Name | Descrição |
|-------------|-----------|
| `FREEPAY_PUBLIC_KEY` | Chave pública da API FreePay Brasil |
| `FREEPAY_SECRET_KEY` | Chave secreta da API FreePay Brasil |
| `UTMIFY_API_KEY` | Chave da API Utmify para rastreamento |
| `ADMIN_PASSWORD` | Senha de acesso ao painel administrativo |

**Secrets automáticas (não precisa configurar):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## ⚡ Edge Functions

### 1. `admin-auth`
Autenticação do painel administrativo.

**Localização:** `supabase/functions/admin-auth/index.ts`

**Funcionalidade:**
- Valida senha do admin contra `ADMIN_PASSWORD`
- Retorna sucesso ou erro de autenticação

### 2. `admin-events`
CRUD completo de eventos e tipos de ingresso.

**Localização:** `supabase/functions/admin-events/index.ts`

**Endpoints:**
- `GET` - Lista todos eventos com seus tipos de ingresso
- `POST` - Cria novo evento
- `PUT` - Atualiza evento existente
- `DELETE` - Remove evento

### 3. `create-pix-payment`
Criação de pagamento PIX via FreePay.

**Localização:** `supabase/functions/create-pix-payment/index.ts`

**Funcionalidade:**
1. Recebe dados do cliente e itens do carrinho
2. Cria pedido no banco com status "pending"
3. Envia para Utmify com status "waiting_payment"
4. Gera cobrança PIX na FreePay
5. Retorna QR Code e código "copia e cola"

### 4. `pix-webhook`
Webhook para confirmação de pagamento.

**Localização:** `supabase/functions/pix-webhook/index.ts`

**Funcionalidade:**
1. Recebe notificação da FreePay
2. Atualiza status do pedido no banco
3. Atualiza status na Utmify (paid/refunded)

---

## 📁 Estrutura de Pastas do Frontend

```
src/
├── assets/                    # Imagens e assets
│   ├── brazil-flag.png
│   ├── event-banner.png
│   ├── event-cover.jpg
│   ├── event-map.png
│   ├── guicheweb-logo.png
│   ├── guicheweb-logo-full.png
│   └── pix-phone-illustration.png
│
├── components/
│   ├── ui/                    # Componentes Shadcn UI
│   ├── Navbar.tsx             # Barra de navegação
│   ├── NavLink.tsx            # Links de navegação
│   ├── RichTextEditor.tsx     # Editor de texto rico (Tiptap)
│   ├── SearchOrdersDialog.tsx # Modal de busca de pedidos
│   ├── TicketView.tsx         # Visualização do ingresso
│   ├── UserMenuDialog.tsx     # Menu do usuário
│   └── admin/
│       └── EventManager.tsx   # Gerenciador de eventos admin
│
├── contexts/
│   └── AuthContext.tsx        # Contexto de autenticação
│
├── hooks/
│   ├── use-mobile.tsx         # Hook para detectar mobile
│   └── use-toast.ts           # Hook de notificações
│
├── integrations/
│   └── supabase/
│       ├── client.ts          # Cliente Supabase (auto-gerado)
│       └── types.ts           # Tipos TypeScript (auto-gerado)
│
├── pages/
│   ├── Index.tsx              # Página inicial com lista de eventos
│   ├── EventPage.tsx          # Página do evento com ingressos
│   ├── Checkout.tsx           # Página de checkout/pagamento
│   ├── PaymentSuccess.tsx     # Página de sucesso do pagamento
│   ├── MeusPedidos.tsx        # Página de visualização de pedidos
│   ├── Ingressos.tsx          # Página de ingressos
│   ├── MeusDados.tsx          # Página de dados do usuário
│   ├── Login.tsx              # Página de login
│   ├── AdminLogin.tsx         # Login do painel admin
│   ├── AdminDashboard.tsx     # Dashboard administrativo
│   └── NotFound.tsx           # Página 404
│
├── lib/
│   └── utils.ts               # Utilitários gerais
│
├── App.tsx                    # Componente principal com rotas
├── App.css                    # Estilos globais
├── index.css                  # Estilos Tailwind
└── main.tsx                   # Entry point
```

---

## 🛣️ Rotas da Aplicação

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | Index | Página inicial com eventos |
| `/:slug` | EventPage | Página do evento dinâmico |
| `/checkout` | Checkout | Checkout com pagamento PIX |
| `/pagamento-confirmado` | PaymentSuccess | Confirmação de pagamento |
| `/meus-pedidos` | MeusPedidos | Visualização de ingressos |
| `/ingressos` | Ingressos | Página de ingressos |
| `/meus-dados` | MeusDados | Dados do usuário |
| `/login` | Login | Login de usuário |
| `/gw-admin-2025` | AdminLogin | Login admin (URL secreta) |
| `/gw-admin-2025/dashboard` | AdminDashboard | Painel administrativo |

---

## 💳 Fluxo de Pagamento PIX

```
1. Usuário seleciona ingressos na página do evento
           ↓
2. Clica em "Comprar" → Redirecionado para /checkout
           ↓
3. Preenche dados pessoais (nome, CPF, email, telefone)
           ↓
4. Clica em "Gerar PIX" → Edge Function create-pix-payment
           ↓
5. Sistema cria pedido no banco (status: pending)
           ↓
6. Sistema envia para Utmify (status: waiting_payment)
           ↓
7. Sistema gera cobrança na FreePay
           ↓
8. Retorna QR Code e código "copia e cola"
           ↓
9. Usuário paga via app do banco
           ↓
10. FreePay envia webhook → Edge Function pix-webhook
           ↓
11. Sistema atualiza pedido (status: paid)
           ↓
12. Sistema atualiza Utmify (status: paid)
           ↓
13. Usuário é redirecionado para /pagamento-confirmado
           ↓
14. Usuário pode baixar ingressos em PDF
```

---

## 🎫 Estrutura do Ingresso (PDF)

Cada ingresso contém:
- **Cabeçalho:** Data de pagamento, logo GuicheWeb
- **Dados do Evento:** Nome, data, horário, local
- **Dados do Cliente:** Nome, CPF (mascarado), email
- **Tipo de Ingresso:** Setor, nome do ingresso
- **Identificadores Únicos:**
  - QR Code (transaction_id + order_id + ticket_index)
  - Código de barras
  - Número do ingresso
- **Instruções:** Avisos importantes para o portador

---

## 🔧 Configurações Importantes

### Limite de Carrinho
- Máximo de R$ 1.000,00 por compra (prevenção de fraudes)
- Usuário deve fazer múltiplas compras para valores maiores

### Mobile First
- 80% dos usuários acessam via mobile
- Design prioriza experiência mobile

### Hierarquia de Ingressos
- **Setor:** Arena, Área VIP, Premium, Frontstage
- **Tipo:** Inteira, Meia, Solidária, PCD

---

## 📦 Dependências Principais

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@supabase/supabase-js": "^2.86.0",
  "@tanstack/react-query": "^5.83.0",
  "tailwindcss": "...",
  "shadcn/ui": "...",
  "jspdf": "^3.0.4",
  "html2canvas": "^1.4.1",
  "qrcode": "^1.5.4",
  "jsbarcode": "^3.12.1",
  "@tiptap/react": "^3.11.1",
  "sonner": "^1.7.4",
  "date-fns": "^3.6.0"
}
```

---

## 🚀 Como Configurar em Nova Conta

### 1. Criar Projeto no Lovable
- Crie um novo projeto no Lovable
- Habilite o Lovable Cloud

### 2. Importar Código
- Conecte ao GitHub
- Faça pull do repositório

### 3. Configurar Banco de Dados
- Execute as migrações SQL acima
- Crie as tabelas: events, ticket_types, orders

### 4. Configurar Secrets
No Lovable Cloud, adicione:
- `FREEPAY_PUBLIC_KEY`
- `FREEPAY_SECRET_KEY`
- `UTMIFY_API_KEY`
- `ADMIN_PASSWORD`

### 5. Configurar Storage
- Crie bucket `event-images` (público)

### 6. Deploy
- As edge functions são deployadas automaticamente
- Publique o frontend

---

## 🔗 APIs Externas

### FreePay Brasil
- **Documentação:** https://freepaybrasil.com/docs
- **Endpoint:** `https://api.freepaybrasil.com/v1/payment-transaction/create`
- **Autenticação:** Basic Auth (PUBLIC_KEY:SECRET_KEY)

### Utmify
- **Endpoint:** `https://api.utmify.com.br/api-credentials/orders`
- **Autenticação:** Header `x-api-token`

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- Código fonte no GitHub
- Documentação do Lovable: https://docs.lovable.dev
- Documentação do Supabase: https://supabase.com/docs
