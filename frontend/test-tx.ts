import { ethers } from "ethers";

const RPC_URL = "https://rpc-amoy.polygon.technology";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const txHash = "0xd67c552d41a466faf94c6cd4ec494b3cf8ebc28e616efe45fb65f19a5205bfc8";
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt) {
      console.log("Transaction found!");
      console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
      console.log("Block:", receipt.blockNumber);
    } else {
      console.log("Transaction NOT FOUND on Amoy!");
    }
  } catch(e: any) {
    console.error("Error fetching tx:", e.message || e);
  }
}

main();
