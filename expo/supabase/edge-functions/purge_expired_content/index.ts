// Supabase Edge Function: purge_expired_content
// Deletes expired snaps + stories from DB and corresponding storage objects.
// This runs on a CRON schedule (e.g., every hour) configured in Supabase dashboard.

// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env vars for Supabase client");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TableAndBucket = { table: string; bucket: string };
const contentConfig: TableAndBucket[] = [
  { table: "snaps", bucket: "snaps" },
  { table: "stories", bucket: "stories" },
];

export default async function handler(req: Request) {
  const now = new Date().toISOString();

  for (const { table, bucket } of contentConfig) {
    const { data: rows, error } = await supabase
      .from(table)
      .select("id, media_url")
      .lte("expires_at", now);

    if (error) {
      console.error(`Error fetching expired rows from ${table}:`, error);
      continue;
    }

    if (!rows || rows.length === 0) continue;

    // Delete storage objects in parallel
    const deletePromises = rows.map((row: any) => {
      // media_url sample: https://<project>.supabase.co/storage/v1/object/public/snaps/<path>
      try {
        const relativePath = row.media_url.split(`/object/public/${bucket}/`)[1];
        if (relativePath) {
          return supabase.storage.from(bucket).remove([relativePath]);
        }
      } catch (_e) {}
      return Promise.resolve();
    });

    await Promise.all(deletePromises);

    // Delete DB rows
    const { error: deleteErr } = await supabase.from(table).delete().in(
      "id",
      rows.map((r: any) => r.id),
    );

    if (deleteErr) {
      console.error(`Error deleting expired rows from ${table}:`, deleteErr);
    }
  }

  return new Response(
    JSON.stringify({ status: "success", purgedAt: now }),
    { headers: { "Content-Type": "application/json" } },
  );
} 