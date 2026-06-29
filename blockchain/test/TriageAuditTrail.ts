import { expect } from "chai";
import { network } from "hardhat";

/**
 * Test suite untuk TriageAuditTrail smart contract — X-TRACE Project
 * Jalankan dengan: npx hardhat test mocha test/TriageAuditTrail.ts
 *
 * Pattern Hardhat 3: gunakan `const { ethers } = await network.create()`
 * bukan `hre.ethers` (yang merupakan Hardhat 2 pattern).
 */

const { ethers } = await network.create();

describe("TriageAuditTrail", function () {

  // ── Helper: deploy fresh contract ──────────────────────────────

  async function deployFixture() {
    const [deployer, admin, doctor] = await ethers.getSigners();
    const TriageAuditTrail = await ethers.getContractFactory("TriageAuditTrail");
    const contract = await TriageAuditTrail.deploy();
    return { contract, deployer, admin, doctor };
  }

  // ── Deployment ────────────────────────────────────────────────

  describe("Deployment", function () {
    it("harus deploy dengan 0 record", async function () {
      const { contract } = await deployFixture();
      expect(await contract.totalRecords()).to.equal(0n);
    });
  });

  // ── logTriage ─────────────────────────────────────────────────

  describe("logTriage", function () {
    it("harus mencatat triage dan emit event TriageLogged", async function () {
      const { contract, admin } = await deployFixture();

      const visitId       = "abc123-uuid-dari-supabase";
      const patientName   = "Budi Santoso";
      const priority      = "CRITICAL";
      const confidenceBps = 9400n; // 94%
      const action        = "AI TRIAGE + KONFIRMASI";

      const tx = await contract.connect(admin).logTriage(
        visitId, patientName, priority, confidenceBps, action
      );

      await expect(tx)
        .to.emit(contract, "TriageLogged")
        .withArgs(
          0n,
          visitId,
          patientName,
          priority,
          confidenceBps,
          action,
          admin.address,
          // timestamp: hanya cek bahwa nilainya > 0
          (v: bigint) => v > 0n
        );

      expect(await contract.totalRecords()).to.equal(1n);
    });

    it("harus reject jika visitId sudah tercatat (idempotent)", async function () {
      const { contract, admin } = await deployFixture();
      const visitId = "uuid-duplikat-123";

      await contract.connect(admin).logTriage(visitId, "Pasien A", "HIGH", 8000n, "AI TRIAGE + KONFIRMASI");

      await expect(
        contract.connect(admin).logTriage(visitId, "Pasien A", "HIGH", 8000n, "AI TRIAGE + KONFIRMASI")
      ).to.be.revertedWith("visitId sudah dicatat");
    });

    it("harus reject jika confidenceBps > 10000", async function () {
      const { contract, admin } = await deployFixture();
      await expect(
        contract.connect(admin).logTriage("uuid-x", "Pasien B", "LOW", 10001n, "TEST")
      ).to.be.revertedWith("confidenceBps melebihi 10000");
    });

    it("harus reject jika visitId kosong", async function () {
      const { contract } = await deployFixture();
      await expect(
        contract.logTriage("", "Pasien C", "MEDIUM", 5000n, "TEST")
      ).to.be.revertedWith("visitId kosong");
    });
  });

  // ── getRecord ─────────────────────────────────────────────────

  describe("getRecord", function () {
    it("harus mengembalikan data record yang benar", async function () {
      const { contract, admin } = await deployFixture();
      await contract.connect(admin).logTriage(
        "visit-111", "Siti Rahayu", "MEDIUM", 7500n, "AI TRIAGE + KONFIRMASI"
      );

      const record = await contract.getRecord(0n);
      expect(record.visitId).to.equal("visit-111");
      expect(record.patientName).to.equal("Siti Rahayu");
      expect(record.priority).to.equal("MEDIUM");
      expect(record.confidenceBps).to.equal(7500n);
      expect(record.confirmedBy).to.equal(admin.address);
      expect(record.exists).to.equal(true);
    });

    it("harus revert jika recordId tidak valid", async function () {
      const { contract } = await deployFixture();
      await expect(contract.getRecord(99n)).to.be.revertedWith("recordId tidak valid");
    });
  });

  // ── getRecordByVisitId ────────────────────────────────────────

  describe("getRecordByVisitId", function () {
    it("harus menemukan record berdasarkan visitId", async function () {
      const { contract } = await deployFixture();
      await contract.logTriage("visit-xyz-999", "Ahmad Fauzi", "HIGH", 8800n, "KONFIRMASI TRIAGE");

      const record = await contract.getRecordByVisitId("visit-xyz-999");
      expect(record.patientName).to.equal("Ahmad Fauzi");
      expect(record.priority).to.equal("HIGH");
    });

    it("harus revert jika visitId tidak ditemukan", async function () {
      const { contract } = await deployFixture();
      await expect(contract.getRecordByVisitId("tidak-ada")).to.be.revertedWith("visitId tidak ditemukan");
    });
  });

  // ── isVisitRecorded ───────────────────────────────────────────

  describe("isVisitRecorded", function () {
    it("harus return false sebelum dicatat, true setelah dicatat", async function () {
      const { contract } = await deployFixture();
      expect(await contract.isVisitRecorded("visit-baru")).to.equal(false);

      await contract.logTriage("visit-baru", "Dewi Lestari", "LOW", 6000n, "TRIAGE");
      expect(await contract.isVisitRecorded("visit-baru")).to.equal(true);
    });
  });

  // ── getLatestRecords ──────────────────────────────────────────

  describe("getLatestRecords", function () {
    it("harus mengembalikan N record terbaru dalam urutan descending", async function () {
      const { contract } = await deployFixture();

      await contract.logTriage("v-001", "Pasien Satu",  "LOW",      5000n, "TRIAGE");
      await contract.logTriage("v-002", "Pasien Dua",   "MEDIUM",   7000n, "TRIAGE");
      await contract.logTriage("v-003", "Pasien Tiga",  "CRITICAL", 9500n, "TRIAGE");

      const latest = await contract.getLatestRecords(2n);
      expect(latest.length).to.equal(2);
      expect(latest[0].visitId).to.equal("v-003"); // terbaru duluan
      expect(latest[1].visitId).to.equal("v-002");
    });

    it("harus mengembalikan semua record jika count > total", async function () {
      const { contract } = await deployFixture();
      await contract.logTriage("v-a", "A", "LOW", 5000n, "TRIAGE");

      const latest = await contract.getLatestRecords(100n);
      expect(latest.length).to.equal(1);
    });
  });
});
