import { supabase } from "./supabaseClient.js";

// الحصول على الـ pid من الرابط
const pid = new URLSearchParams(window.location.search).get("pid");

// عناصر DOM
const titleEl = document.getElementById("projectTitle");
const shortEl = document.getElementById("projectShort");
const fullEl = document.getElementById("projectFull");
const galleryEl = document.getElementById("projectGallery");
const backBtn = document.getElementById("backBtn");

// -----------------------------------------
// تحميل بيانات المشروع
// -----------------------------------------
async function loadProject() {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", pid)
    .single();

  if (error || !project) {
    titleEl.textContent = "حدث خطأ أثناء تحميل المشروع";
    console.error(error);
    return;
  }

  titleEl.textContent = project.title;
  shortEl.textContent = project.short_description;
  fullEl.textContent = project.full_description;

  // تعيين رابط العودة حسب نوع الخدمة
  const serviceLink = {
    video: "video-editing.html",
    graphic: "graphic-design.html",
    ai: "ai-apps.html",
    modeling: "3d-modeling.html",
  }[project.service_type];

  if (serviceLink) backBtn.href = serviceLink;

  loadGallery();
}

// -----------------------------------------
// تحميل ملفات المشروع (صور + فيديو)
// -----------------------------------------
async function loadGallery() {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) {
    galleryEl.innerHTML = "<p>حدث خطأ أثناء تحميل الملفات.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    galleryEl.innerHTML = "<p>لا توجد ملفات.</p>";
    return;
  }

  galleryEl.innerHTML = "";

  data.forEach((file) => {
    const box = document.createElement("div");
    box.className = "gallery-item";

    if (file.file_type === "video") {
      box.innerHTML = `
        <video controls>
          <source src="${file.file_url}" type="video/mp4">
        </video>`;
    } else {
      box.innerHTML = `<img src="${file.file_url}" alt="project media" />`;
    }

    galleryEl.appendChild(box);
  });
}

// تشغيل
loadProject();
