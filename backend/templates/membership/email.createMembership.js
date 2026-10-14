import ucfirst from "../../utils/ucfirst.js";

export function emailmembershipActivated(client, membership) {

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return `
  <div style="
      font-family: Arial, sans-serif;
      background-color:#f4f6f9;
      padding:30px;
  ">
    <div style="
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border-radius:12px;
        padding:30px;
        box-shadow:0 4px 12px rgba(0,0,0,0.08);
    ">
      <h2 style="margin-top:0;color:#2c3e50;">
        🎉 membership Activated
      </h2>

      <p style="color:#333;font-size:14px;">
        Hello <b>${ucfirst(client.first_name)}</b>,
      </p>

      <p style="color:#333;font-size:14px;">
        Congratulations! Your membership is now <b>Active</b>.
      </p>

      <div style="
          background:#f8f9fc;
          border:1px solid #e3e6f0;
          border-radius:8px;
          padding:18px;
          margin:20px 0;
      ">

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Membership Fee:</b> ${formatCurrency(membership.membership_fee)}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Duration:</b> ${membership.duration} 
          (${membership.duration_days} days)
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>Start Date:</b> ${formatDate(membership.start_date)}
        </p>

        <p style="margin:0 0 8px 0;font-size:14px;">
          <b>End Date:</b> ${formatDate(membership.end_date)}
        </p>

        <p style="margin:0;font-size:14px;">
          <b>Status:</b> Active
        </p>
      </div>

      <p style="color:#333;font-size:14px;">
        We’re excited to support your fitness journey 💪
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

      <p style="font-size:12px;color:#888;margin:0;">
        — 6Pack Iron City Fitness System
      </p>
    </div>
  </div>
  `;
}
