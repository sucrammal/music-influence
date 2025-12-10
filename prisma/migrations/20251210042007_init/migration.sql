-- CreateTable
CREATE TABLE "Artist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "wikiUrl" TEXT,
    "summary" TEXT,
    "imageUrl" TEXT,
    "lastFetched" DATETIME
);

-- CreateTable
CREATE TABLE "Influence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromArtistId" INTEGER NOT NULL,
    "toArtistId" INTEGER NOT NULL,
    "relationType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "Influence_fromArtistId_fkey" FOREIGN KEY ("fromArtistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Influence_toArtistId_fkey" FOREIGN KEY ("toArtistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");
