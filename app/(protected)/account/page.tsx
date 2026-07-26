import { requireUser } from "@/lib/dal";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import ProfileCard from "./ProfileCard";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "0 1 400px" }}>
        <ProfileCard profile={profile} />
      </div>
      <div style={{ flex: "0 1 400px" }}>
        <ChangePasswordCard />
      </div>
    </div>
  );
}
