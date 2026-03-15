CREATE TABLE t_p32918684_cms_zayavok_system.clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(200),
    contact_person VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p32918684_cms_zayavok_system.tickets (
    id SERIAL PRIMARY KEY,
    number VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES t_p32918684_cms_zayavok_system.clients(id),
    system_type VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    engineer_id INTEGER REFERENCES t_p32918684_cms_zayavok_system.users(id),
    created_by INTEGER REFERENCES t_p32918684_cms_zayavok_system.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,
    closed_at TIMESTAMPTZ
);

CREATE TABLE t_p32918684_cms_zayavok_system.ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES t_p32918684_cms_zayavok_system.tickets(id),
    user_id INTEGER NOT NULL REFERENCES t_p32918684_cms_zayavok_system.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p32918684_cms_zayavok_system.ppr_schedule (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES t_p32918684_cms_zayavok_system.clients(id),
    system_type VARCHAR(200),
    maintenance_type VARCHAR(200),
    date_start DATE,
    date_end DATE,
    engineer_id INTEGER REFERENCES t_p32918684_cms_zayavok_system.users(id),
    status VARCHAR(50) DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p32918684_cms_zayavok_system.warehouse_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(200),
    unit VARCHAR(50),
    quantity NUMERIC(12,2) DEFAULT 0,
    min_quantity NUMERIC(12,2) DEFAULT 0,
    price NUMERIC(12,2) DEFAULT 0,
    location VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON t_p32918684_cms_zayavok_system.tickets(status);
CREATE INDEX idx_tickets_engineer ON t_p32918684_cms_zayavok_system.tickets(engineer_id);
CREATE INDEX idx_tickets_client ON t_p32918684_cms_zayavok_system.tickets(client_id);
CREATE INDEX idx_tickets_created ON t_p32918684_cms_zayavok_system.tickets(created_at DESC);
