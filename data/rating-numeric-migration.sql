-- rating カラムを integer から numeric (小数対応) に変更
-- 例: 2212.038 のような小数レートを保存できるようにする
ALTER TABLE teams
  ALTER COLUMN rating TYPE numeric USING rating::numeric;
