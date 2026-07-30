module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},9935,a=>{"use strict";let b=Error("Cannot find module 'idb'");throw b.code="MODULE_NOT_FOUND",b},13882,a=>{"use strict";a.i(8171);var b=a.i(27669);let c=(0,b.createContext)(null);a.s(["useAuth",0,function(){return(0,b.useContext)(c)}])},92639,a=>{"use strict";a.s(["buildPharmacyReceiptEmail",0,function({submission:a,pharmacy:b,receivedByName:c}){let d=`RSSB Reception Receipt ${a.receipt_number} - ${b.pharmacy_name}`,e=[`Dear ${b.contact_person||`${b.pharmacy_name} team`},`,"","This confirms that RSSB Pharmaceutical Invoices Verification Unit received your submission today.","",`Receipt No.: ${a.receipt_number}`,`Pharmacy: ${b.pharmacy_name} (${b.pharmacy_code})`,`District: ${b.district}`,`Vouchers submitted: ${a.voucher_count}`,null!=a.invoice_total_amount?`Invoice total: ${Number(a.invoice_total_amount).toLocaleString()} RWF`:null,`Received by: ${c||"-"}`,"","The signed reception receipt is attached to this email for your records.","","Kind regards,","RSSB Pharmaceutical Invoices Verification Unit"].filter(Boolean).join("\n");return{to:b.email||"",subject:d,body:e}},"buildSupervisorReportEmail",0,function({date:a,rows:b,totals:c}){return{to:"",subject:`Reception Report - ${a}`,body:`Dear Supervisor,

Please find attached the Pharmaceutical Invoices Verification Unit reception report for ${a}.

Summary:
- Submissions received: ${b.length}
- Total vouchers: ${c.vouchers}
- Total invoice amount: ${c.amount.toLocaleString()} RWF

The full breakdown by pharmacy is in the attached Excel report.

Kind regards,
RSSB Reception Desk`}},"openMailDraft",0,function({to:a="",cc:b="",subject:c="",body:d=""}){let e=new URLSearchParams;b&&e.set("cc",b),e.set("subject",c),e.set("body",d);let f=`mailto:${encodeURIComponent(a)}?${e.toString()}`;window.location.href=f}])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__09d611g._.js.map