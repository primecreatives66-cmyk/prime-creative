const { json, env, getCmsValue, supabaseFetch, handleError } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
    const config = env();
    const settings = await getCmsValue("settings", {});
    const services = await getCmsValue("services", []);
    const courses = await getCmsValue("courses", []);
    const bookings = await supabaseFetch("/rest/v1/bookings?select=*&order=created_at.desc&limit=200");
    const uploads = await supabaseFetch("/rest/v1/uploads?select=*&order=created_at.desc&limit=200");
    json(res, 200, {
      settings: {
        brandName: "Prime Creative",
        whatsapp: config.whatsapp,
        email: config.email,
        domain: config.publicSiteUrl,
        ...settings,
      },
      services,
      courses,
      bookings: bookings.map((item) => ({ ...item, createdAt: item.created_at })),
      uploads: uploads.map((item) => ({ ...item, createdAt: item.created_at })),
    });
  } catch (error) {
    handleError(res, error);
  }
};
