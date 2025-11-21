import { supabase } from "./supabaseClient.js";

// Load latest intro video from Supabase
async function loadIntroVideo() {
  const videoEl = document.getElementById("introVideo");
  if (!videoEl) return;

  const { data, error } = await supabase
    .from("video_intro")
    .select("file_url")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Error loading intro video:", error.message);
    return;
  }

  if (data && data.file_url) {
    videoEl.innerHTML = "";
    const source = document.createElement("source");
    source.src = data.file_url;
    source.type = "video/mp4";
    videoEl.appendChild(source);
  }
}

// Handle contact form submit
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      description: formData.get("description"),
    };

    const { error } = await supabase.from("contact_requests").insert(payload);
    if (error) {
      alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
      console.error(error);
      return;
    }
    alert("تم إرسال طلبك بنجاح، سنتواصل معك قريبًا.");
    form.reset();
  });
}

loadIntroVideo();
initContactForm();
