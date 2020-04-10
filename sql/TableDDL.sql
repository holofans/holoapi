CREATE TABLE "channel" (
  "id" text PRIMARY KEY,
  "type" text,
  "ytChannelId" text,
  "bbSpaceId" text,
  "name" text,
  "description" text,
  "publishedAt" timestamp,
  "thumbnail" text,
  "ytUploadsId" text,
  "bbRoomId" text,
  "views" int,
  "subscribers" int
);

CREATE TABLE "video" (
  "videoId" text PRIMARY KEY,
  "type" text,
  "channelId" text,
  "title" text,
  "description" text,
  "publishedAt" timestamp,
  "liveSchedule" text,
  "liveStart" timestamp,
  "liveEnd" timestamp,
);

CREATE TABLE "comments" (
  "videoId" text,
  "videoTime" int,
  "message" text
);

ALTER TABLE "video" ADD FOREIGN KEY ("channelId") REFERENCES "channel" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("videoId") REFERENCES "video" ("videoId");

CREATE UNIQUE INDEX ON "channel" ("id");

CREATE INDEX ON "video" ("channelId");

CREATE INDEX ON "video" ("publishedAt");
