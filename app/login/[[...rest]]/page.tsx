import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/src/components/AuthShell";

export const metadata = { title: "Sign in - Faith Connect" };

export default function LoginPage() {
  return (
    <AuthShell>
      <SignIn path="/login" routing="path" signUpUrl="/sign-up" />
    </AuthShell>
  );
}
