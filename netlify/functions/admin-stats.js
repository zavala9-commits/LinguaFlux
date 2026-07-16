const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autenticado' }) };
  }

  const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Token inválido' }) };
  }

  // A partir de aquí usamos service role, pero ya verificamos quién es el usuario.
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.is_admin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: activeSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: lessonsDone } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true });

  return {
    statusCode: 200,
    body: JSON.stringify({
      totalUsers: totalUsers || 0,
      activeSubs: activeSubs || 0,
      lessonsDone: lessonsDone || 0,
    }),
  };
};
