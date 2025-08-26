-- CreateTable
CREATE TABLE `GateMasuk` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `jenis` ENUM('Motor', 'Mobil') NOT NULL,
    `plat` VARCHAR(191) NOT NULL,
    `gateIn` VARCHAR(191) NOT NULL,
    `jamMasuk` DATETIME(3) NOT NULL,
    `operatorIn` VARCHAR(191) NULL,

    UNIQUE INDEX `GateMasuk_kode_key`(`kode`),
    INDEX `GateMasuk_jamMasuk_idx`(`jamMasuk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaksi` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `gateOut` VARCHAR(191) NOT NULL,
    `jamKeluar` DATETIME(3) NOT NULL,
    `durasiMenit` INTEGER NOT NULL,
    `jamDibulatkan` INTEGER NOT NULL,
    `tarifPerJam` INTEGER NOT NULL,
    `totalBayar` INTEGER NOT NULL,
    `metode` ENUM('CASH', 'QRIS', 'EMONEY', 'DEBIT') NOT NULL,
    `tunaiDiterima` INTEGER NULL,
    `kembalian` INTEGER NULL,
    `operatorOut` VARCHAR(191) NULL,

    UNIQUE INDEX `Transaksi_kode_key`(`kode`),
    INDEX `Transaksi_jamKeluar_idx`(`jamKeluar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaksi` ADD CONSTRAINT `Transaksi_kode_fkey` FOREIGN KEY (`kode`) REFERENCES `GateMasuk`(`kode`) ON DELETE RESTRICT ON UPDATE CASCADE;
