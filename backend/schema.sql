CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    mobile TEXT,
    role TEXT CHECK (role IN ('admin','user')) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    department TEXT,
    risk_index FLOAT DEFAULT 0.0,
    behavioral_tags TEXT[] DEFAULT '{}',
    whatsapp_number TEXT,
    discord_handle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('phishing','credential','training')),
    subject TEXT,
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt_context JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('phishing','credential','training')),
    status TEXT CHECK (status IN ('draft','scheduled','running','completed','cancelled')) DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
    tracking_id TEXT UNIQUE NOT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    last_event_at TIMESTAMPTZ,
    channel TEXT DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    event_type TEXT CHECK (
        event_type IN (
            'email_opened',
            'link_clicked',
            'credential_submitted',
            'training_viewed'
        )
    ),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    password_strength TEXT,
    length INTEGER,
    contains_special_chars BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    risk_level TEXT CHECK (risk_level IN ('low','medium','high')),
    click_rate FLOAT,
    credential_rate FLOAT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    insight_type TEXT,
    summary TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile TEXT;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','user'));
-- ALTER TABLE simulations ALTER COLUMN tracking_id TYPE TEXT;