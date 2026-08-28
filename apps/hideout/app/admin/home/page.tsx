import { HomeForm } from "@/components/admin/home-form"
import { readCmsHome } from "@/lib/cms/home"

export default async function AdminHomePage() {
  const home = await readCmsHome()

  return <HomeForm home={home} />
}
