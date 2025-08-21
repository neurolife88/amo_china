-- Добавляем поле actual_entry_date в таблицу visas
-- Это поле позволяет указать реальную дату въезда в Китай (по паспорту)
-- По умолчанию будет использоваться arrival_datetime

ALTER TABLE visas ADD COLUMN IF NOT EXISTS actual_entry_date DATE;
