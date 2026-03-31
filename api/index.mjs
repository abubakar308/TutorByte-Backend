// src/app.ts
import express2 from "express";
import { toNodeHandler } from "better-auth/node";

// src/app/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/app/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.5.0",
  "engineVersion": "280c870be64f457428992c43c1f6d557fab6e29e",
  "activeProvider": "postgresql",
  "inlineSchema": 'model AdminLog {\n  id        String   @id @default(uuid())\n  adminId   String\n  action    String\n  createdAt DateTime @default(now())\n\n  admin User @relation("adminLogs", fields: [adminId], references: [id])\n}\n\nmodel User {\n  id                 String     @id @default(uuid())\n  name               String     @db.VarChar(255)\n  email              String     @unique\n  emailVerified      Boolean    @default(false)\n  image              String?\n  role               UserRole   @default(STUDENT)\n  needPasswordChange Boolean    @default(false)\n  isDeleted          Boolean    @default(false)\n  deletedAt          DateTime?\n  isVerified         Boolean    @default(false)\n  status             UserStatus @default(ACTIVE)\n  createdAt          DateTime   @default(now())\n  updatedAt          DateTime   @updatedAt\n\n  sessions Session[]\n  accounts Account[]\n\n  tutorProfile     TutorProfile?\n  reviews          Review[]       @relation("studentReviews")\n  bookings         Booking[]      @relation("studentBookings")\n  sentMessages     Message[]      @relation("sentMessages")\n  receivedMessages Message[]      @relation("receivedMessages")\n  notifications    Notification[]\n  adminLogs        AdminLog[]     @relation("adminLogs")\n  availabilities   Availability[] @relation("studentAvailability")\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id @default(uuid())\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Availability {\n  id        String    @id @default(uuid())\n  tutorId   String?\n  studentId String?\n  dayOfWeek DayOfWeek\n  startTime String\n  endTime   String\n  isActive  Boolean   @default(true)\n\n  tutor   TutorProfile? @relation(fields: [tutorId], references: [id])\n  student User?         @relation("studentAvailability", fields: [studentId], references: [id])\n\n  @@map("availability")\n}\n\nmodel Booking {\n  id          String        @id @default(uuid())\n  studentId   String\n  tutorId     String\n  subjectId   String\n  bookingDate DateTime\n  startTime   String\n  endTime     String\n  status      BookingStatus\n  totalPrice  Decimal       @db.Decimal(8, 2)\n  meetingLink String?\n  createdAt   DateTime      @default(now())\n\n  student User         @relation("studentBookings", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n  payment Payment?\n}\n\nenum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BLOCKED\n}\n\nenum SubjectCategory {\n  ACADEMIC\n  SKILLS\n  LANGUAGE\n}\n\nenum DayOfWeek {\n  SUN\n  MON\n  TUE\n  WED\n  THU\n  FRI\n  SAT\n}\n\nenum BookingStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel Language {\n  id   String @id @default(uuid())\n  name String\n\n  tutors TutorLanguages[]\n}\n\nmodel Message {\n  id         String   @id @default(uuid())\n  senderId   String\n  receiverId String\n  message    String\n  isRead     Boolean\n  createdAt  DateTime @default(now())\n\n  sender   User @relation("sentMessages", fields: [senderId], references: [id])\n  receiver User @relation("receivedMessages", fields: [receiverId], references: [id])\n}\n\nmodel Notification {\n  id        String   @id @default(uuid())\n  userId    String\n  title     String\n  message   String\n  isRead    Boolean\n  createdAt DateTime @default(now())\n\n  user User @relation(fields: [userId], references: [id])\n}\n\nmodel Payment {\n  id            String        @id @default(uuid())\n  bookingId     String        @unique\n  amount        Decimal       @db.Decimal(8, 2)\n  status        PaymentStatus\n  transactionId String\n  paymentMethod String\n  createdAt     DateTime      @default(now())\n\n  booking Booking @relation(fields: [bookingId], references: [id])\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  studentId String\n  tutorId   String\n  rating    Int\n  comment   String\n  createdAt DateTime @default(now())\n\n  student User         @relation("studentReviews", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Subject {\n  id         String          @id @default(uuid())\n  name       String\n  categories SubjectCategory\n\n  tutors   TutorSubjects[]\n  bookings Booking[]\n}\n\nmodel TutorLanguages {\n  id         String @id @default(uuid())\n  tutorId    String\n  languageId String\n\n  tutor    TutorProfile @relation(fields: [tutorId], references: [id])\n  language Language     @relation(fields: [languageId], references: [id])\n}\n\nmodel TutorProfile {\n  id              String   @id @default(uuid())\n  userId          String   @unique\n  bio             String\n  experienceYears Int\n  hourlyRate      Decimal  @db.Decimal(8, 2)\n  averageRating   Float\n  totalReviews    Int\n  isApproved      Boolean\n  createdAt       DateTime @default(now())\n\n  user           User             @relation(fields: [userId], references: [id])\n  subjects       TutorSubjects[]\n  languages      TutorLanguages[]\n  availabilities Availability[]\n  reviews        Review[]\n  bookings       Booking[]\n}\n\nmodel TutorSubjects {\n  id        String @id @default(uuid())\n  tutorId   String\n  subjectId String\n\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"AdminLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"admin","kind":"object","type":"User","relationName":"adminLogs"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"needPasswordChange","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"studentReviews"},{"name":"bookings","kind":"object","type":"Booking","relationName":"studentBookings"},{"name":"sentMessages","kind":"object","type":"Message","relationName":"sentMessages"},{"name":"receivedMessages","kind":"object","type":"Message","relationName":"receivedMessages"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"adminLogs","kind":"object","type":"AdminLog","relationName":"adminLogs"},{"name":"availabilities","kind":"object","type":"Availability","relationName":"studentAvailability"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Availability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"dayOfWeek","kind":"enum","type":"DayOfWeek"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"AvailabilityToTutorProfile"},{"name":"student","kind":"object","type":"User","relationName":"studentAvailability"}],"dbName":"availability"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"bookingDate","kind":"scalar","type":"DateTime"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"totalPrice","kind":"scalar","type":"Decimal"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentBookings"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"subject","kind":"object","type":"Subject","relationName":"BookingToSubject"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"}],"dbName":null},"Language":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tutors","kind":"object","type":"TutorLanguages","relationName":"LanguageToTutorLanguages"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"receiverId","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"sender","kind":"object","type":"User","relationName":"sentMessages"},{"name":"receiver","kind":"object","type":"User","relationName":"receivedMessages"}],"dbName":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentReviews"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"}],"dbName":null},"Subject":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"categories","kind":"enum","type":"SubjectCategory"},{"name":"tutors","kind":"object","type":"TutorSubjects","relationName":"SubjectToTutorSubjects"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToSubject"}],"dbName":null},"TutorLanguages":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"languageId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorLanguagesToTutorProfile"},{"name":"language","kind":"object","type":"Language","relationName":"LanguageToTutorLanguages"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"experienceYears","kind":"scalar","type":"Int"},{"name":"hourlyRate","kind":"scalar","type":"Decimal"},{"name":"averageRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"subjects","kind":"object","type":"TutorSubjects","relationName":"TutorProfileToTutorSubjects"},{"name":"languages","kind":"object","type":"TutorLanguages","relationName":"TutorLanguagesToTutorProfile"},{"name":"availabilities","kind":"object","type":"Availability","relationName":"AvailabilityToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"}],"dbName":null},"TutorSubjects":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorProfileToTutorSubjects"},{"name":"subject","kind":"object","type":"Subject","relationName":"SubjectToTutorSubjects"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","tutor","tutors","student","subject","booking","payment","bookings","_count","subjects","language","languages","availabilities","reviews","tutorProfile","sender","receiver","sentMessages","receivedMessages","notifications","adminLogs","admin","AdminLog.findUnique","AdminLog.findUniqueOrThrow","AdminLog.findFirst","AdminLog.findFirstOrThrow","AdminLog.findMany","data","AdminLog.createOne","AdminLog.createMany","AdminLog.createManyAndReturn","AdminLog.updateOne","AdminLog.updateMany","AdminLog.updateManyAndReturn","create","update","AdminLog.upsertOne","AdminLog.deleteOne","AdminLog.deleteMany","having","_min","_max","AdminLog.groupBy","AdminLog.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Availability.findUnique","Availability.findUniqueOrThrow","Availability.findFirst","Availability.findFirstOrThrow","Availability.findMany","Availability.createOne","Availability.createMany","Availability.createManyAndReturn","Availability.updateOne","Availability.updateMany","Availability.updateManyAndReturn","Availability.upsertOne","Availability.deleteOne","Availability.deleteMany","Availability.groupBy","Availability.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","_avg","_sum","Booking.groupBy","Booking.aggregate","Language.findUnique","Language.findUniqueOrThrow","Language.findFirst","Language.findFirstOrThrow","Language.findMany","Language.createOne","Language.createMany","Language.createManyAndReturn","Language.updateOne","Language.updateMany","Language.updateManyAndReturn","Language.upsertOne","Language.deleteOne","Language.deleteMany","Language.groupBy","Language.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Subject.findUnique","Subject.findUniqueOrThrow","Subject.findFirst","Subject.findFirstOrThrow","Subject.findMany","Subject.createOne","Subject.createMany","Subject.createManyAndReturn","Subject.updateOne","Subject.updateMany","Subject.updateManyAndReturn","Subject.upsertOne","Subject.deleteOne","Subject.deleteMany","Subject.groupBy","Subject.aggregate","TutorLanguages.findUnique","TutorLanguages.findUniqueOrThrow","TutorLanguages.findFirst","TutorLanguages.findFirstOrThrow","TutorLanguages.findMany","TutorLanguages.createOne","TutorLanguages.createMany","TutorLanguages.createManyAndReturn","TutorLanguages.updateOne","TutorLanguages.updateMany","TutorLanguages.updateManyAndReturn","TutorLanguages.upsertOne","TutorLanguages.deleteOne","TutorLanguages.deleteMany","TutorLanguages.groupBy","TutorLanguages.aggregate","TutorProfile.findUnique","TutorProfile.findUniqueOrThrow","TutorProfile.findFirst","TutorProfile.findFirstOrThrow","TutorProfile.findMany","TutorProfile.createOne","TutorProfile.createMany","TutorProfile.createManyAndReturn","TutorProfile.updateOne","TutorProfile.updateMany","TutorProfile.updateManyAndReturn","TutorProfile.upsertOne","TutorProfile.deleteOne","TutorProfile.deleteMany","TutorProfile.groupBy","TutorProfile.aggregate","TutorSubjects.findUnique","TutorSubjects.findUniqueOrThrow","TutorSubjects.findFirst","TutorSubjects.findFirstOrThrow","TutorSubjects.findMany","TutorSubjects.createOne","TutorSubjects.createMany","TutorSubjects.createManyAndReturn","TutorSubjects.updateOne","TutorSubjects.updateMany","TutorSubjects.updateManyAndReturn","TutorSubjects.upsertOne","TutorSubjects.deleteOne","TutorSubjects.deleteMany","TutorSubjects.groupBy","TutorSubjects.aggregate","AND","OR","NOT","id","tutorId","subjectId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","userId","bio","experienceYears","hourlyRate","averageRating","totalReviews","isApproved","createdAt","every","some","none","languageId","name","SubjectCategory","categories","studentId","rating","comment","bookingId","amount","PaymentStatus","status","transactionId","paymentMethod","title","message","isRead","senderId","receiverId","bookingDate","startTime","endTime","BookingStatus","totalPrice","meetingLink","DayOfWeek","dayOfWeek","isActive","identifier","value","expiresAt","updatedAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","image","UserRole","role","needPasswordChange","isDeleted","deletedAt","isVerified","UserStatus","adminId","action","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "-QeNAYACCBoAANYDACCjAgAAlQQAMKQCAAA8ABClAgAAlQQAMKYCAQAAAAG7AkAA1QMAIfQCAQDQAwAh9QIBANADACEBAAAAAQAgDAMAANYDACCjAgAApQQAMKQCAAADABClAgAApQQAMKYCAQDQAwAhtAIBANADACG7AkAA1QMAIdwCQADVAwAh3QJAANUDACHnAgEA0AMAIegCAQCKBAAh6QIBAIoEACEDAwAAlQUAIOgCAADlBQAg6QIAAOUFACAMAwAA1gMAIKMCAAClBAAwpAIAAAMAEKUCAAClBAAwpgIBAAAAAbQCAQDQAwAhuwJAANUDACHcAkAA1QMAId0CQADVAwAh5wIBAAAAAegCAQCKBAAh6QIBAIoEACEDAAAAAwAgAQAABAAwAgAABQAgEQMAANYDACCjAgAApAQAMKQCAAAHABClAgAApAQAMKYCAQDQAwAhtAIBANADACG7AkAA1QMAId0CQADVAwAh3gIBANADACHfAgEA0AMAIeACAQCKBAAh4QIBAIoEACHiAgEAigQAIeMCQACMBAAh5AJAAIwEACHlAgEAigQAIeYCAQCKBAAhCAMAAJUFACDgAgAA5QUAIOECAADlBQAg4gIAAOUFACDjAgAA5QUAIOQCAADlBQAg5QIAAOUFACDmAgAA5QUAIBEDAADWAwAgowIAAKQEADCkAgAABwAQpQIAAKQEADCmAgEAAAABtAIBANADACG7AkAA1QMAId0CQADVAwAh3gIBANADACHfAgEA0AMAIeACAQCKBAAh4QIBAIoEACHiAgEAigQAIeMCQACMBAAh5AJAAIwEACHlAgEAigQAIeYCAQCKBAAhAwAAAAcAIAEAAAgAMAIAAAkAIBIDAADWAwAgDAAA2wMAIA4AANcDACAQAADYAwAgEQAA2QMAIBIAANoDACCjAgAAzwMAMKQCAAALABClAgAAzwMAMKYCAQDQAwAhtAIBANADACG1AgEA0AMAIbYCAgDRAwAhtwIQANIDACG4AggA0wMAIbkCAgDRAwAhugIgANQDACG7AkAA1QMAIQEAAAALACAIBgAAmQQAIAkAAKEEACCjAgAAowQAMKQCAAANABClAgAAowQAMKYCAQDQAwAhpwIBANADACGoAgEA0AMAIQIGAAD-BgAgCQAAiAcAIAgGAACZBAAgCQAAoQQAIKMCAACjBAAwpAIAAA0AEKUCAACjBAAwpgIBAAAAAacCAQDQAwAhqAIBANADACEDAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIBIGAACZBAAgCAAA1gMAIAkAAKEEACALAACiBAAgowIAAJ8EADCkAgAAEgAQpQIAAJ8EADCmAgEA0AMAIacCAQDQAwAhqAIBANADACG7AkAA1QMAIcMCAQDQAwAhyQIAAKAE1QIi0QJAANUDACHSAgEA0AMAIdMCAQDQAwAh1QIQANIDACHWAgEAigQAIQUGAAD-BgAgCAAAlQUAIAkAAIgHACALAACJBwAg1gIAAOUFACASBgAAmQQAIAgAANYDACAJAAChBAAgCwAAogQAIKMCAACfBAAwpAIAABIAEKUCAACfBAAwpgIBAAAAAacCAQDQAwAhqAIBANADACG7AkAA1QMAIcMCAQDQAwAhyQIAAKAE1QIi0QJAANUDACHSAgEA0AMAIdMCAQDQAwAh1QIQANIDACHWAgEAigQAIQMAAAASACABAAATADACAAAUACALCgAA6gMAIKMCAADoAwAwpAIAABYAEKUCAADoAwAwpgIBANADACG7AkAA1QMAIcYCAQDQAwAhxwIQANIDACHJAgAA6QPJAiLKAgEA0AMAIcsCAQDQAwAhAQAAABYAIAEAAAANACABAAAAEgAgCAYAAJkEACAPAACeBAAgowIAAJ0EADCkAgAAGgAQpQIAAJ0EADCmAgEA0AMAIacCAQDQAwAhvwIBANADACECBgAA_gYAIA8AAIcHACAIBgAAmQQAIA8AAJ4EACCjAgAAnQQAMKQCAAAaABClAgAAnQQAMKYCAQAAAAGnAgEA0AMAIb8CAQDQAwAhAwAAABoAIAEAABsAMAIAABwAIAMAAAAaACABAAAbADACAAAcACABAAAAGgAgDAYAAJAEACAIAACcBAAgowIAAJoEADCkAgAAIAAQpQIAAJoEADCmAgEA0AMAIacCAQCKBAAhwwIBAIoEACHSAgEA0AMAIdMCAQDQAwAh2AIAAJsE2AIi2QIgANQDACEEBgAA_gYAIAgAAJUFACCnAgAA5QUAIMMCAADlBQAgDAYAAJAEACAIAACcBAAgowIAAJoEADCkAgAAIAAQpQIAAJoEADCmAgEAAAABpwIBAIoEACHDAgEAigQAIdICAQDQAwAh0wIBANADACHYAgAAmwTYAiLZAiAA1AMAIQMAAAAgACABAAAhADACAAAiACABAAAACwAgGgQAAI4EACAFAACPBAAgDAAA2wMAIBEAANkDACASAADaAwAgEwAAkAQAIBYAAJEEACAXAACRBAAgGAAAkgQAIBkAAJMEACCjAgAAiQQAMKQCAAAlABClAgAAiQQAMKYCAQDQAwAhuwJAANUDACHAAgEA0AMAIckCAACNBPQCIt0CQADVAwAh6gIBANADACHrAiAA1AMAIewCAQCKBAAh7gIAAIsE7gIi7wIgANQDACHwAiAA1AMAIfECQACMBAAh8gIgANQDACEBAAAAJQAgCwYAAJkEACAIAADWAwAgowIAAJgEADCkAgAAJwAQpQIAAJgEADCmAgEA0AMAIacCAQDQAwAhuwJAANUDACHDAgEA0AMAIcQCAgDRAwAhxQIBANADACECBgAA_gYAIAgAAJUFACALBgAAmQQAIAgAANYDACCjAgAAmAQAMKQCAAAnABClAgAAmAQAMKYCAQAAAAGnAgEA0AMAIbsCQADVAwAhwwIBANADACHEAgIA0QMAIcUCAQDQAwAhAwAAACcAIAEAACgAMAIAACkAIAMAAAASACABAAATADACAAAUACABAAAADQAgAQAAABoAIAEAAAAgACABAAAAJwAgAQAAABIAIAMAAAAnACABAAAoADACAAApACADAAAAEgAgAQAAEwAwAgAAFAAgCxQAANYDACAVAADWAwAgowIAAJcEADCkAgAAMwAQpQIAAJcEADCmAgEA0AMAIbsCQADVAwAhzQIBANADACHOAiAA1AMAIc8CAQDQAwAh0AIBANADACECFAAAlQUAIBUAAJUFACALFAAA1gMAIBUAANYDACCjAgAAlwQAMKQCAAAzABClAgAAlwQAMKYCAQAAAAG7AkAA1QMAIc0CAQDQAwAhzgIgANQDACHPAgEA0AMAIdACAQDQAwAhAwAAADMAIAEAADQAMAIAADUAIAMAAAAzACABAAA0ADACAAA1ACAKAwAA1gMAIKMCAACWBAAwpAIAADgAEKUCAACWBAAwpgIBANADACG0AgEA0AMAIbsCQADVAwAhzAIBANADACHNAgEA0AMAIc4CIADUAwAhAQMAAJUFACAKAwAA1gMAIKMCAACWBAAwpAIAADgAEKUCAACWBAAwpgIBAAAAAbQCAQDQAwAhuwJAANUDACHMAgEA0AMAIc0CAQDQAwAhzgIgANQDACEDAAAAOAAgAQAAOQAwAgAAOgAgCBoAANYDACCjAgAAlQQAMKQCAAA8ABClAgAAlQQAMKYCAQDQAwAhuwJAANUDACH0AgEA0AMAIfUCAQDQAwAhARoAAJUFACADAAAAPAAgAQAAPQAwAgAAAQAgAwAAACAAIAEAACEAMAIAACIAIAEAAAADACABAAAABwAgAQAAACcAIAEAAAASACABAAAAMwAgAQAAADMAIAEAAAA4ACABAAAAPAAgAQAAACAAIAEAAAABACADAAAAPAAgAQAAPQAwAgAAAQAgAwAAADwAIAEAAD0AMAIAAAEAIAMAAAA8ACABAAA9ADACAAABACAFGgAAhgcAIKYCAQAAAAG7AkAAAAAB9AIBAAAAAfUCAQAAAAEBIAAATQAgBKYCAQAAAAG7AkAAAAAB9AIBAAAAAfUCAQAAAAEBIAAATwAwASAAAE8AMAUaAACFBwAgpgIBAKkEACG7AkAAtwQAIfQCAQCpBAAh9QIBAKkEACECAAAAAQAgIAAAUgAgBKYCAQCpBAAhuwJAALcEACH0AgEAqQQAIfUCAQCpBAAhAgAAADwAICAAAFQAIAIAAAA8ACAgAABUACADAAAAAQAgJwAATQAgKAAAUgAgAQAAAAEAIAEAAAA8ACADDQAAggcAIC0AAIQHACAuAACDBwAgB6MCAACUBAAwpAIAAFsAEKUCAACUBAAwpgIBALwDACG7AkAAxQMAIfQCAQC8AwAh9QIBALwDACEDAAAAPAAgAQAAWgAwLAAAWwAgAwAAADwAIAEAAD0AMAIAAAEAIBoEAACOBAAgBQAAjwQAIAwAANsDACARAADZAwAgEgAA2gMAIBMAAJAEACAWAACRBAAgFwAAkQQAIBgAAJIEACAZAACTBAAgowIAAIkEADCkAgAAJQAQpQIAAIkEADCmAgEAAAABuwJAANUDACHAAgEA0AMAIckCAACNBPQCIt0CQADVAwAh6gIBAAAAAesCIADUAwAh7AIBAIoEACHuAgAAiwTuAiLvAiAA1AMAIfACIADUAwAh8QJAAIwEACHyAiAA1AMAIQEAAABeACABAAAAXgAgDAQAAPwGACAFAAD9BgAgDAAAmgUAIBEAAJgFACASAACZBQAgEwAA_gYAIBYAAP8GACAXAAD_BgAgGAAAgAcAIBkAAIEHACDsAgAA5QUAIPECAADlBQAgAwAAACUAIAEAAGEAMAIAAF4AIAMAAAAlACABAABhADACAABeACADAAAAJQAgAQAAYQAwAgAAXgAgFwQAAPIGACAFAADzBgAgDAAA9gYAIBEAAPsGACASAAD1BgAgEwAA9AYAIBYAAPcGACAXAAD4BgAgGAAA-QYAIBkAAPoGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPQCAt0CQAAAAAHqAgEAAAAB6wIgAAAAAewCAQAAAAHuAgAAAO4CAu8CIAAAAAHwAiAAAAAB8QJAAAAAAfICIAAAAAEBIAAAZQAgDaYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA9AIC3QJAAAAAAeoCAQAAAAHrAiAAAAAB7AIBAAAAAe4CAAAA7gIC7wIgAAAAAfACIAAAAAHxAkAAAAAB8gIgAAAAAQEgAABnADABIAAAZwAwFwQAAIMGACAFAACEBgAgDAAAhwYAIBEAAIwGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqQQAIbsCQAC3BAAhwAIBAKkEACHJAgAAggb0AiLdAkAAtwQAIeoCAQCpBAAh6wIgALYEACHsAgEAyQQAIe4CAACBBu4CIu8CIAC2BAAh8AIgALYEACHxAkAA9gUAIfICIAC2BAAhAgAAAF4AICAAAGoAIA2mAgEAqQQAIbsCQAC3BAAhwAIBAKkEACHJAgAAggb0AiLdAkAAtwQAIeoCAQCpBAAh6wIgALYEACHsAgEAyQQAIe4CAACBBu4CIu8CIAC2BAAh8AIgALYEACHxAkAA9gUAIfICIAC2BAAhAgAAACUAICAAAGwAIAIAAAAlACAgAABsACADAAAAXgAgJwAAZQAgKAAAagAgAQAAAF4AIAEAAAAlACAFDQAA_gUAIC0AAIAGACAuAAD_BQAg7AIAAOUFACDxAgAA5QUAIBCjAgAAggQAMKQCAABzABClAgAAggQAMKYCAQC8AwAhuwJAAMUDACHAAgEAvAMAIckCAACEBPQCIt0CQADFAwAh6gIBALwDACHrAiAAxAMAIewCAQDxAwAh7gIAAIME7gIi7wIgAMQDACHwAiAAxAMAIfECQAD-AwAh8gIgAMQDACEDAAAAJQAgAQAAcgAwLAAAcwAgAwAAACUAIAEAAGEAMAIAAF4AIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCQMAAP0FACCmAgEAAAABtAIBAAAAAbsCQAAAAAHcAkAAAAAB3QJAAAAAAecCAQAAAAHoAgEAAAAB6QIBAAAAAQEgAAB7ACAIpgIBAAAAAbQCAQAAAAG7AkAAAAAB3AJAAAAAAd0CQAAAAAHnAgEAAAAB6AIBAAAAAekCAQAAAAEBIAAAfQAwASAAAH0AMAkDAAD8BQAgpgIBAKkEACG0AgEAqQQAIbsCQAC3BAAh3AJAALcEACHdAkAAtwQAIecCAQCpBAAh6AIBAMkEACHpAgEAyQQAIQIAAAAFACAgAACAAQAgCKYCAQCpBAAhtAIBAKkEACG7AkAAtwQAIdwCQAC3BAAh3QJAALcEACHnAgEAqQQAIegCAQDJBAAh6QIBAMkEACECAAAAAwAgIAAAggEAIAIAAAADACAgAACCAQAgAwAAAAUAICcAAHsAICgAAIABACABAAAABQAgAQAAAAMAIAUNAAD5BQAgLQAA-wUAIC4AAPoFACDoAgAA5QUAIOkCAADlBQAgC6MCAACBBAAwpAIAAIkBABClAgAAgQQAMKYCAQC8AwAhtAIBALwDACG7AkAAxQMAIdwCQADFAwAh3QJAAMUDACHnAgEAvAMAIegCAQDxAwAh6QIBAPEDACEDAAAAAwAgAQAAiAEAMCwAAIkBACADAAAAAwAgAQAABAAwAgAABQAgAQAAAAkAIAEAAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACAOAwAA-AUAIKYCAQAAAAG0AgEAAAABuwJAAAAAAd0CQAAAAAHeAgEAAAAB3wIBAAAAAeACAQAAAAHhAgEAAAAB4gIBAAAAAeMCQAAAAAHkAkAAAAAB5QIBAAAAAeYCAQAAAAEBIAAAkQEAIA2mAgEAAAABtAIBAAAAAbsCQAAAAAHdAkAAAAAB3gIBAAAAAd8CAQAAAAHgAgEAAAAB4QIBAAAAAeICAQAAAAHjAkAAAAAB5AJAAAAAAeUCAQAAAAHmAgEAAAABASAAAJMBADABIAAAkwEAMA4DAAD3BQAgpgIBAKkEACG0AgEAqQQAIbsCQAC3BAAh3QJAALcEACHeAgEAqQQAId8CAQCpBAAh4AIBAMkEACHhAgEAyQQAIeICAQDJBAAh4wJAAPYFACHkAkAA9gUAIeUCAQDJBAAh5gIBAMkEACECAAAACQAgIAAAlgEAIA2mAgEAqQQAIbQCAQCpBAAhuwJAALcEACHdAkAAtwQAId4CAQCpBAAh3wIBAKkEACHgAgEAyQQAIeECAQDJBAAh4gIBAMkEACHjAkAA9gUAIeQCQAD2BQAh5QIBAMkEACHmAgEAyQQAIQIAAAAHACAgAACYAQAgAgAAAAcAICAAAJgBACADAAAACQAgJwAAkQEAICgAAJYBACABAAAACQAgAQAAAAcAIAoNAADzBQAgLQAA9QUAIC4AAPQFACDgAgAA5QUAIOECAADlBQAg4gIAAOUFACDjAgAA5QUAIOQCAADlBQAg5QIAAOUFACDmAgAA5QUAIBCjAgAA_QMAMKQCAACfAQAQpQIAAP0DADCmAgEAvAMAIbQCAQC8AwAhuwJAAMUDACHdAkAAxQMAId4CAQC8AwAh3wIBALwDACHgAgEA8QMAIeECAQDxAwAh4gIBAPEDACHjAkAA_gMAIeQCQAD-AwAh5QIBAPEDACHmAgEA8QMAIQMAAAAHACABAACeAQAwLAAAnwEAIAMAAAAHACABAAAIADACAAAJACAJowIAAPwDADCkAgAApQEAEKUCAAD8AwAwpgIBAAAAAbsCQADVAwAh2gIBANADACHbAgEA0AMAIdwCQADVAwAh3QJAANUDACEBAAAAogEAIAEAAACiAQAgCaMCAAD8AwAwpAIAAKUBABClAgAA_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AIAIAamAgEAqQQAIbQCAQCpBAAhuwJAALcEACHMAgEAqQQAIc0CAQCpBAAhzgIgALYEACECAAAAOAAgIAAApgIAIAIAAAA4ACAgAACmAgAgAwAAADoAICcAAJ8CACAoAACkAgAgAQAAADoAIAEAAAA4ACADDQAAywUAIC0AAM0FACAuAADMBQAgCaMCAADrAwAwpAIAAK0CABClAgAA6wMAMKYCAQC8AwAhtAIBALwDACG7AkAAxQMAIcwCAQC8AwAhzQIBALwDACHOAiAAxAMAIQMAAAA4ACABAACsAgAwLAAArQIAIAMAAAA4ACABAAA5ADACAAA6ACALCgAA6gMAIKMCAADoAwAwpAIAABYAEKUCAADoAwAwpgIBAAAAAbsCQADVAwAhxgIBAAAAAccCEADSAwAhyQIAAOkDyQIiygIBANADACHLAgEA0AMAIQEAAACwAgAgAQAAALACACABCgAAygUAIAMAAAAWACABAACzAgAwAgAAsAIAIAMAAAAWACABAACzAgAwAgAAsAIAIAMAAAAWACABAACzAgAwAgAAsAIAIAgKAADJBQAgpgIBAAAAAbsCQAAAAAHGAgEAAAABxwIQAAAAAckCAAAAyQICygIBAAAAAcsCAQAAAAEBIAAAtwIAIAemAgEAAAABuwJAAAAAAcYCAQAAAAHHAhAAAAAByQIAAADJAgLKAgEAAAABywIBAAAAAQEgAAC5AgAwASAAALkCADAICgAAyAUAIKYCAQCpBAAhuwJAALcEACHGAgEAqQQAIccCEAC0BAAhyQIAANMEyQIiygIBAKkEACHLAgEAqQQAIQIAAACwAgAgIAAAvAIAIAemAgEAqQQAIbsCQAC3BAAhxgIBAKkEACHHAhAAtAQAIckCAADTBMkCIsoCAQCpBAAhywIBAKkEACECAAAAFgAgIAAAvgIAIAIAAAAWACAgAAC-AgAgAwAAALACACAnAAC3AgAgKAAAvAIAIAEAAACwAgAgAQAAABYAIAUNAADDBQAgLQAAxgUAIC4AAMUFACCPAQAAxAUAIJABAADHBQAgCqMCAADkAwAwpAIAAMUCABClAgAA5AMAMKYCAQC8AwAhuwJAAMUDACHGAgEAvAMAIccCEADCAwAhyQIAAOUDyQIiygIBALwDACHLAgEAvAMAIQMAAAAWACABAADEAgAwLAAAxQIAIAMAAAAWACABAACzAgAwAgAAsAIAIAEAAAApACABAAAAKQAgAwAAACcAIAEAACgAMAIAACkAIAMAAAAnACABAAAoADACAAApACADAAAAJwAgAQAAKAAwAgAAKQAgCAYAAMIFACAIAADlBAAgpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABASAAAM0CACAGpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABASAAAM8CADABIAAAzwIAMAgGAADBBQAgCAAA4wQAIKYCAQCpBAAhpwIBAKkEACG7AkAAtwQAIcMCAQCpBAAhxAICALMEACHFAgEAqQQAIQIAAAApACAgAADSAgAgBqYCAQCpBAAhpwIBAKkEACG7AkAAtwQAIcMCAQCpBAAhxAICALMEACHFAgEAqQQAIQIAAAAnACAgAADUAgAgAgAAACcAICAAANQCACADAAAAKQAgJwAAzQIAICgAANICACABAAAAKQAgAQAAACcAIAUNAAC8BQAgLQAAvwUAIC4AAL4FACCPAQAAvQUAIJABAADABQAgCaMCAADjAwAwpAIAANsCABClAgAA4wMAMKYCAQC8AwAhpwIBALwDACG7AkAAxQMAIcMCAQC8AwAhxAICAMEDACHFAgEAvAMAIQMAAAAnACABAADaAgAwLAAA2wIAIAMAAAAnACABAAAoADACAAApACAIBwAA1wMAIAwAANsDACCjAgAA4QMAMKQCAADhAgAQpQIAAOEDADCmAgEAAAABwAIBANADACHCAgAA4gPCAiIBAAAA3gIAIAEAAADeAgAgCAcAANcDACAMAADbAwAgowIAAOEDADCkAgAA4QIAEKUCAADhAwAwpgIBANADACHAAgEA0AMAIcICAADiA8ICIgIHAACWBQAgDAAAmgUAIAMAAADhAgAgAQAA4gIAMAIAAN4CACADAAAA4QIAIAEAAOICADACAADeAgAgAwAAAOECACABAADiAgAwAgAA3gIAIAUHAAC6BQAgDAAAuwUAIKYCAQAAAAHAAgEAAAABwgIAAADCAgIBIAAA5gIAIAOmAgEAAAABwAIBAAAAAcICAAAAwgICASAAAOgCADABIAAA6AIAMAUHAACkBQAgDAAApQUAIKYCAQCpBAAhwAIBAKkEACHCAgAAowXCAiICAAAA3gIAICAAAOsCACADpgIBAKkEACHAAgEAqQQAIcICAACjBcICIgIAAADhAgAgIAAA7QIAIAIAAADhAgAgIAAA7QIAIAMAAADeAgAgJwAA5gIAICgAAOsCACABAAAA3gIAIAEAAADhAgAgAw0AAKAFACAtAACiBQAgLgAAoQUAIAajAgAA3QMAMKQCAAD0AgAQpQIAAN0DADCmAgEAvAMAIcACAQC8AwAhwgIAAN4DwgIiAwAAAOECACABAADzAgAwLAAA9AIAIAMAAADhAgAgAQAA4gIAMAIAAN4CACABAAAAHAAgAQAAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAUGAACfBQAgDwAAggUAIKYCAQAAAAGnAgEAAAABvwIBAAAAAQEgAAD8AgAgA6YCAQAAAAGnAgEAAAABvwIBAAAAAQEgAAD-AgAwASAAAP4CADAFBgAAngUAIA8AAIAFACCmAgEAqQQAIacCAQCpBAAhvwIBAKkEACECAAAAHAAgIAAAgQMAIAOmAgEAqQQAIacCAQCpBAAhvwIBAKkEACECAAAAGgAgIAAAgwMAIAIAAAAaACAgAACDAwAgAwAAABwAICcAAPwCACAoAACBAwAgAQAAABwAIAEAAAAaACADDQAAmwUAIC0AAJ0FACAuAACcBQAgBqMCAADcAwAwpAIAAIoDABClAgAA3AMAMKYCAQC8AwAhpwIBALwDACG_AgEAvAMAIQMAAAAaACABAACJAwAwLAAAigMAIAMAAAAaACABAAAbADACAAAcACASAwAA1gMAIAwAANsDACAOAADXAwAgEAAA2AMAIBEAANkDACASAADaAwAgowIAAM8DADCkAgAACwAQpQIAAM8DADCmAgEAAAABtAIBAAAAAbUCAQDQAwAhtgICANEDACG3AhAA0gMAIbgCCADTAwAhuQICANEDACG6AiAA1AMAIbsCQADVAwAhAQAAAI0DACABAAAAjQMAIAYDAACVBQAgDAAAmgUAIA4AAJYFACAQAACXBQAgEQAAmAUAIBIAAJkFACADAAAACwAgAQAAkAMAMAIAAI0DACADAAAACwAgAQAAkAMAMAIAAI0DACADAAAACwAgAQAAkAMAMAIAAI0DACAPAwAAjwUAIAwAAJQFACAOAACQBQAgEAAAkQUAIBEAAJIFACASAACTBQAgpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABASAAAJQDACAJpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABASAAAJYDADABIAAAlgMAMA8DAAC4BAAgDAAAvQQAIA4AALkEACAQAAC6BAAgEQAAuwQAIBIAALwEACCmAgEAqQQAIbQCAQCpBAAhtQIBAKkEACG2AgIAswQAIbcCEAC0BAAhuAIIALUEACG5AgIAswQAIboCIAC2BAAhuwJAALcEACECAAAAjQMAICAAAJkDACAJpgIBAKkEACG0AgEAqQQAIbUCAQCpBAAhtgICALMEACG3AhAAtAQAIbgCCAC1BAAhuQICALMEACG6AiAAtgQAIbsCQAC3BAAhAgAAAAsAICAAAJsDACACAAAACwAgIAAAmwMAIAMAAACNAwAgJwAAlAMAICgAAJkDACABAAAAjQMAIAEAAAALACAFDQAArgQAIC0AALEEACAuAACwBAAgjwEAAK8EACCQAQAAsgQAIAyjAgAAwAMAMKQCAACiAwAQpQIAAMADADCmAgEAvAMAIbQCAQC8AwAhtQIBALwDACG2AgIAwQMAIbcCEADCAwAhuAIIAMMDACG5AgIAwQMAIboCIADEAwAhuwJAAMUDACEDAAAACwAgAQAAoQMAMCwAAKIDACADAAAACwAgAQAAkAMAMAIAAI0DACABAAAADwAgAQAAAA8AIAMAAAANACABAAAOADACAAAPACADAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAUGAACsBAAgCQAArQQAIKYCAQAAAAGnAgEAAAABqAIBAAAAAQEgAACqAwAgA6YCAQAAAAGnAgEAAAABqAIBAAAAAQEgAACsAwAwASAAAKwDADAFBgAAqgQAIAkAAKsEACCmAgEAqQQAIacCAQCpBAAhqAIBAKkEACECAAAADwAgIAAArwMAIAOmAgEAqQQAIacCAQCpBAAhqAIBAKkEACECAAAADQAgIAAAsQMAIAIAAAANACAgAACxAwAgAwAAAA8AICcAAKoDACAoAACvAwAgAQAAAA8AIAEAAAANACADDQAApgQAIC0AAKgEACAuAACnBAAgBqMCAAC7AwAwpAIAALgDABClAgAAuwMAMKYCAQC8AwAhpwIBALwDACGoAgEAvAMAIQMAAAANACABAAC3AwAwLAAAuAMAIAMAAAANACABAAAOADACAAAPACAGowIAALsDADCkAgAAuAMAEKUCAAC7AwAwpgIBALwDACGnAgEAvAMAIagCAQC8AwAhDg0AAL4DACAtAAC_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-AwAgLQAA-gMAIC4AAPoDACCpAgAAANgCAqoCAAAA2AIIqwIAAADYAgizAgAA-QPYAiIEqQIAAADYAgKqAgAAANgCCKsCAAAA2AIIswIAAPoD2AIiCaMCAAD7AwAwpAIAALgBABClAgAA-wMAMKYCAQC8AwAhuwJAAMUDACHaAgEAvAMAIdsCAQC8AwAh3AJAAMUDACHdAkAAxQMAIQmjAgAA_AMAMKQCAAClAQAQpQIAAPwDADCmAgEA0AMAIbsCQADVAwAh2gIBANADACHbAgEA0AMAIdwCQADVAwAh3QJAANUDACEQowIAAP0DADCkAgAAnwEAEKUCAAD9AwAwpgIBALwDACG0AgEAvAMAIbsCQADFAwAh3QJAAMUDACHeAgEAvAMAId8CAQC8AwAh4AIBAPEDACHhAgEA8QMAIeICAQDxAwAh4wJAAP4DACHkAkAA_gMAIeUCAQDxAwAh5gIBAPEDACELDQAA8wMAIC0AAIAEACAuAACABAAgqQJAAAAAAaoCQAAAAAWrAkAAAAAFrAJAAAAAAa0CQAAAAAGuAkAAAAABrwJAAAAAAbMCQAD_AwAhCw0AAPMDACAtAACABAAgLgAAgAQAIKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAA_wMAIQipAkAAAAABqgJAAAAABasCQAAAAAWsAkAAAAABrQJAAAAAAa4CQAAAAAGvAkAAAAABswJAAIAEACELowIAAIEEADCkAgAAiQEAEKUCAACBBAAwpgIBALwDACG0AgEAvAMAIbsCQADFAwAh3AJAAMUDACHdAkAAxQMAIecCAQC8AwAh6AIBAPEDACHpAgEA8QMAIRCjAgAAggQAMKQCAABzABClAgAAggQAMKYCAQC8AwAhuwJAAMUDACHAAgEAvAMAIckCAACEBPQCIt0CQADFAwAh6gIBALwDACHrAiAAxAMAIewCAQDxAwAh7gIAAIME7gIi7wIgAMQDACHwAiAAxAMAIfECQAD-AwAh8gIgAMQDACEHDQAAvgMAIC0AAIgEACAuAACIBAAgqQIAAADuAgKqAgAAAO4CCKsCAAAA7gIIswIAAIcE7gIiBw0AAL4DACAtAACGBAAgLgAAhgQAIKkCAAAA9AICqgIAAAD0AgirAgAAAPQCCLMCAACFBPQCIgcNAAC-AwAgLQAAhgQAIC4AAIYEACCpAgAAAPQCAqoCAAAA9AIIqwIAAAD0AgizAgAAhQT0AiIEqQIAAAD0AgKqAgAAAPQCCKsCAAAA9AIIswIAAIYE9AIiBw0AAL4DACAtAACIBAAgLgAAiAQAIKkCAAAA7gICqgIAAADuAgirAgAAAO4CCLMCAACHBO4CIgSpAgAAAO4CAqoCAAAA7gIIqwIAAADuAgizAgAAiATuAiIaBAAAjgQAIAUAAI8EACAMAADbAwAgEQAA2QMAIBIAANoDACATAACQBAAgFgAAkQQAIBcAAJEEACAYAACSBAAgGQAAkwQAIKMCAACJBAAwpAIAACUAEKUCAACJBAAwpgIBANADACG7AkAA1QMAIcACAQDQAwAhyQIAAI0E9AIi3QJAANUDACHqAgEA0AMAIesCIADUAwAh7AIBAIoEACHuAgAAiwTuAiLvAiAA1AMAIfACIADUAwAh8QJAAIwEACHyAiAA1AMAIQupAgEAAAABqgIBAAAABasCAQAAAAWsAgEAAAABrQIBAAAAAa4CAQAAAAGvAgEAAAABsAIBAAAAAbECAQAAAAGyAgEAAAABswIBAPQDACEEqQIAAADuAgKqAgAAAO4CCKsCAAAA7gIIswIAAIgE7gIiCKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAAgAQAIQSpAgAAAPQCAqoCAAAA9AIIqwIAAAD0AgizAgAAhgT0AiIDvAIAAAMAIL0CAAADACC-AgAAAwAgA7wCAAAHACC9AgAABwAgvgIAAAcAIBQDAADWAwAgDAAA2wMAIA4AANcDACAQAADYAwAgEQAA2QMAIBIAANoDACCjAgAAzwMAMKQCAAALABClAgAAzwMAMKYCAQDQAwAhtAIBANADACG1AgEA0AMAIbYCAgDRAwAhtwIQANIDACG4AggA0wMAIbkCAgDRAwAhugIgANQDACG7AkAA1QMAIfYCAAALACD3AgAACwAgA7wCAAAzACC9AgAAMwAgvgIAADMAIAO8AgAAOAAgvQIAADgAIL4CAAA4ACADvAIAADwAIL0CAAA8ACC-AgAAPAAgB6MCAACUBAAwpAIAAFsAEKUCAACUBAAwpgIBALwDACG7AkAAxQMAIfQCAQC8AwAh9QIBALwDACEIGgAA1gMAIKMCAACVBAAwpAIAADwAEKUCAACVBAAwpgIBANADACG7AkAA1QMAIfQCAQDQAwAh9QIBANADACEKAwAA1gMAIKMCAACWBAAwpAIAADgAEKUCAACWBAAwpgIBANADACG0AgEA0AMAIbsCQADVAwAhzAIBANADACHNAgEA0AMAIc4CIADUAwAhCxQAANYDACAVAADWAwAgowIAAJcEADCkAgAAMwAQpQIAAJcEADCmAgEA0AMAIbsCQADVAwAhzQIBANADACHOAiAA1AMAIc8CAQDQAwAh0AIBANADACELBgAAmQQAIAgAANYDACCjAgAAmAQAMKQCAAAnABClAgAAmAQAMKYCAQDQAwAhpwIBANADACG7AkAA1QMAIcMCAQDQAwAhxAICANEDACHFAgEA0AMAIRQDAADWAwAgDAAA2wMAIA4AANcDACAQAADYAwAgEQAA2QMAIBIAANoDACCjAgAAzwMAMKQCAAALABClAgAAzwMAMKYCAQDQAwAhtAIBANADACG1AgEA0AMAIbYCAgDRAwAhtwIQANIDACG4AggA0wMAIbkCAgDRAwAhugIgANQDACG7AkAA1QMAIfYCAAALACD3AgAACwAgDAYAAJAEACAIAACcBAAgowIAAJoEADCkAgAAIAAQpQIAAJoEADCmAgEA0AMAIacCAQCKBAAhwwIBAIoEACHSAgEA0AMAIdMCAQDQAwAh2AIAAJsE2AIi2QIgANQDACEEqQIAAADYAgKqAgAAANgCCKsCAAAA2AIIswIAAPoD2AIiHAQAAI4EACAFAACPBAAgDAAA2wMAIBEAANkDACASAADaAwAgEwAAkAQAIBYAAJEEACAXAACRBAAgGAAAkgQAIBkAAJMEACCjAgAAiQQAMKQCAAAlABClAgAAiQQAMKYCAQDQAwAhuwJAANUDACHAAgEA0AMAIckCAACNBPQCIt0CQADVAwAh6gIBANADACHrAiAA1AMAIewCAQCKBAAh7gIAAIsE7gIi7wIgANQDACHwAiAA1AMAIfECQACMBAAh8gIgANQDACH2AgAAJQAg9wIAACUAIAgGAACZBAAgDwAAngQAIKMCAACdBAAwpAIAABoAEKUCAACdBAAwpgIBANADACGnAgEA0AMAIb8CAQDQAwAhCAcAANgDACCjAgAA7gMAMKQCAADuAQAQpQIAAO4DADCmAgEA0AMAIcACAQDQAwAh9gIAAO4BACD3AgAA7gEAIBIGAACZBAAgCAAA1gMAIAkAAKEEACALAACiBAAgowIAAJ8EADCkAgAAEgAQpQIAAJ8EADCmAgEA0AMAIacCAQDQAwAhqAIBANADACG7AkAA1QMAIcMCAQDQAwAhyQIAAKAE1QIi0QJAANUDACHSAgEA0AMAIdMCAQDQAwAh1QIQANIDACHWAgEAigQAIQSpAgAAANUCAqoCAAAA1QIIqwIAAADVAgizAgAA9gPVAiIKBwAA1wMAIAwAANsDACCjAgAA4QMAMKQCAADhAgAQpQIAAOEDADCmAgEA0AMAIcACAQDQAwAhwgIAAOIDwgIi9gIAAOECACD3AgAA4QIAIA0KAADqAwAgowIAAOgDADCkAgAAFgAQpQIAAOgDADCmAgEA0AMAIbsCQADVAwAhxgIBANADACHHAhAA0gMAIckCAADpA8kCIsoCAQDQAwAhywIBANADACH2AgAAFgAg9wIAABYAIAgGAACZBAAgCQAAoQQAIKMCAACjBAAwpAIAAA0AEKUCAACjBAAwpgIBANADACGnAgEA0AMAIagCAQDQAwAhEQMAANYDACCjAgAApAQAMKQCAAAHABClAgAApAQAMKYCAQDQAwAhtAIBANADACG7AkAA1QMAId0CQADVAwAh3gIBANADACHfAgEA0AMAIeACAQCKBAAh4QIBAIoEACHiAgEAigQAIeMCQACMBAAh5AJAAIwEACHlAgEAigQAIeYCAQCKBAAhDAMAANYDACCjAgAApQQAMKQCAAADABClAgAApQQAMKYCAQDQAwAhtAIBANADACG7AkAA1QMAIdwCQADVAwAh3QJAANUDACHnAgEA0AMAIegCAQCKBAAh6QIBAIoEACEAAAAB-wIBAAAAAQUnAADyBwAgKAAA-AcAIPgCAADzBwAg-QIAAPcHACD-AgAAjQMAIAUnAADwBwAgKAAA9QcAIPgCAADxBwAg-QIAAPQHACD-AgAA3gIAIAMnAADyBwAg-AIAAPMHACD-AgAAjQMAIAMnAADwBwAg-AIAAPEHACD-AgAA3gIAIAAAAAAABfsCAgAAAAGBAwIAAAABggMCAAAAAYMDAgAAAAGEAwIAAAABBfsCEAAAAAGBAxAAAAABggMQAAAAAYMDEAAAAAGEAxAAAAABBfsCCAAAAAGBAwgAAAABggMIAAAAAYMDCAAAAAGEAwgAAAABAfsCIAAAAAEB-wJAAAAAAQUnAADNBwAgKAAA7gcAIPgCAADOBwAg-QIAAO0HACD-AgAAXgAgCycAAIMFADAoAACIBQAw-AIAAIQFADD5AgAAhQUAMPoCAACGBQAg-wIAAIcFADD8AgAAhwUAMP0CAACHBQAw_gIAAIcFADD_AgAAiQUAMIADAACKBQAwCycAAPUEADAoAAD6BAAw-AIAAPYEADD5AgAA9wQAMPoCAAD4BAAg-wIAAPkEADD8AgAA-QQAMP0CAAD5BAAw_gIAAPkEADD_AgAA-wQAMIADAAD8BAAwCycAAOYEADAoAADrBAAw-AIAAOcEADD5AgAA6AQAMPoCAADpBAAg-wIAAOoEADD8AgAA6gQAMP0CAADqBAAw_gIAAOoEADD_AgAA7AQAMIADAADtBAAwCycAANgEADAoAADdBAAw-AIAANkEADD5AgAA2gQAMPoCAADbBAAg-wIAANwEADD8AgAA3AQAMP0CAADcBAAw_gIAANwEADD_AgAA3gQAMIADAADfBAAwCycAAL4EADAoAADDBAAw-AIAAL8EADD5AgAAwAQAMPoCAADBBAAg-wIAAMIEADD8AgAAwgQAMP0CAADCBAAw_gIAAMIEADD_AgAAxAQAMIADAADFBAAwDQgAANUEACAJAADWBAAgCwAA1wQAIKYCAQAAAAGoAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANUCAtECQAAAAAHSAgEAAAAB0wIBAAAAAdUCEAAAAAHWAgEAAAABAgAAABQAICcAANQEACADAAAAFAAgJwAA1AQAICgAAMoEACABIAAA7AcAMBIGAACZBAAgCAAA1gMAIAkAAKEEACALAACiBAAgowIAAJ8EADCkAgAAEgAQpQIAAJ8EADCmAgEAAAABpwIBANADACGoAgEA0AMAIbsCQADVAwAhwwIBANADACHJAgAAoATVAiLRAkAA1QMAIdICAQDQAwAh0wIBANADACHVAhAA0gMAIdYCAQCKBAAhAgAAABQAICAAAMoEACACAAAAxgQAICAAAMcEACAOowIAAMUEADCkAgAAxgQAEKUCAADFBAAwpgIBANADACGnAgEA0AMAIagCAQDQAwAhuwJAANUDACHDAgEA0AMAIckCAACgBNUCItECQADVAwAh0gIBANADACHTAgEA0AMAIdUCEADSAwAh1gIBAIoEACEOowIAAMUEADCkAgAAxgQAEKUCAADFBAAwpgIBANADACGnAgEA0AMAIagCAQDQAwAhuwJAANUDACHDAgEA0AMAIckCAACgBNUCItECQADVAwAh0gIBANADACHTAgEA0AMAIdUCEADSAwAh1gIBAIoEACEKpgIBAKkEACGoAgEAqQQAIbsCQAC3BAAhwwIBAKkEACHJAgAAyATVAiLRAkAAtwQAIdICAQCpBAAh0wIBAKkEACHVAhAAtAQAIdYCAQDJBAAhAfsCAAAA1QICAfsCAQAAAAENCAAAywQAIAkAAMwEACALAADNBAAgpgIBAKkEACGoAgEAqQQAIbsCQAC3BAAhwwIBAKkEACHJAgAAyATVAiLRAkAAtwQAIdICAQCpBAAh0wIBAKkEACHVAhAAtAQAIdYCAQDJBAAhBScAAOQHACAoAADqBwAg-AIAAOUHACD5AgAA6QcAIP4CAABeACAFJwAA4gcAICgAAOcHACD4AgAA4wcAIPkCAADmBwAg_gIAAN4CACAHJwAAzgQAICgAANEEACD4AgAAzwQAIPkCAADQBAAg_AIAABYAIP0CAAAWACD-AgAAsAIAIAamAgEAAAABuwJAAAAAAccCEAAAAAHJAgAAAMkCAsoCAQAAAAHLAgEAAAABAgAAALACACAnAADOBAAgAwAAABYAICcAAM4EACAoAADSBAAgCAAAABYAICAAANIEACCmAgEAqQQAIbsCQAC3BAAhxwIQALQEACHJAgAA0wTJAiLKAgEAqQQAIcsCAQCpBAAhBqYCAQCpBAAhuwJAALcEACHHAhAAtAQAIckCAADTBMkCIsoCAQCpBAAhywIBAKkEACEB-wIAAADJAgINCAAA1QQAIAkAANYEACALAADXBAAgpgIBAAAAAagCAQAAAAG7AkAAAAABwwIBAAAAAckCAAAA1QIC0QJAAAAAAdICAQAAAAHTAgEAAAAB1QIQAAAAAdYCAQAAAAEDJwAA5AcAIPgCAADlBwAg_gIAAF4AIAMnAADiBwAg-AIAAOMHACD-AgAA3gIAIAMnAADOBAAg-AIAAM8EACD-AgAAsAIAIAYIAADlBAAgpgIBAAAAAbsCQAAAAAHDAgEAAAABxAICAAAAAcUCAQAAAAECAAAAKQAgJwAA5AQAIAMAAAApACAnAADkBAAgKAAA4gQAIAEgAADhBwAwCwYAAJkEACAIAADWAwAgowIAAJgEADCkAgAAJwAQpQIAAJgEADCmAgEAAAABpwIBANADACG7AkAA1QMAIcMCAQDQAwAhxAICANEDACHFAgEA0AMAIQIAAAApACAgAADiBAAgAgAAAOAEACAgAADhBAAgCaMCAADfBAAwpAIAAOAEABClAgAA3wQAMKYCAQDQAwAhpwIBANADACG7AkAA1QMAIcMCAQDQAwAhxAICANEDACHFAgEA0AMAIQmjAgAA3wQAMKQCAADgBAAQpQIAAN8EADCmAgEA0AMAIacCAQDQAwAhuwJAANUDACHDAgEA0AMAIcQCAgDRAwAhxQIBANADACEFpgIBAKkEACG7AkAAtwQAIcMCAQCpBAAhxAICALMEACHFAgEAqQQAIQYIAADjBAAgpgIBAKkEACG7AkAAtwQAIcMCAQCpBAAhxAICALMEACHFAgEAqQQAIQUnAADcBwAgKAAA3wcAIPgCAADdBwAg-QIAAN4HACD-AgAAXgAgBggAAOUEACCmAgEAAAABuwJAAAAAAcMCAQAAAAHEAgIAAAABxQIBAAAAAQMnAADcBwAg-AIAAN0HACD-AgAAXgAgBwgAAPQEACCmAgEAAAABwwIBAAAAAdICAQAAAAHTAgEAAAAB2AIAAADYAgLZAiAAAAABAgAAACIAICcAAPMEACADAAAAIgAgJwAA8wQAICgAAPEEACABIAAA2wcAMAwGAACQBAAgCAAAnAQAIKMCAACaBAAwpAIAACAAEKUCAACaBAAwpgIBAAAAAacCAQCKBAAhwwIBAIoEACHSAgEA0AMAIdMCAQDQAwAh2AIAAJsE2AIi2QIgANQDACECAAAAIgAgIAAA8QQAIAIAAADuBAAgIAAA7wQAIAqjAgAA7QQAMKQCAADuBAAQpQIAAO0EADCmAgEA0AMAIacCAQCKBAAhwwIBAIoEACHSAgEA0AMAIdMCAQDQAwAh2AIAAJsE2AIi2QIgANQDACEKowIAAO0EADCkAgAA7gQAEKUCAADtBAAwpgIBANADACGnAgEAigQAIcMCAQCKBAAh0gIBANADACHTAgEA0AMAIdgCAACbBNgCItkCIADUAwAhBqYCAQCpBAAhwwIBAMkEACHSAgEAqQQAIdMCAQCpBAAh2AIAAPAE2AIi2QIgALYEACEB-wIAAADYAgIHCAAA8gQAIKYCAQCpBAAhwwIBAMkEACHSAgEAqQQAIdMCAQCpBAAh2AIAAPAE2AIi2QIgALYEACEHJwAA1gcAICgAANkHACD4AgAA1wcAIPkCAADYBwAg_AIAACUAIP0CAAAlACD-AgAAXgAgBwgAAPQEACCmAgEAAAABwwIBAAAAAdICAQAAAAHTAgEAAAAB2AIAAADYAgLZAiAAAAABAycAANYHACD4AgAA1wcAIP4CAABeACADDwAAggUAIKYCAQAAAAG_AgEAAAABAgAAABwAICcAAIEFACADAAAAHAAgJwAAgQUAICgAAP8EACABIAAA1QcAMAgGAACZBAAgDwAAngQAIKMCAACdBAAwpAIAABoAEKUCAACdBAAwpgIBAAAAAacCAQDQAwAhvwIBANADACECAAAAHAAgIAAA_wQAIAIAAAD9BAAgIAAA_gQAIAajAgAA_AQAMKQCAAD9BAAQpQIAAPwEADCmAgEA0AMAIacCAQDQAwAhvwIBANADACEGowIAAPwEADCkAgAA_QQAEKUCAAD8BAAwpgIBANADACGnAgEA0AMAIb8CAQDQAwAhAqYCAQCpBAAhvwIBAKkEACEDDwAAgAUAIKYCAQCpBAAhvwIBAKkEACEFJwAA0AcAICgAANMHACD4AgAA0QcAIPkCAADSBwAg_gIAAOsBACADDwAAggUAIKYCAQAAAAG_AgEAAAABAycAANAHACD4AgAA0QcAIP4CAADrAQAgAwkAAK0EACCmAgEAAAABqAIBAAAAAQIAAAAPACAnAACOBQAgAwAAAA8AICcAAI4FACAoAACNBQAgASAAAM8HADAIBgAAmQQAIAkAAKEEACCjAgAAowQAMKQCAAANABClAgAAowQAMKYCAQAAAAGnAgEA0AMAIagCAQDQAwAhAgAAAA8AICAAAI0FACACAAAAiwUAICAAAIwFACAGowIAAIoFADCkAgAAiwUAEKUCAACKBQAwpgIBANADACGnAgEA0AMAIagCAQDQAwAhBqMCAACKBQAwpAIAAIsFABClAgAAigUAMKYCAQDQAwAhpwIBANADACGoAgEA0AMAIQKmAgEAqQQAIagCAQCpBAAhAwkAAKsEACCmAgEAqQQAIagCAQCpBAAhAwkAAK0EACCmAgEAAAABqAIBAAAAAQMnAADNBwAg-AIAAM4HACD-AgAAXgAgBCcAAIMFADD4AgAAhAUAMPoCAACGBQAg_gIAAIcFADAEJwAA9QQAMPgCAAD2BAAw-gIAAPgEACD-AgAA-QQAMAQnAADmBAAw-AIAAOcEADD6AgAA6QQAIP4CAADqBAAwBCcAANgEADD4AgAA2QQAMPoCAADbBAAg_gIAANwEADAEJwAAvgQAMPgCAAC_BAAw-gIAAMEEACD-AgAAwgQAMAwEAAD8BgAgBQAA_QYAIAwAAJoFACARAACYBQAgEgAAmQUAIBMAAP4GACAWAAD_BgAgFwAA_wYAIBgAAIAHACAZAACBBwAg7AIAAOUFACDxAgAA5QUAIAAAAAAAAAAABScAAMgHACAoAADLBwAg-AIAAMkHACD5AgAAygcAIP4CAACNAwAgAycAAMgHACD4AgAAyQcAIP4CAACNAwAgAAAAAfsCAAAAwgICCycAALEFADAoAAC1BQAw-AIAALIFADD5AgAAswUAMPoCAAC0BQAg-wIAAIcFADD8AgAAhwUAMP0CAACHBQAw_gIAAIcFADD_AgAAtgUAMIADAACKBQAwCycAAKYFADAoAACqBQAw-AIAAKcFADD5AgAAqAUAMPoCAACpBQAg-wIAAMIEADD8AgAAwgQAMP0CAADCBAAw_gIAAMIEADD_AgAAqwUAMIADAADFBAAwDQYAALAFACAIAADVBAAgCwAA1wQAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANUCAtECQAAAAAHSAgEAAAAB0wIBAAAAAdUCEAAAAAHWAgEAAAABAgAAABQAICcAAK8FACADAAAAFAAgJwAArwUAICgAAK0FACABIAAAxwcAMAIAAAAUACAgAACtBQAgAgAAAMYEACAgAACsBQAgCqYCAQCpBAAhpwIBAKkEACG7AkAAtwQAIcMCAQCpBAAhyQIAAMgE1QIi0QJAALcEACHSAgEAqQQAIdMCAQCpBAAh1QIQALQEACHWAgEAyQQAIQ0GAACuBQAgCAAAywQAIAsAAM0EACCmAgEAqQQAIacCAQCpBAAhuwJAALcEACHDAgEAqQQAIckCAADIBNUCItECQAC3BAAh0gIBAKkEACHTAgEAqQQAIdUCEAC0BAAh1gIBAMkEACEFJwAAwgcAICgAAMUHACD4AgAAwwcAIPkCAADEBwAg_gIAAI0DACANBgAAsAUAIAgAANUEACALAADXBAAgpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAckCAAAA1QIC0QJAAAAAAdICAQAAAAHTAgEAAAAB1QIQAAAAAdYCAQAAAAEDJwAAwgcAIPgCAADDBwAg_gIAAI0DACADBgAArAQAIKYCAQAAAAGnAgEAAAABAgAAAA8AICcAALkFACADAAAADwAgJwAAuQUAICgAALgFACABIAAAwQcAMAIAAAAPACAgAAC4BQAgAgAAAIsFACAgAAC3BQAgAqYCAQCpBAAhpwIBAKkEACEDBgAAqgQAIKYCAQCpBAAhpwIBAKkEACEDBgAArAQAIKYCAQAAAAGnAgEAAAABBCcAALEFADD4AgAAsgUAMPoCAAC0BQAg_gIAAIcFADAEJwAApgUAMPgCAACnBQAw-gIAAKkFACD-AgAAwgQAMAAAAAAABScAALwHACAoAAC_BwAg-AIAAL0HACD5AgAAvgcAIP4CAACNAwAgAycAALwHACD4AgAAvQcAIP4CAACNAwAgAAAAAAAFJwAAtwcAICgAALoHACD4AgAAuAcAIPkCAAC5BwAg_gIAABQAIAMnAAC3BwAg-AIAALgHACD-AgAAFAAgBQYAAP4GACAIAACVBQAgCQAAiAcAIAsAAIkHACDWAgAA5QUAIAAAAAUnAACyBwAgKAAAtQcAIPgCAACzBwAg-QIAALQHACD-AgAAXgAgAycAALIHACD4AgAAswcAIP4CAABeACAAAAAFJwAAqgcAICgAALAHACD4AgAAqwcAIPkCAACvBwAg_gIAAF4AIAUnAACoBwAgKAAArQcAIPgCAACpBwAg-QIAAKwHACD-AgAAXgAgAycAAKoHACD4AgAAqwcAIP4CAABeACADJwAAqAcAIPgCAACpBwAg_gIAAF4AIAAAAAsnAADbBQAwKAAA3wUAMPgCAADcBQAw-QIAAN0FADD6AgAA3gUAIPsCAAD5BAAw_AIAAPkEADD9AgAA-QQAMP4CAAD5BAAw_wIAAOAFADCAAwAA_AQAMAMGAACfBQAgpgIBAAAAAacCAQAAAAECAAAAHAAgJwAA4wUAIAMAAAAcACAnAADjBQAgKAAA4gUAIAEgAACnBwAwAgAAABwAICAAAOIFACACAAAA_QQAICAAAOEFACACpgIBAKkEACGnAgEAqQQAIQMGAACeBQAgpgIBAKkEACGnAgEAqQQAIQMGAACfBQAgpgIBAAAAAacCAQAAAAEEJwAA2wUAMPgCAADcBQAw-gIAAN4FACD-AgAA-QQAMAAAAAAAAAAAAAcnAACiBwAgKAAApQcAIPgCAACjBwAg-QIAAKQHACD8AgAACwAg_QIAAAsAIP4CAACNAwAgAycAAKIHACD4AgAAowcAIP4CAACNAwAgAAAAAAAAAfsCQAAAAAEFJwAAnQcAICgAAKAHACD4AgAAngcAIPkCAACfBwAg_gIAAF4AIAMnAACdBwAg-AIAAJ4HACD-AgAAXgAgAAAABScAAJgHACAoAACbBwAg-AIAAJkHACD5AgAAmgcAIP4CAABeACADJwAAmAcAIPgCAACZBwAg_gIAAF4AIAAAAAH7AgAAAO4CAgH7AgAAAPQCAgsnAADmBgAwKAAA6wYAMPgCAADnBgAw-QIAAOgGADD6AgAA6QYAIPsCAADqBgAw_AIAAOoGADD9AgAA6gYAMP4CAADqBgAw_wIAAOwGADCAAwAA7QYAMAsnAADaBgAwKAAA3wYAMPgCAADbBgAw-QIAANwGADD6AgAA3QYAIPsCAADeBgAw_AIAAN4GADD9AgAA3gYAMP4CAADeBgAw_wIAAOAGADCAAwAA4QYAMAcnAADVBgAgKAAA2AYAIPgCAADWBgAg-QIAANcGACD8AgAACwAg_QIAAAsAIP4CAACNAwAgCycAAMwGADAoAADQBgAw-AIAAM0GADD5AgAAzgYAMPoCAADPBgAg-wIAANwEADD8AgAA3AQAMP0CAADcBAAw_gIAANwEADD_AgAA0QYAMIADAADfBAAwCycAAMMGADAoAADHBgAw-AIAAMQGADD5AgAAxQYAMPoCAADGBgAg-wIAAMIEADD8AgAAwgQAMP0CAADCBAAw_gIAAMIEADD_AgAAyAYAMIADAADFBAAwCycAALoGADAoAAC-BgAw-AIAALsGADD5AgAAvAYAMPoCAAC9BgAg-wIAALIGADD8AgAAsgYAMP0CAACyBgAw_gIAALIGADD_AgAAvwYAMIADAAC1BgAwCycAAK4GADAoAACzBgAw-AIAAK8GADD5AgAAsAYAMPoCAACxBgAg-wIAALIGADD8AgAAsgYAMP0CAACyBgAw_gIAALIGADD_AgAAtAYAMIADAAC1BgAwCycAAKIGADAoAACnBgAw-AIAAKMGADD5AgAApAYAMPoCAAClBgAg-wIAAKYGADD8AgAApgYAMP0CAACmBgAw_gIAAKYGADD_AgAAqAYAMIADAACpBgAwCycAAJYGADAoAACbBgAw-AIAAJcGADD5AgAAmAYAMPoCAACZBgAg-wIAAJoGADD8AgAAmgYAMP0CAACaBgAw_gIAAJoGADD_AgAAnAYAMIADAACdBgAwCycAAI0GADAoAACRBgAw-AIAAI4GADD5AgAAjwYAMPoCAACQBgAg-wIAAOoEADD8AgAA6gQAMP0CAADqBAAw_gIAAOoEADD_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-gIAAOkGACD-AgAA6gYAMAQnAADaBgAw-AIAANsGADD6AgAA3QYAIP4CAADeBgAwAycAANUGACD4AgAA1gYAIP4CAACNAwAgBCcAAMwGADD4AgAAzQYAMPoCAADPBgAg_gIAANwEADAEJwAAwwYAMPgCAADEBgAw-gIAAMYGACD-AgAAwgQAMAQnAAC6BgAw-AIAALsGADD6AgAAvQYAIP4CAACyBgAwBCcAAK4GADD4AgAArwYAMPoCAACxBgAg_gIAALIGADAEJwAAogYAMPgCAACjBgAw-gIAAKUGACD-AgAApgYAMAQnAACWBgAw-AIAAJcGADD6AgAAmQYAIP4CAACaBgAwBCcAAI0GADD4AgAAjgYAMPoCAACQBgAg_gIAAOoEADAAAAYDAACVBQAgDAAAmgUAIA4AAJYFACAQAACXBQAgEQAAmAUAIBIAAJkFACAAAAAAAAAFJwAAigcAICgAAI0HACD4AgAAiwcAIPkCAACMBwAg_gIAAF4AIAMnAACKBwAg-AIAAIsHACD-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-wYAIBIAAPUGACATAAD0BgAgFwAA-AYAIBgAAPkGACAZAAD6BgAgpgIBAAAAAbsCQAAAAAHAAgEAAAAByQIAAAD0AgLdAkAAAAAB6gIBAAAAAesCIAAAAAHsAgEAAAAB7gIAAADuAgLvAiAAAAAB8AIgAAAAAfECQAAAAAHyAiAAAAABAgAAAF4AICcAAKoHACADAAAAJQAgJwAAqAcAICgAAK4HACAYAAAAJQAgBAAAgwYAIAUAAIQGACAMAACHBgAgEQAAjAYAIBIAAIYGACATAACFBgAgFgAAiAYAIBgAAIoGACAZAACLBgAgIAAArgcAIKYCAQCpBAAhuwJAALcEACHAAgEAqQQAIckCAACCBvQCIt0CQAC3BAAh6gIBAKkEACHrAiAAtgQAIewCAQDJBAAh7gIAAIEG7gIi7wIgALYEACHwAiAAtgQAIfECQAD2BQAh8gIgALYEACEWBAAAgwYAIAUAAIQGACAMAACHBgAgEQAAjAYAIBIAAIYGACATAACFBgAgFgAAiAYAIBgAAIoGACAZAACLBgAgpgIBAKkEACG7AkAAtwQAIcACAQCpBAAhyQIAAIIG9AIi3QJAALcEACHqAgEAqQQAIesCIAC2BAAh7AIBAMkEACHuAgAAgQbuAiLvAiAAtgQAIfACIAC2BAAh8QJAAPYFACHyAiAAtgQAIQMAAAAlACAnAACqBwAgKAAAsQcAIBgAAAAlACAEAACDBgAgBQAAhAYAIAwAAIcGACARAACMBgAgEgAAhgYAIBMAAIUGACAXAACJBgAgGAAAigYAIBkAAIsGACAgAACxBwAgpgIBAKkEACG7AkAAtwQAIcACAQCpBAAhyQIAAIIG9AIi3QJAALcEACHqAgEAqQQAIesCIAC2BAAh7AIBAMkEACHuAgAAgQbuAiLvAiAAtgQAIfACIAC2BAAh8QJAAPYFACHyAiAAtgQAIRYEAACDBgAgBQAAhAYAIAwAAIcGACARAACMBgAgEgAAhgYAIBMAAIUGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqQQAIbsCQAC3BAAhwAIBAKkEACHJAgAAggb0AiLdAkAAtwQAIeoCAQCpBAAh6wIgALYEACHsAgEAyQQAIe4CAACBBu4CIu8CIAC2BAAh8AIgALYEACHxAkAA9gUAIfICIAC2BAAhFgQAAPIGACAFAADzBgAgDAAA9gYAIBEAAPsGACASAAD1BgAgEwAA9AYAIBYAAPcGACAXAAD4BgAgGQAA-gYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA9AIC3QJAAAAAAeoCAQAAAAHrAiAAAAAB7AIBAAAAAe4CAAAA7gIC7wIgAAAAAfACIAAAAAHxAkAAAAAB8gIgAAAAAQIAAABeACAnAACyBwAgAwAAACUAICcAALIHACAoAAC2BwAgGAAAACUAIAQAAIMGACAFAACEBgAgDAAAhwYAIBEAAIwGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGQAAiwYAICAAALYHACCmAgEAqQQAIbsCQAC3BAAhwAIBAKkEACHJAgAAggb0AiLdAkAAtwQAIeoCAQCpBAAh6wIgALYEACHsAgEAyQQAIe4CAACBBu4CIu8CIAC2BAAh8AIgALYEACHxAkAA9gUAIfICIAC2BAAhFgQAAIMGACAFAACEBgAgDAAAhwYAIBEAAIwGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGQAAiwYAIKYCAQCpBAAhuwJAALcEACHAAgEAqQQAIckCAACCBvQCIt0CQAC3BAAh6gIBAKkEACHrAiAAtgQAIewCAQDJBAAh7gIAAIEG7gIi7wIgALYEACHwAiAAtgQAIfECQAD2BQAh8gIgALYEACEOBgAAsAUAIAgAANUEACAJAADWBAAgpgIBAAAAAacCAQAAAAGoAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANUCAtECQAAAAAHSAgEAAAAB0wIBAAAAAdUCEAAAAAHWAgEAAAABAgAAABQAICcAALcHACADAAAAEgAgJwAAtwcAICgAALsHACAQAAAAEgAgBgAArgUAIAgAAMsEACAJAADMBAAgIAAAuwcAIKYCAQCpBAAhpwIBAKkEACGoAgEAqQQAIbsCQAC3BAAhwwIBAKkEACHJAgAAyATVAiLRAkAAtwQAIdICAQCpBAAh0wIBAKkEACHVAhAAtAQAIdYCAQDJBAAhDgYAAK4FACAIAADLBAAgCQAAzAQAIKYCAQCpBAAhpwIBAKkEACGoAgEAqQQAIbsCQAC3BAAhwwIBAKkEACHJAgAAyATVAiLRAkAAtwQAIdICAQCpBAAh0wIBAKkEACHVAhAAtAQAIdYCAQDJBAAhDgMAAI8FACAMAACUBQAgDgAAkAUAIBAAAJEFACARAACSBQAgpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABAgAAAI0DACAnAAC8BwAgAwAAAAsAICcAALwHACAoAADABwAgEAAAAAsAIAMAALgEACAMAAC9BAAgDgAAuQQAIBAAALoEACARAAC7BAAgIAAAwAcAIKYCAQCpBAAhtAIBAKkEACG1AgEAqQQAIbYCAgCzBAAhtwIQALQEACG4AggAtQQAIbkCAgCzBAAhugIgALYEACG7AkAAtwQAIQ4DAAC4BAAgDAAAvQQAIA4AALkEACAQAAC6BAAgEQAAuwQAIKYCAQCpBAAhtAIBAKkEACG1AgEAqQQAIbYCAgCzBAAhtwIQALQEACG4AggAtQQAIbkCAgCzBAAhugIgALYEACG7AkAAtwQAIQKmAgEAAAABpwIBAAAAAQ4DAACPBQAgDgAAkAUAIBAAAJEFACARAACSBQAgEgAAkwUAIKYCAQAAAAG0AgEAAAABtQIBAAAAAbYCAgAAAAG3AhAAAAABuAIIAAAAAbkCAgAAAAG6AiAAAAABuwJAAAAAAQIAAACNAwAgJwAAwgcAIAMAAAALACAnAADCBwAgKAAAxgcAIBAAAAALACADAAC4BAAgDgAAuQQAIBAAALoEACARAAC7BAAgEgAAvAQAICAAAMYHACCmAgEAqQQAIbQCAQCpBAAhtQIBAKkEACG2AgIAswQAIbcCEAC0BAAhuAIIALUEACG5AgIAswQAIboCIAC2BAAhuwJAALcEACEOAwAAuAQAIA4AALkEACAQAAC6BAAgEQAAuwQAIBIAALwEACCmAgEAqQQAIbQCAQCpBAAhtQIBAKkEACG2AgIAswQAIbcCEAC0BAAhuAIIALUEACG5AgIAswQAIboCIAC2BAAhuwJAALcEACEKpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAckCAAAA1QIC0QJAAAAAAdICAQAAAAHTAgEAAAAB1QIQAAAAAdYCAQAAAAEOAwAAjwUAIAwAAJQFACAOAACQBQAgEQAAkgUAIBIAAJMFACCmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAjQMAICcAAMgHACADAAAACwAgJwAAyAcAICgAAMwHACAQAAAACwAgAwAAuAQAIAwAAL0EACAOAAC5BAAgEQAAuwQAIBIAALwEACAgAADMBwAgpgIBAKkEACG0AgEAqQQAIbUCAQCpBAAhtgICALMEACG3AhAAtAQAIbgCCAC1BAAhuQICALMEACG6AiAAtgQAIbsCQAC3BAAhDgMAALgEACAMAAC9BAAgDgAAuQQAIBEAALsEACASAAC8BAAgpgIBAKkEACG0AgEAqQQAIbUCAQCpBAAhtgICALMEACG3AhAAtAQAIbgCCAC1BAAhuQICALMEACG6AiAAtgQAIbsCQAC3BAAhFgQAAPIGACAFAADzBgAgDAAA9gYAIBEAAPsGACASAAD1BgAgFgAA9wYAIBcAAPgGACAYAAD5BgAgGQAA-gYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA9AIC3QJAAAAAAeoCAQAAAAHrAiAAAAAB7AIBAAAAAe4CAAAA7gIC7wIgAAAAAfACIAAAAAHxAkAAAAAB8gIgAAAAAQIAAABeACAnAADNBwAgAqYCAQAAAAGoAgEAAAABAqYCAQAAAAHAAgEAAAABAgAAAOsBACAnAADQBwAgAwAAAO4BACAnAADQBwAgKAAA1AcAIAQAAADuAQAgIAAA1AcAIKYCAQCpBAAhwAIBAKkEACECpgIBAKkEACHAAgEAqQQAIQKmAgEAAAABvwIBAAAAARYEAADyBgAgBQAA8wYAIAwAAPYGACASAAD1BgAgEwAA9AYAIBYAAPcGACAXAAD4BgAgGAAA-QYAIBkAAPoGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPQCAt0CQAAAAAHqAgEAAAAB6wIgAAAAAewCAQAAAAHuAgAAAO4CAu8CIAAAAAHwAiAAAAAB8QJAAAAAAfICIAAAAAECAAAAXgAgJwAA1gcAIAMAAAAlACAnAADWBwAgKAAA2gcAIBgAAAAlACAEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACAgAADaBwAgpgIBAKkEACG7AkAAtwQAIcACAQCpBAAhyQIAAIIG9AIi3QJAALcEACHqAgEAqQQAIesCIAC2BAAh7AIBAMkEACHuAgAAgQbuAiLvAiAAtgQAIfACIAC2BAAh8QJAAPYFACHyAiAAtgQAIRYEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqQQAIbsCQAC3BAAhwAIBAKkEACHJAgAAggb0AiLdAkAAtwQAIeoCAQCpBAAh6wIgALYEACHsAgEAyQQAIe4CAACBBu4CIu8CIAC2BAAh8AIgALYEACHxAkAA9gUAIfICIAC2BAAhBqYCAQAAAAHDAgEAAAAB0gIBAAAAAdMCAQAAAAHYAgAAANgCAtkCIAAAAAEWBAAA8gYAIAUAAPMGACAMAAD2BgAgEQAA-wYAIBMAAPQGACAWAAD3BgAgFwAA-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-0AEUf9MBO4AB1AE_gQHVAQiCAdYBCIMB1wEIhAHYAQiFAdkBCIYB2wEIhwHdARSIAd4BQIkB4AEIigHiARSLAeMBQYwB5AEIjQHlAQiOAeYBFJEB6QFCkgHqAUiTAewBDJQB7QEMlQHwAQyWAfEBDJcB8gEMmAH0AQyZAfYBFJoB9wFJmwH5AQycAfsBFJ0B_AFKngH9AQyfAf4BDKAB_wEUoQGCAkuiAYMCT6MBhAIRpAGFAhGlAYYCEaYBhwIRpwGIAhGoAYoCEakBjAIUqgGNAlCrAY8CEawBkQIUrQGSAlGuAZMCEa8BlAIRsAGVAhSxAZgCUrIBmQJWswGaAhK0AZsCErUBnAIStgGdAhK3AZ4CErgBoAISuQGiAhS6AaMCV7sBpQISvAGnAhS9AagCWL4BqQISvwGqAhLAAasCFMEBrgJZwgGvAl3DAbECCcQBsgIJxQG0AgnGAbUCCccBtgIJyAG4AgnJAboCFMoBuwJeywG9AgnMAb8CFM0BwAJfzgHBAgnPAcICCdABwwIU0QHGAmDSAccCZtMByAIP1AHJAg_VAcoCD9YBywIP1wHMAg_YAc4CD9kB0AIU2gHRAmfbAdMCD9wB1QIU3QHWAmjeAdcCD98B2AIP4AHZAhThAdwCaeIB3QJv4wHfAgfkAeACB-UB4wIH5gHkAgfnAeUCB-gB5wIH6QHpAhTqAeoCcOsB7AIH7AHuAhTtAe8Cce4B8AIH7wHxAgfwAfICFPEB9QJy8gH2AnbzAfcCC_QB-AIL9QH5Agv2AfoCC_cB-wIL-AH9Agv5Af8CFPoBgAN3-wGCAwv8AYQDFP0BhQN4_gGGAwv_AYcDC4ACiAMUgQKLA3mCAowDfYMCjgMFhAKPAwWFApEDBYYCkgMFhwKTAwWIApUDBYkClwMUigKYA36LApoDBYwCnAMUjQKdA3-OAp4DBY8CnwMFkAKgAxSRAqMDgAGSAqQDhgGTAqUDBpQCpgMGlQKnAwaWAqgDBpcCqQMGmAKrAwaZAq0DFJoCrgOHAZsCsAMGnAKyAxSdArMDiAGeArQDBp8CtQMGoAK2AxShArkDiQGiAroDjQE"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer } = await import("buffer");
  const wasmArray = Buffer.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/enums.ts
