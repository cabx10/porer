import { useMemo, useState } from "react";
import { locationData } from "../utils/locations";
import { useT } from "../i18n";

export interface LocationValue {
  city: string;
  district: string;
  neighborhood: string;
}

/** City → district → neighborhood selects; supports single or multi-district and multi-neighborhood selection. */
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
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");

  const districts = useMemo(() => {
    return value.city ? Object.keys(locationData[value.city] ?? {}) : [];
  }, [value.city]);

  const selectedDistricts = useMemo(() => {
    return multiDistrict && value.district
      ? value.district.split(",").map((d) => d.trim()).filter(Boolean)
      : [];
  }, [multiDistrict, value.district]);

  const selectedNeighborhoods = useMemo(() => {
    return multiDistrict && value.neighborhood
      ? value.neighborhood.split(",").map((n) => n.trim()).filter(Boolean)
      : [];
  }, [multiDistrict, value.neighborhood]);

  // Available neighborhoods in multi-mode:
  // If districts are selected, pool from selected districts.
  // Otherwise pool from all districts in the city.
  const availableNeighborhoods = useMemo(() => {
    if (!value.city) return [];
    const targetDistricts = selectedDistricts.length > 0 ? selectedDistricts : districts;
    const all = targetDistricts.flatMap((d) => locationData[value.city]?.[d] ?? []);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, "tr"));
  }, [value.city, selectedDistricts, districts]);

  const filteredNeighborhoods = useMemo(() => {
    const q = neighborhoodSearch.trim().toLowerCase();
    if (!q) return availableNeighborhoods;
    return availableNeighborhoods.filter((n) => n.toLowerCase().includes(q));
  }, [availableNeighborhoods, neighborhoodSearch]);

  // Neighborhoods for single-district mode (e.g. ListingForm)
  const singleNeighborhoods = useMemo(() => {
    return value.city && value.district
      ? locationData[value.city]?.[value.district] ?? []
      : [];
  }, [value.city, value.district]);

  const toggleDistrict = (d: string) => {
    const nextDistricts = selectedDistricts.includes(d)
      ? selectedDistricts.filter((x) => x !== d)
      : [...selectedDistricts, d];

    // Prune any selected neighborhoods that no longer belong to selected districts
    let nextNeighborhoods = selectedNeighborhoods;
    if (nextDistricts.length > 0 && value.city) {
      const allowed = new Set(
        nextDistricts.flatMap((dist) => locationData[value.city]?.[dist] ?? [])
      );
      nextNeighborhoods = selectedNeighborhoods.filter((n) => allowed.has(n));
    }

    onChange(
      {
        ...value,
        district: nextDistricts.join(","),
        neighborhood: nextNeighborhoods.join(","),
      },
      "district"
    );
  };

  const clearDistricts = () => {
    onChange({ ...value, district: "", neighborhood: "" }, "district");
  };

  const toggleNeighborhood = (n: string) => {
    const next = selectedNeighborhoods.includes(n)
      ? selectedNeighborhoods.filter((x) => x !== n)
      : [...selectedNeighborhoods, n];
    onChange(
      {
        ...value,
        neighborhood: next.join(","),
      },
      "neighborhood"
    );
  };

  const selectAllNeighborhoods = () => {
    onChange(
      {
        ...value,
        neighborhood: availableNeighborhoods.join(","),
      },
      "neighborhood"
    );
  };

  const clearNeighborhoods = () => {
    onChange({ ...value, neighborhood: "" }, "neighborhood");
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
                {selectedDistricts.length > 0 && ` (${selectedDistricts.length})`}
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

        {value.city && availableNeighborhoods.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("filter.neighborhoodSelect")}
                {selectedNeighborhoods.length > 0 && ` (${selectedNeighborhoods.length})`}
              </span>
              <div className="flex items-center gap-2">
                {selectedNeighborhoods.length < availableNeighborhoods.length && (
                  <button
                    type="button"
                    onClick={selectAllNeighborhoods}
                    className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {t("filter.selectAllNeighborhoods")}
                  </button>
                )}
                {selectedNeighborhoods.length > 0 && (
                  <button
                    type="button"
                    onClick={clearNeighborhoods}
                    className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {t("filter.allNeighborhoods")}
                  </button>
                )}
              </div>
            </div>

            {availableNeighborhoods.length > 6 && (
              <div className="relative">
                <input
                  type="text"
                  value={neighborhoodSearch}
                  onChange={(e) => setNeighborhoodSearch(e.target.value)}
                  placeholder={t("filter.searchNeighborhood")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                {neighborhoodSearch && (
                  <button
                    type="button"
                    onClick={() => setNeighborhoodSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {filteredNeighborhoods.map((n) => {
                const isSelected = selectedNeighborhoods.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNeighborhood(n)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? "bg-brand-700 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {isSelected ? `✓ ${n}` : n}
                  </button>
                );
              })}
              {filteredNeighborhoods.length === 0 && (
                <p className="py-2 text-xs text-slate-400 italic">
                  {t("filter.noNeighborhoodFound")}
                </p>
              )}
            </div>
          </div>
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
        {singleNeighborhoods.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
