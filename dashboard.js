import { supabase } from "./supabaseClient.js";

/* -------------------------------------
    عناصر DOM
--------------------------------------*/
const projectForm = document.getElementById("createProjectForm");
const projectList = document.getElementById("projectList");

const uploadArea = document.getElementById("uploadFilesForProject");
const fileInput = document.getElementById("fileInput");

const progressContainer = document.getElementById("uploadProgressContainer");
const progressBar = document.getElementById("uploadProgressBar");
const progressText = document.getElementById("uploadProgressText");

let currentProjectId = null;

/* -------------------------------------
   تحميل قائمة المشاريع
--------------------------------------*/
async function loadProjects() {
  projectList.innerHTML = `<p style="color:#bbb">جاري التحميل...</p>`;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    projectList.innerHTML = `<p style="color:red">فشل تحميل المشاريع</p>`;
    console.error(error);
    return;
  }

  projectList.innerHTML = "";

  data.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="project-header-block">
        ${
          p.thumbnail_url
            ? `<img class="thumb" src="${p.thumbnail_url}" alt="thumbnail">`
            : `<div class="no-thumb">No Thumbnail</div>`
        }
        <h3>${p.title}</h3>
        <p>${p.short_description}</p>
      </div>

      <div class="btn-row">
        <button class="btn-primary" onclick="editProject('${p.id}')">تعديل</button>
        <button class="btn-delete" onclick="deleteProject('${p.id}')">حذف المشروع</button>
      </div>

      <div class="btn-row">
        <button class="btn-secondary" onclick="selectProject('${p.id}')">رفع ملفات</button>
        <a class="btn-secondary" href="project.html?pid=${p.id}" target="_blank">عرض المشروع</a>
      </div>

      <div class="project-files-wrapper">
        <h4 class="files-title">ملفات المشروع</h4>
        <div id="files-${p.id}" class="project-files-grid"></div>
      </div>
    `;

    projectList.appendChild(card);

    loadProjectFiles(p.id);
  });
}


/* -------------------------------------
   تنظيف اسم الملف
--------------------------------------*/
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/_+/g, "_");
}

/* -------------------------------------
   رفع Thumbnail
--------------------------------------*/
async function uploadThumbnail(file, projectId) {
  const safeName = sanitizeFileName(file.name);
  const filePath = `${projectId}/thumbnail-${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("project_files")
    .upload(filePath, file);

  if (error) {
    console.error("Thumbnail upload failed:", error);
    return null;
  }

  const { data: url } = supabase.storage
    .from("project_files")
    .getPublicUrl(filePath);

  return url.publicUrl;
}

/* -------------------------------------
   رفع الملفات مع Progress Bar (FAKE PROGRESS)
--------------------------------------*/
async function uploadFileWithProgress(file, projectId) {
  // إظهار الكونتينر
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";

  // FAKE PROGRESS لأن Supabase ما بيدعم progress event
  let fake = 0;
  const fakeInterval = setInterval(() => {
    fake += 2;
    if (fake > 90) fake = 90;

    progressBar.style.width = fake + "%";
    progressText.textContent = fake + "%";
  }, 120);

  // تجهيز الاسم
  const safeName = sanitizeFileName(file.name);
  const filePath = `${projectId}/${Date.now()}-${safeName}`;

  // رفع الملف
  const { error } = await supabase.storage
    .from("project_files")
    .upload(filePath, file);

  // إيقاف الفيك بروجريس
  clearInterval(fakeInterval);

  if (error) {
    console.error(error);
    progressBar.style.width = "100%";
    progressBar.style.background = "red";
    progressText.textContent = "فشل الرفع";
    return null;
  }

  // إنهاء البروجريس
  progressBar.style.width = "100%";
  progressText.textContent = "100%";

  // إرجاع الرابط
  const { data: url } = supabase.storage
    .from("project_files")
    .getPublicUrl(filePath);

  return url.publicUrl;
}


/* -------------------------------------
   عند اختيار الملفات للرفع
--------------------------------------*/
fileInput.addEventListener("change", async (e) => {
  if (!currentProjectId) {
    alert("يجب اختيار مشروع أولاً");
    return;
  }

  const files = e.target.files;

  for (let file of files) {
    const url = await uploadFileWithProgress(file, currentProjectId);

    if (url) {
      await supabase.from("project_files").insert({
        project_id: currentProjectId,
        file_url: url,
        file_type: file.type.startsWith("video")
          ? "video"
          : file.type.startsWith("image")
          ? "image"
          : "other",
      });
    }
  }

  loadProjectFiles(currentProjectId);
});

