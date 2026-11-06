"use strict";

const base = "https://staging.tiseasa.com/ar/admin";
const glyphs = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  menu: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  projects: '<path d="M3 21h18M6 21V7l8-4v18m0-12h4v12M9 10v1m0 3v1"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  units: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M4 12h16"/>',
  contacts: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  qr: '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 14v3h3v4m3-7v3m-7 4h1"/>',
  stats: '<path d="M3 3v18h18M8 16v-4m5 4V8m5 8V5"/>',
  promotion: '<path d="m4 10 15-5v14L4 15zM8 16l2 5h3l-1-4M22 9v6"/>',
  content: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
  external: '<path d="M13 4h7v7m0-7-9 9m7 0v7H4V6h7"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  settings: '<circle cx="12" cy="12" r="4"/><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/>',
};
function icon(name, extra = "") {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;
}

const pages = {
  home: {title:"نظرة عامة", icon:"home", path:""},
  projects: {title:"إدارة المشاريع", icon:"projects", path:"/projects", description:"استعرض المشاريع وافتح سجلاتها لإدارة بياناتها وظهورها في الموقع.", sections:{"قائمة المشاريع":["عرض المشاريع المسجلة","تعديل بيانات المشاريع وصورها وملفاتها"],"إضافة مشروع":["افتح قسم إضافة مشروع جديد لإدخال بياناته."]}},
  add: {title:"إضافة مشروع جديد", icon:"add", path:"/projects/new", description:"حقول النموذج الحالي لإضافة مشروع إلى موقع الزاملية.", sections:{"البيانات الأساسية":["اسم المشروع والمحتوى بالعربية والإنجليزية","رابط البث المباشر والنبذة المختصرة باللغتين"],"المدينة والحالة":["المدينة، حالة العقار، حالة المشروع، إتاحة العرض والموقع"],"الميزات والضمانات":["ضمان الكهرباء والإضاءة والمصاعد والبناء","التبريد والتكييف والصرف الصحي والعزل الصوتي","الدخول الذكي ونظام استشعار الحرائق"],"الروابط والموقع":["عرض ثلاثي الأبعاد، مراحل البناء، إحداثيات الموقع","نوع المشروع ورابط الموقع والخريطة"],"تفاصيل العرض":["سنة الإنشاء والمساحة وعدد المباني والوحدات والمصاعد","الظهور في الصفحة الرئيسية وترتيب العرض"],"الصور والملفات":["الصورة الرئيسية ومعرض يصل إلى خمس صور","ثلاثة ملفات بعناوين عربية وإنجليزية وفيديو اختياري"]}},
  units: {title:"إدارة الشقق والمباني", icon:"units", path:"/apartments", description:"انتقل إلى إدارة الشقق والوحدات في لوحة الزاملية.", sections:{"إدارة الشقق والوحدات":["عرض بيانات الشقق والوحدات في اللوحة الحالية"]}},
  contacts: {title:"طلبات التواصل", icon:"contacts", path:"/contacts", description:"الوصول إلى الطلبات الواردة عبر نماذج التواصل في الموقع.", columns:["#","الاسم","البريد","الهاتف","الحالة","التاريخ"]},
  qr: {title:"طلبات QR Code", icon:"qr", path:"/qrcode-leads", description:"متابعة الطلبات الواردة عبر رمز QR.", columns:["#","الاسم","الهاتف","التواصل","المشاريع","الحالة","التاريخ"], filters:["الكل","جديد","تم التواصل","مغلق"]},
  stats: {title:"إحصائيات الموقع", icon:"stats", path:"/statistics", description:"حركة الزيارات الشهرية ومقارنة زوار السعودية بإجمالي زوار الموقع.", sections:{"تقارير اللوحة الحالية":["الزوار الشهريون ومقارنة الزوار","الصفحات والمشاريع والدول الأكثر زيارة","فلاتر كل الأوقات وهذا الشهر"]}},
  promotion: {title:"ترويج للموقع", icon:"promotion", path:"/promotion", description:"الوصول إلى محتوى الترويج للموقع وإرشاداته.", sections:{"تحسين محركات البحث":[],"وسائل التواصل الاجتماعي":[],"واتساب":[],"نصائح للترويج":[]}},
  content: {title:"سياسات وخصوصية", icon:"content", path:"/content", description:"إدارة نصوص سياسة الخصوصية وشروط الاستخدام باللغتين.", sections:{"سياسة الخصوصية":["العنوان بالعربية والإنجليزية","محرر المحتوى بالعربية والإنجليزية"],"شروط الاستخدام":["العنوان بالعربية والإنجليزية","محرر المحتوى بالعربية والإنجليزية"]}},
};
const groups = [
  ["العقارات", "projects", ["projects", "add", "units"]],
  ["التواصل", "contacts", ["contacts", "qr"]],
  ["الموقع والإعدادات", "settings", ["stats", "promotion", "content"]],
];
const nav = document.querySelector("#navigation");
const main = document.querySelector("main");
const toggle = document.querySelector("#toggle");
const scrim = document.querySelector("#scrim");
const narrow = matchMedia("(max-width:760px)");
let compact = false;
let drawer = false;
try { compact = localStorage.getItem("alzamiliah-sidebar") === "compact"; } catch {}
function updateMenu() {
  document.body.classList.toggle("compact", compact && !narrow.matches);
  document.body.classList.toggle("menu-open", drawer && narrow.matches);
  const expanded = narrow.matches ? drawer : !compact;
  toggle.setAttribute("aria-expanded", expanded);
  toggle.setAttribute("aria-label", expanded ? "طي القائمة الجانبية" : "فتح القائمة الجانبية");
  scrim.hidden = !drawer || !narrow.matches;
}
function closeDrawer() {
  drawer = false;
  updateMenu();
}
function toggleMenu() {
  if (narrow.matches) drawer = !drawer;
  else {
    compact = !compact;
    try { localStorage.setItem("alzamiliah-sidebar", compact ? "compact" : "full"); } catch {}
  }
  updateMenu();
}
function navLink(key) {
  const {title, icon: name} = pages[key];
  return `<a class="nav-link" href="#${key}" title="${title}" aria-label="${title}">${icon(name)}<span>${title}</span></a>`;
}
nav.innerHTML = navLink("home") + groups.map(([title, name, keys]) =>
  `<details open><summary title="${title}" aria-label="${title}">${icon(name)}<span>${title}</span>${icon("chevron","chevron")}</summary><div class="children">${keys.map(navLink).join("")}</div></details>`
).join("");
nav.querySelectorAll("summary").forEach(summary => summary.addEventListener("click", event => {
  if (!narrow.matches && compact) {
    event.preventDefault();
    toggleMenu();
    summary.parentElement.open = true;
  }
}));
toggle.innerHTML = icon("menu");
document.querySelector("#site").insertAdjacentHTML("beforeend", icon("external"));
toggle.addEventListener("click", toggleMenu);
scrim.addEventListener("click", () => { closeDrawer(); toggle.focus(); });
narrow.addEventListener("change", closeDrawer);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && drawer) { closeDrawer(); toggle.focus(); }
});
updateMenu();

