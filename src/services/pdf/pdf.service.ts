import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { MonthlyTourEntry, MonthlyTourProgramme } from "../../Features/monthlyTourProgramme/types/monthlyTourProgramme.types";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\r?\n/g, "<br />");
}

function displayValue(value: unknown, fallback = "-"): string {
  const text = String(value ?? "").trim();
  return escapeHtml(text || fallback);
}

function page(title: string, subtitle: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @page { margin: 28px 24px; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #18212B; margin: 0; font-size: 12px; }
  .header { border-bottom: 2px solid #1D9C6E; padding-bottom: 12px; margin-bottom: 18px; }
  .brand { color: #1D9C6E; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  h1 { margin: 5px 0 0; font-size: 22px; color: #101418; }
  .subtitle { margin-top: 4px; color: #6B7280; font-size: 11px; }
  .section { margin: 0 0 14px; padding: 14px; border: 1px solid #E3E9EF; border-radius: 10px; page-break-inside: avoid; }
  .section-title { margin: 0 0 12px; font-size: 10px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: #315043; }
  .grid { display: table; width: 100%; table-layout: fixed; }
  .grid-row { display: table-row; }
  .cell { display: table-cell; width: 50%; padding: 0 18px 12px 0; vertical-align: top; }
  .cell.last { padding-right: 0; }
  .label { color: #7B8794; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; margin-bottom: 4px; }
  .value { color: #17212B; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
  .full { width: 100%; display: block; padding: 0; }
  .field { padding: 9px 0; border-top: 1px solid #EEF1F6; }
  .field:first-child { border-top: 0; padding-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 2px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { text-align: left; background: #F3F7F5; color: #315043; padding: 8px; border-bottom: 1px solid #DCE8E1; font-size: 9px; text-transform: uppercase; }
  td { padding: 8px; border-bottom: 1px solid #EEF1F6; vertical-align: top; line-height: 1.45; overflow-wrap: anywhere; word-break: break-word; }
  .table-small td, .table-small th { font-size: 8.5px; }
  .sub-label { color: #7B8794; font-size: 8px; text-transform: uppercase; letter-spacing: .4px; font-weight: 700; margin-bottom: 2px; }
  .stack + .stack { margin-top: 8px; padding-top: 8px; border-top: 1px solid #EEF1F6; }
  .muted { color: #7B8794; }
  .record-head { display:flex; justify-content:space-between; padding-bottom:9px; margin-bottom:12px; border-bottom:1px solid #E3E9EF; color:#315043; font-size:10px; font-weight:700; }
  .record { page-break-inside: auto; }
  .footer { color: #8A8F98; font-size: 9px; margin-top: 18px; text-align: center; }
</style>
</head>
<body>
<div class="header"><div class="brand">Vetronix</div><h1>${escapeHtml(title)}</h1><div class="subtitle">${escapeHtml(subtitle)}</div></div>
${body}
<div class="footer">Generated from the Vetronix Employee App</div>
</body>
</html>`;
}

async function createAndSharePdf(html: string, dialogTitle: string) {
  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    // PDF generation has still completed; open the native print UI as a fallback.
    await Print.printAsync({ html });
    return uri;
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: ".pdf",
    dialogTitle,
  });

  return uri;
}

export async function generateMonthlyTourProgrammePdf(params: {
  employeeName: string;
  programme: MonthlyTourProgramme | null;
  entries: MonthlyTourEntry[];
}) {
  const { employeeName, programme, entries } = params;
  const rows = entries.map((entry, index) => `<tr>
    <td>${index + 1}</td>
    <td>${escapeHtml(entry.tour_date)}</td>
    <td>${escapeHtml(entry.hq_ex_tour)}</td>
    <td>${escapeHtml(entry.route_plan_details)}</td>
    <td>${escapeHtml(entry.travel_mode)}</td>
    <td>${escapeHtml(entry.total_km)}</td>
    <td>${escapeHtml(entry.route_no)}</td>
    <td>${escapeHtml(entry.note)}</td>
  </tr>`).join("");

  const body = `
  <div class="section"><div class="grid">
    <div class="cell"><div class="label">Employee</div><div class="value">${escapeHtml(employeeName)}</div></div>
    <div class="cell"><div class="label">Programme</div><div class="value">${escapeHtml(programme ? `${programme.month}/${programme.year}` : "Current Month")}</div></div>
    <div class="cell"><div class="label">Status</div><div class="value">${escapeHtml(programme?.status ?? "draft")}</div></div>
    <div class="cell"><div class="label">Total Entries</div><div class="value">${entries.length}</div></div>
  </div></div>
  <div class="section"><table><thead><tr>
    <th>#</th><th>Date</th><th>Type</th><th>Route</th><th>Mode</th><th>KM</th><th>Route No</th><th>Note</th>
  </tr></thead><tbody>${rows || '<tr><td colspan="8">No tour entries.</td></tr>'}</tbody></table></div>`;

  return createAndSharePdf(
    page("Monthly Tour Programme", "Employee tour plan", body),
    "Share Monthly Tour Programme PDF",
  );
}

type VisitPdfParams = {
  employeeName: string;
  partyLabel: string;
  partyName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  products: string[];
  nextFollowupDate: string;
  remarks?: string;
};

function generateVisitHtml(title: string, subtitle: string, params: VisitPdfParams) {
  const productText = params.products.length ? params.products.join(", ") : "None";
  const identity = `
    <div class="section">
      <div class="section-title">Visit Summary</div>
      <div class="grid">
        <div class="grid-row">
          <div class="cell"><div class="label">Employee</div><div class="value">${displayValue(params.employeeName)}</div></div>
          <div class="cell last"><div class="label">${escapeHtml(params.partyLabel)}</div><div class="value">${displayValue(params.partyName)}</div></div>
        </div>
        <div class="grid-row">
          <div class="cell"><div class="label">Visit Date</div><div class="value">${displayValue(params.visitDate)}</div></div>
          <div class="cell last"><div class="label">Visit Time</div><div class="value">${displayValue(params.visitTime)}</div></div>
        </div>
      </div>
    </div>`;

  const visitDetails = `
    <div class="section">
      <div class="section-title">Visit Details</div>
      <div class="field"><div class="label">Location</div><div class="value">${displayValue(params.location)}</div></div>
      <div class="field"><div class="label">Discussion</div><div class="value">${displayValue(params.discussion)}</div></div>
      <div class="field"><div class="label">Outcome</div><div class="value">${displayValue(params.outcome)}</div></div>
      <div class="field"><div class="label">Products Discussed</div><div class="value">${displayValue(productText)}</div></div>
      ${params.remarks !== undefined ? `<div class="field"><div class="label">Remarks</div><div class="value">${displayValue(params.remarks)}</div></div>` : ""}
    </div>`;

  const followup = `
    <div class="section">
      <div class="section-title">Follow-up</div>
      <div class="grid">
        <div class="grid-row">
          <div class="cell"><div class="label">Next Follow-up Date</div><div class="value">${displayValue(params.nextFollowupDate)}</div></div>
          <div class="cell last"><div class="label">Record Status</div><div class="value">Completed visit record</div></div>
        </div>
      </div>
    </div>`;

  return page(title, subtitle, identity + visitDetails + followup);
}


export type VisitPdfRecord = VisitPdfParams;

function generateVisitTableRows(records: VisitPdfParams[]) {
  return records.map((record, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${displayValue(record.visitDate)}</td>
      <td>${displayValue(record.visitTime)}</td>
      <td>${displayValue(record.partyName)}</td>
      <td>${displayValue(record.location)}</td>
      <td>${displayValue(record.discussion)}</td>
      <td>${displayValue(record.outcome)}</td>
      <td>${displayValue(record.products.length ? record.products.join(", ") : "None")}</td>
      <td>${displayValue(record.nextFollowupDate)}</td>
      ${record.partyLabel === "Doctor" ? `<td>${displayValue(record.remarks ?? "")}</td>` : ""}
    </tr>`).join("");
}

async function generateVisitCollectionPdf(
  title: string,
  subtitle: string,
  dialogTitle: string,
  employeeName: string,
  monthLabel: string,
  records: VisitPdfParams[],
) {
  const isDoctor = title === "Doctor Visits";
  const headers = isDoctor
    ? `<th>#</th><th>Visit Date</th><th>Visit Time</th><th>Doctor</th><th>Location</th><th>Discussion</th><th>Remarks</th><th>Products Discussed</th><th>Next Follow-up</th>`
    : `<th>#</th><th>Visit Date</th><th>Visit Time</th><th>${title.startsWith("Dealer") ? "Dealer" : "Farmer"}</th><th>Location</th><th>Discussion</th><th>Outcome</th><th>Next Follow-up</th>`;
  const rows = records.map((record, index) => {
    if (isDoctor) return `<tr><td>${index+1}</td><td>${displayValue(record.visitDate)}</td><td>${displayValue(record.visitTime)}</td><td>${displayValue(record.partyName)}</td><td>${displayValue(record.location)}</td><td>${displayValue(record.discussion)}</td><td>${displayValue(record.remarks ?? "")}</td><td>${displayValue(record.products.length ? record.products.join(", ") : "None")}</td><td>${displayValue(record.nextFollowupDate)}</td></tr>`;
    return `<tr><td>${index+1}</td><td>${displayValue(record.visitDate)}</td><td>${displayValue(record.visitTime)}</td><td>${displayValue(record.partyName)}</td><td>${displayValue(record.location)}</td><td>${displayValue(record.discussion)}</td><td>${displayValue(record.outcome)}</td><td>${displayValue(record.nextFollowupDate)}</td></tr>`;
  }).join("");
  const body = `
    <div class="section"><div class="grid">
      <div class="cell"><div class="label">Employee</div><div class="value">${displayValue(employeeName)}</div></div>
      <div class="cell last"><div class="label">Report Month</div><div class="value">${displayValue(monthLabel)}</div></div>
    </div><div class="field"><div class="label">Total Visits</div><div class="value">${records.length}</div></div></div>
    <div class="section"><table class="table-small"><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${isDoctor ? 9 : 8}">No visits recorded for this month.</td></tr>`}</tbody></table></div>`;
  return createAndSharePdf(page(title, subtitle, body), dialogTitle);
}

export async function generateDoctorVisitsPdf(params: {
  employeeName: string;
  monthLabel: string;
  records: VisitPdfParams[];
}) {
  return generateVisitCollectionPdf(
    "Doctor Visits",
    "Monthly doctor visit report",
    "Share Doctor Visits PDF",
    params.employeeName,
    params.monthLabel,
    params.records,
  );
}

export async function generateDealerVisitsPdf(params: {
  employeeName: string;
  monthLabel: string;
  records: VisitPdfParams[];
}) {
  return generateVisitCollectionPdf(
    "Dealer Visits",
    "Monthly dealer visit report",
    "Share Dealer Visits PDF",
    params.employeeName,
    params.monthLabel,
    params.records,
  );
}

export async function generateFarmerVisitsPdf(params: {
  employeeName: string;
  monthLabel: string;
  records: VisitPdfParams[];
}) {
  return generateVisitCollectionPdf(
    "Farmer Visits",
    "Monthly farmer visit report",
    "Share Farmer Visits PDF",
    params.employeeName,
    params.monthLabel,
    params.records,
  );
}

export async function generateDoctorVisitPdf(params: {
  employeeName: string;
  doctorName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  products: string[];
  nextFollowupDate: string;
  remarks?: string;
}) {
  return createAndSharePdf(
    generateVisitHtml("Doctor Visit", "Doctor field visit record", {
      ...params,
      partyLabel: "Doctor",
      partyName: params.doctorName,
    }),
    "Share Doctor Visit PDF",
  );
}

export async function generateDealerVisitPdf(params: {
  employeeName: string;
  dealerName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  products: string[];
  nextFollowupDate: string;
}) {
  return createAndSharePdf(
    generateVisitHtml("Dealer Visit", "Dealer field visit record", {
      ...params,
      partyLabel: "Dealer",
      partyName: params.dealerName,
    }),
    "Share Dealer Visit PDF",
  );
}

export async function generateFarmerVisitPdf(params: {
  employeeName: string;
  farmerName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  products: string[];
  nextFollowupDate: string;
}) {
  return createAndSharePdf(
    generateVisitHtml("Farmer Visit", "Farmer field visit record", {
      ...params,
      partyLabel: "Farmer",
      partyName: params.farmerName,
    }),
    "Share Farmer Visit PDF",
  );
}

export type FollowUpPdfRecord = {
  followUpDate: string;
  visitType: string;
  partyName: string;
  visitDate: string;
  visitTime: string;
  location: string;
  discussion: string;
  outcome: string;
  products: string[];
};

export async function generateFollowUpsPdf(params: { employeeName: string; monthLabel: string; records: FollowUpPdfRecord[] }) {
  const rows = params.records.map((r, i) => `<tr><td>${i+1}</td><td>${displayValue(r.followUpDate)}</td><td>${displayValue(r.visitType)}</td><td>${displayValue(r.partyName)}</td><td>${displayValue(r.visitDate)}</td><td>${displayValue(r.visitTime)}</td><td>${displayValue(r.location)}</td><td>${displayValue(r.discussion)}</td><td>${displayValue(r.outcome)}</td><td>${displayValue(r.products.length ? r.products.join(", ") : "None")}</td></tr>`).join("");
  const body = `<div class="section"><div class="grid"><div class="cell"><div class="label">Employee</div><div class="value">${displayValue(params.employeeName)}</div></div><div class="cell last"><div class="label">Report</div><div class="value">${displayValue(params.monthLabel)}</div></div></div><div class="field"><div class="label">Total Follow-ups</div><div class="value">${params.records.length}</div></div></div><div class="section"><table class="table-small"><thead><tr><th>#</th><th>Follow-up Date</th><th>Visit Type</th><th>Party</th><th>Original Visit Date</th><th>Visit Time</th><th>Location</th><th>Discussion</th><th>Outcome</th><th>Products Discussed</th></tr></thead><tbody>${rows || '<tr><td colspan="10">No upcoming follow-ups.</td></tr>'}</tbody></table></div>`;
  return createAndSharePdf(page("Follow-Up", "Upcoming employee follow-up meetings", body), "Share Follow-Up PDF");
}

export async function generateOrderDeliveryPdf(params: { employeeName: string; monthLabel: string; records: Array<{ orderDate:string; saleType:string; product:string; doctor:string; dealer:string; orderValue:number; quantity:number; rate:number; delivered:number; remaining:number; status:string; lastDeliveryDate:string; expectedDeliveryDate:string; remarks:string; }> }) {
  const rows = params.records.map((r,i)=>`<tr><td>${i+1}</td><td>${displayValue(r.orderDate)}</td><td>${displayValue(r.saleType)}</td><td>${displayValue(r.product)}</td><td>${displayValue(r.doctor)}</td><td>${displayValue(r.dealer)}</td><td>₹${Number(r.orderValue||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td>${displayValue(r.quantity,"0")}</td><td>₹${Number(r.rate||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td>₹${Number(r.delivered||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td>₹${Number(r.remaining||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td>${displayValue(r.status)}</td><td>${displayValue(r.lastDeliveryDate)}</td><td>${displayValue(r.expectedDeliveryDate)}</td><td>${displayValue(r.remarks)}</td></tr>`).join("");
  const body=`<div class="section"><div class="grid"><div class="cell"><div class="label">Employee</div><div class="value">${displayValue(params.employeeName)}</div></div><div class="cell last"><div class="label">Report Month</div><div class="value">${displayValue(params.monthLabel)}</div></div></div><div class="field"><div class="label">Total Orders</div><div class="value">${params.records.length}</div></div></div><div class="section"><table class="table-small"><thead><tr><th>#</th><th>Order Date</th><th>Sale Type</th><th>Product</th><th>Doctor</th><th>Dealer</th><th>Order Value</th><th>Quantity</th><th>Rate</th><th>Delivered Amount</th><th>Remaining Amount</th><th>Delivery Status</th><th>Last Delivery Date</th><th>Expected Delivery</th><th>Remarks</th></tr></thead><tbody>${rows||'<tr><td colspan="15">No order delivery records found.</td></tr>'}</tbody></table></div>`;
  return createAndSharePdf(page("Order Delivery Status", "Employee order delivery report", body), "Share Order Delivery Status PDF");
}


export type MonthlyMeetingPlanPdfRecord = {
  type: "Doctor" | "Dealer" | "Farmer";
  partyName: string;
  location: string;
  plannedDate: string;
  meetingDate: string;
  discussion: string;
  reply: string;
  note: string;
};

export async function generateMonthlyMeetingPlanPdf(params: {
  employeeName: string;
  monthLabel: string;
  records: MonthlyMeetingPlanPdfRecord[];
}) {
  const rows = params.records.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${displayValue(r.type)}</td>
      <td>${displayValue(r.partyName)}</td>
      <td>${displayValue(r.location)}</td>
      <td>${displayValue(r.plannedDate)}</td>
      <td>${displayValue(r.meetingDate)}</td>
      <td>${displayValue(r.discussion)}</td>
      <td>${displayValue(r.reply)}</td>
      <td>${displayValue(r.note)}</td>
    </tr>`).join("");

  const body = `
    <div class="section">
      <div class="grid">
        <div class="cell"><div class="label">Employee</div><div class="value">${displayValue(params.employeeName)}</div></div>
        <div class="cell last"><div class="label">Report Month</div><div class="value">${displayValue(params.monthLabel)}</div></div>
      </div>
      <div class="field"><div class="label">Total Plans</div><div class="value">${params.records.length}</div></div>
    </div>
    <div class="section">
      <table class="table-small">
        <thead><tr>
          <th>#</th><th>Type</th><th>Doctor / Dealer / Farmer</th><th>Location</th>
          <th>Planned Date</th><th>Meeting Date</th><th>Discussion</th><th>Reply</th><th>Note</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="9">No monthly meeting plans found.</td></tr>'}</tbody>
      </table>
    </div>`;

  return createAndSharePdf(
    page("Monthly Meeting Plan", "Employee monthly meeting plan report", body),
    "Share Monthly Meeting Plan PDF",
  );
}