/* -------------------------------------
   تحديد مشروع للرفع
--------------------------------------*/
window.selectProject = function (id) {
  currentProjectId = id;
  uploadArea.style.display = "block";
  fileInput.value = "";
};

/* -------------------------------------
   تحميل ملفات مشروع معين
--------------------------------------*/
async function loadProjectFiles(projectId) {
  const container = document.getElementById(`files-${projectId}`);
  if (!container) return;

  // نجهّز الكارد
  container.innerHTML = `
    <div class="project-files-card">
      <h4 style="margin:0 0 10px 0; color:#7cc;">ملفات المشروع</h4>
      <div class="project-files-grid" id="grid-${projectId}">
        <p style="color:#999">جاري التحميل...</p>
      </div>
    </div>
  `;

  const grid = document.getElementById(`grid-${projectId}`);

  // جلب الملفات من Supabase
  const { data } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) {
    grid.innerHTML = "<p style='color:#666'>لا توجد ملفات</p>";
    return;
  }

  grid.innerHTML = "";

  // عرض الملفات داخل الكارد
  data.forEach((f) => {
    const item = document.createElement("div");

    item.innerHTML = `
      ${
        f.file_type === "image"
          ? `<img src="${f.file_url}" />`
          : f.file_type === "video"
          ? `<video src="${f.file_url}" controls></video>`
          : `<a href="${f.file_url}" target="_blank">ملف مرفوع</a>`
      }

      <button class="btn-delete-small" onclick="deleteFile('${f.id}')">
        حذف
      </button>
    `;

    grid.appendChild(item);
  });
}

/* -------------------------------------
   حذف ملف
--------------------------------------*/
window.deleteFile = async function (id) {
  if (!confirm("هل تريد حذف هذا الملف؟")) return;

  await supabase.from("project_files").delete().eq("id", id);

  loadProjects();
};

/* -------------------------------------
   إنشاء مشروع جديد (+ Thumbnail + Gallery)
--------------------------------------*/
projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(projectForm);

  const thumbnailFile = document.getElementById("thumbnailInput").files[0];
  const galleryFiles = document.getElementById("galleryInput").files;

  if (!thumbnailFile) {
    alert("يجب اختيار صورة مصغّرة");
    return;
  }

  // 1) إنشاء المشروع
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      service_type: fd.get("service_type"),
      title: fd.get("title"),
      short_description: fd.get("short_description"),
      full_description: fd.get("full_description"),
    })
    .select()
    .single();

  if (error) {
    alert("فشل إنشاء المشروع");
    console.error(error);
    return;
  }

  const projectId = project.id;

  // 2) رفع Thumbnail
  const thumbnailUrl = await uploadThumbnail(thumbnailFile, projectId);

  if (thumbnailUrl) {
    await supabase
      .from("projects")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", projectId);
  }

  // 3) رفع ملفات الغاليري
  for (let file of galleryFiles) {
    const url = await uploadFileWithProgress(file, projectId);
    if (url) {
      await supabase.from("project_files").insert({
        project_id: projectId,
        file_url: url,
        file_type: file.type.startsWith("video") ? "video" : "image",
      });
    }
  }

  projectForm.reset();
  loadProjects();
});

/* -------------------------------------
   تعديل مشروع قائم
--------------------------------------*/
window.editProject = async function (id) {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return;

  document.querySelector("[name='service_type']").value = data.service_type;
  document.querySelector("[name='title']").value = data.title;
  document.querySelector("[name='short_description']").value = data.short_description;
  document.querySelector("[name='full_description']").value = data.full_description;

  currentProjectId = id;

  projectForm.onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(projectForm);

    await supabase
      .from("projects")
      .update({
        service_type: fd.get("service_type"),
        title: fd.get("title"),
        short_description: fd.get("short_description"),
        full_description: fd.get("full_description"),
      })
      .eq("id", id);

    projectForm.reset();
    projectForm.onsubmit = null;
    loadProjects();
  };
};

/* -------------------------------------
   حذف مشروع كامل
--------------------------------------*/
window.deleteProject = async function (id) {
  if (!confirm("سيتم حذف المشروع وجميع ملفاته، هل أنت متأكد؟")) return;

  await supabase.from("project_files").delete().eq("project_id", id);
  await supabase.from("projects").delete().eq("id", id);

  loadProjects();
};

/* -------------------------------------
   بدء التشغيل
--------------------------------------*/
loadProjects();
