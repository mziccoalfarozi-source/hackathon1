import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition deployment module untuk TriageAuditTrail — X-TRACE Project
 *
 * Deploy ke local:
 *   npx hardhat ignition deploy ignition/modules/TriageAuditTrail.ts
 *
 * Deploy ke Polygon Amoy Testnet:
 *   npx hardhat ignition deploy ignition/modules/TriageAuditTrail.ts --network amoy
 *
 * Setelah deploy, catat CONTRACT_ADDRESS dari output dan masukkan ke:
 *   frontend/lib/blockchain.ts → CONTRACT_ADDRESS
 */
export default buildModule("TriageAuditTrailModule", (m) => {
  const triageAuditTrail = m.contract("TriageAuditTrail");

  return { triageAuditTrail };
});
