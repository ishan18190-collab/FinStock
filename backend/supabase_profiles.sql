-- Since you want to scrap Twilio and use Supabase, 
-- you need to create a `profiles` table that mirrors Supabase's internal `auth.users` table.

-- 1. Create a public profiles table to store phone numbers
create table public.profiles (
  id uuid references auth.users not null primary key,
  phone_number text unique not null,
  is_verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Optional: Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);

-- 3. Set up a trigger to automatically copy numbers from auth.users to public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone_number)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

-- 4. Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
