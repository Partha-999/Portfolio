import {
  createClient,
  createWriteClient,
  createMigration,
} from "@prismicio/client";
import { createPrismicAuthManager } from "@slicemachine/manager";
import sm from "./slicemachine.config.json";
import pkg from "./package.json";

main();

async function main() {
  const authManager = createPrismicAuthManager();

  const isLoggedIn = await authManager.checkIsLoggedIn();
  if (!isLoggedIn) {
    const sessionInfo = await authManager.getLoginSessionInfo();
    await authManager.nodeLoginSession({
      port: sessionInfo.port,
      onListenCallback() {
        console.log(
          `Open this URL in your browser and log in: ${sessionInfo.url}`,
        );
      },
    });
    console.log("Logged in!");
  }

  const sourceClient = createClient(pkg.name);
  console.log(
    `Fetching source documents from "${sourceClient.repositoryName}"...`,
  );
  const allDocuments = await sourceClient.dangerouslyGetAll();

  const client = createWriteClient(sm.repositoryName, {
    writeToken: await authManager.getAuthenticationToken(),
  });

  // 🔍 Fetch repository info to debug 'languages' field
  const repository = await client.getRepository();
  console.log("Repository languages:", repository.languages);

  if (!repository.languages || repository.languages.length === 0) {
    throw new Error(
      `No languages found in repository "${client.repositoryName}". Check if your repo is initialized properly.`,
    );
  }

  const masterLocale = repository.languages.find((lang) => lang.is_master)?.id;
  if (!masterLocale) {
    throw new Error("Master locale not found in repository languages.");
  }

  const migration = createMigration();
  for (const document of allDocuments) {
    if (["homepage", "settings"].includes(document.type))
      // @ts-expect-error - These documents shouldn't have UIDs.
      delete document.uid;

    migration.createDocumentFromPrismic(
      document,
      (document.uid || document.type)
        .replace(/-/g, " ")
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    );
  }

  console.log(`Copying documents to "${client.repositoryName}"...`);
  await client.migrate(migration);

  console.log(
    `Done! Next, visit https://${sm.repositoryName}.prismic.io/builder/migration to publish your release.`,
  );
}
