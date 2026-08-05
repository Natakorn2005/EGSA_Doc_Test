import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>เข้าสู่ระบบ</h1>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit" style={{ padding: "8px 16px", marginTop: 12 }}>
          เข้าสู่ระบบด้วย Google
        </button>
      </form>
    </main>
  );
}
