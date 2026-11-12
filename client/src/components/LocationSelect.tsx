import { locationData } from "../utils/locations";
import { useT } from "../i18n";

export interface LocationValue {
  city: string;
  district: string;
  neighborhood: string;
}

/** City → district → neighborhood selects; picking a level clears the ones below it. */
export default function LocationSelect({
  value,
  onChange,
  allowAll,
  error,
  className = "grid gap-3 sm:grid-cols-3",
}: {
  value: LocationValue;
  onChange: (v: LocationValue, changed: keyof LocationValue) => void;
  allowAll?: boolean;
  error?: string;
  className?: string;
}) {
  const t = useT();
  const districts = value.city ? Object.keys(locationData[value.city] ?? {}) : [];
  const neighborhoods = value.city && value.district ? locationData[value.city]?.[value.district] ?? [] : [];
  return (
    <div className={className}>
      <select
        className={`input ${error && !value.city ? "input-error" : ""}`}
        value={value.city}
        onChange={(e) => onChange({ city: e.target.value, district: "", neighborhood: "" }, "city")}
      >
        <option value="">{allowAll ? t("location.allCities") : t("location.city")}</option>
        {Object.keys(locationData).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={value.district}
        disabled={!value.city}
        onChange={(e) => onChange({ ...value, district: e.target.value, neighborhood: "" }, "district")}
      >
        <option value="">{allowAll ? t("location.allDistricts") : t("location.district")}</option>
        {districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={value.neighborhood}
        disabled={!value.district}
        onChange={(e) => onChange({ ...value, neighborhood: e.target.value }, "neighborhood")}
      >
        <option value="">{allowAll ? t("location.allNeighborhoods") : t("location.neighborhood")}</option>
        {neighborhoods.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
