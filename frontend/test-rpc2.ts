import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x3EA98796706a07CFfceb10ed3c923CD5CF8FcA04";
const RPC_URL = "https://rpc-amoy.polygon.technology";

const ABI = [
  "function totalRecords() external view returns (uint256)",
  "function getLatestRecords(uint256 count) external view returns (tuple(uint256 recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address confirmedBy, uint256 timestamp, bool exists)[])"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  try {
    const total = await contract.totalRecords();
    console.log("Total records on chain:", total.toString());

    if (Number(total) > 0) {
      const latest = await contract.getLatestRecords(5);
      console.log("Latest records:");
      latest.forEach((r: any) => {
        console.log(`- ID: ${r.recordId}, VisitId: ${r.visitId}, Name: ${r.patientName}`);
      });
    }
  } catch(e: any) {
    console.error("Error calling contract:", e.message || e);
  }
}

main();
