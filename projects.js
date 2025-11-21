import { supabase } from "./supabaseClient.js";

/* التقاط الـ DIV الصحيح */
const grid =
  document.getElementById("galleryGrid") ||
  document.getElementById("projectsGrid");

/* قراءة نوع الخدمة */
const service = document.body.dataset.service;

async function loadProjects() {
  if (!grid || !service) return;

  grid.innerHTML = `<p style="color:#bbb;">جاري التحميل...</p>`;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("service_type", service)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = "<p style='color:red;'>خطأ أثناء تحميل المشاريع.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = "<p style='color:#bbb;'>لا توجد مشاريع بعد.</p>";
    return;
  }

  grid.innerHTML = "";

  data.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img class="project-thumb" src="${p.thumbnail_url || "placeholder.jpg"}">
      <h3>${p.title}</h3>
      <p>${p.short_description}</p>
      <a class="btn-primary" href="project.html?pid=${p.id}">
        عرض المشروع ↗
      </a>
    `;

    grid.appendChild(card);
  });
}

loadProjects();
