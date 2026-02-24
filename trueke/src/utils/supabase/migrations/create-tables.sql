create table if not exists users (
    id uuid default uuid_generate_v4(),
    email text not null unique, 
    username text not null unique, 
    
);