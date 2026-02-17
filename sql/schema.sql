-- =============================================================================
-- SQL Schema for Task Management Application
-- Execute this in Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE (linked to Supabase Auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Link to Supabase auth.users
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'worker')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =============================================================================
-- TASKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'new' CHECK (
      status IN ('new', 'planned', 'in_progress', 'waiting_materials', 'done', 'postponed')
    ),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- =============================================================================
-- INSTALLATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'new' CHECK (
      status IN ('new', 'planned', 'in_progress', 'waiting_materials', 'done', 'postponed')
    ),
    scheduled_at TIMESTAMPTZ,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installations_project_id ON installations(project_id);
CREATE INDEX IF NOT EXISTS idx_installations_assignee_id ON installations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_scheduled_at ON installations(scheduled_at);

-- =============================================================================
-- PURCHASE REQUESTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    installation_id UUID REFERENCES installations(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (
      status IN ('draft', 'pending', 'approved', 'rejected')
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_task_id ON purchase_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_installation_id ON purchase_requests(installation_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_by ON purchase_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);

-- =============================================================================
-- PURCHASE REQUEST ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (
      unit IN (
        'pcs','m','m2','m3','l','kg','box','pack','set',
        'упак','шт','м','м2','м3','л','кг'
      )
    ),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_request_items_request_id ON purchase_request_items(purchase_request_id);

-- =============================================================================
-- MATERIALS TABLE (справочник расходных материалов)
-- =============================================================================
CREATE TABLE IF NOT EXISTS materials (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  default_unit TEXT NOT NULL CHECK (
    default_unit IN (
      'pcs','m','m2','m3','l','kg','box','pack','set',
      'упак','шт','м','м2','м3','л','кг'
    )
  ),
  is_optional  BOOLEAN NOT NULL DEFAULT false,
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);

-- Связь позиций заявок с справочником материалов
ALTER TABLE purchase_request_items
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE SET NULL;

-- =============================================================================
-- EXPLICIT FOREIGN KEY CONSTRAINTS (named, for Supabase)
-- =============================================================================
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS fk_projects_created_by;
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_project;
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_project 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_assignee;
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assignee 
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE installations 
DROP CONSTRAINT IF EXISTS fk_installations_project;
ALTER TABLE installations 
ADD CONSTRAINT fk_installations_project 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE installations 
DROP CONSTRAINT IF EXISTS fk_installations_assignee;
ALTER TABLE installations 
ADD CONSTRAINT fk_installations_assignee 
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_requests 
DROP CONSTRAINT IF EXISTS fk_pr_task;
ALTER TABLE purchase_requests 
ADD CONSTRAINT fk_pr_task 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

ALTER TABLE purchase_requests 
DROP CONSTRAINT IF EXISTS fk_pr_installation;
ALTER TABLE purchase_requests 
ADD CONSTRAINT fk_pr_installation 
  FOREIGN KEY (installation_id) REFERENCES installations(id) ON DELETE SET NULL;

ALTER TABLE purchase_requests 
DROP CONSTRAINT IF EXISTS fk_pr_created_by;
ALTER TABLE purchase_requests 
ADD CONSTRAINT fk_pr_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_requests 
DROP CONSTRAINT IF EXISTS fk_pr_approved_by;
ALTER TABLE purchase_requests 
ADD CONSTRAINT fk_pr_approved_by 
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_request_items 
DROP CONSTRAINT IF EXISTS fk_pri_purchase_request;
ALTER TABLE purchase_request_items 
ADD CONSTRAINT fk_pri_purchase_request 
  FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users can read all"
  ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert"
  ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own"
  ON users
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- projects
CREATE POLICY "Projects can read all"
  ON projects
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Projects can insert"
  ON projects
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Projects can update"
  ON projects
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- tasks
CREATE POLICY "Tasks can read all"
  ON tasks
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tasks can insert"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tasks can update"
  ON tasks
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- installations
CREATE POLICY "Installations can read all"
  ON installations
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Installations can insert"
  ON installations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Installations can update"
  ON installations
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- purchase_requests
CREATE POLICY "PR can read all"
  ON purchase_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "PR can insert"
  ON purchase_requests
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "PR can update"
  ON purchase_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- purchase_request_items
CREATE POLICY "PRI can read all"
  ON purchase_request_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "PRI can insert"
  ON purchase_request_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "PRI can update"
  ON purchase_request_items
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- materials
CREATE POLICY "Materials can read all"
  ON materials
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Materials can insert"
  ON materials
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Materials can update"
  ON materials
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    auth_id UUID;
BEGIN
    auth_id := auth.uid();
    SELECT role INTO user_role FROM users WHERE auth_user_id = auth_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    auth_id UUID;
BEGIN
    auth_id := auth.uid();
    SELECT id INTO user_id FROM users WHERE auth_user_id = auth_id;
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_current_user_manager()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := get_current_user_role();
    RETURN user_role = 'manager';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: автозаполнение purchase_request_items из materials
-- =============================================================================
CREATE OR REPLACE FUNCTION fill_pr_item_from_material()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.material_id IS NOT NULL THEN
    SELECT m.name, m.default_unit
      INTO NEW.name, NEW.unit
    FROM materials m
    WHERE m.id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_pr_item_from_material
  ON purchase_request_items;

CREATE TRIGGER trg_fill_pr_item_from_material
BEFORE INSERT ON purchase_request_items
FOR EACH ROW
EXECUTE FUNCTION fill_pr_item_from_material();

-- =============================================================================
-- SEED DATA: MATERIALS
-- =============================================================================
INSERT INTO materials (name, category, default_unit, is_optional, comment) VALUES
-- Трасса, медь, изоляция
('Медная труба 1/4" для фреона', 'трасса', 'м', false, 'R410A/R32, в бухтах, длина по трассе'),
('Медная труба 3/8" для фреона', 'трасса', 'м', false, 'для 7k–24k BTU, смотреть по модели'),
('Медная труба 1/2" для фреона', 'трасса', 'м', true, 'для более мощных сплит-систем'),
('Теплоизоляция 6 мм для трубы 1/4"', 'трасса', 'м', false, 'вспененный каучук/ПЭ'),
('Теплоизоляция 9 мм для трубы 3/8"/1/2"', 'трасса', 'м', false, 'вспененный каучук/ПЭ'),
('Дренажный шланг ПВХ 16 мм', 'дренаж', 'м', false, 'FD14 или аналог'),
('Кабель межблочный 4×1,5 мм² ВВГнг-LS', 'электрика', 'м', false, 'типовой для бытовых сплит-систем'),
('Кабель межблочный 3×1,5 мм²', 'электрика', 'м', true, 'вариант по схеме подключения'),
('Кабель межблочный 5×1,5 мм²', 'электрика', 'м', true, 'для некоторых мульти-сплит'),
('Кабель силовой 3×2,5 мм²', 'электрика', 'м', false, 'питание кондиционера от щита'),
('Кабель-канал 60×40 мм', 'декор/трасса', 'м', false, 'прокладка трассы внутри помещения'),
('Соединительные уголки для кабель-канала', 'декор/трасса', 'шт', true, 'наружные/внутренние'),
('Заглушки для кабель-канала', 'декор/трасса', 'шт', true, 'концевая отделка'),

-- Крепёж наружного блока
('Кронштейны для наружного блока 450×500', 'крепёж наружного блока', 'set', false, 'под большинство бытовых блоков'),
('Кронштейны для наружного блока 500×600', 'крепёж наружного блока', 'set', true, 'для тяжёлых блоков'),
('Анкерный болт 10×100 мм', 'крепёж', 'шт', false, 'крепление кронштейнов к бетону'),
('Анкерный болт 12×100 мм', 'крепёж', 'шт', true, 'для тяжёлых блоков/слабых оснований'),
('Дюбель 14×100 мм', 'крепёж', 'шт', true, 'под анкера'),
('Болт М10×50', 'крепёж', 'шт', true, 'крепление блока к кронштейну'),
('Гайка М10', 'крепёж', 'шт', true, NULL),
('Шайба М10', 'крепёж', 'шт', true, NULL),
('Виброопоры резиновые под наружный блок', 'виброзащита', 'set', false, '4 шт на блок'),

-- Крепёж внутреннего блока и трассы
('Дюбель с шурупом 6×40', 'крепёж внутреннего блока', 'шт', false, 'крепление монтажной пластины'),
('Дюбель с шурупом 6×33', 'крепёж трассы', 'шт', false, 'крепление кабель-канала'),
('Саморез 3,5×25', 'крепёж', 'шт', true, 'гипсокартон/короба'),
('Клипса под трассу d38', 'крепёж трассы', 'шт', true, 'открытая прокладка'),
('Стяжка нейлоновая 4,8×200', 'крепёж', 'шт', false, 'фиксация трассы и кабелей'),
('Стяжка нейлоновая 3,6×150', 'крепёж', 'шт', true, NULL),

-- Герметизация и изоляция
('Изолента ПВХ чёрная 15×10 м', 'изоляция', 'шт', false, 'обмотка трассы'),
('Герметик силиконовый', 'герметизация', 'шт', false, 'отверстия, узлы прохода'),
('Монтажная пена', 'герметизация', 'шт', true, 'заделка отверстия'),
('Уплотнительный поролон/уплотнитель', 'герметизация', 'м', true, 'альтернатива пене'),

-- Электрика и соединения
('Клеммная колодка W10/W16', 'электрика', 'шт', false, 'соединение проводов'),
('Гофра ПВХ 16 мм', 'электрика', 'м', true, 'защита кабеля'),
('Гофра ПВХ 20 мм', 'электрика', 'м', true, 'для более толстых кабелей'),
('Наконечники НШВИ', 'электрика', 'упак', true, 'под разные сечения'),
('Наконечники кольцевые/вилочные', 'электрика', 'упак', true, 'для клемм блоков'),
('Термоусадочная трубка', 'электрика', 'м', true, 'разные диаметры'),
('Автоматический выключатель под кондиционер', 'электрика', 'шт', false, 'номинал по паспорту'),
('УЗО/дифавтомат', 'электрика', 'шт', true, 'по проекту электрики'),

-- Доп. оборудование и защита
('Дренажная помпа для кондиционера', 'доп. оборудование', 'шт', true, 'при невозможности самотёка'),
('Козырёк над наружным блоком', 'защита', 'шт', true, NULL),
('Антивандальная решётка/кожух наружного блока', 'защита', 'шт', true, NULL),
('Модульная рама/подставка под наружный блок', 'крепёж наружного блока', 'шт', true, 'крыша, балкон, грунт'),
('Защитные уголки для кабель-канала', 'декор/трасса', 'шт', true, NULL),
('Декоративные накладки для кабель-канала', 'декор/трасса', 'шт', true, NULL),
('Сетчатый фильтр/решётка на дренаж', 'дренаж', 'шт', true, 'от мусора и листьев'),

-- Соединительные и медные материалы
('Медная муфта под пайку', 'медь/фитинги', 'шт', true, NULL),
('Медный угол под пайку', 'медь/фитинги', 'шт', true, '90°/45°'),
('Медный тройник под пайку', 'медь/фитинги', 'шт', true, NULL),
('Рефнет-разветвитель', 'медь/фитинги', 'шт', true, 'для мульти-сплит'),
('Припой для меди', 'пайка', 'шт', true, 'серебряный/медно-фосфорный'),
('Флюс для пайки меди', 'пайка', 'шт', true, NULL),
('Армированная клейкая лента', 'крепёж/изоляция', 'шт', true, 'армированный скотч'),

-- Дренаж и канализация
('ПВХ-труба 32 мм для дренажа', 'дренаж', 'м', true, 'отвод в канализацию'),
('ПВХ-труба 40 мм для дренажа', 'дренаж', 'м', true, NULL),
('Сифон для дренажа кондиционера', 'дренаж', 'шт', true, 'подключение к канализации'),
('Обратный клапан для дренажа', 'дренаж', 'шт', true, 'от запахов из канализации'),
('Хомуты для крепления ПВХ-дренажа', 'крепёж дренажа', 'шт', true, NULL),

-- Высотные работы
('Анкер с кольцом 8×40', 'высотные работы', 'шт', true, 'подвес/страховка'),
('Анкер с кольцом 8×60', 'высотные работы', 'шт', true, NULL),
('Страховочная стропа/фал', 'высотные работы', 'шт', true, 'фиксация монтажника/блока'),
('Страховочный карабин', 'высотные работы', 'шт', true, NULL),
('Химический анкер/состав', 'крепёж', 'шт', true, 'для пустотелых/слабых оснований'),

-- Инструменты и расходники
('Сверло по бетону 6 мм', 'инструмент/расходники', 'шт', true, NULL),
('Сверло по бетону 8 мм', 'инструмент/расходники', 'шт', true, NULL),
('Сверло по бетону 10 мм', 'инструмент/расходники', 'шт', true, NULL),
('Сверло по бетону 12 мм', 'инструмент/расходники', 'шт', true, NULL),
('Коронка по бетону 45–65 мм', 'инструмент/расходники', 'шт', true, 'отверстие под трассу'),
('Отрезной диск по металлу', 'инструмент/расходники', 'шт', true, NULL),
('Отрезной диск по бетону', 'инструмент/расходники', 'шт', true, NULL),
('Наждачная бумага', 'инструмент/расходники', 'шт', true, NULL),
('Напильник по металлу', 'инструмент/расходники', 'шт', true, NULL),
('Рулетка', 'инструмент', 'шт', true, NULL),
('Маркер/карандаш строительный', 'инструмент', 'шт', true, NULL),
('Строительный уровень', 'инструмент', 'шт', true, NULL)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
