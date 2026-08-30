/**
 * Environment Variable Validation
 */

export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn('Missing environment variable: ' + key);
    }
  }
}
