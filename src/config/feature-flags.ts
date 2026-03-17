function parseBooleanFlag(value: string | undefined, defaultValue = false): boolean {
    if (value === undefined) return defaultValue;
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const featureFlags = {
    tenderFtsSearch: parseBooleanFlag(import.meta.env.VITE_FF_TENDER_FTS_SEARCH, false),
} as const;

