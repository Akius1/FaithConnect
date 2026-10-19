import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/src/components/AuthShell";

export const metadata = { title: "Create account - Faith Connect" };

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp path="/sign-up" routing="path" signInUrl="/login" />
    </AuthShell>
  );
}
