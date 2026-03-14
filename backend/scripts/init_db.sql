CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('admin','user')) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('phishing','credential','training')),
    subject TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    name TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft','scheduled','running','completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_at TIMESTAMPTZ,
    include_qr_code BOOLEAN DEFAULT FALSE,
    selected_target_ids JSONB DEFAULT '[]'::jsonb,
    ad_hoc_emails JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
    tracking_id UUID UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending','sent','failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE simulation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('email_opened','link_clicked','credential_submitted','training_viewed')),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_targets_org ON targets(organization_id);
CREATE INDEX idx_sim_campaign ON simulations(campaign_id);
CREATE INDEX idx_events_sim ON simulation_events(simulation_id);
