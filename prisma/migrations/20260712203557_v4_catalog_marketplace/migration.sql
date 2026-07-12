-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "LoginIdentifierType" AS ENUM ('mobile', 'email');

-- CreateEnum
CREATE TYPE "CatalogItemStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "InventoryUploadStatus" AS ENUM ('processing', 'completed', 'completed_with_errors', 'failed');

-- CreateEnum
CREATE TYPE "SupplyRequestStatus" AS ENUM ('open', 'fulfilled', 'closed');

-- CreateEnum
CREATE TYPE "SupplyOfferStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionSourceType" AS ENUM ('catalog_purchase', 'supply_offer');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('mada', 'card');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_doc_url" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "login_identifier_type" "LoginIdentifierType" NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sfda_license_number" TEXT NOT NULL,
    "sfda_license_doc_url" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "login_identifier_type" "LoginIdentifierType" NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "sku" TEXT,
    "price" INTEGER NOT NULL,
    "discount_percentage" DECIMAL(5,2),
    "quantity_available" INTEGER NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "CatalogItemStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_uploads" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" "InventoryUploadStatus" NOT NULL DEFAULT 'processing',
    "row_count" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "error_count" INTEGER NOT NULL,
    "error_details" JSONB,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_requests" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "status" "SupplyRequestStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_offers" (
    "id" TEXT NOT NULL,
    "supply_request_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "message" TEXT,
    "status" "SupplyOfferStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "supply_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "source_type" "TransactionSourceType" NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "platform_commission_amount" INTEGER NOT NULL,
    "supplier_payout_amount" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL,
    "payout_status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "catalog_item_id" TEXT,
    "supply_offer_id" TEXT,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_auth_user_id_key" ON "pharmacies"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_license_number_key" ON "pharmacies"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_mobile_key" ON "pharmacies"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_email_key" ON "pharmacies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_auth_user_id_key" ON "suppliers"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_sfda_license_number_key" ON "suppliers"("sfda_license_number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_mobile_key" ON "suppliers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_email_key" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "catalog_items_supplier_id_sku_idx" ON "catalog_items"("supplier_id", "sku");

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_uploads" ADD CONSTRAINT "inventory_uploads_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_requests" ADD CONSTRAINT "supply_requests_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_offers" ADD CONSTRAINT "supply_offers_supply_request_id_fkey" FOREIGN KEY ("supply_request_id") REFERENCES "supply_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_offers" ADD CONSTRAINT "supply_offers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_supply_offer_id_fkey" FOREIGN KEY ("supply_offer_id") REFERENCES "supply_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
