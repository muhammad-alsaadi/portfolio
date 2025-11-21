import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabase = createClient(
  "https://tpleszfjyladgjpwzifo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbGVzemZqeWxhZGdqcHd6aWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDU0NDksImV4cCI6MjA3OTI4MTQ0OX0.KkC53qTMXrXhb-vRwcKKbAeNVqL7_qqMxeosX99HOok"
);
