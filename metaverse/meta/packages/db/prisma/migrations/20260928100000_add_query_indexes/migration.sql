CREATE INDEX "Space_creatorId_idx" ON "Space"("creatorId");
CREATE INDEX "ChatMessage_spaceId_timestamp_idx" ON "ChatMessage"("spaceId", "timestamp");
CREATE INDEX "spaceElements_spaceId_idx" ON "spaceElements"("spaceId");
CREATE INDEX "MapElements_mapId_idx" ON "MapElements"("mapId");
