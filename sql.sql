CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE layers (
    id SERIAL PRIMARY KEY,
    division VARCHAR(255) NOT NULL,
    layer_name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE layer_columns (
    id SERIAL PRIMARY KEY,
    layer_id INT REFERENCES layers(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_type VARCHAR(50) NOT NULL,
    column_description TEXT
);

CREATE TABLE devision (
    id SERIAL PRIMARY KEY,
    division_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);