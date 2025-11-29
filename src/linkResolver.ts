// src/linkResolver.ts
import { PrismicDocument } from "@prismicio/client";

export const linkResolver = (doc: PrismicDocument): string => {
  switch (doc.type) {
    case "homepage":
      return "/";
    case "page":
      return `/${doc.uid}`;
    case "settings":
      return "/settings"; // Optional — use only if needed
    default:
      return "/";
  }
};
