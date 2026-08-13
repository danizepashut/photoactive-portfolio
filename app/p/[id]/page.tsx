import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentColor } from "@/lib/student-colors";
import { Gallery, type GalleryPhoto } from "@/app/p/[id]/gallery";
import styles from "@/app/p/[id]/portfolio.module.css";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("public_portfolio_view")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) notFound();

  if (student.status === "expired") {
    return (
      <div className={styles.page}>
        <div
          className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ color: "#e8e4dc" }}
        >
          <h1 className="text-2xl font-bold">
            {student.display_name ?? "תיק העבודות"}
          </h1>
          <p className="text-sm" style={{ color: "#948d80" }}>
            התיק הזה פג תוקף. פנה לצוות פוטואקטיב לפרטים.
          </p>
        </div>
      </div>
    );
  }

  await supabase.rpc("increment_view_count", { p_student_id: id });

  const { data: photoRows } = await supabase
    .from("public_portfolio_photos_view")
    .select("*")
    .eq("student_id", id)
    .order("display_order", { ascending: true });

  const photos: GalleryPhoto[] = await Promise.all(
    (photoRows ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from("portfolio-photos")
        .createSignedUrl(p.storage_path, 3600);
      return { id: p.id, title: p.title, url: data?.signedUrl ?? "" };
    }),
  );

  let profilePhotoUrl: string | null = null;
  if (student.profile_photo_path) {
    const { data } = await supabase.storage
      .from("portfolio-photos")
      .createSignedUrl(student.profile_photo_path, 3600);
    profilePhotoUrl = data?.signedUrl ?? null;
  }

  const age = student.birth_year
    ? new Date().getFullYear() - student.birth_year
    : null;

  // הגוון האישי המדויק שהוקצה לתלמיד (אחד מ-18, ראו lib/student-colors.ts).
  // "עמוק" נגזר ממנו ב-CSS (color-mix), לא מוריאציה אחרת של אותו גוון.
  const accent = getStudentColor(student.color_hue, student.color_variation);

  const accentStyle = {
    "--accent": accent,
  } as React.CSSProperties;

  return (
    <div className={styles.page} style={accentStyle}>
      <div className={styles.glow} />
      <div className={styles.shell}>
        <aside className={styles.rail}>
          <div className={`${styles.fadeIn} ${styles.d1}`}>
            {profilePhotoUrl && (
              <div className={styles.avatar}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profilePhotoUrl}
                  alt=""
                  className={styles.avatarImg}
                />
              </div>
            )}
            <div className={styles.frameId}>כרטיס תלמיד · 00</div>
            <h1 className={styles.railName}>{student.display_name}</h1>
            <div className={styles.role}>
              פוטואקטיב{age !== null ? ` · גיל ${age}` : ""}
            </div>
          </div>

          {student.quote && (
            <p className={`${styles.quote} ${styles.fadeIn} ${styles.d2}`}>
              {student.quote}
            </p>
          )}

          {(student.trait_1 || student.trait_2 || student.trait_3) && (
            <div className={`${styles.fadeIn} ${styles.d2}`}>
              <div className={styles.traitsTitle}>
                שלושה דברים שמאפיינים את הצילום שלי
              </div>
              <ul className={styles.traitsList}>
                {[student.trait_1, student.trait_2, student.trait_3]
                  .filter(Boolean)
                  .map((trait, i) => (
                    <li key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {trait}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {student.bio && (
            <p className={`${styles.bioText} ${styles.fadeIn} ${styles.d3}`}>
              {student.bio}
            </p>
          )}

          {student.work_description && (
            <p className={`${styles.bioText} ${styles.fadeIn} ${styles.d3}`}>
              {student.work_description}
            </p>
          )}

          {student.personal_note && (
            <p className={`${styles.note} ${styles.fadeIn} ${styles.d4}`}>
              {student.personal_note}
            </p>
          )}
        </aside>

        <div className={styles.strip}>
          <Gallery photos={photos} />
        </div>
      </div>

      <footer className={styles.footer}>
        <span>תיק עבודות פוטואקטיב</span>
        <span>
          {student.published_at
            ? new Date(student.published_at).toLocaleDateString("he-IL", {
                year: "numeric",
                month: "long",
              })
            : ""}
        </span>
      </footer>
    </div>
  );
}
