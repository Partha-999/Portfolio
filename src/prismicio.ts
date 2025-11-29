import * as prismic from "@prismicio/client";
import * as prismicNext from "@prismicio/next";
import config from "../slicemachine.config.json";
import { linkResolver } from "./linkResolver"; // ✅ import here

export const repositoryName =
  process.env.NEXT_PUBLIC_PRISMIC_ENVIRONMENT || config.repositoryName;

const routes: prismic.ClientConfig["routes"] = [
  {
    type: "homepage",
    path: "/",
  },
  {
    type: "page",
    path: "/:uid",
  },
];

export const createClient = (config: prismicNext.CreateClientConfig = {}) => {
  const client = prismic.createClient(repositoryName, {
    routes,
    fetchOptions:
      process.env.NODE_ENV === "production"
        ? { next: { tags: ["prismic"] }, cache: "force-cache" }
        : { next: { revalidate: 5 } },
    ...config,
  });

  // ✅ Register the link resolver here
  client.getLinkResolver = () => linkResolver;

  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  });

  return client;
};
