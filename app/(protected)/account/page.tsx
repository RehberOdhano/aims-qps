import { requireUser } from "@/lib/dal";
import Card from "@/components/Card";
import ChangePasswordCard from "@/components/ChangePasswordCard";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <div style={{ marginBottom: 20 }}>
        <Card title="Profile">
          <div style={{ fontSize: 13 }}>
            <strong>{profile.fullname}</strong>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
            @{profile.username} · {profile.role}
          </div>
        </Card>
      </div>
      <ChangePasswordCard />
    </div>
  );
}
