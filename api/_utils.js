const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
};

const env = () => ({
  supabaseUrl: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminPassword: process.env.ADMIN_PASSWORD,
  whatsapp: process.env.WHATSAPP_NUMBER || "09162902223",
  email: process.env.INQUIRY_EMAIL || "primecreative66@gmail.com",
  publicSiteUrl: process.env.PUBLIC_SITE_URL || "",
});

const requireSupabase = () => {
  const config = env();
  if (!config.supabaseUrl || !config.serviceKey) throw new Error("Supabase env vars are missing");
  return config;
};

const requireAdmin = (req) => {
  const { adminPassword } = env();
  if (!adminPassword) throw new Error("ADMIN_PASSWORD is not configured");
  if (req.headers["x-admin-password"] !== adminPassword) {
    const error = new Error("Admin password required");
    error.status = 401;
    throw error;
  }
};

const supabaseFetch = async (path, options = {}) => {
  const { supabaseUrl, serviceKey } = requireSupabase();
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Supabase request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

const getCmsValue = async (key, fallback) => {
  const rows = await supabaseFetch(`/rest/v1/cms?key=eq.${encodeURIComponent(key)}&select=value`);
  return rows?.[0]?.value ?? fallback;
};

const setCmsValue = async (key, value) => {
  const rows = await supabaseFetch("/rest/v1/cms?on_conflict=key", {
    method: "POST",
    body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }]),
  });
  return rows?.[0]?.value ?? value;
};

const handleError = (res, error) => json(res, error.status || 500, { error: error.message || "Server error" });

module.exports = { json, readBody, env, requireAdmin, supabaseFetch, getCmsValue, setCmsValue, handleError };
