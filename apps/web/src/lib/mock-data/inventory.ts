export type ProvisioningState = "Succeeded" | "Updating" | "Failed" | "Canceled";
export type VmPowerState = "running" | "deallocated" | "stopped" | "starting" | "stopping";

export interface AzureResourceItem {
  id: string;
  name: string;
  type: string;
  resourceGroup: string;
  location: string;
  locationDisplay: string;
  provisioningState: ProvisioningState;
  // Live VM power state — strictly separate from provisioningState!
  powerState?: VmPowerState;
  sku?: string;
  tags: Record<string, string>;
  lastObserved: string;
  // Specific VM hardware metadata if resource is a VM
  vmDetails?: {
    vmSize: string;
    vCpuCount: number;
    memoryGb: number;
    gpuModel?: string;
    osType: "Linux" | "Windows";
    osDiskSizeGb: number;
    osDiskType: string;
    privateIpAddress: string;
    publicIpAddress?: string;
    amaAgentInstalled: boolean; // Azure Monitor Agent status
    lastStateChange: string;
  };
}

export const MOCK_RESOURCES: AzureResourceItem[] = [
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-01",
    name: "vm-adt-gpu-trainer-01",
    type: "Microsoft.Compute/virtualMachines",
    resourceGroup: "rg-adt-training-compute",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    powerState: "running",
    sku: "Standard_NC6s_v3",
    tags: { Environment: "Production", Workload: "LLM-FineTuning", Tier: "High-Performance" },
    lastObserved: "2026-10-24T09:40:00Z",
    vmDetails: {
      vmSize: "Standard_NC6s_v3",
      vCpuCount: 6,
      memoryGb: 112,
      gpuModel: "1x NVIDIA Tesla V100-PCIE-16GB",
      osType: "Linux",
      osDiskSizeGb: 256,
      osDiskType: "Premium_LRS",
      privateIpAddress: "10.0.4.15",
      publicIpAddress: "20.84.112.50",
      amaAgentInstalled: false, // Notice: No guest agent installed
      lastStateChange: "2026-10-22T14:30:00Z",
    },
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-training-compute/providers/Microsoft.Compute/virtualMachines/vm-adt-gpu-trainer-02",
    name: "vm-adt-gpu-trainer-02",
    type: "Microsoft.Compute/virtualMachines",
    resourceGroup: "rg-adt-training-compute",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    powerState: "deallocated",
    sku: "Standard_NC6s_v3",
    tags: { Environment: "Production", Workload: "Batch-Training", Schedule: "On-Demand" },
    lastObserved: "2026-10-24T09:40:00Z",
    vmDetails: {
      vmSize: "Standard_NC6s_v3",
      vCpuCount: 6,
      memoryGb: 112,
      gpuModel: "1x NVIDIA Tesla V100-PCIE-16GB",
      osType: "Linux",
      osDiskSizeGb: 256,
      osDiskType: "Premium_LRS",
      privateIpAddress: "10.0.4.16",
      amaAgentInstalled: false,
      lastStateChange: "2026-10-23T18:15:00Z",
    },
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-eval-services/providers/Microsoft.Compute/virtualMachines/vm-adt-eval-worker-01",
    name: "vm-adt-eval-worker-01",
    type: "Microsoft.Compute/virtualMachines",
    resourceGroup: "rg-adt-eval-services",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    powerState: "running",
    sku: "Standard_D4s_v5",
    tags: { Environment: "Staging", Workload: "Automated-Evaluation", Owner: "ADT-AI-QA" },
    lastObserved: "2026-10-24T09:40:00Z",
    vmDetails: {
      vmSize: "Standard_D4s_v5",
      vCpuCount: 4,
      memoryGb: 16,
      osType: "Linux",
      osDiskSizeGb: 128,
      osDiskType: "StandardSSD_LRS",
      privateIpAddress: "10.0.5.21",
      amaAgentInstalled: true, // Installed AMA guest telemetry
      lastStateChange: "2026-10-20T08:00:00Z",
    },
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-data-storage/providers/Microsoft.Storage/storageAccounts/saadtdatasetsprod",
    name: "saadtdatasetsprod",
    type: "Microsoft.Storage/storageAccounts",
    resourceGroup: "rg-adt-data-storage",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "Standard_ZRS",
    tags: { Environment: "Production", Tier: "Hot-Datasets", Encryption: "Customer-Managed" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-security/providers/Microsoft.KeyVault/vaults/kv-adt-prod-secrets",
    name: "kv-adt-prod-secrets",
    type: "Microsoft.KeyVault/vaults",
    resourceGroup: "rg-adt-security",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "Standard",
    tags: { Compliance: "FedRAMP-Ready", SecurityZone: "Core" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-networking/providers/Microsoft.Network/virtualNetworks/vnet-adt-core-eastus2",
    name: "vnet-adt-core-eastus2",
    type: "Microsoft.Network/virtualNetworks",
    resourceGroup: "rg-adt-networking",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "AddressSpace: 10.0.0.0/16",
    tags: { Scope: "Foundation-VNet" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-networking/providers/Microsoft.Network/networkSecurityGroups/nsg-adt-training-compute",
    name: "nsg-adt-training-compute",
    type: "Microsoft.Network/networkSecurityGroups",
    resourceGroup: "rg-adt-networking",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "Standard",
    tags: { Tier: "Compute-DMZ" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-ai-services/providers/Microsoft.CognitiveServices/accounts/cog-adt-openai-eastus2",
    name: "cog-adt-openai-eastus2",
    type: "Microsoft.CognitiveServices/accounts",
    resourceGroup: "rg-adt-ai-services",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "S0",
    tags: { Service: "Azure-OpenAI", Models: "GPT-4o,Embedding-v3" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-data-storage/providers/Microsoft.Storage/storageAccounts/saadtbackupseastus2",
    name: "saadtbackupseastus2",
    type: "Microsoft.Storage/storageAccounts",
    resourceGroup: "rg-adt-data-storage",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "Standard_GRS",
    tags: { Tier: "Archive-Cold", Lifecycle: "Automated-90D" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
  {
    id: "/subscriptions/sub-adt-ai-foundation-prod-01/resourceGroups/rg-adt-monitoring/providers/Microsoft.OperationalInsights/workspaces/law-adt-prod-eastus2",
    name: "law-adt-prod-eastus2",
    type: "Microsoft.OperationalInsights/workspaces",
    resourceGroup: "rg-adt-monitoring",
    location: "eastus2",
    locationDisplay: "East US 2",
    provisioningState: "Succeeded",
    sku: "PerGB2018",
    tags: { Component: "Log-Analytics", Retention: "365-Days" },
    lastObserved: "2026-10-24T09:40:00Z",
  },
];
