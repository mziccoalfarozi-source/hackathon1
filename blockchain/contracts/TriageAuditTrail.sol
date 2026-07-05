// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title TriageAuditTrail
 * @notice Smart contract untuk mencatat hasil triage pasien secara immutable
 *         sebagai bagian dari sistem X-TRACE (Vitas).
 * @dev Setiap konfirmasi triage oleh admin/dokter akan memanggil logTriage().
 *      Data yang dicatat: visitId (dari Supabase), nama pasien, prioritas AI,
 *      confidence score (basis points), dan aksi yang dilakukan.
 *      Semua data bersifat append-only — tidak ada fungsi update/delete.
 */
contract TriageAuditTrail {
    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Dipancarkan setiap kali triage baru dikonfirmasi.
     * @param recordId       Indeks record (auto-increment, mulai dari 0)
     * @param visitId        UUID kunjungan dari Supabase (string)
     * @param patientName    Nama pasien (denormalized untuk audit trail)
     * @param priority       Level prioritas: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
     * @param confidenceBps  Confidence model AI dalam basis points (0–10000)
     *                       Contoh: 9400 = 94%, 7500 = 75%
     * @param action         Jenis aksi: contoh "AI TRIAGE + KONFIRMASI"
     * @param confirmedBy    Alamat wallet/akun yang mengkonfirmasi triage
     * @param timestamp      Unix timestamp saat transaksi dikonfirmasi
     */
    event TriageLogged(
        uint256 indexed recordId,
        string  visitId,
        string  patientName,
        string  priority,
        uint256 confidenceBps,
        string  action,
        address indexed confirmedBy,
        uint256 timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    struct TriageRecord {
        uint256 recordId;
        string  visitId;
        string  patientName;
        string  priority;
        uint256 confidenceBps;
        string  action;
        address confirmedBy;
        uint256 timestamp;
        bool    exists;
    }

    /// @notice Semua record triage yang sudah dicatat, berurutan.
    TriageRecord[] public records;

    /// @notice Mapping dari visitId ke indeks array records (untuk lookup cepat).
    mapping(string => uint256) private _visitIdToIndex;
    mapping(string => bool)    private _visitIdExists;

    // ─────────────────────────────────────────────────────────────
    // Write Function
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Catat satu keputusan triage ke blockchain.
     * @dev Dipanggil dari frontend (ethers.js) saat admin mengkonfirmasi triage.
     *      Satu visitId hanya boleh dicatat SATU kali (idempotent).
     * @param visitId        UUID kunjungan Supabase
     * @param patientName    Nama pasien
     * @param priority       "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
     * @param confidenceBps  Confidence AI dalam basis points (0–10000)
     * @param action         Deskripsi aksi, misal "AI TRIAGE + KONFIRMASI"
     */
    function logTriage(
        string calldata visitId,
        string calldata patientName,
        string calldata priority,
        uint256         confidenceBps,
        string calldata action
    ) external {
        require(bytes(visitId).length > 0,      "visitId kosong");
        require(bytes(patientName).length > 0,  "nama pasien kosong");
        require(bytes(priority).length > 0,     "priority kosong");
        require(confidenceBps <= 10000,         "confidenceBps melebihi 10000");
        require(!_visitIdExists[visitId],       "visitId sudah dicatat");

        uint256 newId = records.length;

        records.push(TriageRecord({
            recordId:     newId,
            visitId:      visitId,
            patientName:  patientName,
            priority:     priority,
            confidenceBps: confidenceBps,
            action:       action,
            confirmedBy:  msg.sender,
            timestamp:    block.timestamp,
            exists:       true
        }));

        _visitIdToIndex[visitId] = newId;
        _visitIdExists[visitId]  = true;

        emit TriageLogged(
            newId,
            visitId,
            patientName,
            priority,
            confidenceBps,
            action,
            msg.sender,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Read Functions
    // ─────────────────────────────────────────────────────────────

    /// @notice Total jumlah record yang telah dicatat.
    function totalRecords() external view returns (uint256) {
        return records.length;
    }

    /**
     * @notice Ambil record berdasarkan indeks (recordId).
     * @param recordId Indeks record (0-based)
     */
    function getRecord(uint256 recordId) external view returns (TriageRecord memory) {
        require(recordId < records.length, "recordId tidak valid");
        return records[recordId];
    }

    /**
     * @notice Cari record berdasarkan visitId dari Supabase.
     * @param visitId UUID kunjungan
     * @return record TriageRecord yang ditemukan
     */
    function getRecordByVisitId(string calldata visitId)
        external
        view
        returns (TriageRecord memory record)
    {
        require(_visitIdExists[visitId], "visitId tidak ditemukan");
        return records[_visitIdToIndex[visitId]];
    }

    /**
     * @notice Cek apakah visitId sudah tercatat di blockchain.
     * @param visitId UUID kunjungan
     */
    function isVisitRecorded(string calldata visitId) external view returns (bool) {
        return _visitIdExists[visitId];
    }

    /**
     * @notice Ambil N record terbaru (untuk tampilan audit dashboard).
     * @param count Jumlah record yang diinginkan (dari yang terbaru)
     */
    function getLatestRecords(uint256 count)
        external
        view
        returns (TriageRecord[] memory)
    {
        uint256 total = records.length;
        if (count > total) count = total;

        TriageRecord[] memory result = new TriageRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = records[total - 1 - i]; // terbaru duluan
        }
        return result;
    }
}
