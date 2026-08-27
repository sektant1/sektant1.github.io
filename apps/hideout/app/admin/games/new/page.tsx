import { GameForm } from "@/components/admin/game-form";

export default function NewGamePage() {
  return <GameForm mode="create" today={new Date().toISOString().slice(0, 10)} />;
}
