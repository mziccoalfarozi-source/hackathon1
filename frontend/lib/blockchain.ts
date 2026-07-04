/**
 * blockchain.ts — X-TRACE Project
 *
 * Utility untuk integrasi smart contract TriageAuditTrail ke frontend Next.js.
 * Menggunakan ethers.js v6 dengan MetaMask sebagai wallet provider.
 *
 * SETUP:
 * 1. Deploy contract: cd blockchain && npx hardhat ignition deploy ignition/modules/TriageAuditTrail.ts --network amoy
 * 2. Salin contract address hasil deploy ke CONTRACT_ADDRESS di bawah.
 * 3. Pastikan NEXT_PUBLIC_POLYGON_AMOY_RPC_URL sudah di-set di .env.local
 */

import { ethers, type BrowserProvider, type Contract } from "ethers";

// ─── Konfigurasi Contract ──────────────────────────────────────────────────────

/**
 * @important Isi dengan address contract setelah deploy ke Polygon Amoy Testnet.
 * Dapatkan dari output: npx hardhat ignition deploy ... --network amoy
 */
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TRIAGE_CONTRACT_ADDRESS ?? "";

/** Polygon Amoy Testnet Chain ID (decimal: 80002) */
export const AMOY_CHAIN_ID = 80002;

/** RPC public Polygon Amoy (bisa ganti dengan Alchemy/Infura untuk production) */
export const AMOY_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL ??
  "https://rpc-amoy.polygon.technology";

/** Block explorer base URL untuk Polygon Amoy */
export const AMOY_EXPLORER = "https://amoy.polygonscan.com";

// ─── ABI (hanya fungsi yang dipakai frontend) ─────────────────────────────────

export const TRIAGE_ABI = [
  // Write
  "function logTriage(string visitId, string patientName, string priority, uint256 confidenceBps, string action) external",

  // Read
  "function totalRecords() external view returns (uint256)",
  "function getRecord(uint256 recordId) external view returns (tuple(uint256 recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address confirmedBy, uint256 timestamp, bool exists))",
  "function getRecordByVisitId(string visitId) external view returns (tuple(uint256 recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address confirmedBy, uint256 timestamp, bool exists))",
  "function isVisitRecorded(string visitId) external view returns (bool)",
  "function getLatestRecords(uint256 count) external view returns (tuple(uint256 recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address confirmedBy, uint256 timestamp, bool exists)[])",

  // Events
  "event TriageLogged(uint256 indexed recordId, string visitId, string patientName, string priority, uint256 confidenceBps, string action, address indexed confirmedBy, uint256 timestamp)",
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockchainTriageResult {
  txHash: string;
  blockNumber: number;
  blockExplorerUrl: string;
}

export interface BlockchainRecord {
  recordId: number;
  visitId: string;
  patientName: string;
  priority: string;
  confidenceBps: number;
  confidence: number; // confidenceBps / 10000 untuk tampilan %
  action: string;
  confirmedBy: string;
  timestamp: Date;
  exists: boolean;
}

// ─── Helper: get provider / signer ───────────────────────────────────────────

/**
 * Dapatkan BrowserProvider dari MetaMask.
 * Akan throw jika MetaMask tidak tersedia.
 */
export async function getProvider(): Promise<BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "MetaMask tidak terdeteksi. Pasang ekstensi MetaMask di browser kamu."
    );
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Minta koneksi wallet dan pastikan user berada di Polygon Amoy.
 * Jika network salah, otomatis switch (atau tambahkan network jika belum ada).
 */
export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== AMOY_CHAIN_ID) {
    await switchToAmoy();
  }

  const signer = await provider.getSigner();
  return signer.address;
}

/**
 * Switch MetaMask ke Polygon Amoy Testnet.
 * Jika network belum ditambahkan, akan otomatis meminta user menambahkannya.
 */
export async function switchToAmoy(): Promise<void> {
  const provider = await getProvider();
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: `0x${AMOY_CHAIN_ID.toString(16)}` },
    ]);
  } catch (err: unknown) {
    // Error code 4902 = chain belum ditambahkan ke MetaMask
    if ((err as { code?: number }).code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: `0x${AMOY_CHAIN_ID.toString(16)}`,
          chainName: "Polygon Amoy Testnet",
          nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
          rpcUrls: [AMOY_RPC_URL],
          blockExplorerUrls: [AMOY_EXPLORER],
        },
      ]);
    } else {
      throw err;
    }
  }
}

