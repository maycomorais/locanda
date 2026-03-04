# 🇧🇷 Locanda Pizzeria — Setup Guide

## 1. Criar novo projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) → **New Project**
2. Nome: `locanda-pizzeria`
3. Após criar, vá em **Settings → API** e copie:
   - **Project URL** 
   - **anon/public key**

## 2. Preencher supabaseClient.js
Abra o arquivo e substitua:
```js
const _SUPABASE_URL = 'COLE_AQUI_A_URL_DO_PROJETO';
const _SUPABASE_KEY = 'COLE_AQUI_A_ANON_KEY';
```

## 3. Executar as migrations no SQL Editor do Supabase
Execute na ordem:
1. O schema completo (tabelas: pedidos, produtos, categorias, etc.)  
2. `migration_categorias_horario.sql` → colunas hora_inicio/hora_fim
3. `migration_horario_semanal.sql` → coluna horarios_semanais

## 4. Subir para o GitHub
```bash
git clone https://github.com/maycomorais/locanda-pizzeria.git
cd locanda-pizzeria
# copiar todos os arquivos para dentro da pasta
git add .
git commit -m "🚀 Locanda Pizzeria — versão inicial"
git push
```

## 5. CNAME
O arquivo CNAME está com `locanda-pizzeria.com.py`.  
Altere se o domínio for diferente, ou delete o arquivo para usar o GitHub Pages padrão.

## Cores do tema
- **Primary:** `#1a7a2e` (verde escuro do logo)
- **Logo URL:** `https://instagram.fasu6-2.fna.fbcdn.net/v/t51.82787-15/573374451_17842149696611574_8991774026443342090_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fasu6-2.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QGF-zpjA8cPijPd5RSpqKxETK5rnkkDDh2p9_6yqpej9zo5GRLUgm0d3tqaeu4Q0J4&_nc_ohc=RupM1OUrZJ4Q7kNvwGnum_W&_nc_gid=FbdfUjQDJpnDTLdsOu7bcA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfzONtO62cnJCGwHroepfIxL3OcBuhtF6AcdRJWoRqm39Q&oe=69ABD045&_nc_sid=7a9f4b`
- **Telefone:** 