var UserRole = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED"
};
var SubjectCategory = {
  ACADEMIC: "ACADEMIC",
  SKILLS: "SKILLS",
  LANGUAGE: "LANGUAGE"
};
var DayOfWeek = {
  SUN: "SUN",
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT"
};
var BookingStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};
var PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};

// src/generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/lib/prisma.ts
var connectionString = process.env.DATABASE_URL;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/app/config/env.ts
import dotenv from "dotenv";
import status from "http-status";

// src/app/errorHelper/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(statusCode, message, stack = "") {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var AppError_default = AppError;

// src/app/config/env.ts
dotenv.config();
var loadEnvVariables = () => {
  const requireEnvVariable = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",
    // 'EMAIL_SENDER_SMTP_USER',
    // 'EMAIL_SENDER_SMTP_PASS',
    // 'EMAIL_SENDER_SMTP_HOST',
    // 'EMAIL_SENDER_SMTP_PORT',
    // 'EMAIL_SENDER_SMTP_FROM',
    // 'GOOGLE_CLIENT_ID',
    // 'GOOGLE_CLIENT_SECRET',
    // 'GOOGLE_CALLBACK_URL',
    // 'FRONTEND_URL',
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD"
  ];
  requireEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError_default(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
    }
  });
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,
    // EMAIL_SENDER: {
    //     SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
    //     SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
    //     SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
    //     SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
    //     SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
    // },
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    // GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    // FRONTEND_URL: process.env.FRONTEND_URL as string,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    },
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD
  };
};
var envVars = loadEnvVariables();

