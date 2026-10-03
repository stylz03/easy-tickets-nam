import HomePage from "@/components/site/HomePage";
import { catalogue } from "@/lib/catalogue";
export const dynamic = "force-dynamic";
export default async function DesignOne() {
  const data = await catalogue();
  return <HomePage {...data} />;
}
