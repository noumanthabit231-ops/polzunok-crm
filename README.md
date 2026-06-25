# Ползунок.CRM

Мини-CRM для отслеживания подписок заведений.

## Быстрый старт

1. **Supabase**
   - Создай проект в [supabase.com](https://supabase.com)
   - Выполни SQL из `supabase-schema.sql` в SQL Editor
   - Скопируй `Project URL` и `anon public key` из настроек API

2. **Настройка**
   ```bash
   cp .env.example .env
   ```
   Впиши свои VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

3. **Запуск**
   ```bash
   npm install
   npm run dev
   ```

4. **Деплой на Vercel**
   ```bash
   npx vercel
   ```
   Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в Environment Variables

## Как работает

- **Главная** — список всех заведений с прогресс-баром подписки
- **+ Добавить** — создаёт заведение + первый платёж (название, сумма, даты)
- **История** — все платежи заведения, отмечен активный период
- Цвета прогресс-бара: зелёный (<60%), жёлтый (60-85%), красный (>85%)
