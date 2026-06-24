import { runStoreContractTests } from "@rankmyseo/core/testing";
import { createSqliteStore } from "./sqlite-store.js";

runStoreContractTests(() => createSqliteStore(":memory:"));
