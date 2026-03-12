import { auth } from "@clerk/nextjs/server";
import Header from "./header";

export default async function HeaderWrapper() {
  const { has } = await auth();

  const isStarter = has({ plan: "plan_starter" });
  const isPremium = has({ plan: "plan_premium" });
  const isPro = has({ plan: "plan_pro" });

  return (
    <Header 
      isStarter={isStarter}
      isPremium={isPremium}
      isPro={isPro}
    />
  );
}