export default function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  res.status(200).json({
    environment: process.env.NODE_ENV || 'not set',
    hasSupabaseUrl: typeof supabaseUrl !== 'undefined',
    supabaseUrlLength: supabaseUrl?.length || 0,
    hasSupabaseKey: typeof supabaseKey !== 'undefined',
    supabaseKeyLength: supabaseKey?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.startsWith('NEXT_PUBLIC_') || 
      k.startsWith('SUPABASE_')
    )
  });
}
