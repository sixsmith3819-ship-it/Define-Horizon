# Quick SQL to Check Your Actual Database Structure

Run these queries in Supabase SQL Editor to see what columns you actually have:

## 1. Check roles table columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;
```

## 2. Check profiles table columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

## 3. See what's actually in roles table
```sql
SELECT * FROM roles LIMIT 5;
```

## 4. See your current profile
```sql
SELECT * FROM profiles WHERE email = 'admin@gmail.com';
```

Please run these and share the results so I can create the correct SQL for you!