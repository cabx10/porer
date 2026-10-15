-- DropIndex
DROP INDEX "Listing_city_rooms_idx";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "district" TEXT,
ADD COLUMN     "neighborhood" TEXT;

-- CreateIndex
CREATE INDEX "Listing_city_district_neighborhood_idx" ON "Listing"("city", "district", "neighborhood");