// src/app/lib/auth.ts
var auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true
  },
  emailVerification: {
    enabled: true,
    sendVerificationEmail: async ({ url, user }) => {
      console.log("Verification email sent to:", user.email);
      console.log("Verification URL:", url);
    }
  },
  // passwordReset: {
  //     enabled: true,
  //     sendResetPasswordEmail: async ({ url, user }) => {
  //         console.log("Reset password email sent to:", user.email);
  //         console.log("Reset password URL:", url);
  //     },
  // },
  // passwordChange: {
  //     enabled: true,
  //     sendPasswordChangeEmail: async ({ url, user }) => {
  //         console.log("Password change email sent to:", user.email);
  //         console.log("Password change URL:", url);
  //     },
  // },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE
      },
      needPasswordChange: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null
      }
    }
  },
  // plugins: [
  //     bearer(),
  //     emailOTP({
  //         overrideDefaultEmailVerification: true,
  //         async sendVerificationOTP({ email, otp, type }) {
  //             if (type === "email-verification") {
  //                 const user = await prisma.user.findUnique({
  //                     where: {
  //                         email,
  //                     }
  //                 })
  //                 if (user && !user.emailVerified) {
  //                        await sendEmail({
  //                             to : email,
  //                             subject : "Verify your email",
  //                             templateName : "otp",
  //                             templateData :{
  //                                 name : user.name,
  //                                 otp,
  //                             }
  //                         });
  //                 }
  //             } else if (type === "forget-password") {
  //                 const user = await prisma.user.findUnique({
  //                     where: {
  //                         email,
  //                     }
  //                 })
  //                 if (user) {
  //                     await sendEmail({
  //                         to: email,
  //                         subject: "Password Reset OTP",
  //                         templateName: "otp",
  //                         templateData: {
  //                             name: user.name,
  //                             otp,
  //                         }
  //                     })
  //                 }
  //             }
  //         },
  //         expiresIn: 2 * 60, // 2 minutes in seconds
  //         otpLength: 6,
  //     })
  // ],
  session: {
    expiresIn: 60 * 60 * 60 * 24,
    // 1 day in seconds
    updateAge: 60 * 60 * 60 * 24,
    // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 60 * 24
      // 1 day in seconds
    }
  }
});

