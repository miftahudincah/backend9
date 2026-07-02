// api/debug.js - Cek environment variables
module.exports = function handler(req, res) {
  // Ambil raw values (tanpa trim dulu)
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Tampilkan informasi detail
  res.status(200).json({
    message: 'Debug environment variables',
    url: {
      exists: typeof urlRaw !== 'undefined',
      isString: typeof urlRaw === 'string',
      length: urlRaw?.length || 0,
      value: urlRaw || 'null',
      firstTenChars: urlRaw?.substring(0, 10) || 'empty',
      startsWithHttps: urlRaw?.startsWith('https://') || false
    },
    key: {
      exists: typeof keyRaw !== 'undefined',
      isString: typeof keyRaw === 'string',
      length: keyRaw?.length || 0,
      firstFiveChars: keyRaw?.substring(0, 5) || 'empty'
    },
    allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC'))
  });
};
