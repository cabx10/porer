import { locationData } from "../utils/locations";
import { useT } from "../i18n";

export interface LocationValue {
  city: string;
  district: string;
  neighborhood: string;
}

/** City → district → neighborhood selects; supports single or multi-district selection. */
export default function LocationSelect({
  value,
  onChange,
  allowAll,
  multiDistrict = false,
  error,
  className = "grid gap-3 sm:grid-cols-3",
}: {
  value: LocationValue;
  onChange: (v: LocationValue, changed: keyof LocationValue) => void;
  allowAll?: boolean;
  multiDistrict?: boolean;
  error?: string;
  className?: string;
}) {
  const t = useT();
  const districts = value.city ? Object.keys(locationData[value.city] ?? {}) : [];

  const selectedDistricts = multiDistrict && value.district
    ? value.district.split(",").map((d) => d.trim()).filter(Boolean)
    : [];

  const singleDistrictForNeighborhood = multiDistrict
    ? selectedDistricts.length === 1 ? selectedDistricts[0] : ""
    : value.district;

  const neighborhoods = value.city && singleDistrictForNeighborhood
    ? locationData[value.city]?.[singleDistrictForNeighborhood] ?? []
    : [];

  const toggleDistrict = (d: string) => {
    const next = selectedDistricts.includes(d)
      ? selectedDistricts.filter((x) => x !== d)
      : [...selectedDistricts, d];
    onChange(
      {
        ...value,
        district: next.join(","),
        neighborhood: next.length === 1 ? value.neighborhood : "",
      },
      "district"
    );
  };

  const clearDistricts = () => {
    onChange({ ...value, district: "", neighborhood: "" }, "district");
  };

  if (multiDistrict) {
    return (
      <div className={className}>
        <div>
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
        </div>

        {value.city && districts.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("filter.districtSelect")}
              </span>
              {selectedDistricts.length > 0 && (
                <button
                  type="button"
                  onClick={clearDistricts}
                  className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                >
                  {t("filter.allDistricts")}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {districts.map((d) => {
                const isSelected = selectedDistricts.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistrict(d)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? "bg-brand-700 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {isSelected ? `✓ ${d}` : d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedDistricts.length === 1 && (
          <div>
            <select
              className="input"
              value={value.neighborhood}
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
        )}

        {selectedDistricts.length > 1 && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            {t("filter.singleDistrictForNeighborhood")}
          </p>
        )}
      </div>
    );
  }

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