// src/app.ts
import cors from "cors";
import cookieParser from "cookie-parser";

// src/app/routes/index.ts
import { Router as Router9 } from "express";

// src/app/module/auth/auth.route.ts
import { Router } from "express";

// src/app/module/auth/auth.controller.ts
import status3 from "http-status";

// src/app/shared/catchAsync.ts
var catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch",
        error: error.message
      });
    }
  };
};

// src/app/shared/sendResponse.ts
var sendResponse = (res, responseData) => {
  const { httpStatusCode, success, message, data } = responseData;
  res.status(httpStatusCode).json({
    httpStatusCode,
    success,
    message,
    data
  });
};

// src/app/module/auth/auth.service.ts
import status2 from "http-status";

// src/app/utils/jwt.ts
import jwt from "jsonwebtoken";
var createToken = (payload, secret, { expiresIn }) => {
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};
var verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error
    };
  }
};
var decodeToken = (token) => {
  const decoded = jwt.decode(token);
  return decoded;
};
var jwtUtils = {
  createToken,
  verifyToken,
  decodeToken
};

// src/app/utils/cookie.ts
var setCookie = (res, key, value, options) => {
  res.cookie(key, value, options);
};
var getCookie = (req, key) => {
  return req.cookies[key];
};
var clearCookie = (res, key, options) => {
  res.clearCookie(key, options);
};
var CookieUtils = {
  setCookie,
  getCookie,
  clearCookie
};

