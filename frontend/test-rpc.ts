import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x3EA98796706a07CFfceb10ed3c923CD5CF8FcA04";
const RPC_URL = "https://rpc-amoy.polygon.technology";

const ABI = [
  "function getRecordByVisitId(string visitId) external view returns (tuple(uint256 recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address confirmedBy, uint256 timestamp, bool exists))"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  try {
    const visitId = "fa6b8d85-c083-4e19-9c60-458d3b4ede06";
    console.log(`Verifying visitId: ${visitId}`);
    const res = await contract.getRecordByVisitId(visitId);
    console.log("Found:", res);
  } catch(e: any) {
    console.error("Error calling contract:", e.message || e);
  }
}

main();