const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const all = [0,0,0,0,0,0,0,0,0,1649,575,0];
const saudi = [0,0,0,0,0,0,0,0,0,1416,433,0];
const number = new Intl.NumberFormat("en-US");
const series = [
  ["جميع الزوار", "#a77d20", all],
  ["زوار السعودية", "#487e68", saudi],
];
function chart() {
  const bottom = 196;
  const x = i => 51 + i * 46;
  const y = value => bottom - value / 1800 * 175;
  return `<section class="panel" aria-labelledby="chart-title">
    <div class="panel-heading"><div><h2 id="chart-title">إحصائيات الزوار</h2><p class="subtle">الزيارات الشهرية من اللوحة الحالية</p></div><span class="year">2026</span></div>
    <div class="legend">${series.map(([label,color], index) => `<button type="button" aria-pressed="true" data-series="${index}"><span class="swatch" style="--series:${color}"></span>${label}</button>`).join("")}</div>
    <svg class="chart" viewBox="0 0 590 226" role="group" aria-label="مخطط زيارات عام 2026" direction="ltr">
      ${[0,450,900,1350,1800].map(value => `<text x="39" y="${y(value)+4}" text-anchor="end">${number.format(value)}</text><path class="gridline" d="M49 ${y(value)}H570"/>`).join("")}
      ${months.map((month,i) => `<text x="${x(i)}" y="216" text-anchor="middle">${month}</text>`).join("")}
      ${series.map(([label,color,values], index) => {
        const points = values.map((value,i) => `${x(i)},${y(value)}`).join(" ");
        return `<g data-plot="${index}"><polygon points="${x(0)},${bottom} ${points} ${x(11)},${bottom}" fill="${color}" opacity=".10"/>
          <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
          ${values.map((value,i) => `<circle cx="${x(i)}" cy="${y(value)}" r="${value ? 4 : 2.2}" fill="${color}" ${value ? 'tabindex="0"' : ""} aria-label="${months[i]}، ${label}، ${number.format(value)}"><title>${months[i]} · ${label} · ${number.format(value)}</title></circle>`).join("")}
        </g>`;
      }).join("")}
    </svg>
    <p class="subtle">لقطة 6 نوفمبر 2026</p>
  </section>`;
}
function external(page, label, variant = "") {
  return `<a class="button ${variant}" href="${base + page.path}" target="_blank" rel="noopener">${label}${icon("external")}</a>`;
}
function home() {
  const metrics = [
    ["projects","عدد المشاريع",9],["contacts","طلبات التواصل",93],
    ["units","استفسارات الوحدات",0],["stats","إجمالي الزوار (2026)",2224],
  ];
  const shortcuts = [
    ["add","بيانات وصور وملفات المشروع"],["projects","استعراض المشاريع وتعديلها"],
    ["contacts","متابعة الطلبات الواردة"],["content","سياسة الخصوصية وشروط الاستخدام"],
  ];
  return `<section class="hero"><div><div class="kicker"><span class="status-dot"></span> الزاملية للتطوير والاستثمار العقاري</div>
    <h1>لوحة التحكم</h1><p>نظرة عامة على المشاريع وطلبات التواصل وزيارات الموقع.</p></div>
    <a class="button primary" href="#add">${icon("add")}إضافة مشروع جديد</a>
  </section>
  <section class="metrics" aria-label="المؤشرات الرئيسية">${metrics.map(([key,label,value]) =>
    `<a class="metric" href="#${key}"><div class="metric-top"><span class="tile-icon">${icon(pages[key].icon)}</span>${icon("arrow")}</div><strong>${number.format(value)}</strong><p>${label}</p></a>`
  ).join("")}</section>
  <div class="overview-grid">${chart()}<section class="panel"><h2>وصول سريع</h2><p class="subtle">الأقسام الأكثر استخدامًا</p>
    <div class="quick">${shortcuts.map(([key,desc]) => `<a href="#${key}"><span class="tile-icon">${icon(pages[key].icon)}</span><span><strong>${pages[key].title}</strong><small>${desc}</small></span>${icon("arrow")}</a>`).join("")}</div>
  </section></div>`;
}
function table(columns, rows, label) {
  return `<div class="table-wrap"><table aria-label="${label}"><thead><tr>${columns.map(col => `<th scope="col">${col}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function pageView(key) {
  const page = pages[key];
  const panels = Object.entries(page.sections || {}).map(([heading, items]) =>
    `<section class="panel"><h2>${heading}</h2>${items.length ? `<ul class="section-list">${items.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}</section>`
  ).join("");
  const records = page.columns ? `<section class="panel"><h2>جدول الطلبات</h2>${page.filters ? `<p class="subtle">الحالات المتاحة · ${page.filters.join("، ")}</p>` : ""}
    ${table(page.columns, [], page.title)}<p class="subtle">تُعرض السجلات في اللوحة الحالية.</p></section>` : "";
  const analytics = key === "stats" ? `<div class="overview-grid">${chart()}<section class="panel"><h2>الزيارات حسب الشهر</h2>${table(["الشهر","جميع الزوار","زوار السعودية"], months.map((month,i) => [month,number.format(all[i]),number.format(saudi[i])]), "الزيارات حسب الشهر")}</section></div>` : "";
  return `<section class="hero"><div><div class="kicker">${icon(page.icon)} مساحة الإدارة</div>
    <h1>${page.title}</h1><p>${page.description}</p></div>${external(page,"فتح في اللوحة الحالية","primary")}</section>
    <div class="page-content">${analytics}${records}${panels ? `<div class="section-grid">${panels}</div>` : ""}</div>`;
}
function render(moveFocus = false) {
  const hash = location.hash.slice(1);
  const key = Object.hasOwn(pages, hash) ? hash : "home";
  document.title = `الزاملية | ${pages[key].title}`;
  document.querySelector("#crumb").textContent = pages[key].title;
  nav.querySelectorAll(".nav-link").forEach(link => {
    const active = link.getAttribute("href") === `#${key}`;
    if (active) {
      link.setAttribute("aria-current", "page");
      const group = link.closest("details");
      if (group) group.open = true;
    } else link.removeAttribute("aria-current");
  });
  main.innerHTML = key === "home" ? home() : pageView(key);
  closeDrawer();
  if (moveFocus) {
    main.focus({preventScroll:true});
    window.scrollTo(0,0);
  }
}
document.querySelector(".skip").addEventListener("click", event => {
  event.preventDefault();
  main.focus();
});
nav.addEventListener("click", event => {
  if (event.target.closest("a")?.getAttribute("href") === location.hash && drawer) {
    closeDrawer();
    main.focus();
  }
});
main.addEventListener("click", event => {
  const button = event.target.closest("[data-series]");
  if (!button) return;
  const active = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", String(!active));
  main.querySelector(`[data-plot="${button.dataset.series}"]`).style.display = active ? "none" : "";
});
window.addEventListener("hashchange", () => render(true));
render();