// src/app/utils/token.ts
var getAccessToken = (payload) => {
  const accessToken = jwtUtils.createToken(
    payload,
    envVars.ACCESS_TOKEN_SECRET,
    { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN }
  );
  return accessToken;
};
var getRefreshToken = (payload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.REFRESH_TOKEN_SECRET,
    { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN }
  );
  return refreshToken;
};
var setAccessTokenCookie = (res, token) => {
  CookieUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 60 * 24
  });
};
var setRefreshTokenCookie = (res, token) => {
  CookieUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 60 * 24 * 7
  });
};
var setBetterAuthSessionCookie = (res, token) => {
  CookieUtils.setCookie(res, "better-auth.session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 60 * 24
  });
};
var tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie
};

// src/app/module/auth/auth.service.ts
var registerStudent = async (payload) => {
  const { name, email, password } = payload;
  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password
    }
  });
  if (!data.user) {
    throw new AppError_default(status2.BAD_REQUEST, "Failed to register student");
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  return {
    ...data,
    student: data.user,
    accessToken,
    refreshToken
  };
};
var loginStudent = async (payload) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({
    body: {
      email,
      password
    }
  });
  if (!data.user) {
    throw new AppError_default(status2.NOT_FOUND, "User is not found");
  }
  if (data.user.status === UserStatus.BLOCKED) {
    throw new AppError_default(status2.FORBIDDEN, "User is blocked");
  }
  if (data.user.isDeleted) {
    throw new AppError_default(status2.NOT_FOUND, "User is deleted");
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified
  });
  return {
    ...data,
    accessToken,
    refreshToken
  };
};
var getMe = async (user) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      isVerified: true,
      status: true,
      createdAt: true,
      tutorProfile: {
        select: {
          id: true,
          bio: true,
          hourlyRate: true,
          isApproved: true
        }
      }
    }
  });
  if (!userData) {
    throw new AppError_default(status2.NOT_FOUND, "User does not exist.");
  }
  return userData;
};
var AuthServices = {
  registerStudent,
  loginStudent,
  getMe
};

// src/app/module/auth/auth.controller.ts
var registerStudent2 = catchAsync(
  async (req, res) => {
    const payload = req.body;
    const result = await AuthServices.registerStudent(payload);
    const { token, accessToken, refreshToken, ...rest } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);
    sendResponse(res, {
      httpStatusCode: status3.CREATED,
      success: true,
      message: "Student registered successfully",
      data: {
        token,
        accessToken,
        refreshToken,
        ...rest
      }
    });
  }
);
var loginStudent2 = catchAsync(
  async (req, res) => {
    const payload = req.body;
    const result = await AuthServices.loginStudent(payload);
    const { accessToken, refreshToken, token, ...rest } = result;
    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, token);
    sendResponse(res, {
      httpStatusCode: 201,
      success: true,
      message: "User login successfully",
      data: {
        token,
        accessToken,
        refreshToken,
        ...rest
      }
    });
  }
);
var getMe2 = catchAsync(async (req, res) => {
  const result = await AuthServices.getMe(req.user);
  sendResponse(res, {
    httpStatusCode: status3.OK,
    success: true,
    message: "Profile fetched successfully.",
    data: result
  });
});
var AuthController = {
  registerStudent: registerStudent2,
  loginStudent: loginStudent2,
  getMe: getMe2
};

// src/app/middleware/checkAuth.ts
import status4 from "http-status";
var checkAuth = (...authRoles) => async (req, res, next) => {
  try {
    const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");
    if (!sessionToken) {
      throw new Error("Unauthorized access! No session token provided.");
    }
    if (sessionToken) {
      const sessionExists = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          expiresAt: {
            gt: /* @__PURE__ */ new Date()
          }
        },
        include: {
          user: true
        }
      });
      if (sessionExists && sessionExists.user) {
        const user = sessionExists.user;
        const now = /* @__PURE__ */ new Date();
        const expiresAt = new Date(sessionExists.expiresAt);
        const createdAt = new Date(sessionExists.createdAt);
        const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
        const timeRemaining = expiresAt.getTime() - now.getTime();
        const percentRemaining = timeRemaining / sessionLifeTime * 100;
        if (percentRemaining < 20) {
          res.setHeader("X-Session-Refresh", "true");
          res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
          res.setHeader("X-Time-Remaining", timeRemaining.toString());
          console.log("Session Expiring Soon!!");
        }
        if (user.status === UserStatus.BLOCKED) {
          throw new AppError_default(status4.UNAUTHORIZED, "Unauthorized access! User is not active.");
        }
        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
          throw new AppError_default(status4.FORBIDDEN, "Forbidden access! You do not have permission to access this resource.");
        }
        req.user = {
          userId: user.id,
          role: user.role,
          email: user.email
        };
      }
      const accessToken2 = CookieUtils.getCookie(req, "accessToken");
      if (!accessToken2) {
        throw new AppError_default(status4.UNAUTHORIZED, "Unauthorized access! No access token provided.");
      }
    }
    const accessToken = CookieUtils.getCookie(req, "accessToken");
    if (!accessToken) {
      throw new AppError_default(status4.UNAUTHORIZED, "Unauthorized access! No access token provided.");
    }
    const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
    if (!verifiedToken.success) {
      throw new AppError_default(status4.UNAUTHORIZED, "Unauthorized access! Invalid access token.");
    }
    if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data.role)) {
      throw new AppError_default(status4.FORBIDDEN, "Forbidden access! You do not have permission to access this resource.");
    }
    next();
  } catch (error) {
    next(error);
  }
};

// src/app/module/auth/auth.route.ts
var router = Router();
router.post("/register", AuthController.registerStudent);
router.post("/login", AuthController.loginStudent);
router.get("/me", checkAuth(), AuthController.getMe);
var AuthRoutes = router;

// src/app/module/tutor/tutor.route.ts
import { Router as Router2 } from "express";

// src/app/module/tutor/tutor.controller.ts
import status6 from "http-status";

// src/app/module/tutor/tutor.service.ts
import status5 from "http-status";

// src/app/config/cloudinary.config.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
});
var uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", ...options },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};
var deleteFromCloudinary = async (publicId, resourceType = "image") => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
var getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  const startIndex = uploadIndex + 1 + (parts[uploadIndex + 1]?.startsWith("v") ? 1 : 0);
  return parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
};

// src/app/module/tutor/tutor.service.ts
var createTutorProfile = async (user, payload) => {
  if (user.role !== "STUDENT" && user.role !== "TUTOR") {
    throw new AppError_default(
      status5.FORBIDDEN,
      "Only students or tutors can create a tutor profile."
    );
  }
  const existing = await prisma.tutorProfile.findUnique({
    where: { userId: user.userId }
  });
  if (existing) {
    throw new AppError_default(
      status5.CONFLICT,
      "Tutor profile already exists. Use the update endpoint."
    );
  }
  if (payload.hourlyRate <= 0) {
    throw new AppError_default(status5.BAD_REQUEST, "Hourly rate must be greater than 0.");
  }
  if (!payload.subjects || !payload.subjects.length) {
    throw new AppError_default(status5.BAD_REQUEST, "At least one subject is required.");
  }
  if (!payload.languages || !payload.languages.length) {
    throw new AppError_default(status5.BAD_REQUEST, "At least one language is required.");
  }
  const profile = await prisma.tutorProfile.create({
    data: {
      userId: user.userId,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      subjects: {
        create: payload.subjects.map((id) => ({
          subject: {
            connect: { id }
          }
        }))
      },
      languages: {
        create: payload.languages.map((id) => ({
          language: {
            connect: { id }
          }
        }))
      },
      experienceYears: payload.experienceYrs ?? 0,
      averageRating: 0,
      totalReviews: 0,
      isApproved: false
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      },
      subjects: true,
      languages: true
    }
  });
  if (user.role === "STUDENT") {
    await prisma.user.update({
      where: { id: user.userId },
      data: { role: "TUTOR" }
    });
  }
  return profile;
};
var updateTutorProfile = async (user, payload) => {
  const profile = await getOwnProfile(user.userId);
  if (payload.hourlyRate !== void 0 && payload.hourlyRate <= 0) {
    throw new AppError_default(status5.BAD_REQUEST, "Hourly rate must be greater than 0.");
  }
  if (payload.subjects !== void 0 && !payload.subjects.length) {
    throw new AppError_default(status5.BAD_REQUEST, "At least one subject is required.");
  }
  if (payload.languages !== void 0 && !payload.languages.length) {
    throw new AppError_default(status5.BAD_REQUEST, "At least one language is required.");
  }
  const updated = await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      ...payload.bio !== void 0 && { bio: payload.bio },
      ...payload.hourlyRate !== void 0 && { hourlyRate: payload.hourlyRate },
      ...payload.experienceYrs !== void 0 && { experienceYears: payload.experienceYrs },
      ...payload.education !== void 0 && { education: payload.education },
      ...payload.timezone !== void 0 && { timezone: payload.timezone },
      ...payload.introVideoUrl !== void 0 && { introVideoUrl: payload.introVideoUrl },
      // Relational updates for subjects
      ...payload.subjects !== void 0 && {
        subjects: {
          deleteMany: {},
          create: payload.subjects.map((id) => ({
            subject: { connect: { id } }
          }))
        }
      },
      // Relational updates for languages
      ...payload.languages !== void 0 && {
        languages: {
          deleteMany: {},
          create: payload.languages.map((id) => ({
            language: { connect: { id } }
          }))
        }
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      }
    }
  });
  return updated;
};
var uploadAvatar = async (user, fileBuffer, mimetype) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) throw new AppError_default(status5.NOT_FOUND, "User not found.");
  if (dbUser.image) {
    const publicId = getPublicIdFromUrl(dbUser.image);
    await deleteFromCloudinary(publicId, "image").catch(() => null);
  }
  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/avatars", {
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    format: "webp"
  });
  await prisma.user.update({
    where: { id: user.userId },
    data: { image: url }
  });
  return { avatarUrl: url };
};
var getMyProfile = async (user) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true }
          }
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });
  if (!profile) {
    throw new AppError_default(
      status5.NOT_FOUND,
      "Tutor profile not found. Please create your profile first."
    );
  }
  return profile;
};
var getPublicProfile = async (tutorProfileId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true }
          }
        }
      },
      _count: {
        select: { reviews: true, bookings: true }
      }
    }
  });
  if (!profile) {
    throw new AppError_default(
      status5.NOT_FOUND,
      "Tutor profile not found or not yet approved."
    );
  }
  return profile;
};
var searchTutors = async (query) => {
  const {
    subject,
    language,
    minPrice,
    maxPrice,
    minRating,
    search,
    sortBy = "rating",
    page = 1,
    limit = 10
  } = query;
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 50);
  const where = {
    isApproved: true,
    user: { status: "ACTIVE" },
    // Subject filter
    ...subject && {
      subjects: { some: { subject: { name: { contains: subject, mode: "insensitive" } } } }
    },
    // Language filter
    ...language && {
      languages: { some: { language: { name: { contains: language, mode: "insensitive" } } } }
    },
    // Price range
    ...minPrice !== void 0 || maxPrice !== void 0 ? {
      hourlyRate: {
        ...minPrice !== void 0 && { gte: minPrice },
        ...maxPrice !== void 0 && { lte: maxPrice }
      }
    } : {},
    // Minimum rating
    ...minRating !== void 0 && {
      averageRating: { gte: minRating }
    },
    // Full-text search on bio and headline (PostgreSQL ILIKE)
    ...search && {
      OR: [
        { bio: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } }
      ]
    }
  };
  const orderBy = (() => {
    switch (sortBy) {
      case "price_asc":
        return { hourlyRate: "asc" };
      case "price_desc":
        return { hourlyRate: "desc" };
      case "reviews":
        return { totalReviews: "desc" };
      default:
        return { averageRating: "desc" };
    }
  })();
  const [total, tutors] = await prisma.$transaction([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        bio: true,
        hourlyRate: true,
        subjects: true,
        languages: true,
        averageRating: true,
        totalReviews: true,
        experienceYears: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  ]);
  return {
    tutors,
    meta: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
      hasNextPage: skip + take < total,
      hasPrevPage: page > 1
    }
  };
};
var getDashboardStats = async (user) => {
  const profile = await getOwnProfile(user.userId);
  const now = /* @__PURE__ */ new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const [
    totalBookings,
    completedBookings,
    pendingBookings,
    monthBookings,
    lastMonthBookings,
    recentReviews,
    upcomingBookings
  ] = await prisma.$transaction([
    // Total bookings ever
    prisma.booking.count({ where: { tutorId: profile.id } }),
    // Completed sessions
    prisma.booking.count({
      where: { tutorId: profile.id, status: "COMPLETED" }
    }),
    // Pending approval
    prisma.booking.count({
      where: { tutorId: profile.id, status: "PENDING" }
    }),
    // This month's bookings
    prisma.booking.count({
      where: {
        tutorId: profile.id,
        createdAt: { gte: startOfMonth }
      }
    }),
    // Last month's bookings (for % change)
    prisma.booking.count({
      where: {
        tutorId: profile.id,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    }),
    // Total earnings (sum of tutorEarnings on PAID payments)
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: profile.id },
        status: "PAID"
      }
    }),
    // This month's earnings
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: profile.id },
        status: "PAID"
      }
    }),
    // Latest 5 reviews
    prisma.review.findMany({
      where: { tutorId: profile.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true } }
      }
    }),
    // Next 5 upcoming accepted sessions
    prisma.booking.findMany({
      where: {
        tutorId: profile.id,
        status: "ACCEPTED"
      },
      take: 5,
      include: {
        student: { select: { id: true, name: true } },
        payment: { select: { status: true, amount: true } }
      }
    })
  ]);
  const bookingChange = lastMonthBookings === 0 ? 100 : Math.round(
    (monthBookings - lastMonthBookings) / lastMonthBookings * 100
  );
  return {
    overview: {
      totalBookings,
      completedBookings,
      pendingBookings,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      isApproved: profile.isApproved
    },
    activity: {
      thisMonthBookings: monthBookings,
      lastMonthBookings,
      bookingChangePercent: bookingChange
    },
    recentReviews,
    upcomingBookings
  };
};
var getOwnProfile = async (userId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!profile) {
    throw new AppError_default(
      status5.NOT_FOUND,
      "Tutor profile not found. Please create your profile first."
    );
  }
  return profile;
};
var TutorServices = {
  createTutorProfile,
  updateTutorProfile,
  uploadAvatar,
  getMyProfile,
  getPublicProfile,
  searchTutors,
  getDashboardStats
};

