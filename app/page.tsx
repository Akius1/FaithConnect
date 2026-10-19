import { redirect } from "next/navigation";

// The middleware has already sent signed-out visitors to /login.
export default function Home() {
  redirect("/dashboard");
}
