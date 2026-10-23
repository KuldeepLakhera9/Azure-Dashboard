import { config } from "../../config";
import { IAzureDataProvider } from "./types";
import { MockAzureDataProvider } from "./mock-provider";
import { AzureSdkDataProvider } from "./real-provider";

let providerInstance: IAzureDataProvider | null = null;

export function getAzureDataProvider(): IAzureDataProvider {
  if (providerInstance) {
    return providerInstance;
  }

  // If mock mode is explicitly turned off AND subscription ID is provided, use the real Azure SDK provider
  if (!config.USE_MOCK_AZURE && config.AZURE_SUBSCRIPTION_ID) {
    console.log("[AzureDataProvider] Initializing Azure SDK provider with Managed Identity / DefaultAzureCredential");
    providerInstance = new AzureSdkDataProvider();
  } else {
    console.log("[AzureDataProvider] Initializing Mock Azure Data Provider (Simulation Mode)");
    providerInstance = new MockAzureDataProvider();
  }

  return providerInstance;
}

export * from "./types";