// src/app/module/tutor/tutor.controller.ts
var createTutorProfile2 = catchAsync(async (req, res) => {
  const result = await TutorServices.createTutorProfile(
    req.user,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status6.CREATED,
    success: true,
    message: "Tutor profile created successfully. Pending admin approval.",
    data: result
  });
});
var updateTutorProfile2 = catchAsync(async (req, res) => {
  const result = await TutorServices.updateTutorProfile(
    req.user,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Tutor profile updated successfully.",
    data: result
  });
});
var getMyProfile2 = catchAsync(async (req, res) => {
  const result = await TutorServices.getMyProfile(req.user);
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Tutor profile fetched successfully.",
    data: result
  });
});
var getPublicProfile2 = catchAsync(async (req, res) => {
  const { tutorId } = req.params;
  const result = await TutorServices.getPublicProfile(tutorId);
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Tutor profile fetched successfully.",
    data: result
  });
});
var searchTutors2 = catchAsync(async (req, res) => {
  const query = {
    subject: req.query.subject,
    language: req.query.language,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : void 0,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : void 0,
    minRating: req.query.minRating ? Number(req.query.minRating) : void 0,
    search: req.query.search,
    sortBy: req.query.sortBy,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10
  };
  const result = await TutorServices.searchTutors(query);
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Tutors fetched successfully.",
    data: result.tutors
  });
});
var uploadAvatar2 = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(status6.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'avatar'."
    });
    return;
  }
  const result = await TutorServices.uploadAvatar(
    req.user,
    req.file.buffer,
    req.file.mimetype
  );
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Avatar uploaded successfully.",
    data: result
  });
});
var getDashboardStats2 = catchAsync(async (req, res) => {
  const result = await TutorServices.getDashboardStats(req.user);
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Dashboard stats fetched successfully.",
    data: result
  });
});
var TutorController = {
  createTutorProfile: createTutorProfile2,
  updateTutorProfile: updateTutorProfile2,
  getMyProfile: getMyProfile2,
  getPublicProfile: getPublicProfile2,
  searchTutors: searchTutors2,
  uploadAvatar: uploadAvatar2,
  getDashboardStats: getDashboardStats2
};

// src/app/module/tutor/tutor.validation.ts
import { z } from "zod";
var timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
var createProfileSchema = z.object({
  body: z.object({
    bio: z.string({ error: "Bio is required." }).min(50, "Bio must be at least 50 characters.").max(1e3, "Bio must not exceed 1000 characters."),
    hourlyRate: z.number({ error: "Hourly rate is required." }).positive("Hourly rate must be greater than 0.").max(1e4, "Hourly rate seems too high."),
    subjects: z.array(z.string().uuid("Invalid subject ID.")).min(1, "At least one subject is required.").max(10, "Maximum 10 subjects allowed."),
    languages: z.array(z.string().uuid("Invalid language ID.")).min(1, "At least one language is required.").max(10, "Maximum 10 languages allowed."),
    experienceYrs: z.number().int().min(0).max(50).optional()
  })
});
var updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().min(50).max(1e3).optional(),
    hourlyRate: z.number().positive().max(1e4).optional(),
    subjects: z.array(z.string().uuid()).min(1).max(10).optional(),
    languages: z.array(z.string().uuid()).min(1).max(10).optional(),
    experienceYrs: z.number().int().min(0).max(50).optional()
  })
});
var availabilitySlotSchema = z.object({
  dayOfWeek: z.number({ error: "dayOfWeek is required." }).int().min(0, "dayOfWeek must be 0 (Sun) to 6 (Sat).").max(6, "dayOfWeek must be 0 (Sun) to 6 (Sat)."),
  startTime: z.string({ error: "startTime is required." }).regex(timeRegex, "startTime must be in HH:MM format (24-hour)."),
  endTime: z.string({ error: "endTime is required." }).regex(timeRegex, "endTime must be in HH:MM format (24-hour)."),
  isRecurring: z.boolean().optional().default(true)
});
var setAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(availabilitySlotSchema).min(1, "At least one availability slot is required.").max(50, "Maximum 50 slots allowed.")
  })
});
var deleteCertificateSchema = z.object({
  body: z.object({
    certificateUrl: z.string({ error: "certificateUrl is required." }).url("Must be a valid URL.")
  })
});
var searchQuerySchema = z.object({
  query: z.object({
    subject: z.string().optional(),
    language: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(["rating", "price_asc", "price_desc", "reviews"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
  })
});
var TutorValidation = {
  createProfileSchema,
  updateProfileSchema,
  setAvailabilitySchema,
  deleteCertificateSchema,
  searchQuerySchema
};

// src/app/middleware/validateRequest.ts
var validateRequest = (zodSchema) => {
  return async (req, res, next) => {
    try {
      const parsedResult = await zodSchema.safeParseAsync({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
        cookies: req.cookies || {}
      });
      if (!parsedResult.success) {
        return next(parsedResult.error);
      }
      if (parsedResult.data.body) {
        req.body = parsedResult.data.body;
      }
      if (parsedResult.data.query) {
        req.query = parsedResult.data.query;
      }
      if (parsedResult.data.params) {
        req.params = parsedResult.data.params;
      }
      if (parsedResult.data.cookies) {
        req.cookies = parsedResult.data.cookies;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/app/module/tutor/tutor.route.ts
var router2 = Router2();
router2.get(
  "/search",
  // validateRequest(TutorValidation.searchQuerySchema),
  TutorController.searchTutors
);
router2.get("/:tutorId/profile", TutorController.getPublicProfile);
router2.post(
  "/profile",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR),
  validateRequest(TutorValidation.createProfileSchema),
  TutorController.createTutorProfile
);
router2.patch(
  "/profile",
  checkAuth(UserRole.TUTOR),
  validateRequest(TutorValidation.updateProfileSchema),
  TutorController.updateTutorProfile
);
router2.get(
  "/profile/me",
  checkAuth(UserRole.TUTOR),
  TutorController.getMyProfile
);
router2.get(
  "/dashboard/stats",
  checkAuth(UserRole.TUTOR),
  TutorController.getDashboardStats
);
router2.post(
  "/upload/avatar",
  checkAuth(UserRole.TUTOR, UserRole.STUDENT),
  // both roles can upload avatars
  TutorController.uploadAvatar
);
var TutorRoutes = router2;

// src/app/module/booking/booking.route.ts
import { Router as Router3 } from "express";

// src/app/module/booking/booking.controller.ts
import status9 from "http-status";

// src/app/module/booking/booking.service.ts
import status8 from "http-status";

// src/app/module/availability/availability.service.ts
import status7 from "http-status";
var DAY_LABELS = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday"
};
var DAY_ORDER = [
  DayOfWeek.SUN,
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT
];
var toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
var overlaps = (aStart, aEnd, bStart, bEnd) => toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart);
var getDayOfWeekFromDate = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return DAY_ORDER[day];
};
var getTargetIds = async (user) => {
  if (user.role === UserRole.TUTOR) {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.userId } });
    if (!profile) {
      throw new AppError_default(status7.NOT_FOUND, "Tutor profile not found.");
    }
    return { tutorId: profile.id };
  }
  return { studentId: user.userId };
};
var assertNoOverlaps = (slots) => {
  const byDay = {};
  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }
  for (const [day, daySlots] of Object.entries(byDay)) {
    const sorted = [...daySlots].sort(
      (a, b) => a.startTime.localeCompare(b.startTime)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      if (overlaps(
        sorted[i].startTime,
        sorted[i].endTime,
        sorted[i + 1].startTime,
        sorted[i + 1].endTime
      )) {
        throw new AppError_default(
          status7.BAD_REQUEST,
          `Overlapping slots on ${DAY_LABELS[day]}: ${sorted[i].startTime}\u2013${sorted[i].endTime} overlaps ${sorted[i + 1].startTime}\u2013${sorted[i + 1].endTime}.`
        );
      }
    }
  }
};
var setAvailability = async (user, payload) => {
  const ids = await getTargetIds(user);
  assertNoOverlaps(payload.slots);
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: ids }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        ...ids,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive !== void 0 ? slot.isActive : true
      }))
    })
  ]);
  return getGroupedAvailability(ids);
};
var addSlot = async (user, slot) => {
  const ids = await getTargetIds(user);
  const existingSlots = await prisma.availability.findMany({
    where: { ...ids, dayOfWeek: slot.dayOfWeek }
  });
  for (const existing of existingSlots) {
    if (overlaps(slot.startTime, slot.endTime, existing.startTime, existing.endTime)) {
      throw new AppError_default(
        status7.CONFLICT,
        `This slot overlaps with an existing slot on ${DAY_LABELS[slot.dayOfWeek]}: ${existing.startTime}\u2013${existing.endTime}.`
      );
    }
  }
  const newSlot = await prisma.availability.create({
    data: {
      ...ids,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive !== void 0 ? slot.isActive : true
    }
  });
  return newSlot;
};
var updateSlot = async (user, slotId, data) => {
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });
  if (!slot) {
    throw new AppError_default(status7.NOT_FOUND, "Availability slot not found.");
  }
  if (ids.tutorId && slot.tutorId !== ids.tutorId || ids.studentId && slot.studentId !== ids.studentId) {
    throw new AppError_default(status7.FORBIDDEN, "You can only update your own availability slots.");
  }
  const newStart = data.startTime ?? slot.startTime;
  const newEnd = data.endTime ?? slot.endTime;
  if (newStart >= newEnd) {
    throw new AppError_default(status7.BAD_REQUEST, "startTime must be before endTime.");
  }
  const siblings = await prisma.availability.findMany({
    where: {
      ...ids,
      dayOfWeek: slot.dayOfWeek,
      id: { not: slotId }
    }
  });
  for (const s of siblings) {
    if (overlaps(newStart, newEnd, s.startTime, s.endTime)) {
      throw new AppError_default(
        status7.CONFLICT,
        `Updated slot overlaps with existing slot on ${DAY_LABELS[slot.dayOfWeek]}: ${s.startTime}\u2013${s.endTime}.`
      );
    }
  }
  const updated = await prisma.availability.update({
    where: { id: slotId },
    data: {
      ...data.startTime !== void 0 && { startTime: data.startTime },
      ...data.endTime !== void 0 && { endTime: data.endTime },
      ...data.isActive !== void 0 && { isActive: data.isActive }
    }
  });
  return updated;
};
var deleteSlot = async (user, slotId) => {
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });
  if (!slot) {
    throw new AppError_default(status7.NOT_FOUND, "Availability slot not found.");
  }
  if (ids.tutorId && slot.tutorId !== ids.tutorId || ids.studentId && slot.studentId !== ids.studentId) {
    throw new AppError_default(status7.FORBIDDEN, "You can only delete your own availability slots.");
  }
  await prisma.availability.delete({ where: { id: slotId } });
  return { message: "Slot deleted successfully." };
};
var getMyAvailability = async (user) => {
  const ids = await getTargetIds(user);
  return getGroupedAvailability(ids);
};
var getPublicAvailability = async (tutorProfileId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true }
  });
  if (!profile) {
    throw new AppError_default(status7.NOT_FOUND, "Tutor not found.");
  }
  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorProfileId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day)
  }));
};
var checkAvailability = async (payload) => {
  const { tutorId, bookingDate, startTime, endTime } = payload;
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorId, isApproved: true }
  });
  if (!profile) {
    throw new AppError_default(status7.NOT_FOUND, "Tutor not found.");
  }
  const requestedDay = getDayOfWeekFromDate(bookingDate);
  const coveringSlot = await prisma.availability.findFirst({
    where: {
      tutorId,
      dayOfWeek: requestedDay,
      isActive: true,
      startTime: { lte: startTime },
      endTime: { gte: endTime }
    }
  });
  if (!coveringSlot) {
    return {
      available: false,
      reason: `Tutor is not available during the requested time (${startTime}\u2013${endTime}) on ${DAY_LABELS[requestedDay]}s.`
    };
  }
  const conflict = await prisma.booking.findFirst({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "ACCEPTED"] }
    }
  });
  if (conflict && overlaps(startTime, endTime, conflict.startTime, conflict.endTime)) {
    return {
      available: false,
      reason: `Tutor already has a booking from ${conflict.startTime}\u2013${conflict.endTime} on this date.`
    };
  }
  return {
    available: true,
    reason: null,
    slot: coveringSlot
  };
};
var toggleSlot = async (user, slotId) => {
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });
  if (!slot) throw new AppError_default(status7.NOT_FOUND, "Availability slot not found.");
  if (ids.tutorId && slot.tutorId !== ids.tutorId || ids.studentId && slot.studentId !== ids.studentId) {
    throw new AppError_default(status7.FORBIDDEN, "You can only toggle your own slots.");
  }
  const updated = await prisma.availability.update({
    where: { id: slotId },
    data: { isActive: !slot.isActive }
  });
  return updated;
};
var getGroupedAvailability = async (ids) => {
  const slots = await prisma.availability.findMany({
    where: ids,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
    activeCount: slots.filter((s) => s.dayOfWeek === day && s.isActive).length,
    totalCount: slots.filter((s) => s.dayOfWeek === day).length
  }));
};
var availabilityService = {
  setAvailability,
  addSlot,
  updateSlot,
  deleteSlot,
  toggleSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability
};

// src/app/module/booking/booking.service.ts
var timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
var timesOverlap = (aStart, aEnd, bStart, bEnd) => {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
};
var getPagination = (page = 1, limit = 10) => ({
  skip: (page - 1) * Math.min(limit, 50),
  take: Math.min(limit, 50)
});
var createBooking = async (studentId, data) => {
  const { tutorId, subjectId, bookingDate, startTime, endTime, totalPrice } = data;
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: { user: true }
  });
  if (!tutor) {
    throw new AppError_default(status8.NOT_FOUND, "Tutor not found.");
  }
  if (!tutor.isApproved) {
    throw new AppError_default(
      status8.BAD_REQUEST,
      "This tutor is not yet approved. Please choose another tutor."
    );
  }
  if (tutor.userId === studentId) {
    throw new AppError_default(status8.BAD_REQUEST, "You cannot book yourself.");
  }
  const bookingDateObj = new Date(bookingDate);
  if (bookingDateObj < /* @__PURE__ */ new Date()) {
    throw new AppError_default(status8.BAD_REQUEST, "Booking date must be in the future.");
  }
  const availability = await availabilityService.checkAvailability({
    tutorId,
    bookingDate,
    startTime,
    endTime
  });
  if (!availability.available) {
    throw new AppError_default(status8.CONFLICT, availability.reason || "Tutor is not available at this time.");
  }
  const studentConflict = await prisma.booking.findFirst({
    where: {
      studentId,
      bookingDate: bookingDateObj,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] }
    }
  });
  if (studentConflict && timesOverlap(startTime, endTime, studentConflict.startTime, studentConflict.endTime)) {
    throw new AppError_default(
      status8.CONFLICT,
      `You already have a booking from ${studentConflict.startTime} to ${studentConflict.endTime} on that date.`
    );
  }
  const booking = await prisma.booking.create({
    data: {
      studentId,
      tutorId,
      subjectId,
      bookingDate: bookingDateObj,
      startTime,
      endTime,
      totalPrice,
      status: BookingStatus.PENDING,
      meetingLink: null
    },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } }
        }
      },
      student: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  return booking;
};
var updateBookingStatus = async (requesterId, requesterRole, bookingId, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: true,
      student: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  if (!booking) {
    throw new AppError_default(status8.NOT_FOUND, "Booking not found.");
  }
  if (requesterRole === "TUTOR") {
    if (booking.tutor.userId !== requesterId) {
      throw new AppError_default(
        status8.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }
    const allowedTutorTransitions = {
      [BookingStatus.PENDING]: [BookingStatus.ACCEPTED, BookingStatus.REJECTED],
      [BookingStatus.ACCEPTED]: [BookingStatus.COMPLETED]
    };
    if (data.status && !allowedTutorTransitions[booking.status]?.includes(data.status)) {
      throw new AppError_default(
        status8.BAD_REQUEST,
        `Cannot transition booking from ${booking.status} to ${data.status}.`
      );
    }
  }
  if (requesterRole === "STUDENT") {
    if (booking.studentId !== requesterId) {
      throw new AppError_default(
        status8.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }
    if (data.status && data.status !== BookingStatus.CANCELLED) {
      throw new AppError_default(
        status8.FORBIDDEN,
        "Students can only cancel bookings."
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError_default(
        status8.BAD_REQUEST,
        "You can only cancel a booking that is still pending."
      );
    }
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...data.status && { status: data.status }
      // ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
    },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } }
        }
      },
      student: { select: { id: true, name: true, email: true, image: true } },
      payment: true
    }
  });
  return updated;
};
var getBookingsByStudent = async (studentId, query) => {
  const { skip, take } = getPagination(query.page, query.limit);
  const where = {
    studentId,
    ...query.status && { status: query.status }
  };
  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: { select: { id: true, name: true, image: true } }
          }
        },
        payment: { select: { status: true, amount: true } }
      },
      orderBy: { bookingDate: "desc" },
      skip,
      take
    })
  ]);
  return {
    bookings,
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};
var getBookingsByTutor = async (tutorUserId, query) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId }
  });
  if (!tutorProfile) {
    throw new AppError_default(status8.NOT_FOUND, "Tutor profile not found.");
  }
  const { skip, take } = getPagination(query.page, query.limit);
  const where = {
    tutorId: tutorProfile.id,
    ...query.status && { status: query.status }
  };
  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, image: true, email: true }
        },
        payment: { select: { status: true, amount: true } }
      },
      orderBy: { bookingDate: "desc" },
      skip,
      take
    })
  ]);
  return {
    bookings,
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};
var getBookingById = async (requesterId, requesterRole, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } }
        }
      },
      student: { select: { id: true, name: true, image: true, email: true } },
      payment: true
    }
  });
  if (!booking) {
    throw new AppError_default(status8.NOT_FOUND, "Booking not found.");
  }
  const isStudent = booking.studentId === requesterId;
  const isTutor = booking.tutorId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  if (!isStudent && !isTutor && !isAdmin) {
    throw new AppError_default(status8.FORBIDDEN, "You do not have access to this booking.");
  }
  return booking;
};
var createReview = async (studentId, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId }
  });
  if (!booking) {
    throw new AppError_default(status8.NOT_FOUND, "Booking not found.");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(
      status8.FORBIDDEN,
      "You can only review your own bookings."
    );
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError_default(
      status8.BAD_REQUEST,
      "You can only review a completed session."
    );
  }
  if (booking.tutorId !== data.tutorId) {
    throw new AppError_default(status8.BAD_REQUEST, "Tutor ID does not match the booking.");
  }
  const existingReview = await prisma.review.findFirst({
    where: { studentId, tutorId: data.tutorId }
  });
  if (existingReview) {
    throw new AppError_default(
      status8.CONFLICT,
      "You have already reviewed this tutor for this booking."
    );
  }
  const [review] = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        studentId,
        tutorId: data.tutorId,
        rating: data.rating,
        comment: data.comment
      },
      include: {
        student: { select: { id: true, name: true, image: true } }
      }
    });
    const aggregate = await tx.review.aggregate({
      where: { tutorId: data.tutorId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.tutorProfile.update({
      where: { id: data.tutorId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating
      }
    });
    return [newReview];
  });
  return review;
};
var getReviewsByTutor = async (tutorId, query) => {
  const { skip, take } = getPagination(query.page, query.limit);
  const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
  if (!tutor) {
    throw new AppError_default(status8.NOT_FOUND, "Tutor not found.");
  }
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where: { tutorId } }),
    prisma.review.findMany({
      where: { tutorId },
      include: {
        student: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    })
  ]);
  return {
    reviews,
    summary: {
      averageRating: tutor.averageRating,
      totalReviews: tutor.totalReviews
    },
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take)
    }
  };
};
var bookingService = {
  createBooking,
  updateBookingStatus,
  getBookingsByStudent,
  getBookingsByTutor,
  getBookingById,
  createReview,
  getReviewsByTutor
};

