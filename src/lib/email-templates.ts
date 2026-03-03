const RTL = "direction: rtl; text-align: right;";
const STYLES = {
  wrapper: `font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 24px; margin: 0; ${RTL}`,
  card: "max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);",
  header: `background: #000000; color: #ffffff; padding: 24px; text-align: center; ${RTL}`,
  logo: "font-size: 24px; font-weight: 700; letter-spacing: 0.5px;",
  body: `padding: 32px 24px; color: #1a1a1a; line-height: 1.6; ${RTL}`,
  title: `font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #000000; ${RTL}`,
  text: `font-size: 15px; margin: 0 0 12px; color: #333333; ${RTL}`,
  table: `width: 100%; border-collapse: collapse; margin: 20px 0; direction: rtl;`,
  th: "background: #f8f8f8; padding: 12px 16px; text-align: right; font-weight: 600; font-size: 13px; color: #000000; border-bottom: 1px solid #e5e5e5;",
  td: "padding: 12px 16px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #333333; text-align: right;",
  footer: `padding: 20px 24px; background: #f8f8f8; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666666; text-align: center; ${RTL}`,
};

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>body,div,table,td,th,p{direction:rtl;text-align:right;}</style>
</head>
<body dir="rtl" style="${STYLES.wrapper}">
  <div dir="rtl" style="${STYLES.card}">
    <div dir="rtl" style="${STYLES.header}">
      <span style="${STYLES.logo}">iPalsam</span>
    </div>
    ${content}
  </div>
