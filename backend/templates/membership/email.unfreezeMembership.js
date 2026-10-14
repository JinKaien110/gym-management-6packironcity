import ucfirst from "../../utils/ucfirst.js";

export function membershipUnfrozenEmail(data) {

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  return `
  <div style="font-family:Arial;background:#f4f6f9;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color:#27ae60;margin-top:0;">🔥 membership Unfrozen</h2>

      <p>Hello <b>${ucfirst(data.first_name)} ${ucfirst(data.last_name)}</b>,</p>

      <p>Great news! Your membership has been unfrozen and is now <b>active</b> again.</p>

      <div style="background:#e8f8f5;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Originally Frozen From:</b> ${formatDate(data.frozen_from)}</p>
        <p><b>Originally Frozen Until:</b> ${formatDate(data.frozen_til)}</p>
        <p><b>Unfrozen On:</b> ${formatDate(data.unfrozen_at)}</p>
        <p><b>Processed By:</b> ${data.unfrozenBy}</p>
        <p><b>New End Date:</b> ${data.new_end_date}</p>
      </div>

      <p>Your membership is now fully active! You can enjoy all the benefits of your plan.</p>

      <hr style="margin:25px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;">— 6Pack Iron City Gym</p>

    </div>
  </div>
  `;
}