// src/app/module/booking/booking.controller.ts
var createBooking2 = catchAsync(async (req, res) => {
  const user = req.user;
  const booking = await bookingService.createBooking(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status9.CREATED,
    success: true,
    message: "Booking created successfully.",
    data: booking
  });
});
var updateBooking = catchAsync(async (req, res) => {
  const user = req.user;
  const bookingId = req.params.id;
  const booking = await bookingService.updateBookingStatus(
    user.userId,
    user.role,
    bookingId,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "Booking updated successfully.",
    data: booking
  });
});
var getBookingById2 = catchAsync(async (req, res) => {
  const user = req.user;
  const booking = await bookingService.getBookingById(
    user.userId,
    user.role,
    req.params.id
  );
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "Booking fetched successfully.",
    data: booking
  });
});
var getMyBookingsAsStudent = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await bookingService.getBookingsByStudent(user.userId, {
    status: req.query.status,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10
  });
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings
  });
});
var getMyBookingsAsTutor = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await bookingService.getBookingsByTutor(user.userId, {
    status: req.query.status,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10
  });
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings
  });
});
var createReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const review = await bookingService.createReview(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status9.CREATED,
    success: true,
    message: "Review submitted successfully.",
    data: review
  });
});
var getReviewsByTutor2 = catchAsync(async (req, res) => {
  const tutorId = req.params.tutorId;
  const result = await bookingService.getReviewsByTutor(tutorId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10
  });
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "Reviews fetched successfully.",
    data: result.reviews
  });
});
var bookingControllers = {
  createBooking: createBooking2,
  updateBooking,
  getBookingById: getBookingById2,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  createReview: createReview2,
  getReviewsByTutor: getReviewsByTutor2
};

// src/app/module/booking/booking.validation.ts
import { z as z2 } from "zod";
var timeRegex2 = /^([01]\d|2[0-3]):[0-5]\d$/;
var createBookingSchema = z2.object({
  body: z2.object({
    tutorId: z2.string().uuid("Invalid tutor ID."),
    bookingDate: z2.string({ message: "Booking date is required." }).refine((val) => !isNaN(Date.parse(val)), "Invalid date format."),
    startTime: z2.string({ message: "Start time is required." }).regex(timeRegex2, "startTime must be HH:MM (24-hour)."),
    endTime: z2.string({ message: "End time is required." }).regex(timeRegex2, "endTime must be HH:MM (24-hour)."),
    totalPrice: z2.number({ message: "Total price is required." }).positive("Total price must be greater than 0.")
  }).refine(
    (data) => data.startTime < data.endTime,
    { message: "startTime must be before endTime.", path: ["endTime"] }
  )
});
var updateBookingSchema = z2.object({
  body: z2.object({
    status: z2.enum(BookingStatus).optional(),
    meetingLink: z2.string().url("Must be a valid URL.").optional()
  }).refine(
    (data) => data.status !== void 0 || data.meetingLink !== void 0,
    { message: "Provide at least status or meetingLink." }
  )
});
var bookingQuerySchema = z2.object({
  query: z2.object({
    status: z2.enum(BookingStatus).optional(),
    page: z2.coerce.number().int().positive().optional(),
    limit: z2.coerce.number().int().min(1).max(50).optional()
  })
});
var createReviewSchema = z2.object({
  body: z2.object({
    bookingId: z2.string().uuid("Invalid booking ID."),
    rating: z2.number({ message: "Rating is required." }).int().min(1, "Minimum rating is 1.").max(5, "Maximum rating is 5."),
    comment: z2.string({ message: "Comment is required." }).min(10, "Comment must be at least 10 characters.").max(1e3, "Comment must not exceed 1000 characters.")
  })
});

// src/app/module/booking/booking.route.ts
var router3 = Router3();
router3.post(
  "/",
  checkAuth(UserRole.STUDENT),
  validateRequest(createBookingSchema),
  bookingControllers.createBooking
);
router3.get(
  "/student/me",
  checkAuth(UserRole.STUDENT),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsStudent
);
router3.get(
  "/tutor/me",
  checkAuth(UserRole.TUTOR),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsTutor
);
router3.get(
  "/:id",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  bookingControllers.getBookingById
);
router3.patch(
  "/:id",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  validateRequest(updateBookingSchema),
  bookingControllers.updateBooking
);
router3.post(
  "/reviews",
  checkAuth(UserRole.STUDENT),
  validateRequest(createReviewSchema),
  bookingControllers.createReview
);
router3.get(
  "/reviews/:tutorId",
  bookingControllers.getReviewsByTutor
);
var BookingRoute = router3;

// src/app/module/admin/admin.route.ts
import { Router as Router4 } from "express";

// src/app/module/admin/admin.controller.ts
import httpStatus from "http-status";

// src/app/module/admin/admin.service.ts
import status10 from "http-status";
var getAllUsers = async (query) => {
  const { role, status: status14, searchTerm } = query;
  const where = {};
  if (role) {
    where.role = role;
  }
  if (status14) {
    where.status = status14;
  }
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } }
    ];
  }
  const result = await prisma.user.findMany({
    where,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      tutorProfile: true
    }
  });
  return result;
};
var updateUserStatus = async (userId, status14, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        status: status14
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user status of ${userId} to ${status14}`
      }
    });
    return updatedUser;
  });
  return result;
};
var updateUserRole = async (userId, role, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        role
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user role of ${userId} to ${role}`
      }
    });
    return updatedUser;
  });
  return result;
};
var getDashboardStats3 = async () => {
  const totalUsers = await prisma.user.count();
  const totalTutors = await prisma.user.count({ where: { role: UserRole.TUTOR } });
  const totalStudents = await prisma.user.count({ where: { role: UserRole.STUDENT } });
  const totalBookings = await prisma.booking.count();
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings
  };
};
var getAdminLogs = async () => {
  const result = await prisma.adminLog.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      admin: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  return result;
};
var createAdmin = async (payload, adminId) => {
  const { name, email, password } = payload;
  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password
    }
  });
  if (!data.user) {
    throw new AppError_default(status10.BAD_REQUEST, "Failed to create admin user");
  }
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: data.user.id
      },
      data: {
        role: UserRole.ADMIN
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Created new admin: ${email}`
      }
    });
    return updatedUser;
  });
  return result;
};
var deleteUser = async (userId, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError_default(status10.NOT_FOUND, "User not found");
    }
    const deletedUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        isDeleted: true,
        status: UserStatus.BLOCKED
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Deleted user: ${user.email} (${userId})`
      }
    });
    return deletedUser;
  });
  return result;
};
var approveTutor = async (userId, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { tutorProfile: true }
    });
    if (!user) {
      throw new AppError_default(status10.NOT_FOUND, "Tutor not found");
    }
    if (user.role !== UserRole.TUTOR) {
      throw new AppError_default(status10.BAD_REQUEST, "User is not a tutor");
    }
    if (!user.tutorProfile) {
      throw new AppError_default(status10.BAD_REQUEST, "Tutor profile not found");
    }
    await tx.tutorProfile.update({
      where: { userId },
      data: { isApproved: true }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Approved tutor: ${user.email} (${user.id})`
      }
    });
    return { message: "Tutor approved successfully" };
  });
  return result;
};
var rejectTutor = async (userId, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new AppError_default(status10.NOT_FOUND, "Tutor not found");
    }
    if (user.role !== UserRole.TUTOR) {
      throw new AppError_default(status10.BAD_REQUEST, "User is not a tutor");
    }
    await tx.user.update({
      where: { id: userId },
      data: { role: UserRole.STUDENT }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Rejected tutor and changed role to student: ${user.email} (${user.id})`
      }
    });
    return { message: "Tutor rejected and role updated to student" };
  });
  return result;
};
var AdminService = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getDashboardStats: getDashboardStats3,
  getAdminLogs,
  createAdmin,
  deleteUser,
  approveTutor,
  rejectTutor
};

// src/app/module/admin/admin.controller.ts
var getAllUsers2 = catchAsync(async (req, res) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result
  });
});
var updateUserStatus2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { status: status14 } = req.body;
  const adminId = req.user.userId;
  const result = await AdminService.updateUserStatus(id, status14, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result
  });
});
var updateUserRole2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  const adminId = req.user.userId;
  const result = await AdminService.updateUserRole(id, role, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully",
    data: result
  });
});
var getDashboardStats4 = catchAsync(async (req, res) => {
  const result = await AdminService.getDashboardStats();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Dashboard statistics fetched successfully",
    data: result
  });
});
var getAdminLogs2 = catchAsync(async (req, res) => {
  const result = await AdminService.getAdminLogs();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Admin logs fetched successfully",
    data: result
  });
});
var createAdmin2 = catchAsync(async (req, res) => {
  const adminId = req.user.userId;
  const result = await AdminService.createAdmin(req.body, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result
  });
});
var deleteUser2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const adminId = req.user.userId;
  const result = await AdminService.deleteUser(id, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result
  });
});
var approveTutor2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const adminId = req.user.userId;
  const result = await AdminService.approveTutor(id, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Tutor approved successfully",
    data: result
  });
});
var rejectTutor2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const adminId = req.user.userId;
  const result = await AdminService.rejectTutor(id, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Tutor rejected and role updated to student",
    data: result
  });
});
var AdminController = {
  getAllUsers: getAllUsers2,
  updateUserStatus: updateUserStatus2,
  updateUserRole: updateUserRole2,
  getDashboardStats: getDashboardStats4,
  getAdminLogs: getAdminLogs2,
  createAdmin: createAdmin2,
  deleteUser: deleteUser2,
  approveTutor: approveTutor2,
  rejectTutor: rejectTutor2
};

// src/app/module/admin/admin.validation.ts
import { z as z3 } from "zod";
var updateUserStatusValidationSchema = z3.object({
  body: z3.object({
    status: z3.enum(UserStatus, {
      message: "Status is required"
    })
  })
});
var updateUserRoleValidationSchema = z3.object({
  body: z3.object({
    role: z3.enum(UserRole, {
      message: "Role is required"
    })
  })
});
var createAdminValidationSchema = z3.object({
  body: z3.object({
    name: z3.string().min(1, "Name is required"),
    email: z3.string().email("Invalid email address"),
    password: z3.string().min(6, "Password must be at least 6 characters")
  })
});
var approveTutorValidationSchema = z3.object({
  params: z3.object({
    id: z3.string().trim().min(1, "Invalid user ID")
  })
});
var rejectTutorValidationSchema = z3.object({
  params: z3.object({
    id: z3.string().trim().min(1, "Invalid user ID")
  })
});
var AdminValidation = {
  updateUserStatusValidationSchema,
  updateUserRoleValidationSchema,
  createAdminValidationSchema,
  approveTutorValidationSchema,
  rejectTutorValidationSchema
};

// src/app/module/admin/admin.route.ts
var router4 = Router4();
router4.get(
  "/dashboard-stats",
  checkAuth(UserRole.ADMIN),
  AdminController.getDashboardStats
);
router4.get(
  "/logs",
  checkAuth(UserRole.ADMIN),
  AdminController.getAdminLogs
);
router4.post(
  "/create-admin",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.createAdminValidationSchema),
  AdminController.createAdmin
);
router4.get(
  "/users",
  checkAuth(UserRole.ADMIN),
  AdminController.getAllUsers
);
router4.patch(
  "/users/:id/status",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserStatusValidationSchema),
  AdminController.updateUserStatus
);
router4.patch(
  "/users/:id/role",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserRoleValidationSchema),
  AdminController.updateUserRole
);
router4.patch(
  "/tutors/:id/approve",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.approveTutorValidationSchema),
  AdminController.approveTutor
);
router4.patch(
  "/tutors/:id/reject",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.rejectTutorValidationSchema),
  AdminController.rejectTutor
);
router4.delete(
  "/users/:id",
  checkAuth(UserRole.ADMIN),
  AdminController.deleteUser
);
var AdminRoutes = router4;

// src/app/module/subject/subject.route.ts
import { Router as Router5 } from "express";

// src/app/module/subject/subject.controller.ts
import httpStatus2 from "http-status";

// src/app/module/subject/subject.service.ts
var createSubject = async (payload) => {
  const result = await prisma.subject.create({
    data: payload
  });
  return result;
};
var getAllSubjects = async () => {
  const result = await prisma.subject.findMany();
  return result;
};
var getSubjectById = async (id) => {
  const result = await prisma.subject.findUnique({
    where: {
      id
    }
  });
  return result;
};
var updateSubject = async (id, payload) => {
  const result = await prisma.subject.update({
    where: {
      id
    },
    data: payload
  });
  return result;
};
var deleteSubject = async (id) => {
  const result = await prisma.subject.delete({
    where: {
      id
    }
  });
  return result;
};
var SubjectService = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
};

// src/app/module/subject/subject.controller.ts
var createSubject2 = catchAsync(async (req, res) => {
  const result = await SubjectService.createSubject(req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus2.CREATED,
    success: true,
    message: "Subject created successfully",
    data: result
  });
});
var getAllSubjects2 = catchAsync(async (req, res) => {
  const result = await SubjectService.getAllSubjects();
  sendResponse(res, {
    httpStatusCode: httpStatus2.OK,
    success: true,
    message: "Subjects fetched successfully",
    data: result
  });
});
var getSubjectById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await SubjectService.getSubjectById(id);
  sendResponse(res, {
    httpStatusCode: httpStatus2.OK,
    success: true,
    message: "Subject fetched successfully",
    data: result
  });
});
var updateSubject2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await SubjectService.updateSubject(id, req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus2.OK,
    success: true,
    message: "Subject updated successfully",
    data: result
  });
});
var deleteSubject2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await SubjectService.deleteSubject(id);
  sendResponse(res, {
    httpStatusCode: httpStatus2.OK,
    success: true,
    message: "Subject deleted successfully",
    data: result
  });
});
var SubjectController = {
  createSubject: createSubject2,
  getAllSubjects: getAllSubjects2,
  getSubjectById: getSubjectById2,
  updateSubject: updateSubject2,
  deleteSubject: deleteSubject2
};

// src/app/module/subject/subject.validation.ts
import { z as z4 } from "zod";
var createSubjectValidationSchema = z4.object({
  body: z4.object({
    name: z4.string().min(1, "Name is required"),
    categories: z4.nativeEnum(SubjectCategory, {
      message: "Category is required"
    })
  })
});
var updateSubjectValidationSchema = z4.object({
  body: z4.object({
    name: z4.string().optional(),
    categories: z4.nativeEnum(SubjectCategory).optional()
  })
});
var SubjectValidation = {
  createSubjectValidationSchema,
  updateSubjectValidationSchema
};

// src/app/module/subject/subject.route.ts
var router5 = Router5();
router5.get("/", SubjectController.getAllSubjects);
router5.get("/:id", SubjectController.getSubjectById);
router5.post(
  "/",
  // checkAuth(UserRole.ADMIN),
  // validateRequest(SubjectValidation.createSubjectValidationSchema),
  SubjectController.createSubject
);
router5.patch(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(SubjectValidation.updateSubjectValidationSchema),
  SubjectController.updateSubject
);
router5.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  SubjectController.deleteSubject
);
var SubjectRoutes = router5;

// src/app/module/language/language.route.ts
import { Router as Router6 } from "express";

// src/app/module/language/language.controller.ts
import httpStatus3 from "http-status";

// src/app/module/language/language.service.ts
var createLanguage = async (payload) => {
  const result = await prisma.language.create({
    data: payload
  });
  return result;
};
var getAllLanguages = async () => {
  const result = await prisma.language.findMany();
  return result;
};
var getLanguageById = async (id) => {
  const result = await prisma.language.findUnique({
    where: {
      id
    }
  });
  return result;
};
var updateLanguage = async (id, payload) => {
  const result = await prisma.language.update({
    where: {
      id
    },
    data: payload
  });
  return result;
};
var deleteLanguage = async (id) => {
  const result = await prisma.language.delete({
    where: {
      id
    }
  });
  return result;
};
var LanguageService = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage
};

// src/app/module/language/language.controller.ts
var createLanguage2 = catchAsync(async (req, res) => {
  const result = await LanguageService.createLanguage(req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus3.CREATED,
    success: true,
    message: "Language created successfully",
    data: result
  });
});
var getAllLanguages2 = catchAsync(async (req, res) => {
  const result = await LanguageService.getAllLanguages();
  sendResponse(res, {
    httpStatusCode: httpStatus3.OK,
    success: true,
    message: "Languages fetched successfully",
    data: result
  });
});
var getLanguageById2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await LanguageService.getLanguageById(id);
  sendResponse(res, {
    httpStatusCode: httpStatus3.OK,
    success: true,
    message: "Language fetched successfully",
    data: result
  });
});
var updateLanguage2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await LanguageService.updateLanguage(id, req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus3.OK,
    success: true,
    message: "Language updated successfully",
    data: result
  });
});
var deleteLanguage2 = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await LanguageService.deleteLanguage(id);
  sendResponse(res, {
    httpStatusCode: httpStatus3.OK,
    success: true,
    message: "Language deleted successfully",
    data: result
  });
});
var LanguageController = {
  createLanguage: createLanguage2,
  getAllLanguages: getAllLanguages2,
  getLanguageById: getLanguageById2,
  updateLanguage: updateLanguage2,
  deleteLanguage: deleteLanguage2
};