/**
 * Buat instance contract (read-only via RPC, atau writable via signer).
 */
async function getContract(writeable = false): Promise<Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "CONTRACT_ADDRESS belum dikonfigurasi. Deploy contract dulu dan set NEXT_PUBLIC_TRIAGE_CONTRACT_ADDRESS di .env.local"
    );
  }

  if (writeable) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, TRIAGE_ABI, signer);
  }

  // Read-only: gunakan RPC langsung tanpa wallet
  const provider = new ethers.JsonRpcProvider(AMOY_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, TRIAGE_ABI, provider);
}

// ─── Write Functions ──────────────────────────────────────────────────────────

/**
 * Catat hasil triage ke blockchain.
 * Dipanggil dari halaman admin/input-pasien setelah AI triage dikonfirmasi.
 *
 * @param visitId        UUID kunjungan dari Supabase
 * @param patientName    Nama pasien
 * @param priority       "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
 * @param confidenceBps  Confidence AI dalam basis points (0–10000)
 *                       Contoh: confidence 0.94 → confidenceBps 9400
 * @param action         Deskripsi aksi, contoh "AI TRIAGE + KONFIRMASI"
 * @returns              { txHash, blockNumber, blockExplorerUrl }
 */
export async function logTriageToBlockchain(
  visitId: string,
  patientName: string,
  priority: string,
  confidenceBps: number,
  action = "AI TRIAGE + KONFIRMASI"
): Promise<BlockchainTriageResult> {
  const contract = await getContract(true);

  const tx = await contract.logTriage(
    visitId,
    patientName,
    priority,
    BigInt(Math.round(confidenceBps)),
    action,
    {
      maxPriorityFeePerGas: ethers.parseUnits("30", "gwei"),
      maxFeePerGas: ethers.parseUnits("35", "gwei"),
    }
  );

  // Tunggu 1 konfirmasi block
  const receipt = await tx.wait(1);

  const blockExplorerUrl = `${AMOY_EXPLORER}/tx/${receipt.hash}`;

  return {
    txHash: receipt.hash,
    blockNumber: Number(receipt.blockNumber),
    blockExplorerUrl,
  };
}

// ─── Read Functions ───────────────────────────────────────────────────────────

/**
 * Cek apakah visitId sudah tercatat di blockchain.
 * Berguna untuk mencegah double-logging saat retry.
 */
export async function isVisitOnChain(visitId: string): Promise<boolean> {
  try {
    const contract = await getContract(false);
    return await contract.isVisitRecorded(visitId);
  } catch {
    return false;
  }
}

/**
 * Ambil detail record dari blockchain berdasarkan visitId.
 */
export async function getOnChainRecord(visitId: string): Promise<BlockchainRecord | null> {
  try {
    const contract = await getContract(false);
    const raw = await contract.getRecordByVisitId(visitId);
    return mapRawRecord(raw);
  } catch (err) {
    console.error("getOnChainRecord error:", err);
    return null;
  }
}

/**
 * Ambil N record terbaru dari blockchain (untuk audit dashboard).
 * @param count Jumlah record yang diambil
 */
export async function getLatestOnChainRecords(count = 20): Promise<BlockchainRecord[]> {
  try {
    const contract = await getContract(false);
    const total = Number(await contract.totalRecords());
    if (total === 0) return [];

    const raw = await contract.getLatestRecords(BigInt(Math.min(count, total)));
    return Array.from(raw).map(mapRawRecord);
  } catch (err) {
    console.error("getLatestOnChainRecords error:", err);
    return [];
  }
}

// ─── Internal Helper ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawRecord(raw: any): BlockchainRecord {
  return {
    recordId:     Number(raw.recordId),
    visitId:      raw.visitId,
    patientName:  raw.patientName,
    priority:     raw.priority,
    confidenceBps: Number(raw.confidenceBps),
    confidence:   Number(raw.confidenceBps) / 10000,
    action:       raw.action,
    confirmedBy:  raw.confirmedBy,
    timestamp:    new Date(Number(raw.timestamp) * 1000), // unix → Date
    exists:       raw.exists,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Ubah confidence float (0–1) ke basis points integer (0–10000). */
export function toBasisPoints(confidence: number): number {
  return Math.round(confidence * 10000);
}

/** Format tx hash pendek untuk tampilan UI. */
export function truncateTxHash(hash: string, start = 10, end = 8): string {
  if (!hash || hash.length < start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
