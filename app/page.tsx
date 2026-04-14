// ホームページ: 検索ページへリダイレクト (最初から全構築を表示)
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/search?format=all");
}