// src/app/module/language/language.validation.ts
import { z as z5 } from "zod";
var createLanguageValidationSchema = z5.object({
  body: z5.object({
    name: z5.string().min(1, "Name is required")
  })
});
var updateLanguageValidationSchema = z5.object({
  body: z5.object({
    name: z5.string().optional()
  })
});
var LanguageValidation = {
  createLanguageValidationSchema,
  updateLanguageValidationSchema
};

// src/app/module/language/language.route.ts
var router6 = Router6();
router6.get("/", LanguageController.getAllLanguages);
router6.get("/:id", LanguageController.getLanguageById);
router6.post(
  "/",
  // checkAuth(UserRole.ADMIN),
  // validateRequest(LanguageValidation.createLanguageValidationSchema),
  LanguageController.createLanguage
);
router6.patch(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(LanguageValidation.updateLanguageValidationSchema),
  LanguageController.updateLanguage
);
router6.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  LanguageController.deleteLanguage
);
var LanguageRoutes = router6;

// src/app/module/availability/availability.route.ts
import { Router as Router7 } from "express";

// src/app/module/availability/availability.controller.ts
import status11 from "http-status";
var setAvailability2 = catchAsync(async (req, res) => {
  const result = await availabilityService.setAvailability(
    req.user,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: "Availability set successfully.",
    data: result
  });
});
var addSlot2 = catchAsync(async (req, res) => {
  const result = await availabilityService.addSlot(
    req.user,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status11.CREATED,
    success: true,
    message: "Availability slot added successfully.",
    data: result
  });
});
var updateSlot2 = catchAsync(async (req, res) => {
  const result = await availabilityService.updateSlot(
    req.user,
    req.params.slotId,
    req.body
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: "Availability slot updated successfully.",
    data: result
  });
});
var deleteSlot2 = catchAsync(async (req, res) => {
  const result = await availabilityService.deleteSlot(
    req.user,
    req.params.slotId
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: result.message,
    data: null
  });
});
var toggleSlot2 = catchAsync(async (req, res) => {
  const result = await availabilityService.toggleSlot(
    req.user,
    req.params.slotId
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: `Slot ${result.isActive ? "activated" : "deactivated"} successfully.`,
    data: result
  });
});
var getMyAvailability2 = catchAsync(async (req, res) => {
  const result = await availabilityService.getMyAvailability(
    req.user
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: "Availability fetched successfully.",
    data: result
  });
});
var getPublicAvailability2 = catchAsync(async (req, res) => {
  const result = await availabilityService.getPublicAvailability(
    req.params.tutorId
  );
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: "Tutor availability fetched successfully.",
    data: result
  });
});
var checkAvailability2 = catchAsync(async (req, res) => {
  const result = await availabilityService.checkAvailability({
    tutorId: req.params.tutorId,
    bookingDate: req.query.bookingDate,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  });
  sendResponse(res, {
    httpStatusCode: status11.OK,
    success: true,
    message: result.available ? "Slot is available." : "Slot is not available.",
    data: result
  });
});
var availabilityController = {
  setAvailability: setAvailability2,
  addSlot: addSlot2,
  updateSlot: updateSlot2,
  deleteSlot: deleteSlot2,
  toggleSlot: toggleSlot2,
  getMyAvailability: getMyAvailability2,
  getPublicAvailability: getPublicAvailability2,
  checkAvailability: checkAvailability2
};

// src/app/module/availability/availability.validation.ts
import { z as z6 } from "zod";
var timeRegex3 = /^([01]\d|2[0-3]):[0-5]\d$/;
var DAY_VALUES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
var slotSchema = z6.object({
  dayOfWeek: z6.preprocess(
    (value) => typeof value === "string" ? value.trim().toUpperCase() : value,
    z6.enum(DAY_VALUES)
  ),
  startTime: z6.string({ message: "startTime is required." }).regex(timeRegex3, 'startTime must be HH:MM 24-hour format, e.g. "09:00"'),
  endTime: z6.string({ message: "endTime is required." }).regex(timeRegex3, 'endTime must be HH:MM 24-hour format, e.g. "11:00"'),
  isActive: z6.boolean().optional()
}).refine((data) => data.startTime < data.endTime, {
  message: "startTime must be before endTime.",
  path: ["endTime"]
});
var setAvailabilitySchema2 = z6.object({
  body: z6.object({
    slots: z6.array(slotSchema).min(1, "At least one slot is required.").max(28, "Maximum 28 slots (4 per day \xD7 7 days).")
  })
});
var addSlotSchema = z6.object({
  body: slotSchema
});
var updateSlotSchema = z6.object({
  body: z6.object({
    startTime: z6.string().regex(timeRegex3, "startTime must be HH:MM (24-hour format).").optional(),
    endTime: z6.string().regex(timeRegex3, "endTime must be HH:MM (24-hour format).").optional(),
    isActive: z6.boolean().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update."
  }).refine(
    (data) => {
      if (data.startTime && data.endTime) return data.startTime < data.endTime;
      return true;
    },
    { message: "startTime must be before endTime.", path: ["endTime"] }
  )
});
var checkAvailabilitySchema = z6.object({
  query: z6.object({
    bookingDate: z6.string({ message: "bookingDate is required." }).refine((val) => !isNaN(Date.parse(val)), "Invalid date format."),
    startTime: z6.string({ message: "startTime is required." }).regex(timeRegex3, "startTime must be HH:MM."),
    endTime: z6.string({ message: "endTime is required." }).regex(timeRegex3, "endTime must be HH:MM.")
  })
});
var AvailabilityValidation = {
  setAvailabilitySchema: setAvailabilitySchema2,
  addSlotSchema,
  updateSlotSchema,
  checkAvailabilitySchema
};

// src/app/module/availability/availability.route.ts
var router7 = Router7();
router7.get("/me", checkAuth(UserRole.TUTOR), availabilityController.getMyAvailability);
router7.put(
  "/",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.setAvailabilitySchema),
  availabilityController.setAvailability
);
router7.post(
  "/slot",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.addSlotSchema),
  availabilityController.addSlot
);
router7.patch(
  "/slot/:slotId/toggle",
  // more specific — must come before /slot/:slotId
  checkAuth(UserRole.TUTOR),
  availabilityController.toggleSlot
);
router7.patch(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.updateSlotSchema),
  availabilityController.updateSlot
);
router7.delete(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  availabilityController.deleteSlot
);
router7.get(
  "/:tutorId/check",
  // more specific — before /:tutorId
  validateRequest(AvailabilityValidation.checkAvailabilitySchema),
  availabilityController.checkAvailability
);
router7.get("/:tutorId", availabilityController.getPublicAvailability);
var AvailabilityRoutes = router7;

// src/app/module/payment/payment.route.ts
import express, { Router as Router8 } from "express";

// src/app/module/payment/payment.controller.ts
import status13 from "http-status";

// src/app/module/payment/payment.service.ts
import status12 from "http-status";
import Stripe from "stripe";
var stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10"
});
var getBookingForPayment = async (bookingId, studentId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: {
        select: { id: true, name: true, email: true }
      },
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      payment: true
    }
  });
  if (!booking) {
    throw new AppError_default(status12.NOT_FOUND, "Booking not found.");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(status12.FORBIDDEN, "You can only pay for your own bookings.");
  }
  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError_default(
      status12.BAD_REQUEST,
      `Cannot pay for a booking with status: ${booking.status}. Booking must be ACCEPTED first.`
    );
  }
  if (booking.payment?.status === PaymentStatus.PAID) {
    throw new AppError_default(status12.CONFLICT, "This booking has already been paid.");
  }
  return booking;
};
var initiatePayment = async (studentId, payload) => {
  const { bookingId, gateway } = payload;
  const booking = await getBookingForPayment(bookingId, studentId);
  if (gateway === "STRIPE") {
    return initiateStripePayment(booking);
  } else {
    return initiateSSLCommerzPayment(booking);
  }
};
var initiateStripePayment = async (booking) => {
  const amountInCents = Math.round(Number(booking.totalPrice) * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      bookingId: booking.id,
      studentId: booking.studentId,
      tutorId: booking.tutorId
    },
    description: `TutorByte session with ${booking.tutor.user.name}`,
    receipt_email: booking.student.email
  });
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId: paymentIntent.id,
      paymentMethod: "STRIPE"
    },
    update: {
      // If retrying, refresh the transactionId
      transactionId: paymentIntent.id,
      status: PaymentStatus.PENDING,
      paymentMethod: "STRIPE"
    }
  });
  return {
    gateway: "STRIPE",
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: Number(booking.totalPrice),
    currency: "usd",
    booking: {
      id: booking.id,
      tutorName: booking.tutor.user.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime
    }
  };
};
var handleStripeWebhook = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_SECRET_KEY
    );
  } catch {
    throw new AppError_default(status12.BAD_REQUEST, "Invalid Stripe webhook signature.");
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      await handleStripeSuccess(intent);
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await handleStripeFailure(intent);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      await handleStripeRefund(charge);
      break;
    }
    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
  return { received: true };
};
var handleStripeSuccess = async (intent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;
  const paymentMethodType = intent.payment_method_types?.[0] ?? "card";
  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.PAID,
        transactionId: intent.id,
        paymentMethod: `STRIPE_${paymentMethodType.toUpperCase()}`
      }
    })
    // Keep booking as ACCEPTED — tutor marks COMPLETED after session
    // But we can set meetingLink here if needed in future
  ]);
  console.log(`\u2705 Stripe payment succeeded for booking: ${bookingId}`);
};
var handleStripeFailure = async (intent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;
  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: PaymentStatus.FAILED,
      transactionId: intent.id
    }
  });
  console.log(`\u274C Stripe payment failed for booking: ${bookingId}`);
};
var handleStripeRefund = async (charge) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: charge.payment_intent }
  });
  if (!payment) return;
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED }
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED }
    })
  ]);
  console.log(`\u21A9\uFE0F  Stripe refund processed for booking: ${payment.bookingId}`);
};
var initiateSSLCommerzPayment = async (booking) => {
  const transactionId = `TB-${booking.id}-${Date.now()}`;
  const sslData = {
    total_amount: Number(booking.totalPrice),
    currency: "BDT",
    tran_id: transactionId,
    // Redirect URLs — frontend handles these pages
    // success_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/success`,
    // fail_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/fail`,
    // cancel_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/cancel`,
    // ipn_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/ipn`,
    // Customer info
    cus_name: booking.student.name,
    cus_email: booking.student.email,
    // cus_phone: booking.student.phone ?? "01700000000",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    // Product info
    product_name: `Tutoring Session \u2013 ${booking.tutor.user.name}`,
    product_category: "Education",
    product_profile: "general",
    // Shipping (required by SSLCommerz even for digital goods)
    shipping_method: "NO",
    num_of_item: 1,
    ship_name: booking.student.name,
    ship_add1: "Dhaka",
    ship_city: "Dhaka",
    ship_country: "Bangladesh",
    // Store the bookingId so we can match on callback
    value_a: booking.id
  };
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId,
      paymentMethod: "SSLCOMMERZ"
    },
    update: {
      transactionId,
      status: PaymentStatus.PENDING,
      paymentMethod: "SSLCOMMERZ"
    }
  });
  return {
    gateway: "SSLCOMMERZ",
    gatewayUrl: "https://test.sslcommerz.com/gw/payment/paymentApi",
    // Placeholder URL
    transactionId,
    amount: Number(booking.totalPrice),
    currency: "BDT",
    booking: {
      id: booking.id,
      tutorName: booking.tutor.user.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime
    }
  };
};
var handleSSLCommerzSuccess = async (payload) => {
  const { tran_id, val_id, bank_tran_id, card_type, status: sslStatus } = payload;
  if (sslStatus !== "VALID" && sslStatus !== "VALIDATED") {
    throw new AppError_default(
      status12.BAD_REQUEST,
      "Payment validation failed. Status: " + sslStatus
    );
  }
  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
    include: { booking: true }
  });
  if (!payment) {
    throw new AppError_default(status12.NOT_FOUND, "Payment record not found.");
  }
  if (payment.status === PaymentStatus.PAID) {
    return { bookingId: payment.bookingId, alreadyPaid: true };
  }
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      transactionId: bank_tran_id || tran_id,
      paymentMethod: `SSLCOMMERZ_${(card_type ?? "CARD").toUpperCase().replace(/ /g, "_")}`
    }
  });
  console.log(`\u2705 SSLCommerz payment succeeded for booking: ${payment.bookingId}`);
  return { bookingId: payment.bookingId, alreadyPaid: false };
};
var handleSSLCommerzFail = async (payload) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id }
  });
  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED }
    });
  }
  return { bookingId: payment?.bookingId ?? null };
};
var handleSSLCommerzCancel = async (payload) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id }
  });
  return { bookingId: payment?.bookingId ?? null };
};
var handleSSLCommerzIPN = async (payload) => {
  if (payload.status !== "VALID" && payload.status !== "VALIDATED") return;
  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id }
  });
  if (!payment || payment.status === PaymentStatus.PAID) return;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      transactionId: payload.bank_tran_id || payload.tran_id,
      paymentMethod: `SSLCOMMERZ_${(payload.card_type ?? "CARD").toUpperCase().replace(/ /g, "_")}`
    }
  });
  console.log(`\u2705 SSLCommerz IPN processed for booking: ${payment.bookingId}`);
};
var getPaymentByBooking = async (requesterId, requesterRole, bookingId) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          tutor: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      }
    }
  });
  if (!payment) {
    throw new AppError_default(status12.NOT_FOUND, "Payment not found for this booking.");
  }
  const isStudent = payment.booking.studentId === requesterId;
  const isTutor = payment.booking.tutor.userId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  if (!isStudent && !isTutor && !isAdmin) {
    throw new AppError_default(status12.FORBIDDEN, "You do not have access to this payment.");
  }
  return payment;
};
var refundPayment = async (bookingId) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId }
  });
  if (!payment) {
    throw new AppError_default(status12.NOT_FOUND, "Payment not found.");
  }
  if (payment.status !== PaymentStatus.PAID) {
    throw new AppError_default(
      status12.BAD_REQUEST,
      `Cannot refund a payment with status: ${payment.status}.`
    );
  }
  if (payment.paymentMethod.startsWith("STRIPE")) {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 1
    });
    const intent = await stripe.paymentIntents.retrieve(payment.transactionId);
    if (intent.latest_charge) {
      await stripe.refunds.create({
        charge: intent.latest_charge
      });
      return { message: "Refund initiated via Stripe. Status will update via webhook." };
    }
  }
  if (payment.paymentMethod.startsWith("SSLCOMMERZ")) {
    const refundResponse = await sslcz.initiateRefund({
      refund_amount: Number(payment.amount),
      refund_remarks: "TutorByte session cancelled",
      bank_tran_id: payment.transactionId,
      refe_id: `REFUND-${payment.id}`
    });
    if (refundResponse.APIConnect === "DONE") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED }
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED }
        })
      ]);
      return { message: "Refund processed successfully via SSLCommerz." };
    }
    throw new AppError_default(status12.BAD_GATEWAY, "SSLCommerz refund failed. Please try manually.");
  }
  throw new AppError_default(status12.BAD_REQUEST, "Unknown payment method.");
};
var paymentService = {
  initiatePayment,
  handleStripeWebhook,
  handleSSLCommerzSuccess,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
  handleSSLCommerzIPN,
  getPaymentByBooking,
  refundPayment
};

// src/app/module/payment/payment.controller.ts
var initiatePayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.initiatePayment(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: result.gateway === "STRIPE" ? "Stripe PaymentIntent created. Use clientSecret on frontend." : "SSLCommerz session created. Redirect user to gatewayUrl.",
    data: result
  });
});
var stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    res.status(status13.BAD_REQUEST).json({
      success: false,
      message: "Missing Stripe-Signature header."
    });
    return;
  }
  const result = await paymentService.handleStripeWebhook(req.body, signature);
  res.status(status13.OK).json(result);
});
var sslCommerzSuccess = catchAsync(async (req, res) => {
  const result = await paymentService.handleSSLCommerzSuccess(req.body);
  const redirectUrl = result.alreadyPaid ? `${envVars.CLIENT_URL}/payment/success?bookingId=${result.bookingId}&already=true` : `${envVars.CLIENT_URL}/payment/success?bookingId=${result.bookingId}`;
  res.redirect(redirectUrl);
});
var sslCommerzFail = catchAsync(async (req, res) => {
  const result = await paymentService.handleSSLCommerzFail(req.body);
  res.redirect(
    `${envVars.CLIENT_URL}/payment/failed?bookingId=${result.bookingId ?? ""}`
  );
});
var sslCommerzCancel = catchAsync(async (req, res) => {
  const result = await paymentService.handleSSLCommerzCancel(req.body);
  res.redirect(
    `${envVars.CLIENT_URL}/payment/cancelled?bookingId=${result.bookingId ?? ""}`
  );
});
var sslCommerzIPN = catchAsync(async (req, res) => {
  await paymentService.handleSSLCommerzIPN(req.body);
  res.status(status13.OK).json({ received: true });
});
var getPaymentByBooking2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.getPaymentByBooking(
    user.userId,
    user.role,
    req.params.bookingId
  );
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: "Payment fetched successfully.",
    data: result
  });
});
var refundPayment2 = catchAsync(async (req, res) => {
  const result = await paymentService.refundPayment(req.params.bookingId);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: result.message,
    data: null
  });
});
var paymentController = {
  initiatePayment: initiatePayment2,
  stripeWebhook,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  sslCommerzIPN,
  getPaymentByBooking: getPaymentByBooking2,
  refundPayment: refundPayment2
};

// src/app/module/payment/payment.validation.ts
import { z as z7 } from "zod";
var initiatePaymentSchema = z7.object({
  body: z7.object({
    bookingId: z7.string().uuid("Invalid booking ID."),
    gateway: z7.enum(["STRIPE", "SSLCOMMERZ"], {
      required_error: "gateway is required.",
      message: "gateway must be STRIPE or SSLCOMMERZ."
    })
  })
});
var PaymentValidation = {
  initiatePaymentSchema
};

// src/app/module/payment/payment.route.ts
var router8 = Router8();
router8.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  // raw body — DO NOT put express.json() before this
  paymentController.stripeWebhook
);
router8.post("/sslcommerz/success", paymentController.sslCommerzSuccess);
router8.post("/sslcommerz/fail", paymentController.sslCommerzFail);
router8.post("/sslcommerz/cancel", paymentController.sslCommerzCancel);
router8.post("/sslcommerz/ipn", paymentController.sslCommerzIPN);
router8.post(
  "/initiate",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.initiatePaymentSchema),
  paymentController.initiatePayment
);
router8.get(
  "/booking/:bookingId",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  paymentController.getPaymentByBooking
);
router8.post(
  "/booking/:bookingId/refund",
  checkAuth(UserRole.ADMIN),
  paymentController.refundPayment
);
var PaymentRoutes = router8;

// src/app/routes/index.ts
var router9 = Router9();
router9.use("/auth", AuthRoutes);
router9.use("/tutors", TutorRoutes);
router9.use("/bookings", BookingRoute);
router9.use("/admin", AdminRoutes);
router9.use("/subject", SubjectRoutes);
router9.use("/language", LanguageRoutes);
router9.use("/availability", AvailabilityRoutes);
router9.use("/payments", PaymentRoutes);
var IndexRoutes = router9;

// src/app.ts
var app = express2();
app.use(express2.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://tutor-byte-backend.vercel.app"
    ],
    credentials: true
  })
);
app.use("/api/v1", IndexRoutes);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/", (req, res) => {
  res.send("TutorByte");
});
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
