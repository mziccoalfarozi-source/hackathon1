import { ethers } from "ethers";

const RPC_URL = "https://rpc-amoy.polygon.technology";
const ABI = [
  "function logTriage(string visitId, string patientName, string priority, uint256 confidenceBps, string action)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const txHash = "0xd67c552d41a466faf94c6cd4ec494b3cf8ebc28e616efe45fb65f19a5205bfc8";
    const tx = await provider.getTransaction(txHash);
    
    if (tx) {
      console.log("Transaction found!");
      const iface = new ethers.Interface(ABI);
      const decoded = iface.parseTransaction({ data: tx.data });
      console.log("Decoded Args:", decoded?.args);
    } else {
      console.log("Transaction NOT FOUND on Amoy!");
    }
  } catch(e: any) {
    console.error("Error fetching tx:", e.message || e);
  }
}

main();
