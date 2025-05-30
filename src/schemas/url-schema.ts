import * as z from "zod";

export const urlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine((val) => {
      // Allow URLs with or without protocol
      if (val.startsWith("http://") || val.startsWith("https://")) {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }
      // For URLs without protocol, check if they look like valid domains
      const domainPattern =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
      return domainPattern.test(val);
    }, "Please enter a valid URL (e.g., https://example.com or example.com)"),
});