</body>
</html>`;
}

export function newRequestEmail(options: {
  recipientName: string;
  departmentName: string;
  items: { name: string; quantity: number; notes?: string | null }[];
  recipientRole: "requester" | "approver";
  notes?: string | null;
}) {
  const { recipientName, departmentName, items, recipientRole, notes } = options;
  const isRequester = recipientRole === "requester";

  const itemsRows = items
    .map(
      (i) =>
        `<tr>
          <td style="${STYLES.td}">${i.name}</td>
          <td style="${STYLES.td}">${i.quantity}</td>
          <td style="${STYLES.td}">${i.notes?.trim() || "-"}</td>
        </tr>`
    )
    .join("");

  const bodyContent = `
    <div dir="rtl" style="${STYLES.body}">
      <p style="${STYLES.title}">שלום ${recipientName},</p>
      <p style="${STYLES.text}">
        ${isRequester ? "הבקשה שלך הוגשה בהצלחה." : "התקבלה בקשה חדשה להשאלת ציוד."}
      </p>
      <p style="${STYLES.text}">מחלקה: <strong>${departmentName}</strong></p>
      <table dir="rtl" style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">פריט</th>
            <th style="${STYLES.th}">כמות</th>
            <th style="${STYLES.th}">הערות</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      ${notes?.trim() ? `<p style="${STYLES.text}"><strong>הערות כלליות:</strong> ${notes.trim()}</p>` : ""}
      <p style="${STYLES.text}">
        ${isRequester ? "תוכל לעקוב אחר סטטוס הבקשה בדשבורד." : "נא לאשר או לדחות את הבקשה במערכת."}
      </p>
    </div>
    <div dir="rtl" style="${STYLES.footer}">
      iPalsam – ניהול ציוד בבסיס צבאי
    </div>`;

  return baseTemplate(bodyContent);
}

export function newOpenRequestEmail(options: {
  recipientName: string;
  departmentName: string;
  items: { name: string; quantity: number; notes?: string | null }[];
  recipientRole: "requester" | "approver";
  source?: "dashboard" | "public_store";
}) {
  const { recipientName, departmentName, items, recipientRole } = options;
  const isRequester = recipientRole === "requester";

  const itemsRows = items
    .map(
      (i) =>
        `<tr>
          <td style="${STYLES.td}">${i.name}</td>
          <td style="${STYLES.td}">${i.quantity}</td>
          <td style="${STYLES.td}">${i.notes?.trim() || "-"}</td>
        </tr>`
    )
    .join("");

  const bodyContent = `
    <div dir="rtl" style="${STYLES.body}">
      <p style="${STYLES.title}">שלום ${recipientName},</p>
      <p style="${STYLES.text}">
        ${isRequester ? "בקשת הציוד שלך הוגשה בהצלחה." : "התקבלה בקשה פתוחה חדשה (בקשה מספק)."}
      </p>
      <p style="${STYLES.text}">מחלקה: <strong>${departmentName}</strong></p>
      <table dir="rtl" style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">פריט</th>
            <th style="${STYLES.th}">כמות</th>
            <th style="${STYLES.th}">הערות</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <p style="${STYLES.text}">
        ${isRequester ? "תוכל לעקוב אחר סטטוס הבקשה בדשבורד." : "נא לאשר או לדחות כל פריט במערכת."}
      </p>
    </div>
    <div dir="rtl" style="${STYLES.footer}">
      iPalsam – ניהול ציוד בבסיס צבאי
    </div>`;

  return baseTemplate(bodyContent);
}

export function requestApprovedEmail(options: {
  recipientName: string;
  departmentName: string;
  items: { name: string; quantity: number; notes?: string | null }[];
  approverNotes?: string | null;
}) {
  const { recipientName, departmentName, items, approverNotes } = options;

  const itemsRows = items
    .map(
      (i) =>
        `<tr>
          <td style="${STYLES.td}">${i.name}</td>
          <td style="${STYLES.td}">${i.quantity}</td>
          <td style="${STYLES.td}">${i.notes?.trim() || "-"}</td>
        </tr>`
    )
    .join("");

  const bodyContent = `
    <div dir="rtl" style="${STYLES.body}">
      <p style="${STYLES.title}">שלום ${recipientName},</p>
      <p style="${STYLES.text}">
        הבקשה שלך להשאלת ציוד <strong>אושרה</strong>.
      </p>
      <p style="${STYLES.text}">מחלקה: <strong>${departmentName}</strong></p>
      <table dir="rtl" style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">פריט</th>
            <th style="${STYLES.th}">כמות</th>
            <th style="${STYLES.th}">הערות</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      ${approverNotes?.trim() ? `<p style="${STYLES.text}"><strong>הערות מהמאשר:</strong> ${approverNotes.trim()}</p>` : ""}
      <p style="${STYLES.text}">ניתן לאסוף את הציוד בהתאם להנחיות המחלקה.</p>
    </div>
    <div dir="rtl" style="${STYLES.footer}">
      iPalsam – ניהול ציוד בבסיס צבאי
    </div>`;

  return baseTemplate(bodyContent);
}

export function requestRejectedEmail(options: {
  recipientName: string;
  departmentName: string;
  items: { name: string; quantity: number; notes?: string | null }[];
  rejectionReason: string;
  approverNotes?: string | null;
}) {
  const { recipientName, departmentName, items, rejectionReason, approverNotes } = options;

  const itemsRows = items
    .map(
      (i) =>
        `<tr>
          <td style="${STYLES.td}">${i.name}</td>
          <td style="${STYLES.td}">${i.quantity}</td>
          <td style="${STYLES.td}">${i.notes?.trim() || "-"}</td>
        </tr>`
    )
    .join("");

  const bodyContent = `
    <div dir="rtl" style="${STYLES.body}">
      <p style="${STYLES.title}">שלום ${recipientName},</p>
      <p style="${STYLES.text}">
        הבקשה שלך להשאלת ציוד <strong>נדחתה</strong>.
      </p>
      <p style="${STYLES.text}">מחלקה: <strong>${departmentName}</strong></p>
      <table dir="rtl" style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">פריט</th>
            <th style="${STYLES.th}">כמות</th>
            <th style="${STYLES.th}">הערות</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <p style="${STYLES.text}"><strong>סיבת הדחייה:</strong> ${rejectionReason.trim()}</p>
      ${approverNotes?.trim() ? `<p style="${STYLES.text}"><strong>הערות נוספות:</strong> ${approverNotes.trim()}</p>` : ""}
      <p style="${STYLES.text}">ניתן לפנות למחלקה לפרטים נוספים.</p>
    </div>
    <div dir="rtl" style="${STYLES.footer}">
      iPalsam – ניהול ציוד בבסיס צבאי
    </div>`;

  return baseTemplate(bodyContent);
}
