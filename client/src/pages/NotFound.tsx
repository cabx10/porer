import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useT } from "../i18n";
import { EmptyState } from "../components/ui";

export default function NotFound() {
  const t = useT();
  return (
    <div className="page py-16">
      <EmptyState
        icon={<Compass size={22} />}
        title={t("notFound.title")}
        text={t("notFound.text")}
        action={
          <Link to="/" className="btn-primary">
            {t("notFound.home")}
          </Link>
        }
      />
    </div>
  );
}
