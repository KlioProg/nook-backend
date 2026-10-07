-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AmenityCode" AS ENUM ('WIFI', 'OUTLET', 'AIRCON', 'RESTROOM', 'PARKING');

-- CreateEnum
CREATE TYPE "PurposeCode" AS ENUM ('STUDY', 'HANGOUT', 'GROUP_PROJECT', 'CHILL', 'DATE', 'MEETING', 'INTERVIEW', 'QUICK_BITE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "minPrice" DECIMAL(10,2) NOT NULL,
    "maxPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" UUID NOT NULL,
    "code" "AmenityCode" NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purpose" (
    "id" UUID NOT NULL,
    "code" "PurposeCode" NOT NULL,

    CONSTRAINT "Purpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotAmenity" (
    "spotId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,

    CONSTRAINT "SpotAmenity_pkey" PRIMARY KEY ("spotId","amenityId")
);

-- CreateTable
CREATE TABLE "SpotPurpose" (
    "spotId" UUID NOT NULL,
    "purposeId" UUID NOT NULL,

    CONSTRAINT "SpotPurpose_pkey" PRIMARY KEY ("spotId","purposeId")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "spotId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Spot_isActive_minPrice_idx" ON "Spot"("isActive", "minPrice");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_code_key" ON "Amenity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Purpose_code_key" ON "Purpose"("code");

-- CreateIndex
CREATE INDEX "SpotAmenity_amenityId_idx" ON "SpotAmenity"("amenityId");

-- CreateIndex
CREATE INDEX "SpotPurpose_purposeId_idx" ON "SpotPurpose"("purposeId");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_spotId_idx" ON "Favorite"("spotId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_spotId_key" ON "Favorite"("userId", "spotId");

-- AddForeignKey
ALTER TABLE "SpotAmenity" ADD CONSTRAINT "SpotAmenity_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotAmenity" ADD CONSTRAINT "SpotAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPurpose" ADD CONSTRAINT "SpotPurpose_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotPurpose" ADD CONSTRAINT "SpotPurpose_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep invariants valid even across concurrent updates or non-API writes.
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_price_range_check"
    CHECK ("minPrice" >= 0 AND "maxPrice" >= "minPrice" AND "maxPrice" <= 99999999.99);
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_latitude_check"
    CHECK ("latitude" >= -90 AND "latitude" <= 90);
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_longitude_check"
    CHECK ("longitude" >= -180 AND "longitude" <= 180);
