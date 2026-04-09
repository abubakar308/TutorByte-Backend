// src/app.ts
import express4 from "express";
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
  "inlineSchema": 'model AdminLog {\n  id        String   @id @default(uuid())\n  adminId   String\n  action    String\n  createdAt DateTime @default(now())\n\n  admin User @relation("adminLogs", fields: [adminId], references: [id])\n}\n\nmodel User {\n  id                 String     @id @default(uuid())\n  name               String     @db.VarChar(255)\n  email              String     @unique\n  emailVerified      Boolean    @default(false)\n  image              String?\n  role               UserRole   @default(STUDENT)\n  needPasswordChange Boolean    @default(false)\n  isDeleted          Boolean    @default(false)\n  deletedAt          DateTime?\n  isVerified         Boolean    @default(false)\n  status             UserStatus @default(ACTIVE)\n  createdAt          DateTime   @default(now())\n  updatedAt          DateTime   @updatedAt\n\n  sessions Session[]\n  accounts Account[]\n\n  tutorProfile     TutorProfile?\n  reviews          Review[]       @relation("studentReviews")\n  bookings         Booking[]      @relation("studentBookings")\n  sentMessages     Message[]      @relation("sentMessages")\n  receivedMessages Message[]      @relation("receivedMessages")\n  notifications    Notification[]\n  adminLogs        AdminLog[]     @relation("adminLogs")\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id @default(uuid())\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Availability {\n  id        String    @id @default(uuid())\n  tutorId   String?\n  dayOfWeek DayOfWeek\n  startTime String\n  endTime   String\n  isActive  Boolean   @default(true)\n\n  tutor TutorProfile? @relation(fields: [tutorId], references: [id])\n\n  @@map("availability")\n}\n\nmodel Booking {\n  id          String        @id @default(uuid())\n  studentId   String\n  tutorId     String\n  subjectId   String\n  bookingDate DateTime\n  startTime   String\n  endTime     String\n  status      BookingStatus @default(PENDING)\n  totalPrice  Decimal       @db.Decimal(10, 2)\n  meetingLink String?\n  reason      String?\n  createdAt   DateTime      @default(now())\n\n  student User         @relation("studentBookings", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n  payment Payment?\n\n  @@map("bookings")\n}\n\nenum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  BLOCKED\n}\n\nenum SubjectCategory {\n  ACADEMIC\n  SKILLS\n  LANGUAGE\n}\n\nenum DayOfWeek {\n  SUN\n  MON\n  TUE\n  WED\n  THU\n  FRI\n  SAT\n}\n\nenum BookingStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel Language {\n  id   String @id @default(uuid())\n  name String @unique\n\n  tutors TutorLanguages[]\n}\n\nmodel Message {\n  id         String   @id @default(uuid())\n  senderId   String\n  receiverId String\n  message    String\n  isRead     Boolean\n  createdAt  DateTime @default(now())\n\n  sender   User @relation("sentMessages", fields: [senderId], references: [id])\n  receiver User @relation("receivedMessages", fields: [receiverId], references: [id])\n\n  @@map("messages")\n}\n\nmodel Notification {\n  id        String   @id @default(uuid())\n  userId    String\n  title     String\n  message   String\n  isRead    Boolean\n  createdAt DateTime @default(now())\n\n  user User @relation(fields: [userId], references: [id])\n\n  @@map("notifications")\n}\n\nmodel Payment {\n  id              String        @id @default(uuid())\n  bookingId       String        @unique\n  amount          Decimal       @db.Decimal(10, 2)\n  status          PaymentStatus @default(PENDING)\n  transactionId   String?       @unique\n  gatewayResponse Json?\n  paymentMethod   String? // "STRIPE", "SSLCOMMERZ", "BKASH"\n  createdAt       DateTime      @default(now())\n\n  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@map("payments")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  studentId String\n  tutorId   String\n  rating    Int\n  comment   String\n  createdAt DateTime @default(now())\n\n  student User         @relation("studentReviews", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Subject {\n  id       String          @id @default(uuid())\n  name     String          @unique\n  category SubjectCategory\n\n  tutors   TutorSubjects[]\n  bookings Booking[]\n\n  @@map("subjects")\n}\n\nmodel TutorLanguages {\n  id         String @id @default(uuid())\n  tutorId    String\n  languageId String\n\n  tutor    TutorProfile @relation(fields: [tutorId], references: [id])\n  language Language     @relation(fields: [languageId], references: [id])\n}\n\nmodel TutorProfile {\n  id              String   @id @default(uuid())\n  userId          String   @unique\n  bio             String?\n  experienceYears Int?\n  hourlyRate      Decimal  @db.Decimal(8, 2)\n  averageRating   Float?   @default(0.0)\n  totalReviews    Int\n  isApproved      Boolean\n  createdAt       DateTime @default(now())\n\n  user           User             @relation(fields: [userId], references: [id])\n  subjects       TutorSubjects[]\n  languages      TutorLanguages[]\n  availabilities Availability[]\n  reviews        Review[]\n  bookings       Booking[]\n\n  @@map("tutor_profiles")\n}\n\nmodel TutorSubjects {\n  id        String @id @default(uuid())\n  tutorId   String\n  subjectId String\n\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"AdminLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"admin","kind":"object","type":"User","relationName":"adminLogs"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"needPasswordChange","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"studentReviews"},{"name":"bookings","kind":"object","type":"Booking","relationName":"studentBookings"},{"name":"sentMessages","kind":"object","type":"Message","relationName":"sentMessages"},{"name":"receivedMessages","kind":"object","type":"Message","relationName":"receivedMessages"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"adminLogs","kind":"object","type":"AdminLog","relationName":"adminLogs"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Availability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"dayOfWeek","kind":"enum","type":"DayOfWeek"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"AvailabilityToTutorProfile"}],"dbName":"availability"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"bookingDate","kind":"scalar","type":"DateTime"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"totalPrice","kind":"scalar","type":"Decimal"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentBookings"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"subject","kind":"object","type":"Subject","relationName":"BookingToSubject"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"}],"dbName":"bookings"},"Language":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tutors","kind":"object","type":"TutorLanguages","relationName":"LanguageToTutorLanguages"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"receiverId","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"sender","kind":"object","type":"User","relationName":"sentMessages"},{"name":"receiver","kind":"object","type":"User","relationName":"receivedMessages"}],"dbName":"messages"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"gatewayResponse","kind":"scalar","type":"Json"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"}],"dbName":"payments"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentReviews"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"}],"dbName":"reviews"},"Subject":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"category","kind":"enum","type":"SubjectCategory"},{"name":"tutors","kind":"object","type":"TutorSubjects","relationName":"SubjectToTutorSubjects"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToSubject"}],"dbName":"subjects"},"TutorLanguages":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"languageId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorLanguagesToTutorProfile"},{"name":"language","kind":"object","type":"Language","relationName":"LanguageToTutorLanguages"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"experienceYears","kind":"scalar","type":"Int"},{"name":"hourlyRate","kind":"scalar","type":"Decimal"},{"name":"averageRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"subjects","kind":"object","type":"TutorSubjects","relationName":"TutorProfileToTutorSubjects"},{"name":"languages","kind":"object","type":"TutorLanguages","relationName":"TutorLanguagesToTutorProfile"},{"name":"availabilities","kind":"object","type":"Availability","relationName":"AvailabilityToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"}],"dbName":"tutor_profiles"},"TutorSubjects":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorProfileToTutorSubjects"},{"name":"subject","kind":"object","type":"Subject","relationName":"SubjectToTutorSubjects"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","tutor","tutors","student","subject","booking","payment","bookings","_count","subjects","language","languages","availabilities","reviews","tutorProfile","sender","receiver","sentMessages","receivedMessages","notifications","adminLogs","admin","AdminLog.findUnique","AdminLog.findUniqueOrThrow","AdminLog.findFirst","AdminLog.findFirstOrThrow","AdminLog.findMany","data","AdminLog.createOne","AdminLog.createMany","AdminLog.createManyAndReturn","AdminLog.updateOne","AdminLog.updateMany","AdminLog.updateManyAndReturn","create","update","AdminLog.upsertOne","AdminLog.deleteOne","AdminLog.deleteMany","having","_min","_max","AdminLog.groupBy","AdminLog.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Availability.findUnique","Availability.findUniqueOrThrow","Availability.findFirst","Availability.findFirstOrThrow","Availability.findMany","Availability.createOne","Availability.createMany","Availability.createManyAndReturn","Availability.updateOne","Availability.updateMany","Availability.updateManyAndReturn","Availability.upsertOne","Availability.deleteOne","Availability.deleteMany","Availability.groupBy","Availability.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","_avg","_sum","Booking.groupBy","Booking.aggregate","Language.findUnique","Language.findUniqueOrThrow","Language.findFirst","Language.findFirstOrThrow","Language.findMany","Language.createOne","Language.createMany","Language.createManyAndReturn","Language.updateOne","Language.updateMany","Language.updateManyAndReturn","Language.upsertOne","Language.deleteOne","Language.deleteMany","Language.groupBy","Language.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Subject.findUnique","Subject.findUniqueOrThrow","Subject.findFirst","Subject.findFirstOrThrow","Subject.findMany","Subject.createOne","Subject.createMany","Subject.createManyAndReturn","Subject.updateOne","Subject.updateMany","Subject.updateManyAndReturn","Subject.upsertOne","Subject.deleteOne","Subject.deleteMany","Subject.groupBy","Subject.aggregate","TutorLanguages.findUnique","TutorLanguages.findUniqueOrThrow","TutorLanguages.findFirst","TutorLanguages.findFirstOrThrow","TutorLanguages.findMany","TutorLanguages.createOne","TutorLanguages.createMany","TutorLanguages.createManyAndReturn","TutorLanguages.updateOne","TutorLanguages.updateMany","TutorLanguages.updateManyAndReturn","TutorLanguages.upsertOne","TutorLanguages.deleteOne","TutorLanguages.deleteMany","TutorLanguages.groupBy","TutorLanguages.aggregate","TutorProfile.findUnique","TutorProfile.findUniqueOrThrow","TutorProfile.findFirst","TutorProfile.findFirstOrThrow","TutorProfile.findMany","TutorProfile.createOne","TutorProfile.createMany","TutorProfile.createManyAndReturn","TutorProfile.updateOne","TutorProfile.updateMany","TutorProfile.updateManyAndReturn","TutorProfile.upsertOne","TutorProfile.deleteOne","TutorProfile.deleteMany","TutorProfile.groupBy","TutorProfile.aggregate","TutorSubjects.findUnique","TutorSubjects.findUniqueOrThrow","TutorSubjects.findFirst","TutorSubjects.findFirstOrThrow","TutorSubjects.findMany","TutorSubjects.createOne","TutorSubjects.createMany","TutorSubjects.createManyAndReturn","TutorSubjects.updateOne","TutorSubjects.updateMany","TutorSubjects.updateManyAndReturn","TutorSubjects.upsertOne","TutorSubjects.deleteOne","TutorSubjects.deleteMany","TutorSubjects.groupBy","TutorSubjects.aggregate","AND","OR","NOT","id","tutorId","subjectId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","userId","bio","experienceYears","hourlyRate","averageRating","totalReviews","isApproved","createdAt","every","some","none","languageId","name","SubjectCategory","category","studentId","rating","comment","bookingId","amount","PaymentStatus","status","transactionId","gatewayResponse","paymentMethod","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","title","message","isRead","senderId","receiverId","bookingDate","startTime","endTime","BookingStatus","totalPrice","meetingLink","reason","DayOfWeek","dayOfWeek","isActive","identifier","value","expiresAt","updatedAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","image","UserRole","role","needPasswordChange","isDeleted","deletedAt","isVerified","UserStatus","adminId","action","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "6AeNAYACCBoAANkDACCjAgAAlwQAMKQCAAA6ABClAgAAlwQAMKYCAQAAAAG7AkAA2AMAIfwCAQDlAwAh_QIBAOUDACEBAAAAAQAgDAMAANkDACCjAgAApgQAMKQCAAADABClAgAApgQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeQCQADYAwAh5QJAANgDACHvAgEA5QMAIfACAQDSAwAh8QIBANIDACEDAwAAlgUAIPACAACvBAAg8QIAAK8EACAMAwAA2QMAIKMCAACmBAAwpAIAAAMAEKUCAACmBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHkAkAA2AMAIeUCQADYAwAh7wIBAAAAAfACAQDSAwAh8QIBANIDACEDAAAAAwAgAQAABAAwAgAABQAgEQMAANkDACCjAgAApQQAMKQCAAAHABClAgAApQQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeUCQADYAwAh5gIBAOUDACHnAgEA5QMAIegCAQDSAwAh6QIBANIDACHqAgEA0gMAIesCQACOBAAh7AJAAI4EACHtAgEA0gMAIe4CAQDSAwAhCAMAAJYFACDoAgAArwQAIOkCAACvBAAg6gIAAK8EACDrAgAArwQAIOwCAACvBAAg7QIAAK8EACDuAgAArwQAIBEDAADZAwAgowIAAKUEADCkAgAABwAQpQIAAKUEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIeUCQADYAwAh5gIBAOUDACHnAgEA5QMAIegCAQDSAwAh6QIBANIDACHqAgEA0gMAIesCQACOBAAh7AJAAI4EACHtAgEA0gMAIe4CAQDSAwAhAwAAAAcAIAEAAAgAMAIAAAkAIBIDAADZAwAgDAAA3gMAIA4AANoDACAQAADbAwAgEQAA3AMAIBIAAN0DACCjAgAA0QMAMKQCAAALABClAgAA0QMAMKYCAQDlAwAhtAIBAOUDACG1AgEA0gMAIbYCAgDTAwAhtwIQANQDACG4AggA1QMAIbkCAgDWAwAhugIgANcDACG7AkAA2AMAIQEAAAALACAIBgAAmwQAIAkAAKIEACCjAgAApAQAMKQCAAANABClAgAApAQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIQIGAADzBgAgCQAA_QYAIAgGAACbBAAgCQAAogQAIKMCAACkBAAwpAIAAA0AEKUCAACkBAAwpgIBAAAAAacCAQDlAwAhqAIBAOUDACEDAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIBMGAACbBAAgCAAA2QMAIAkAAKIEACALAACjBAAgowIAAKAEADCkAgAAEgAQpQIAAKAEADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACG7AkAA2AMAIcMCAQDlAwAhyQIAAKEE3AIi2AJAANgDACHZAgEA5QMAIdoCAQDlAwAh3AIQANQDACHdAgEA0gMAId4CAQDSAwAhBgYAAPMGACAIAACWBQAgCQAA_QYAIAsAAP4GACDdAgAArwQAIN4CAACvBAAgEwYAAJsEACAIAADZAwAgCQAAogQAIAsAAKMEACCjAgAAoAQAMKQCAAASABClAgAAoAQAMKYCAQAAAAGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACHeAgEA0gMAIQMAAAASACABAAATADACAAAUACAMCgAA8QMAIKMCAADuAwAwpAIAABYAEKUCAADuAwAwpgIBAOUDACG7AkAA2AMAIcYCAQDlAwAhxwIQANQDACHJAgAA7wPJAiLKAgEA0gMAIcsCAADwAwAgzAIBANIDACEBAAAAFgAgAQAAAA0AIAEAAAASACAIBgAAmwQAIA8AAJ8EACCjAgAAngQAMKQCAAAaABClAgAAngQAMKYCAQDlAwAhpwIBAOUDACG_AgEA5QMAIQIGAADzBgAgDwAA_AYAIAgGAACbBAAgDwAAnwQAIKMCAACeBAAwpAIAABoAEKUCAACeBAAwpgIBAAAAAacCAQDlAwAhvwIBAOUDACEDAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAEAAAAaACAKBgAAkgQAIKMCAACcBAAwpAIAACAAEKUCAACcBAAwpgIBAOUDACGnAgEA0gMAIdkCAQDlAwAh2gIBAOUDACHgAgAAnQTgAiLhAiAA1wMAIQIGAADzBgAgpwIAAK8EACAKBgAAkgQAIKMCAACcBAAwpAIAACAAEKUCAACcBAAwpgIBAAAAAacCAQDSAwAh2QIBAOUDACHaAgEA5QMAIeACAACdBOACIuECIADXAwAhAwAAACAAIAEAACEAMAIAACIAIAEAAAALACALBgAAmwQAIAgAANkDACCjAgAAmgQAMKQCAAAlABClAgAAmgQAMKYCAQDlAwAhpwIBAOUDACG7AkAA2AMAIcMCAQDlAwAhxAICANYDACHFAgEA5QMAIQIGAADzBgAgCAAAlgUAIAsGAACbBAAgCAAA2QMAIKMCAACaBAAwpAIAACUAEKUCAACaBAAwpgIBAAAAAacCAQDlAwAhuwJAANgDACHDAgEA5QMAIcQCAgDWAwAhxQIBAOUDACEDAAAAJQAgAQAAJgAwAgAAJwAgAwAAABIAIAEAABMAMAIAABQAIAEAAAANACABAAAAGgAgAQAAACAAIAEAAAAlACABAAAAEgAgAwAAACUAIAEAACYAMAIAACcAIAMAAAASACABAAATADACAAAUACALFAAA2QMAIBUAANkDACCjAgAAmQQAMKQCAAAxABClAgAAmQQAMKYCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQIUAACWBQAgFQAAlgUAIAsUAADZAwAgFQAA2QMAIKMCAACZBAAwpAIAADEAEKUCAACZBAAwpgIBAAAAAbsCQADYAwAh1AIBAOUDACHVAiAA1wMAIdYCAQDlAwAh1wIBAOUDACEDAAAAMQAgAQAAMgAwAgAAMwAgAwAAADEAIAEAADIAMAIAADMAIAoDAADZAwAgowIAAJgEADCkAgAANgAQpQIAAJgEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACEBAwAAlgUAIAoDAADZAwAgowIAAJgEADCkAgAANgAQpQIAAJgEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIdMCAQDlAwAh1AIBAOUDACHVAiAA1wMAIQMAAAA2ACABAAA3ADACAAA4ACAIGgAA2QMAIKMCAACXBAAwpAIAADoAEKUCAACXBAAwpgIBAOUDACG7AkAA2AMAIfwCAQDlAwAh_QIBAOUDACEBGgAAlgUAIAMAAAA6ACABAAA7ADACAAABACABAAAAAwAgAQAAAAcAIAEAAAAlACABAAAAEgAgAQAAADEAIAEAAAAxACABAAAANgAgAQAAADoAIAEAAAABACADAAAAOgAgAQAAOwAwAgAAAQAgAwAAADoAIAEAADsAMAIAAAEAIAMAAAA6ACABAAA7ADACAAABACAFGgAA-wYAIKYCAQAAAAG7AkAAAAAB_AIBAAAAAf0CAQAAAAEBIAAASQAgBKYCAQAAAAG7AkAAAAAB_AIBAAAAAf0CAQAAAAEBIAAASwAwASAAAEsAMAUaAAD6BgAgpgIBAKoEACG7AkAAuwQAIfwCAQCqBAAh_QIBAKoEACECAAAAAQAgIAAATgAgBKYCAQCqBAAhuwJAALsEACH8AgEAqgQAIf0CAQCqBAAhAgAAADoAICAAAFAAIAIAAAA6ACAgAABQACADAAAAAQAgJwAASQAgKAAATgAgAQAAAAEAIAEAAAA6ACADDQAA9wYAIC0AAPkGACAuAAD4BgAgB6MCAACWBAAwpAIAAFcAEKUCAACWBAAwpgIBALcDACG7AkAAwgMAIfwCAQC3AwAh_QIBALcDACEDAAAAOgAgAQAAVgAwLAAAVwAgAwAAADoAIAEAADsAMAIAAAEAIBkEAACQBAAgBQAAkQQAIAwAAN4DACASAADdAwAgEwAAkgQAIBYAAJMEACAXAACTBAAgGAAAlAQAIBkAAJUEACCjAgAAjAQAMKQCAABdABClAgAAjAQAMKYCAQAAAAG7AkAA2AMAIcACAQDlAwAhyQIAAI8E_AIi5QJAANgDACHyAgEAAAAB8wIgANcDACH0AgEA0gMAIfYCAACNBPYCIvcCIADXAwAh-AIgANcDACH5AkAAjgQAIfoCIADXAwAhAQAAAFoAIAEAAABaACAZBAAAkAQAIAUAAJEEACAMAADeAwAgEgAA3QMAIBMAAJIEACAWAACTBAAgFwAAkwQAIBgAAJQEACAZAACVBAAgowIAAIwEADCkAgAAXQAQpQIAAIwEADCmAgEA5QMAIbsCQADYAwAhwAIBAOUDACHJAgAAjwT8AiLlAkAA2AMAIfICAQDlAwAh8wIgANcDACH0AgEA0gMAIfYCAACNBPYCIvcCIADXAwAh-AIgANcDACH5AkAAjgQAIfoCIADXAwAhCwQAAPEGACAFAADyBgAgDAAAmwUAIBIAAJoFACATAADzBgAgFgAA9AYAIBcAAPQGACAYAAD1BgAgGQAA9gYAIPQCAACvBAAg-QIAAK8EACADAAAAXQAgAQAAXgAwAgAAWgAgAwAAAF0AIAEAAF4AMAIAAFoAIAMAAABdACABAABeADACAABaACAWBAAA6AYAIAUAAOkGACAMAADsBgAgEgAA6wYAIBMAAOoGACAWAADtBgAgFwAA7gYAIBgAAO8GACAZAADwBgAgpgIBAAAAAbsCQAAAAAHAAgEAAAAByQIAAAD8AgLlAkAAAAAB8gIBAAAAAfMCIAAAAAH0AgEAAAAB9gIAAAD2AgL3AiAAAAAB-AIgAAAAAfkCQAAAAAH6AiAAAAABASAAAGIAIA2mAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPwCAuUCQAAAAAHyAgEAAAAB8wIgAAAAAfQCAQAAAAH2AgAAAPYCAvcCIAAAAAH4AiAAAAAB-QJAAAAAAfoCIAAAAAEBIAAAZAAwASAAAGQAMBYEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhAgAAAFoAICAAAGcAIA2mAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhAgAAAF0AICAAAGkAIAIAAABdACAgAABpACADAAAAWgAgJwAAYgAgKAAAZwAgAQAAAFoAIAEAAABdACAFDQAA_gUAIC0AAIAGACAuAAD_BQAg9AIAAK8EACD5AgAArwQAIBCjAgAAhQQAMKQCAABwABClAgAAhQQAMKYCAQC3AwAhuwJAAMIDACHAAgEAtwMAIckCAACHBPwCIuUCQADCAwAh8gIBALcDACHzAiAAwQMAIfQCAQC8AwAh9gIAAIYE9gIi9wIgAMEDACH4AiAAwQMAIfkCQACBBAAh-gIgAMEDACEDAAAAXQAgAQAAbwAwLAAAcAAgAwAAAF0AIAEAAF4AMAIAAFoAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCQMAAP0FACCmAgEAAAABtAIBAAAAAbsCQAAAAAHkAkAAAAAB5QJAAAAAAe8CAQAAAAHwAgEAAAAB8QIBAAAAAQEgAAB4ACAIpgIBAAAAAbQCAQAAAAG7AkAAAAAB5AJAAAAAAeUCQAAAAAHvAgEAAAAB8AIBAAAAAfECAQAAAAEBIAAAegAwASAAAHoAMAkDAAD8BQAgpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh5AJAALsEACHlAkAAuwQAIe8CAQCqBAAh8AIBALUEACHxAgEAtQQAIQIAAAAFACAgAAB9ACAIpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh5AJAALsEACHlAkAAuwQAIe8CAQCqBAAh8AIBALUEACHxAgEAtQQAIQIAAAADACAgAAB_ACACAAAAAwAgIAAAfwAgAwAAAAUAICcAAHgAICgAAH0AIAEAAAAFACABAAAAAwAgBQ0AAPkFACAtAAD7BQAgLgAA-gUAIPACAACvBAAg8QIAAK8EACALowIAAIQEADCkAgAAhgEAEKUCAACEBAAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh5AJAAMIDACHlAkAAwgMAIe8CAQC3AwAh8AIBALwDACHxAgEAvAMAIQMAAAADACABAACFAQAwLAAAhgEAIAMAAAADACABAAAEADACAAAFACABAAAACQAgAQAAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIA4DAAD4BQAgpgIBAAAAAbQCAQAAAAG7AkAAAAAB5QJAAAAAAeYCAQAAAAHnAgEAAAAB6AIBAAAAAekCAQAAAAHqAgEAAAAB6wJAAAAAAewCQAAAAAHtAgEAAAAB7gIBAAAAAQEgAACOAQAgDaYCAQAAAAG0AgEAAAABuwJAAAAAAeUCQAAAAAHmAgEAAAAB5wIBAAAAAegCAQAAAAHpAgEAAAAB6gIBAAAAAesCQAAAAAHsAkAAAAAB7QIBAAAAAe4CAQAAAAEBIAAAkAEAMAEgAACQAQAwDgMAAPcFACCmAgEAqgQAIbQCAQCqBAAhuwJAALsEACHlAkAAuwQAIeYCAQCqBAAh5wIBAKoEACHoAgEAtQQAIekCAQC1BAAh6gIBALUEACHrAkAA9gUAIewCQAD2BQAh7QIBALUEACHuAgEAtQQAIQIAAAAJACAgAACTAQAgDaYCAQCqBAAhtAIBAKoEACG7AkAAuwQAIeUCQAC7BAAh5gIBAKoEACHnAgEAqgQAIegCAQC1BAAh6QIBALUEACHqAgEAtQQAIesCQAD2BQAh7AJAAPYFACHtAgEAtQQAIe4CAQC1BAAhAgAAAAcAICAAAJUBACACAAAABwAgIAAAlQEAIAMAAAAJACAnAACOAQAgKAAAkwEAIAEAAAAJACABAAAABwAgCg0AAPMFACAtAAD1BQAgLgAA9AUAIOgCAACvBAAg6QIAAK8EACDqAgAArwQAIOsCAACvBAAg7AIAAK8EACDtAgAArwQAIO4CAACvBAAgEKMCAACABAAwpAIAAJwBABClAgAAgAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeUCQADCAwAh5gIBALcDACHnAgEAtwMAIegCAQC8AwAh6QIBALwDACHqAgEAvAMAIesCQACBBAAh7AJAAIEEACHtAgEAvAMAIe4CAQC8AwAhAwAAAAcAIAEAAJsBADAsAACcAQAgAwAAAAcAIAEAAAgAMAIAAAkAIAmjAgAA_wMAMKQCAACiAQAQpQIAAP8DADCmAgEAAAABuwJAANgDACHiAgEA5QMAIeMCAQDlAwAh5AJAANgDACHlAkAA2AMAIQEAAACfAQAgAQAAAJ8BACAJowIAAP8DADCkAgAAogEAEKUCAAD_AwAwpgIBAOUDACG7AkAA2AMAIeICAQDlAwAh4wIBAOUDACHkAkAA2AMAIeUCQADYAwAhAAMAAACiAQAgAQAAowEAMAIAAJ8BACADAAAAogEAIAEAAKMBADACAACfAQAgAwAAAKIBACABAACjAQAwAgAAnwEAIAamAgEAAAABuwJAAAAAAeICAQAAAAHjAgEAAAAB5AJAAAAAAeUCQAAAAAEBIAAApwEAIAamAgEAAAABuwJAAAAAAeICAQAAAAHjAgEAAAAB5AJAAAAAAeUCQAAAAAEBIAAAqQEAMAEgAACpAQAwBqYCAQCqBAAhuwJAALsEACHiAgEAqgQAIeMCAQCqBAAh5AJAALsEACHlAkAAuwQAIQIAAACfAQAgIAAArAEAIAamAgEAqgQAIbsCQAC7BAAh4gIBAKoEACHjAgEAqgQAIeQCQAC7BAAh5QJAALsEACECAAAAogEAICAAAK4BACACAAAAogEAICAAAK4BACADAAAAnwEAICcAAKcBACAoAACsAQAgAQAAAJ8BACABAAAAogEAIAMNAADwBQAgLQAA8gUAIC4AAPEFACAJowIAAP4DADCkAgAAtQEAEKUCAAD-AwAwpgIBALcDACG7AkAAwgMAIeICAQC3AwAh4wIBALcDACHkAkAAwgMAIeUCQADCAwAhAwAAAKIBACABAAC0AQAwLAAAtQEAIAMAAACiAQAgAQAAowEAMAIAAJ8BACABAAAAIgAgAQAAACIAIAMAAAAgACABAAAhADACAAAiACADAAAAIAAgAQAAIQAwAgAAIgAgAwAAACAAIAEAACEAMAIAACIAIAcGAADvBQAgpgIBAAAAAacCAQAAAAHZAgEAAAAB2gIBAAAAAeACAAAA4AIC4QIgAAAAAQEgAAC9AQAgBqYCAQAAAAGnAgEAAAAB2QIBAAAAAdoCAQAAAAHgAgAAAOACAuECIAAAAAEBIAAAvwEAMAEgAAC_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_BQAgjwEAAL4FACCQAQAAwQUAIAmjAgAA5wMAMKQCAADWAgAQpQIAAOcDADCmAgEAtwMAIacCAQC3AwAhuwJAAMIDACHDAgEAtwMAIcQCAgDAAwAhxQIBALcDACEDAAAAJQAgAQAA1QIAMCwAANYCACADAAAAJQAgAQAAJgAwAgAAJwAgCAcAANoDACAMAADeAwAgowIAAOQDADCkAgAA3AIAEKUCAADkAwAwpgIBAAAAAcACAQAAAAHCAgAA5gPCAiIBAAAA2QIAIAEAAADZAgAgCAcAANoDACAMAADeAwAgowIAAOQDADCkAgAA3AIAEKUCAADkAwAwpgIBAOUDACHAAgEA5QMAIcICAADmA8ICIgIHAACXBQAgDAAAmwUAIAMAAADcAgAgAQAA3QIAMAIAANkCACADAAAA3AIAIAEAAN0CADACAADZAgAgAwAAANwCACABAADdAgAwAgAA2QIAIAUHAAC7BQAgDAAAvAUAIKYCAQAAAAHAAgEAAAABwgIAAADCAgIBIAAA4QIAIAOmAgEAAAABwAIBAAAAAcICAAAAwgICASAAAOMCADABIAAA4wIAMAUHAAClBQAgDAAApgUAIKYCAQCqBAAhwAIBAKoEACHCAgAApAXCAiICAAAA2QIAICAAAOYCACADpgIBAKoEACHAAgEAqgQAIcICAACkBcICIgIAAADcAgAgIAAA6AIAIAIAAADcAgAgIAAA6AIAIAMAAADZAgAgJwAA4QIAICgAAOYCACABAAAA2QIAIAEAAADcAgAgAw0AAKEFACAtAACjBQAgLgAAogUAIAajAgAA4AMAMKQCAADvAgAQpQIAAOADADCmAgEAtwMAIcACAQC3AwAhwgIAAOEDwgIiAwAAANwCACABAADuAgAwLAAA7wIAIAMAAADcAgAgAQAA3QIAMAIAANkCACABAAAAHAAgAQAAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAUGAACgBQAgDwAAgwUAIKYCAQAAAAGnAgEAAAABvwIBAAAAAQEgAAD3AgAgA6YCAQAAAAGnAgEAAAABvwIBAAAAAQEgAAD5AgAwASAAAPkCADAFBgAAnwUAIA8AAIEFACCmAgEAqgQAIacCAQCqBAAhvwIBAKoEACECAAAAHAAgIAAA_AIAIAOmAgEAqgQAIacCAQCqBAAhvwIBAKoEACECAAAAGgAgIAAA_gIAIAIAAAAaACAgAAD-AgAgAwAAABwAICcAAPcCACAoAAD8AgAgAQAAABwAIAEAAAAaACADDQAAnAUAIC0AAJ4FACAuAACdBQAgBqMCAADfAwAwpAIAAIUDABClAgAA3wMAMKYCAQC3AwAhpwIBALcDACG_AgEAtwMAIQMAAAAaACABAACEAwAwLAAAhQMAIAMAAAAaACABAAAbADACAAAcACASAwAA2QMAIAwAAN4DACAOAADaAwAgEAAA2wMAIBEAANwDACASAADdAwAgowIAANEDADCkAgAACwAQpQIAANEDADCmAgEAAAABtAIBAAAAAbUCAQDSAwAhtgICANMDACG3AhAA1AMAIbgCCADVAwAhuQICANYDACG6AiAA1wMAIbsCQADYAwAhAQAAAIgDACABAAAAiAMAIAkDAACWBQAgDAAAmwUAIA4AAJcFACAQAACYBQAgEQAAmQUAIBIAAJoFACC1AgAArwQAILYCAACvBAAguAIAAK8EACADAAAACwAgAQAAiwMAMAIAAIgDACADAAAACwAgAQAAiwMAMAIAAIgDACADAAAACwAgAQAAiwMAMAIAAIgDACAPAwAAkAUAIAwAAJUFACAOAACRBQAgEAAAkgUAIBEAAJMFACASAACUBQAgpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABASAAAI8DACAJpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABASAAAJEDADABIAAAkQMAMA8DAAC8BAAgDAAAwQQAIA4AAL0EACAQAAC-BAAgEQAAvwQAIBIAAMAEACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACECAAAAiAMAICAAAJQDACAJpgIBAKoEACG0AgEAqgQAIbUCAQC1BAAhtgICALYEACG3AhAAtwQAIbgCCAC4BAAhuQICALkEACG6AiAAugQAIbsCQAC7BAAhAgAAAAsAICAAAJYDACACAAAACwAgIAAAlgMAIAMAAACIAwAgJwAAjwMAICgAAJQDACABAAAAiAMAIAEAAAALACAIDQAAsAQAIC0AALMEACAuAACyBAAgjwEAALEEACCQAQAAtAQAILUCAACvBAAgtgIAAK8EACC4AgAArwQAIAyjAgAAuwMAMKQCAACdAwAQpQIAALsDADCmAgEAtwMAIbQCAQC3AwAhtQIBALwDACG2AgIAvQMAIbcCEAC-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-AIgANcDACH5AkAAjgQAIfoCIADXAwAh_gIAAF0AIP8CAABdACADvAIAAA0AIL0CAAANACC-AgAADQAgA7wCAAAaACC9AgAAGgAgvgIAABoAIAO8AgAAIAAgvQIAACAAIL4CAAAgACADvAIAACUAIL0CAAAlACC-AgAAJQAgA7wCAAASACC9AgAAEgAgvgIAABIAIAajAgAA3wMAMKQCAACFAwAQpQIAAN8DADCmAgEAtwMAIacCAQC3AwAhvwIBALcDACEGowIAAOADADCkAgAA7wIAEKUCAADgAwAwpgIBALcDACHAAgEAtwMAIcICAADhA8ICIgcNAAC5AwAgLQAA4wMAIC4AAOMDACCpAgAAAMICAqoCAAAAwgIIqwIAAADCAgizAgAA4gPCAiIHDQAAuQMAIC0AAOMDACAuAADjAwAgqQIAAADCAgKqAgAAAMICCKsCAAAAwgIIswIAAOIDwgIiBKkCAAAAwgICqgIAAADCAgirAgAAAMICCLMCAADjA8ICIggHAADaAwAgDAAA3gMAIKMCAADkAwAwpAIAANwCABClAgAA5AMAMKYCAQDlAwAhwAIBAOUDACHCAgAA5gPCAiILqQIBAAAAAaoCAQAAAASrAgEAAAAErAIBAAAAAa0CAQAAAAGuAgEAAAABrwIBAAAAAbACAQAAAAGxAgEAAAABsgIBAAAAAbMCAQC6AwAhBKkCAAAAwgICqgIAAADCAgirAgAAAMICCLMCAADjA8ICIgmjAgAA5wMAMKQCAADWAgAQpQIAAOcDADCmAgEAtwMAIacCAQC3AwAhuwJAAMIDACHDAgEAtwMAIcQCAgDAAwAhxQIBALcDACELowIAAOgDADCkAgAAwAIAEKUCAADoAwAwpgIBALcDACG7AkAAwgMAIcYCAQC3AwAhxwIQAL4DACHJAgAA6QPJAiLKAgEAvAMAIcsCAADqAwAgzAIBALwDACEHDQAAuQMAIC0AAO0DACAuAADtAwAgqQIAAADJAgKqAgAAAMkCCKsCAAAAyQIIswIAAOwDyQIiDw0AAMoDACAtAADrAwAgLgAA6wMAIKkCgAAAAAGsAoAAAAABrQKAAAAAAa4CgAAAAAGvAoAAAAABswKAAAAAAc0CAQAAAAHOAgEAAAABzwIBAAAAAdACgAAAAAHRAoAAAAAB0gKAAAAAAQypAoAAAAABrAKAAAAAAa0CgAAAAAGuAoAAAAABrwKAAAAAAbMCgAAAAAHNAgEAAAABzgIBAAAAAc8CAQAAAAHQAoAAAAAB0QKAAAAAAdICgAAAAAEHDQAAuQMAIC0AAO0DACAuAADtAwAgqQIAAADJAgKqAgAAAMkCCKsCAAAAyQIIswIAAOwDyQIiBKkCAAAAyQICqgIAAADJAgirAgAAAMkCCLMCAADtA8kCIgwKAADxAwAgowIAAO4DADCkAgAAFgAQpQIAAO4DADCmAgEA5QMAIbsCQADYAwAhxgIBAOUDACHHAhAA1AMAIckCAADvA8kCIsoCAQDSAwAhywIAAPADACDMAgEA0gMAIQSpAgAAAMkCAqoCAAAAyQIIqwIAAADJAgizAgAA7QPJAiIMqQKAAAAAAawCgAAAAAGtAoAAAAABrgKAAAAAAa8CgAAAAAGzAoAAAAABzQIBAAAAAc4CAQAAAAHPAgEAAAAB0AKAAAAAAdECgAAAAAHSAoAAAAABFQYAAJsEACAIAADZAwAgCQAAogQAIAsAAKMEACCjAgAAoAQAMKQCAAASABClAgAAoAQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIbsCQADYAwAhwwIBAOUDACHJAgAAoQTcAiLYAkAA2AMAIdkCAQDlAwAh2gIBAOUDACHcAhAA1AMAId0CAQDSAwAh3gIBANIDACH-AgAAEgAg_wIAABIAIAmjAgAA8gMAMKQCAACoAgAQpQIAAPIDADCmAgEAtwMAIbQCAQC3AwAhuwJAAMIDACHTAgEAtwMAIdQCAQC3AwAh1QIgAMEDACEJowIAAPMDADCkAgAAkgIAEKUCAADzAwAwpgIBALcDACG7AkAAwgMAIdQCAQC3AwAh1QIgAMEDACHWAgEAtwMAIdcCAQC3AwAhBaMCAAD0AwAwpAIAAPwBABClAgAA9AMAMKYCAQC3AwAhwAIBALcDACEGBwAA2wMAIKMCAAD1AwAwpAIAAOkBABClAgAA9QMAMKYCAQDlAwAhwAIBAOUDACEPowIAAPYDADCkAgAA4wEAEKUCAAD2AwAwpgIBALcDACGnAgEAtwMAIagCAQC3AwAhuwJAAMIDACHDAgEAtwMAIckCAAD3A9wCItgCQADCAwAh2QIBALcDACHaAgEAtwMAIdwCEAC-AwAh3QIBALwDACHeAgEAvAMAIQcNAAC5AwAgLQAA-QMAIC4AAPkDACCpAgAAANwCAqoCAAAA3AIIqwIAAADcAgizAgAA-APcAiIHDQAAuQMAIC0AAPkDACAuAAD5AwAgqQIAAADcAgKqAgAAANwCCKsCAAAA3AIIswIAAPgD3AIiBKkCAAAA3AICqgIAAADcAgirAgAAANwCCLMCAAD5A9wCIgmjAgAA-gMAMKQCAADNAQAQpQIAAPoDADCmAgEAtwMAIacCAQC8AwAh2QIBALcDACHaAgEAtwMAIeACAAD7A-ACIuECIADBAwAhBw0AALkDACAtAAD9AwAgLgAA_QMAIKkCAAAA4AICqgIAAADgAgirAgAAAOACCLMCAAD8A-ACIgcNAAC5AwAgLQAA_QMAIC4AAP0DACCpAgAAAOACAqoCAAAA4AIIqwIAAADgAgizAgAA_APgAiIEqQIAAADgAgKqAgAAAOACCKsCAAAA4AIIswIAAP0D4AIiCaMCAAD-AwAwpAIAALUBABClAgAA_gMAMKYCAQC3AwAhuwJAAMIDACHiAgEAtwMAIeMCAQC3AwAh5AJAAMIDACHlAkAAwgMAIQmjAgAA_wMAMKQCAACiAQAQpQIAAP8DADCmAgEA5QMAIbsCQADYAwAh4gIBAOUDACHjAgEA5QMAIeQCQADYAwAh5QJAANgDACEQowIAAIAEADCkAgAAnAEAEKUCAACABAAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh5QJAAMIDACHmAgEAtwMAIecCAQC3AwAh6AIBALwDACHpAgEAvAMAIeoCAQC8AwAh6wJAAIEEACHsAkAAgQQAIe0CAQC8AwAh7gIBALwDACELDQAAygMAIC0AAIMEACAuAACDBAAgqQJAAAAAAaoCQAAAAAWrAkAAAAAFrAJAAAAAAa0CQAAAAAGuAkAAAAABrwJAAAAAAbMCQACCBAAhCw0AAMoDACAtAACDBAAgLgAAgwQAIKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAAggQAIQipAkAAAAABqgJAAAAABasCQAAAAAWsAkAAAAABrQJAAAAAAa4CQAAAAAGvAkAAAAABswJAAIMEACELowIAAIQEADCkAgAAhgEAEKUCAACEBAAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh5AJAAMIDACHlAkAAwgMAIe8CAQC3AwAh8AIBALwDACHxAgEAvAMAIRCjAgAAhQQAMKQCAABwABClAgAAhQQAMKYCAQC3AwAhuwJAAMIDACHAAgEAtwMAIckCAACHBPwCIuUCQADCAwAh8gIBALcDACHzAiAAwQMAIfQCAQC8AwAh9gIAAIYE9gIi9wIgAMEDACH4AiAAwQMAIfkCQACBBAAh-gIgAMEDACEHDQAAuQMAIC0AAIsEACAuAACLBAAgqQIAAAD2AgKqAgAAAPYCCKsCAAAA9gIIswIAAIoE9gIiBw0AALkDACAtAACJBAAgLgAAiQQAIKkCAAAA_AICqgIAAAD8AgirAgAAAPwCCLMCAACIBPwCIgcNAAC5AwAgLQAAiQQAIC4AAIkEACCpAgAAAPwCAqoCAAAA_AIIqwIAAAD8AgizAgAAiAT8AiIEqQIAAAD8AgKqAgAAAPwCCKsCAAAA_AIIswIAAIkE_AIiBw0AALkDACAtAACLBAAgLgAAiwQAIKkCAAAA9gICqgIAAAD2AgirAgAAAPYCCLMCAACKBPYCIgSpAgAAAPYCAqoCAAAA9gIIqwIAAAD2AgizAgAAiwT2AiIZBAAAkAQAIAUAAJEEACAMAADeAwAgEgAA3QMAIBMAAJIEACAWAACTBAAgFwAAkwQAIBgAAJQEACAZAACVBAAgowIAAIwEADCkAgAAXQAQpQIAAIwEADCmAgEA5QMAIbsCQADYAwAhwAIBAOUDACHJAgAAjwT8AiLlAkAA2AMAIfICAQDlAwAh8wIgANcDACH0AgEA0gMAIfYCAACNBPYCIvcCIADXAwAh-AIgANcDACH5AkAAjgQAIfoCIADXAwAhBKkCAAAA9gICqgIAAAD2AgirAgAAAPYCCLMCAACLBPYCIgipAkAAAAABqgJAAAAABasCQAAAAAWsAkAAAAABrQJAAAAAAa4CQAAAAAGvAkAAAAABswJAAIMEACEEqQIAAAD8AgKqAgAAAPwCCKsCAAAA_AIIswIAAIkE_AIiA7wCAAADACC9AgAAAwAgvgIAAAMAIAO8AgAABwAgvQIAAAcAIL4CAAAHACAUAwAA2QMAIAwAAN4DACAOAADaAwAgEAAA2wMAIBEAANwDACASAADdAwAgowIAANEDADCkAgAACwAQpQIAANEDADCmAgEA5QMAIbQCAQDlAwAhtQIBANIDACG2AgIA0wMAIbcCEADUAwAhuAIIANUDACG5AgIA1gMAIboCIADXAwAhuwJAANgDACH-AgAACwAg_wIAAAsAIAO8AgAAMQAgvQIAADEAIL4CAAAxACADvAIAADYAIL0CAAA2ACC-AgAANgAgA7wCAAA6ACC9AgAAOgAgvgIAADoAIAejAgAAlgQAMKQCAABXABClAgAAlgQAMKYCAQC3AwAhuwJAAMIDACH8AgEAtwMAIf0CAQC3AwAhCBoAANkDACCjAgAAlwQAMKQCAAA6ABClAgAAlwQAMKYCAQDlAwAhuwJAANgDACH8AgEA5QMAIf0CAQDlAwAhCgMAANkDACCjAgAAmAQAMKQCAAA2ABClAgAAmAQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIdMCAQDlAwAh1AIBAOUDACHVAiAA1wMAIQsUAADZAwAgFQAA2QMAIKMCAACZBAAwpAIAADEAEKUCAACZBAAwpgIBAOUDACG7AkAA2AMAIdQCAQDlAwAh1QIgANcDACHWAgEA5QMAIdcCAQDlAwAhCwYAAJsEACAIAADZAwAgowIAAJoEADCkAgAAJQAQpQIAAJoEADCmAgEA5QMAIacCAQDlAwAhuwJAANgDACHDAgEA5QMAIcQCAgDWAwAhxQIBAOUDACEUAwAA2QMAIAwAAN4DACAOAADaAwAgEAAA2wMAIBEAANwDACASAADdAwAgowIAANEDADCkAgAACwAQpQIAANEDADCmAgEA5QMAIbQCAQDlAwAhtQIBANIDACG2AgIA0wMAIbcCEADUAwAhuAIIANUDACG5AgIA1gMAIboCIADXAwAhuwJAANgDACH-AgAACwAg_wIAAAsAIAoGAACSBAAgowIAAJwEADCkAgAAIAAQpQIAAJwEADCmAgEA5QMAIacCAQDSAwAh2QIBAOUDACHaAgEA5QMAIeACAACdBOACIuECIADXAwAhBKkCAAAA4AICqgIAAADgAgirAgAAAOACCLMCAAD9A-ACIggGAACbBAAgDwAAnwQAIKMCAACeBAAwpAIAABoAEKUCAACeBAAwpgIBAOUDACGnAgEA5QMAIb8CAQDlAwAhCAcAANsDACCjAgAA9QMAMKQCAADpAQAQpQIAAPUDADCmAgEA5QMAIcACAQDlAwAh_gIAAOkBACD_AgAA6QEAIBMGAACbBAAgCAAA2QMAIAkAAKIEACALAACjBAAgowIAAKAEADCkAgAAEgAQpQIAAKAEADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACG7AkAA2AMAIcMCAQDlAwAhyQIAAKEE3AIi2AJAANgDACHZAgEA5QMAIdoCAQDlAwAh3AIQANQDACHdAgEA0gMAId4CAQDSAwAhBKkCAAAA3AICqgIAAADcAgirAgAAANwCCLMCAAD5A9wCIgoHAADaAwAgDAAA3gMAIKMCAADkAwAwpAIAANwCABClAgAA5AMAMKYCAQDlAwAhwAIBAOUDACHCAgAA5gPCAiL-AgAA3AIAIP8CAADcAgAgDgoAAPEDACCjAgAA7gMAMKQCAAAWABClAgAA7gMAMKYCAQDlAwAhuwJAANgDACHGAgEA5QMAIccCEADUAwAhyQIAAO8DyQIiygIBANIDACHLAgAA8AMAIMwCAQDSAwAh_gIAABYAIP8CAAAWACAIBgAAmwQAIAkAAKIEACCjAgAApAQAMKQCAAANABClAgAApAQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIREDAADZAwAgowIAAKUEADCkAgAABwAQpQIAAKUEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHlAkAA2AMAIeYCAQDlAwAh5wIBAOUDACHoAgEA0gMAIekCAQDSAwAh6gIBANIDACHrAkAAjgQAIewCQACOBAAh7QIBANIDACHuAgEA0gMAIQwDAADZAwAgowIAAKYEADCkAgAAAwAQpQIAAKYEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHkAkAA2AMAIeUCQADYAwAh7wIBAOUDACHwAgEA0gMAIfECAQDSAwAhAAAAAYMDAQAAAAEFJwAA4QcAICgAAOcHACCAAwAA4gcAIIEDAADmBwAghgMAAIgDACAFJwAA3wcAICgAAOQHACCAAwAA4AcAIIEDAADjBwAghgMAANkCACADJwAA4QcAIIADAADiBwAghgMAAIgDACADJwAA3wcAIIADAADgBwAghgMAANkCACAAAAAAAAABgwMBAAAAAQWDAwIAAAABiQMCAAAAAYoDAgAAAAGLAwIAAAABjAMCAAAAAQWDAxAAAAABiQMQAAAAAYoDEAAAAAGLAxAAAAABjAMQAAAAAQWDAwgAAAABiQMIAAAAAYoDCAAAAAGLAwgAAAABjAMIAAAAAQWDAwIAAAABiQMCAAAAAYoDAgAAAAGLAwIAAAABjAMCAAAAAQGDAyAAAAABAYMDQAAAAAEFJwAAwQcAICgAAN0HACCAAwAAwgcAIIEDAADcBwAghgMAAFoAIAsnAACEBQAwKAAAiQUAMIADAACFBQAwgQMAAIYFADCCAwAAhwUAIIMDAACIBQAwhAMAAIgFADCFAwAAiAUAMIYDAACIBQAwhwMAAIoFADCIAwAAiwUAMAsnAAD2BAAwKAAA-wQAMIADAAD3BAAwgQMAAPgEADCCAwAA-QQAIIMDAAD6BAAwhAMAAPoEADCFAwAA-gQAMIYDAAD6BAAwhwMAAPwEADCIAwAA_QQAMAsnAADpBAAwKAAA7gQAMIADAADqBAAwgQMAAOsEADCCAwAA7AQAIIMDAADtBAAwhAMAAO0EADCFAwAA7QQAMIYDAADtBAAwhwMAAO8EADCIAwAA8AQAMAsnAADbBAAwKAAA4AQAMIADAADcBAAwgQMAAN0EADCCAwAA3gQAIIMDAADfBAAwhAMAAN8EADCFAwAA3wQAMIYDAADfBAAwhwMAAOEEADCIAwAA4gQAMAsnAADCBAAwKAAAxwQAMIADAADDBAAwgQMAAMQEADCCAwAAxQQAIIMDAADGBAAwhAMAAMYEADCFAwAAxgQAMIYDAADGBAAwhwMAAMgEADCIAwAAyQQAMA4IAADYBAAgCQAA2QQAIAsAANoEACCmAgEAAAABqAIBAAAAAbsCQAAAAAHDAgEAAAAByQIAAADcAgLYAkAAAAAB2QIBAAAAAdoCAQAAAAHcAhAAAAAB3QIBAAAAAd4CAQAAAAECAAAAFAAgJwAA1wQAIAMAAAAUACAnAADXBAAgKAAAzQQAIAEgAADbBwAwEwYAAJsEACAIAADZAwAgCQAAogQAIAsAAKMEACCjAgAAoAQAMKQCAAASABClAgAAoAQAMKYCAQAAAAGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACHeAgEA0gMAIQIAAAAUACAgAADNBAAgAgAAAMoEACAgAADLBAAgD6MCAADJBAAwpAIAAMoEABClAgAAyQQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIbsCQADYAwAhwwIBAOUDACHJAgAAoQTcAiLYAkAA2AMAIdkCAQDlAwAh2gIBAOUDACHcAhAA1AMAId0CAQDSAwAh3gIBANIDACEPowIAAMkEADCkAgAAygQAEKUCAADJBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACHeAgEA0gMAIQumAgEAqgQAIagCAQCqBAAhuwJAALsEACHDAgEAqgQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQGDAwAAANwCAg4IAADOBAAgCQAAzwQAIAsAANAEACCmAgEAqgQAIagCAQCqBAAhuwJAALsEACHDAgEAqgQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQUnAADTBwAgKAAA2QcAIIADAADUBwAggQMAANgHACCGAwAAWgAgBScAANEHACAoAADWBwAggAMAANIHACCBAwAA1QcAIIYDAADZAgAgBycAANEEACAoAADUBAAggAMAANIEACCBAwAA0wQAIIQDAAAWACCFAwAAFgAghgMAAKsCACAHpgIBAAAAAbsCQAAAAAHHAhAAAAAByQIAAADJAgLKAgEAAAABywKAAAAAAcwCAQAAAAECAAAAqwIAICcAANEEACADAAAAFgAgJwAA0QQAICgAANUEACAJAAAAFgAgIAAA1QQAIKYCAQCqBAAhuwJAALsEACHHAhAAtwQAIckCAADWBMkCIsoCAQC1BAAhywKAAAAAAcwCAQC1BAAhB6YCAQCqBAAhuwJAALsEACHHAhAAtwQAIckCAADWBMkCIsoCAQC1BAAhywKAAAAAAcwCAQC1BAAhAYMDAAAAyQICDggAANgEACAJAADZBAAgCwAA2gQAIKYCAQAAAAGoAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAAB3gIBAAAAAQMnAADTBwAggAMAANQHACCGAwAAWgAgAycAANEHACCAAwAA0gcAIIYDAADZAgAgAycAANEEACCAAwAA0gQAIIYDAACrAgAgBggAAOgEACCmAgEAAAABuwJAAAAAAcMCAQAAAAHEAgIAAAABxQIBAAAAAQIAAAAnACAnAADnBAAgAwAAACcAICcAAOcEACAoAADlBAAgASAAANAHADALBgAAmwQAIAgAANkDACCjAgAAmgQAMKQCAAAlABClAgAAmgQAMKYCAQAAAAGnAgEA5QMAIbsCQADYAwAhwwIBAOUDACHEAgIA1gMAIcUCAQDlAwAhAgAAACcAICAAAOUEACACAAAA4wQAICAAAOQEACAJowIAAOIEADCkAgAA4wQAEKUCAADiBAAwpgIBAOUDACGnAgEA5QMAIbsCQADYAwAhwwIBAOUDACHEAgIA1gMAIcUCAQDlAwAhCaMCAADiBAAwpAIAAOMEABClAgAA4gQAMKYCAQDlAwAhpwIBAOUDACG7AkAA2AMAIcMCAQDlAwAhxAICANYDACHFAgEA5QMAIQWmAgEAqgQAIbsCQAC7BAAhwwIBAKoEACHEAgIAuQQAIcUCAQCqBAAhBggAAOYEACCmAgEAqgQAIbsCQAC7BAAhwwIBAKoEACHEAgIAuQQAIcUCAQCqBAAhBScAAMsHACAoAADOBwAggAMAAMwHACCBAwAAzQcAIIYDAABaACAGCAAA6AQAIKYCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABAycAAMsHACCAAwAAzAcAIIYDAABaACAFpgIBAAAAAdkCAQAAAAHaAgEAAAAB4AIAAADgAgLhAiAAAAABAgAAACIAICcAAPUEACADAAAAIgAgJwAA9QQAICgAAPQEACABIAAAygcAMAoGAACSBAAgowIAAJwEADCkAgAAIAAQpQIAAJwEADCmAgEAAAABpwIBANIDACHZAgEA5QMAIdoCAQDlAwAh4AIAAJ0E4AIi4QIgANcDACECAAAAIgAgIAAA9AQAIAIAAADxBAAgIAAA8gQAIAmjAgAA8AQAMKQCAADxBAAQpQIAAPAEADCmAgEA5QMAIacCAQDSAwAh2QIBAOUDACHaAgEA5QMAIeACAACdBOACIuECIADXAwAhCaMCAADwBAAwpAIAAPEEABClAgAA8AQAMKYCAQDlAwAhpwIBANIDACHZAgEA5QMAIdoCAQDlAwAh4AIAAJ0E4AIi4QIgANcDACEFpgIBAKoEACHZAgEAqgQAIdoCAQCqBAAh4AIAAPME4AIi4QIgALoEACEBgwMAAADgAgIFpgIBAKoEACHZAgEAqgQAIdoCAQCqBAAh4AIAAPME4AIi4QIgALoEACEFpgIBAAAAAdkCAQAAAAHaAgEAAAAB4AIAAADgAgLhAiAAAAABAw8AAIMFACCmAgEAAAABvwIBAAAAAQIAAAAcACAnAACCBQAgAwAAABwAICcAAIIFACAoAACABQAgASAAAMkHADAIBgAAmwQAIA8AAJ8EACCjAgAAngQAMKQCAAAaABClAgAAngQAMKYCAQAAAAGnAgEA5QMAIb8CAQDlAwAhAgAAABwAICAAAIAFACACAAAA_gQAICAAAP8EACAGowIAAP0EADCkAgAA_gQAEKUCAAD9BAAwpgIBAOUDACGnAgEA5QMAIb8CAQDlAwAhBqMCAAD9BAAwpAIAAP4EABClAgAA_QQAMKYCAQDlAwAhpwIBAOUDACG_AgEA5QMAIQKmAgEAqgQAIb8CAQCqBAAhAw8AAIEFACCmAgEAqgQAIb8CAQCqBAAhBScAAMQHACAoAADHBwAggAMAAMUHACCBAwAAxgcAIIYDAADmAQAgAw8AAIMFACCmAgEAAAABvwIBAAAAAQMnAADEBwAggAMAAMUHACCGAwAA5gEAIAMJAACuBAAgpgIBAAAAAagCAQAAAAECAAAADwAgJwAAjwUAIAMAAAAPACAnAACPBQAgKAAAjgUAIAEgAADDBwAwCAYAAJsEACAJAACiBAAgowIAAKQEADCkAgAADQAQpQIAAKQEADCmAgEAAAABpwIBAOUDACGoAgEA5QMAIQIAAAAPACAgAACOBQAgAgAAAIwFACAgAACNBQAgBqMCAACLBQAwpAIAAIwFABClAgAAiwUAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIQajAgAAiwUAMKQCAACMBQAQpQIAAIsFADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACECpgIBAKoEACGoAgEAqgQAIQMJAACsBAAgpgIBAKoEACGoAgEAqgQAIQMJAACuBAAgpgIBAAAAAagCAQAAAAEDJwAAwQcAIIADAADCBwAghgMAAFoAIAQnAACEBQAwgAMAAIUFADCCAwAAhwUAIIYDAACIBQAwBCcAAPYEADCAAwAA9wQAMIIDAAD5BAAghgMAAPoEADAEJwAA6QQAMIADAADqBAAwggMAAOwEACCGAwAA7QQAMAQnAADbBAAwgAMAANwEADCCAwAA3gQAIIYDAADfBAAwBCcAAMIEADCAAwAAwwQAMIIDAADFBAAghgMAAMYEADALBAAA8QYAIAUAAPIGACAMAACbBQAgEgAAmgUAIBMAAPMGACAWAAD0BgAgFwAA9AYAIBgAAPUGACAZAAD2BgAg9AIAAK8EACD5AgAArwQAIAAAAAAAAAAABScAALwHACAoAAC_BwAggAMAAL0HACCBAwAAvgcAIIYDAACIAwAgAycAALwHACCAAwAAvQcAIIYDAACIAwAgAAAAAYMDAAAAwgICCycAALIFADAoAAC2BQAwgAMAALMFADCBAwAAtAUAMIIDAAC1BQAggwMAAIgFADCEAwAAiAUAMIUDAACIBQAwhgMAAIgFADCHAwAAtwUAMIgDAACLBQAwCycAAKcFADAoAACrBQAwgAMAAKgFADCBAwAAqQUAMIIDAACqBQAggwMAAMYEADCEAwAAxgQAMIUDAADGBAAwhgMAAMYEADCHAwAArAUAMIgDAADJBAAwDgYAALEFACAIAADYBAAgCwAA2gQAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAAB3gIBAAAAAQIAAAAUACAnAACwBQAgAwAAABQAICcAALAFACAoAACuBQAgASAAALsHADACAAAAFAAgIAAArgUAIAIAAADKBAAgIAAArQUAIAumAgEAqgQAIacCAQCqBAAhuwJAALsEACHDAgEAqgQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQ4GAACvBQAgCAAAzgQAIAsAANAEACCmAgEAqgQAIacCAQCqBAAhuwJAALsEACHDAgEAqgQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQUnAAC2BwAgKAAAuQcAIIADAAC3BwAggQMAALgHACCGAwAAiAMAIA4GAACxBQAgCAAA2AQAIAsAANoEACCmAgEAAAABpwIBAAAAAbsCQAAAAAHDAgEAAAAByQIAAADcAgLYAkAAAAAB2QIBAAAAAdoCAQAAAAHcAhAAAAAB3QIBAAAAAd4CAQAAAAEDJwAAtgcAIIADAAC3BwAghgMAAIgDACADBgAArQQAIKYCAQAAAAGnAgEAAAABAgAAAA8AICcAALoFACADAAAADwAgJwAAugUAICgAALkFACABIAAAtQcAMAIAAAAPACAgAAC5BQAgAgAAAIwFACAgAAC4BQAgAqYCAQCqBAAhpwIBAKoEACEDBgAAqwQAIKYCAQCqBAAhpwIBAKoEACEDBgAArQQAIKYCAQAAAAGnAgEAAAABBCcAALIFADCAAwAAswUAMIIDAAC1BQAghgMAAIgFADAEJwAApwUAMIADAACoBQAwggMAAKoFACCGAwAAxgQAMAAAAAAABScAALAHACAoAACzBwAggAMAALEHACCBAwAAsgcAIIYDAACIAwAgAycAALAHACCAAwAAsQcAIIYDAACIAwAgAAAAAAAFJwAAqwcAICgAAK4HACCAAwAArAcAIIEDAACtBwAghgMAABQAIAMnAACrBwAggAMAAKwHACCGAwAAFAAgBgYAAPMGACAIAACWBQAgCQAA_QYAIAsAAP4GACDdAgAArwQAIN4CAACvBAAgAAAABScAAKYHACAoAACpBwAggAMAAKcHACCBAwAAqAcAIIYDAABaACADJwAApgcAIIADAACnBwAghgMAAFoAIAAAAAUnAACeBwAgKAAApAcAIIADAACfBwAggQMAAKMHACCGAwAAWgAgBScAAJwHACAoAAChBwAggAMAAJ0HACCBAwAAoAcAIIYDAABaACADJwAAngcAIIADAACfBwAghgMAAFoAIAMnAACcBwAggAMAAJ0HACCGAwAAWgAgAAAACycAANwFADAoAADgBQAwgAMAAN0FADCBAwAA3gUAMIIDAADfBQAggwMAAPoEADCEAwAA-gQAMIUDAAD6BAAwhgMAAPoEADCHAwAA4QUAMIgDAAD9BAAwAwYAAKAFACCmAgEAAAABpwIBAAAAAQIAAAAcACAnAADkBQAgAwAAABwAICcAAOQFACAoAADjBQAgASAAAJsHADACAAAAHAAgIAAA4wUAIAIAAAD-BAAgIAAA4gUAIAKmAgEAqgQAIacCAQCqBAAhAwYAAJ8FACCmAgEAqgQAIacCAQCqBAAhAwYAAKAFACCmAgEAAAABpwIBAAAAAQQnAADcBQAwgAMAAN0FADCCAwAA3wUAIIYDAAD6BAAwAAAAAAAAAAAHJwAAlgcAICgAAJkHACCAAwAAlwcAIIEDAACYBwAghAMAAAsAIIUDAAALACCGAwAAiAMAIAMnAACWBwAggAMAAJcHACCGAwAAiAMAIAAAAAAAAAGDA0AAAAABBScAAJEHACAoAACUBwAggAMAAJIHACCBAwAAkwcAIIYDAABaACADJwAAkQcAIIADAACSBwAghgMAAFoAIAAAAAUnAACMBwAgKAAAjwcAIIADAACNBwAggQMAAI4HACCGAwAAWgAgAycAAIwHACCAAwAAjQcAIIYDAABaACAAAAABgwMAAAD2AgIBgwMAAAD8AgILJwAA3AYAMCgAAOEGADCAAwAA3QYAMIEDAADeBgAwggMAAN8GACCDAwAA4AYAMIQDAADgBgAwhQMAAOAGADCGAwAA4AYAMIcDAADiBgAwiAMAAOMGADALJwAA0AYAMCgAANUGADCAAwAA0QYAMIEDAADSBgAwggMAANMGACCDAwAA1AYAMIQDAADUBgAwhQMAANQGADCGAwAA1AYAMIcDAADWBgAwiAMAANcGADAHJwAAywYAICgAAM4GACCAAwAAzAYAIIEDAADNBgAghAMAAAsAIIUDAAALACCGAwAAiAMAIAsnAADCBgAwKAAAxgYAMIADAADDBgAwgQMAAMQGADCCAwAAxQYAIIMDAADfBAAwhAMAAN8EADCFAwAA3wQAMIYDAADfBAAwhwMAAMcGADCIAwAA4gQAMAsnAAC5BgAwKAAAvQYAMIADAAC6BgAwgQMAALsGADCCAwAAvAYAIIMDAADGBAAwhAMAAMYEADCFAwAAxgQAMIYDAADGBAAwhwMAAL4GADCIAwAAyQQAMAsnAACwBgAwKAAAtAYAMIADAACxBgAwgQMAALIGADCCAwAAswYAIIMDAACoBgAwhAMAAKgGADCFAwAAqAYAMIYDAACoBgAwhwMAALUGADCIAwAAqwYAMAsnAACkBgAwKAAAqQYAMIADAAClBgAwgQMAAKYGADCCAwAApwYAIIMDAACoBgAwhAMAAKgGADCFAwAAqAYAMIYDAACoBgAwhwMAAKoGADCIAwAAqwYAMAsnAACYBgAwKAAAnQYAMIADAACZBgAwgQMAAJoGADCCAwAAmwYAIIMDAACcBgAwhAMAAJwGADCFAwAAnAYAMIYDAACcBgAwhwMAAJ4GADCIAwAAnwYAMAsnAACMBgAwKAAAkQYAMIADAACNBgAwgQMAAI4GADCCAwAAjwYAIIMDAACQBgAwhAMAAJAGADCFAwAAkAYAMIYDAACQBgAwhwMAAJIGADCIAwAAkwYAMAOmAgEAAAABuwJAAAAAAf0CAQAAAAECAAAAAQAgJwAAlwYAIAMAAAABACAnAACXBgAgKAAAlgYAIAEgAACLBwAwCBoAANkDACCjAgAAlwQAMKQCAAA6ABClAgAAlwQAMKYCAQAAAAG7AkAA2AMAIfwCAQDlAwAh_QIBAOUDACECAAAAAQAgIAAAlgYAIAIAAACUBgAgIAAAlQYAIAejAgAAkwYAMKQCAACUBgAQpQIAAJMGADCmAgEA5QMAIbsCQADYAwAh_AIBAOUDACH9AgEA5QMAIQejAgAAkwYAMKQCAACUBgAQpQIAAJMGADCmAgEA5QMAIbsCQADYAwAh_AIBAOUDACH9AgEA5QMAIQOmAgEAqgQAIbsCQAC7BAAh_QIBAKoEACEDpgIBAKoEACG7AkAAuwQAIf0CAQCqBAAhA6YCAQAAAAG7AkAAAAAB_QIBAAAAAQWmAgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQIAAAA4ACAnAACjBgAgAwAAADgAICcAAKMGACAoAACiBgAgASAAAIoHADAKAwAA2QMAIKMCAACYBAAwpAIAADYAEKUCAACYBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACECAAAAOAAgIAAAogYAIAIAAACgBgAgIAAAoQYAIAmjAgAAnwYAMKQCAACgBgAQpQIAAJ8GADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACEJowIAAJ8GADCkAgAAoAYAEKUCAACfBgAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh0wIBAOUDACHUAgEA5QMAIdUCIADXAwAhBaYCAQCqBAAhuwJAALsEACHTAgEAqgQAIdQCAQCqBAAh1QIgALoEACEFpgIBAKoEACG7AkAAuwQAIdMCAQCqBAAh1AIBAKoEACHVAiAAugQAIQWmAgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQYUAADWBQAgpgIBAAAAAbsCQAAAAAHUAgEAAAAB1QIgAAAAAdYCAQAAAAECAAAAMwAgJwAArwYAIAMAAAAzACAnAACvBgAgKAAArgYAIAEgAACJBwAwCxQAANkDACAVAADZAwAgowIAAJkEADCkAgAAMQAQpQIAAJkEADCmAgEAAAABuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQIAAAAzACAgAACuBgAgAgAAAKwGACAgAACtBgAgCaMCAACrBgAwpAIAAKwGABClAgAAqwYAMKYCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQmjAgAAqwYAMKQCAACsBgAQpQIAAKsGADCmAgEA5QMAIbsCQADYAwAh1AIBAOUDACHVAiAA1wMAIdYCAQDlAwAh1wIBAOUDACEFpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIQYUAADUBQAgpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIQYUAADWBQAgpgIBAAAAAbsCQAAAAAHUAgEAAAAB1QIgAAAAAdYCAQAAAAEGFQAA1wUAIKYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHXAgEAAAABAgAAADMAICcAALgGACADAAAAMwAgJwAAuAYAICgAALcGACABIAAAiAcAMAIAAAAzACAgAAC3BgAgAgAAAKwGACAgAAC2BgAgBaYCAQCqBAAhuwJAALsEACHUAgEAqgQAIdUCIAC6BAAh1wIBAKoEACEGFQAA1QUAIKYCAQCqBAAhuwJAALsEACHUAgEAqgQAIdUCIAC6BAAh1wIBAKoEACEGFQAA1wUAIKYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHXAgEAAAABDgYAALEFACAJAADZBAAgCwAA2gQAIKYCAQAAAAGnAgEAAAABqAIBAAAAAbsCQAAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAAB3gIBAAAAAQIAAAAUACAnAADBBgAgAwAAABQAICcAAMEGACAoAADABgAgASAAAIcHADACAAAAFAAgIAAAwAYAIAIAAADKBAAgIAAAvwYAIAumAgEAqgQAIacCAQCqBAAhqAIBAKoEACG7AkAAuwQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQ4GAACvBQAgCQAAzwQAIAsAANAEACCmAgEAqgQAIacCAQCqBAAhqAIBAKoEACG7AkAAuwQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQ4GAACxBQAgCQAA2QQAIAsAANoEACCmAgEAAAABpwIBAAAAAagCAQAAAAG7AkAAAAAByQIAAADcAgLYAkAAAAAB2QIBAAAAAdoCAQAAAAHcAhAAAAAB3QIBAAAAAd4CAQAAAAEGBgAAwwUAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABAgAAACcAICcAAMoGACADAAAAJwAgJwAAygYAICgAAMkGACABIAAAhgcAMAIAAAAnACAgAADJBgAgAgAAAOMEACAgAADIBgAgBaYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAgC5BAAhxQIBAKoEACEGBgAAwgUAIKYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAgC5BAAhxQIBAKoEACEGBgAAwwUAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABDQwAAJUFACAOAACRBQAgEAAAkgUAIBEAAJMFACASAACUBQAgpgIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAiAMAICcAAMsGACADAAAACwAgJwAAywYAICgAAM8GACAPAAAACwAgDAAAwQQAIA4AAL0EACAQAAC-BAAgEQAAvwQAIBIAAMAEACAgAADPBgAgpgIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQ0MAADBBAAgDgAAvQQAIBAAAL4EACARAAC_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_wYAICgAAIIHACCAAwAAgAcAIIEDAACBBwAghgMAAFoAIAMnAAD_BgAggAMAAIAHACCGAwAAWgAgAQcAAJgFACACBwAAlwUAIAwAAJsFACAECgAAywUAIMoCAACvBAAgywIAAK8EACDMAgAArwQAIBUEAADoBgAgBQAA6QYAIAwAAOwGACASAADrBgAgEwAA6gYAIBYAAO0GACAXAADuBgAgGAAA7wYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA_AIC5QJAAAAAAfICAQAAAAHzAiAAAAAB9AIBAAAAAfYCAAAA9gIC9wIgAAAAAfgCIAAAAAH5AkAAAAAB-gIgAAAAAQIAAABaACAnAAD_BgAgAwAAAF0AICcAAP8GACAoAACDBwAgFwAAAF0AIAQAAIMGACAFAACEBgAgDAAAhwYAIBIAAIYGACATAACFBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgIAAAgwcAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEVBAAAgwYAIAUAAIQGACAMAACHBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgFwAAiQYAIBgAAIoGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhB6YCAQAAAAG7AkAAAAAB5AJAAAAAAeUCQAAAAAHvAgEAAAAB8AIBAAAAAfECAQAAAAEMpgIBAAAAAbsCQAAAAAHlAkAAAAAB5gIBAAAAAecCAQAAAAHoAgEAAAAB6QIBAAAAAeoCAQAAAAHrAkAAAAAB7AJAAAAAAe0CAQAAAAHuAgEAAAABBaYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABC6YCAQAAAAGnAgEAAAABqAIBAAAAAbsCQAAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAAB3gIBAAAAAQWmAgEAAAABuwJAAAAAAdQCAQAAAAHVAiAAAAAB1wIBAAAAAQWmAgEAAAABuwJAAAAAAdQCAQAAAAHVAiAAAAAB1gIBAAAAAQWmAgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQOmAgEAAAABuwJAAAAAAf0CAQAAAAEVBQAA6QYAIAwAAOwGACASAADrBgAgEwAA6gYAIBYAAO0GACAXAADuBgAgGAAA7wYAIBkAAPAGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPwCAuUCQAAAAAHyAgEAAAAB8wIgAAAAAfQCAQAAAAH2AgAAAPYCAvcCIAAAAAH4AiAAAAAB-QJAAAAAAfoCIAAAAAECAAAAWgAgJwAAjAcAIAMAAABdACAnAACMBwAgKAAAkAcAIBcAAABdACAFAACEBgAgDAAAhwYAIBIAAIYGACATAACFBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgGQAAiwYAICAAAJAHACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhFQUAAIQGACAMAACHBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgFwAAiQYAIBgAAIoGACAZAACLBgAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIRUEAADoBgAgDAAA7AYAIBIAAOsGACATAADqBgAgFgAA7QYAIBcAAO4GACAYAADvBgAgGQAA8AYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA_AIC5QJAAAAAAfICAQAAAAHzAiAAAAAB9AIBAAAAAfYCAAAA9gIC9wIgAAAAAfgCIAAAAAH5AkAAAAAB-gIgAAAAAQIAAABaACAnAACRBwAgAwAAAF0AICcAAJEHACAoAACVBwAgFwAAAF0AIAQAAIMGACAMAACHBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgFwAAiQYAIBgAAIoGACAZAACLBgAgIAAAlQcAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEVBAAAgwYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhDgMAAJAFACAMAACVBQAgDgAAkQUAIBAAAJIFACASAACUBQAgpgIBAAAAAbQCAQAAAAG1AgEAAAABtgICAAAAAbcCEAAAAAG4AggAAAABuQICAAAAAboCIAAAAAG7AkAAAAABAgAAAIgDACAnAACWBwAgAwAAAAsAICcAAJYHACAoAACaBwAgEAAAAAsAIAMAALwEACAMAADBBAAgDgAAvQQAIBAAAL4EACASAADABAAgIAAAmgcAIKYCAQCqBAAhtAIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQ4DAAC8BAAgDAAAwQQAIA4AAL0EACAQAAC-BAAgEgAAwAQAIKYCAQCqBAAhtAIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQKmAgEAAAABpwIBAAAAARUEAADoBgAgBQAA6QYAIAwAAOwGACASAADrBgAgEwAA6gYAIBYAAO0GACAYAADvBgAgGQAA8AYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA_AIC5QJAAAAAAfICAQAAAAHzAiAAAAAB9AIBAAAAAfYCAAAA9gIC9wIgAAAAAfgCIAAAAAH5AkAAAAAB-gIgAAAAAQIAAABaACAnAACcBwAgFQQAAOgGACAFAADpBgAgDAAA7AYAIBIAAOsGACATAADqBgAgFwAA7gYAIBgAAO8GACAZAADwBgAgpgIBAAAAAbsCQAAAAAHAAgEAAAAByQIAAAD8AgLlAkAAAAAB8gIBAAAAAfMCIAAAAAH0AgEAAAAB9gIAAAD2AgL3AiAAAAAB-AIgAAAAAfkCQAAAAAH6AiAAAAABAgAAAFoAICcAAJ4HACADAAAAXQAgJwAAnAcAICgAAKIHACAXAAAAXQAgBAAAgwYAIAUAAIQGACAMAACHBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgGAAAigYAIBkAAIsGACAgAACiBwAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIRUEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAYAACKBgAgGQAAiwYAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEDAAAAXQAgJwAAngcAICgAAKUHACAXAAAAXQAgBAAAgwYAIAUAAIQGACAMAACHBgAgEgAAhgYAIBMAAIUGACAXAACJBgAgGAAAigYAIBkAAIsGACAgAAClBwAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIRUEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBcAAIkGACAYAACKBgAgGQAAiwYAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEVBAAA6AYAIAUAAOkGACAMAADsBgAgEgAA6wYAIBMAAOoGACAWAADtBgAgFwAA7gYAIBkAAPAGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPwCAuUCQAAAAAHyAgEAAAAB8wIgAAAAAfQCAQAAAAH2AgAAAPYCAvcCIAAAAAH4AiAAAAAB-QJAAAAAAfoCIAAAAAECAAAAWgAgJwAApgcAIAMAAABdACAnAACmBwAgKAAAqgcAIBcAAABdACAEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGQAAiwYAICAAAKoHACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhFQQAAIMGACAFAACEBgAgDAAAhwYAIBIAAIYGACATAACFBgAgFgAAiAYAIBcAAIkGACAZAACLBgAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIQ8GAACxBQAgCAAA2AQAIAkAANkEACCmAgEAAAABpwIBAAAAAagCAQAAAAG7AkAAAAABwwIBAAAAAckCAAAA3AIC2AJAAAAAAdkCAQAAAAHaAgEAAAAB3AIQAAAAAd0CAQAAAAHeAgEAAAABAgAAABQAICcAAKsHACADAAAAEgAgJwAAqwcAICgAAK8HACARAAAAEgAgBgAArwUAIAgAAM4EACAJAADPBAAgIAAArwcAIKYCAQCqBAAhpwIBAKoEACGoAgEAqgQAIbsCQAC7BAAhwwIBAKoEACHJAgAAzATcAiLYAkAAuwQAIdkCAQCqBAAh2gIBAKoEACHcAhAAtwQAId0CAQC1BAAh3gIBALUEACEPBgAArwUAIAgAAM4EACAJAADPBAAgpgIBAKoEACGnAgEAqgQAIagCAQCqBAAhuwJAALsEACHDAgEAqgQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACHeAgEAtQQAIQ4DAACQBQAgDAAAlQUAIA4AAJEFACAQAACSBQAgEQAAkwUAIKYCAQAAAAG0AgEAAAABtQIBAAAAAbYCAgAAAAG3AhAAAAABuAIIAAAAAbkCAgAAAAG6AiAAAAABuwJAAAAAAQIAAACIAwAgJwAAsAcAIAMAAAALACAnAACwBwAgKAAAtAcAIBAAAAALACADAAC8BAAgDAAAwQQAIA4AAL0EACAQAAC-BAAgEQAAvwQAICAAALQHACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEOAwAAvAQAIAwAAMEEACAOAAC9BAAgEAAAvgQAIBEAAL8EACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACECpgIBAAAAAacCAQAAAAEOAwAAkAUAIA4AAJEFACAQAACSBQAgEQAAkwUAIBIAAJQFACCmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAiAMAICcAALYHACADAAAACwAgJwAAtgcAICgAALoHACAQAAAACwAgAwAAvAQAIA4AAL0EACAQAAC-BAAgEQAAvwQAIBIAAMAEACAgAAC6BwAgpgIBAKoEACG0AgEAqgQAIbUCAQC1BAAhtgICALYEACG3AhAAtwQAIbgCCAC4BAAhuQICALkEACG6AiAAugQAIbsCQAC7BAAhDgMAALwEACAOAAC9BAAgEAAAvgQAIBEAAL8EACASAADABAAgpgIBAKoEACG0AgEAqgQAIbUCAQC1BAAhtgICALYEACG3AhAAtwQAIbgCCAC4BAAhuQICALkEACG6AiAAugQAIbsCQAC7BAAhC6YCAQAAAAGnAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAAB3gIBAAAAAQ4DAACQBQAgDAAAlQUAIA4AAJEFACARAACTBQAgEgAAlAUAIKYCAQAAAAG0AgEAAAABtQIBAAAAAbYCAgAAAAG3AhAAAAABuAIIAAAAAbkCAgAAAAG6AiAAAAABuwJAAAAAAQIAAACIAwAgJwAAvAcAIAMAAAALACAnAAC8BwAgKAAAwAcAIBAAAAALACADAAC8BAAgDAAAwQQAIA4AAL0EACARAAC_BAAgEgAAwAQAICAAAMAHACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEOAwAAvAQAIAwAAMEEACAOAAC9BAAgEQAAvwQAIBIAAMAEACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEVBAAA6AYAIAUAAOkGACAMAADsBgAgEgAA6wYAIBYAAO0GACAXAADuBgAgGAAA7wYAIBkAAPAGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPwCAuUCQAAAAAHyAgEAAAAB8wIgAAAAAfQCAQAAAAH2AgAAAPYCAvcCIAAAAAH4AiAAAAAB-QJAAAAAAfoCIAAAAAECAAAAWgAgJwAAwQcAIAKmAgEAAAABqAIBAAAAAQKmAgEAAAABwAIBAAAAAQIAAADmAQAgJwAAxAcAIAMAAADpAQAgJwAAxAcAICgAAMgHACAEAAAA6QEAICAAAMgHACCmAgEAqgQAIcACAQCqBAAhAqYCAQCqBAAhwAIBAKoEACECpgIBAAAAAb8CAQAAAAEFpgIBAAAAAdkCAQAAAAHaAgEAAAAB4AIAAADgAgLhAiAAAAABFQQAAOgGACAFAADpBgAgDAAA7AYAIBMAAOoGACAWAADtBgAgFwAA7gYAIBgAAO8GACAZAADwBgAgpgIBAAAAAbsCQAAAAAHAAgEAAAAByQIAAAD8AgLlAkAAAAAB8gIBAAAAAfMCIAAAAAH0AgEAAAAB9gIAAAD2AgL3AiAAAAAB-AIgAAAAAfkCQAAAAAH6AiAAAAABAgAAAFoAICcAAMsHACADAAAAXQAgJwAAywcAICgAAM8HACAXAAAAXQAgBAAAgwYAIAUAAIQGACAMAACHBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACAgAADPBwAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIRUEAACDBgAgBQAAhAYAIAwAAIcGACATAACFBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgGQAAiwYAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEFpgIBAAAAAbsCQAAAAAHDAgEAAAABxAICAAAAAcUCAQAAAAEEBwAAuwUAIKYCAQAAAAHAAgEAAAABwgIAAADCAgICAAAA2QIAICcAANEHACAVBAAA6AYAIAUAAOkGACASAADrBgAgEwAA6gYAIBYAAO0GACAXAADuBgAgGAAA7wYAIBkAAPAGACCmAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPwCAuUCQAAAAAHyAgEAAAAB8wIgAAAAAfQCAQAAAAH2AgAAAPYCAvcCIAAAAAH4AiAAAAAB-QJAAAAAAfoCIAAAAAECAAAAWgAgJwAA0wcAIAMAAADcAgAgJwAA0QcAICgAANcHACAGAAAA3AIAIAcAAKUFACAgAADXBwAgpgIBAKoEACHAAgEAqgQAIcICAACkBcICIgQHAAClBQAgpgIBAKoEACHAAgEAqgQAIcICAACkBcICIgMAAABdACAnAADTBwAgKAAA2gcAIBcAAABdACAEAACDBgAgBQAAhAYAIBIAAIYGACATAACFBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgGQAAiwYAICAAANoHACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb8AiLlAkAAuwQAIfICAQCqBAAh8wIgALoEACH0AgEAtQQAIfYCAACBBvYCIvcCIAC6BAAh-AIgALoEACH5AkAA9gUAIfoCIAC6BAAhFQQAAIMGACAFAACEBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgFwAAiQYAIBgAAIoGACAZAACLBgAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIQumAgEAAAABqAIBAAAAAbsCQAAAAAHDAgEAAAAByQIAAADcAgLYAkAAAAAB2QIBAAAAAdoCAQAAAAHcAhAAAAAB3QIBAAAAAd4CAQAAAAEDAAAAXQAgJwAAwQcAICgAAN4HACAXAAAAXQAgBAAAgwYAIAUAAIQGACAMAACHBgAgEgAAhgYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACAgAADeBwAgpgIBAKoEACG7AkAAuwQAIcACAQCqBAAhyQIAAIIG_AIi5QJAALsEACHyAgEAqgQAIfMCIAC6BAAh9AIBALUEACH2AgAAgQb2AiL3AiAAugQAIfgCIAC6BAAh-QJAAPYFACH6AiAAugQAIRUEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgGQAAiwYAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvwCIuUCQAC7BAAh8gIBAKoEACHzAiAAugQAIfQCAQC1BAAh9gIAAIEG9gIi9wIgALoEACH4AiAAugQAIfkCQAD2BQAh-gIgALoEACEEDAAAvAUAIKYCAQAAAAHAAgEAAAABwgIAAADCAgICAAAA2QIAICcAAN8HACAOAwAAkAUAIAwAAJUFACAQAACSBQAgEQAAkwUAIBIAAJQFACCmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAiAMAICcAAOEHACADAAAA3AIAICcAAN8HACAoAADlBwAgBgAAANwCACAMAACmBQAgIAAA5QcAIKYCAQCqBAAhwAIBAKoEACHCAgAApAXCAiIEDAAApgUAIKYCAQCqBAAhwAIBAKoEACHCAgAApAXCAiIDAAAACwAgJwAA4QcAICgAAOgHACAQAAAACwAgAwAAvAQAIAwAAMEEACAQAAC-BAAgEQAAvwQAIBIAAMAEACAgAADoBwAgpgIBAKoEACG0AgEAqgQAIbUCAQC1BAAhtgICALYEACG3AhAAtwQAIbgCCAC4BAAhuQICALkEACG6AiAAugQAIbsCQAC7BAAhDgMAALwEACAMAADBBAAgEAAAvgQAIBEAAL8EACASAADABAAgpgIBAKoEACG0AgEAqgQAIbUCAQC1BAAhtgICALYEACG3AhAAtwQAIbgCCAC4BAAhuQICALkEACG6AiAAugQAIbsCQAC7BAAhARoAAgoEBgMFCgQMMAgNABMSLw8TDAUWNBEXNREYORIZPAEBAwACAQMAAgcDAAIMKQgNABAOEAYQHQsRIw4SKA8CBgAFCQAHAwcRBgwVCA0ACgQGAAUIAAIJAAcLFwkBCgAIAgcYAAwZAAIGAAUPAAwCBx4LDQANAQcfAAEGJAUCBgAFCAACBQwuAA4qABArABEsABItAAIUAAIVAAIBAwACCAQ9AAU-AAxAABI_ABZBABdCABhDABlEAAABGgACARoAAgMNABgtABkuABoAAAADDQAYLQAZLgAaAAADDQAfLQAgLgAhAAAAAw0AHy0AIC4AIQEDAAIBAwACAw0AJi0AJy4AKAAAAAMNACYtACcuACgBAwACAQMAAgMNAC0tAC4uAC8AAAADDQAtLQAuLgAvAAAAAw0ANS0ANi4ANwAAAAMNADUtADYuADcBBsIBBQEGyAEFAw0APC0APS4APgAAAAMNADwtAD0uAD4DBgAFCAACCQAHAwYABQgAAgkABwUNAEMtAEYuAEePAQBEkAEARQAAAAAABQ0AQy0ARi4AR48BAESQAQBFAAADDQBMLQBNLgBOAAAAAw0ATC0ATS4ATgIUAAIVAAICFAACFQACAw0AUy0AVC4AVQAAAAMNAFMtAFQuAFUBAwACAQMAAgMNAFotAFsuAFwAAAADDQBaLQBbLgBcAQoACAEKAAgFDQBhLQBkLgBljwEAYpABAGMAAAAAAAUNAGEtAGQuAGWPAQBikAEAYwIGAAUIAAICBgAFCAACBQ0Aai0AbS4Abo8BAGuQAQBsAAAAAAAFDQBqLQBtLgBujwEAa5ABAGwAAAMNAHMtAHQuAHUAAAADDQBzLQB0LgB1AgYABQ8ADAIGAAUPAAwDDQB6LQB7LgB8AAAAAw0Aei0Aey4AfAEDAAIBAwACBQ0AgQEtAIQBLgCFAY8BAIIBkAEAgwEAAAAAAAUNAIEBLQCEAS4AhQGPAQCCAZABAIMBAgYABQkABwIGAAUJAAcDDQCKAS0AiwEuAIwBAAAAAw0AigEtAIsBLgCMARsCARxFAR1GAR5HAR9IASFKASJMFCNNFSRPASVRFCZSFilTASpUAStVFC9YFzBZGzFbAjJcAjNfAjRgAjVhAjZjAjdlFDhmHDloAjpqFDtrHTxsAj1tAj5uFD9xHkByIkFzA0J0A0N1A0R2A0V3A0Z5A0d7FEh8I0l-A0qAARRLgQEkTIIBA02DAQNOhAEUT4cBJVCIASlRiQEEUooBBFOLAQRUjAEEVY0BBFaPAQRXkQEUWJIBKlmUAQRalgEUW5cBK1yYAQRdmQEEXpoBFF-dASxgngEwYaABMWKhATFjpAExZKUBMWWmATFmqAExZ6oBFGirATJprQExaq8BFGuwATNssQExbbIBMW6zARRvtgE0cLcBOHG4AQ5yuQEOc7oBDnS7AQ51vAEOdr4BDnfAARR4wQE5ecQBDnrGARR7xwE6fMkBDn3KAQ5-ywEUf84BO4ABzwE_gQHQAQiCAdEBCIMB0gEIhAHTAQiFAdQBCIYB1gEIhwHYARSIAdkBQIkB2wEIigHdARSLAd4BQYwB3wEIjQHgAQiOAeEBFJEB5AFCkgHlAUiTAecBDJQB6AEMlQHrAQyWAewBDJcB7QEMmAHvAQyZAfEBFJoB8gFJmwH0AQycAfYBFJ0B9wFKngH4AQyfAfkBDKAB-gEUoQH9AUuiAf4BT6MB_wERpAGAAhGlAYECEaYBggIRpwGDAhGoAYUCEakBhwIUqgGIAlCrAYoCEawBjAIUrQGNAlGuAY4CEa8BjwIRsAGQAhSxAZMCUrIBlAJWswGVAhK0AZYCErUBlwIStgGYAhK3AZkCErgBmwISuQGdAhS6AZ4CV7sBoAISvAGiAhS9AaMCWL4BpAISvwGlAhLAAaYCFMEBqQJZwgGqAl3DAawCCcQBrQIJxQGvAgnGAbACCccBsQIJyAGzAgnJAbUCFMoBtgJeywG4AgnMAboCFM0BuwJfzgG8AgnPAb0CCdABvgIU0QHBAmDSAcICZtMBwwIP1AHEAg_VAcUCD9YBxgIP1wHHAg_YAckCD9kBywIU2gHMAmfbAc4CD9wB0AIU3QHRAmjeAdICD98B0wIP4AHUAhThAdcCaeIB2AJv4wHaAgfkAdsCB-UB3gIH5gHfAgfnAeACB-gB4gIH6QHkAhTqAeUCcOsB5wIH7AHpAhTtAeoCce4B6wIH7wHsAgfwAe0CFPEB8AJy8gHxAnbzAfICC_QB8wIL9QH0Agv2AfUCC_cB9gIL-AH4Agv5AfoCFPoB-wJ3-wH9Agv8Af8CFP0BgAN4_gGBAwv_AYIDC4ACgwMUgQKGA3mCAocDfYMCiQMFhAKKAwWFAowDBYYCjQMFhwKOAwWIApADBYkCkgMUigKTA36LApUDBYwClwMUjQKYA3-OApkDBY8CmgMFkAKbAxSRAp4DgAGSAp8DhgGTAqADBpQCoQMGlQKiAwaWAqMDBpcCpAMGmAKmAwaZAqgDFJoCqQOHAZsCqwMGnAKtAxSdAq4DiAGeAq8DBp8CsAMGoAKxAxShArQDiQGiArUDjQE"
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
  INACTIVE: "INACTIVE",
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
      password,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
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

// src/app/builder/QueryBuilder.ts
var QueryHelper = class {
  // ১. Search Logic: একটি সার্চ টার্ম এবং সার্চেবল ফিল্ডের অ্যারে নেবে এবং Prisma এর জন্য একটি সার্চ অবজেক্ট রিটার্ন করবে
  static search(searchTerm, searchableFields) {
    if (!searchTerm) return {};
    return {
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive"
        }
      }))
    };
  }
  // ২. Filter Logic: স্ট্যাটাস, ক্যাটাগরি বা অন্য ফিক্সড ভ্যালুর জন্য
  static filter(query, excludeFields = ["search", "searchTerm", "page", "limit", "sortBy", "sortOrder"]) {
    const finalFilters = {};
    Object.keys(query).forEach((key) => {
      if (!excludeFields.includes(key) && query[key]) {
        finalFilters[key] = query[key];
      }
    });
    return finalFilters;
  }
  // ৩. Pagination & Sorting
  static paginateAndSort(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
    return {
      skip,
      take: limit,
      page,
      limit,
      orderBy: { [sortBy]: sortOrder }
    };
  }
};

// src/app/module/tutor/tutor.service.ts
var createTutorProfile = async (user, payload) => {
  if (user.role !== "STUDENT") {
    throw new AppError_default(
      status5.FORBIDDEN,
      "Only students can create a tutor profile."
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
  const profile = await getMyProfile(user);
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
      ...payload.experienceYears !== void 0 && { experienceYears: payload.experienceYears },
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
var getAllTutors = async (query) => {
  const searchTerm = query.searchTerm || query.search;
  const searchConditions = searchTerm ? {
    OR: [
      { user: { name: { contains: query.search, mode: "insensitive" } } },
      { bio: { contains: query.search, mode: "insensitive" } }
    ]
  } : {};
  const filterConditions = QueryHelper.filter(query);
  const { skip, take, page, limit, orderBy } = QueryHelper.paginateAndSort(query);
  const where = {
    isApproved: true,
    ...searchConditions,
    ...filterConditions
  };
  const total = await prisma.tutorProfile.count({ where });
  const tutors = await prisma.tutorProfile.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true
        }
      },
      subjects: {
        select: {
          subject: {
            select: { id: true, name: true }
          }
        }
      },
      languages: {
        select: {
          language: {
            select: { id: true, name: true }
          }
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { endTime: "asc" }]
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true, image: true }
          }
        }
      },
      _count: {
        select: { reviews: true, bookings: true, subjects: true, languages: true }
      }
    }
  });
  return {
    tutors,
    meta: {
      page,
      limit,
      total
    }
  };
};
var getPublicProfile = async (tutorProfileId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true
        }
      },
      subjects: {
        select: {
          subject: {
            select: { id: true, name: true }
          }
        }
      },
      languages: {
        select: {
          language: {
            select: { id: true, name: true }
          }
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
            select: { id: true, name: true, image: true }
            // ইমেজও ইনক্লুড করা ভালো
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
var getDashboardStats = async (userId) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutor) {
    throw new AppError_default(status5.NOT_FOUND, "Tutor profile not found!");
  }
  const now = /* @__PURE__ */ new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const currentTimeString = now.toISOString();
  const [
    totalBookings,
    completedBookings,
    pendingBookings,
    monthBookings,
    lastMonthBookings,
    totalEarningsResult,
    monthEarningsResult,
    recentReviews,
    upcomingBookings
  ] = await prisma.$transaction([
    // 1. Total bookings
    prisma.booking.count({ where: { tutorId: tutor.id } }),
    // 2. Completed sessions
    prisma.booking.count({ where: { tutorId: tutor.id, status: "COMPLETED" } }),
    // 3. Pending approval
    prisma.booking.count({ where: { tutorId: tutor.id, status: "PENDING" } }),
    // 4. This month's bookings
    prisma.booking.count({
      where: { tutorId: tutor.id, createdAt: { gte: startOfMonth } }
    }),
    // 5. Last month's bookings
    prisma.booking.count({
      where: { tutorId: tutor.id, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }),
    // 6. Total earnings
    prisma.payment.aggregate({
      where: { booking: { tutorId: tutor.id }, status: "PAID" },
      _sum: { amount: true }
    }),
    // 7. This month's earnings
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: tutor.id },
        status: "PAID",
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),
    // 8. Latest 5 reviews
    prisma.review.findMany({
      where: { tutorId: tutor.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, name: true, image: true } } }
    }),
    // 9. Upcoming sessions (Fixing the Type Error here)
    prisma.booking.findMany({
      where: {
        tutorId: tutor.id,
        status: "ACCEPTED",
        // যদি startTime ফিল্ডটি String হয়, তবে currentTimeString দিন। 
        // যদি DateTime হয় তবে সরাসরি 'now' ব্যবহার করুন।
        startTime: { gte: currentTimeString }
      },
      take: 5,
      orderBy: { startTime: "asc" },
      include: {
        student: { select: { id: true, name: true, image: true } },
        payment: { select: { status: true, amount: true } }
      }
    })
  ]);
  const bookingChange = lastMonthBookings === 0 ? monthBookings > 0 ? 100 : 0 : Math.round((monthBookings - lastMonthBookings) / lastMonthBookings * 100);
  return {
    overview: {
      totalBookings,
      completedBookings,
      pendingBookings,
      totalEarnings: totalEarningsResult._sum.amount || 0,
      monthEarnings: monthEarningsResult._sum.amount || 0,
      averageRating: tutor.averageRating || 0,
      totalReviews: tutor.totalReviews || 0,
      isApproved: tutor.isApproved
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
var TutorServices = {
  createTutorProfile,
  updateTutorProfile,
  uploadAvatar,
  getMyProfile,
  getAllTutors,
  getPublicProfile,
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
var getAllTutors2 = catchAsync(async (req, res) => {
  const result = await TutorServices.getAllTutors(req.query);
  sendResponse(res, {
    httpStatusCode: status6.OK,
    success: true,
    message: "Tutors fetched successfully.",
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
  const user = req.user;
  const result = await TutorServices.getDashboardStats(user.userId);
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
  getAllTutors: getAllTutors2,
  getPublicProfile: getPublicProfile2,
  uploadAvatar: uploadAvatar2,
  getDashboardStats: getDashboardStats2
};

// src/app/module/tutor/tutor.validation.ts
import { z } from "zod";
var timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
var createProfileSchema = z.object({
  body: z.object({
    bio: z.string({ error: "Bio is required." }).min(20, "Bio must be at least 20 characters.").max(1e3, "Bio must not exceed 1000 characters."),
    hourlyRate: z.number({ error: "Hourly rate is required." }).positive("Hourly rate must be greater than 0.").max(1e4, "Hourly rate seems too high."),
    subjects: z.array(z.string().uuid("Invalid subject ID.")).min(1, "At least one subject is required.").max(10, "Maximum 10 subjects allowed."),
    languages: z.array(z.string().uuid("Invalid language ID.")).min(1, "At least one language is required.").max(10, "Maximum 10 languages allowed."),
    experienceYears: z.number().int().min(0).max(50).optional()
  })
});
var updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().min(50).max(1e3).optional(),
    hourlyRate: z.number().positive().max(1e4).optional(),
    subjects: z.array(z.string().uuid()).min(1).max(10).optional(),
    languages: z.array(z.string().uuid()).min(1).max(10).optional(),
    experienceYears: z.number().int().min(0).max(50).optional()
  })
});
var availabilitySlotSchema = z.object({
  dayOfWeek: z.number({ error: "dayOfWeek is required." }).int().min(0, "dayOfWeek must be 0 (Sun) to 6 (Sat).").max(6, "dayOfWeek must be 0 (Sun) to 6 (Sat)."),
  startTime: z.string({ error: "startTime is required." }).regex(timeRegex, "startTime must be in HH:MM format (24-hour)."),
  endTime: z.string({ error: "endTime is required." }).regex(timeRegex, "endTime must be in HH:MM format (24-hour).")
});
var setAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(availabilitySlotSchema).min(1, "At least one availability slot is required.").max(50, "Maximum 50 slots allowed.")
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
        Object.assign(req.query, parsedResult.data.query);
      }
      if (parsedResult.data.params) {
        Object.assign(req.params, parsedResult.data.params);
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
router2.get("/", TutorController.getAllTutors);
router2.get("/:tutorId", TutorController.getPublicProfile);
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
import status8 from "http-status";

// src/app/module/booking/booking.service.ts
import status7 from "http-status";
var getPagination = (page = 1, limit = 10) => ({
  skip: (page - 1) * Math.min(limit, 50),
  take: Math.min(limit, 50)
});
var createBooking = async (userId, data) => {
  const { tutorId, subjectId, bookingDate, startTime, endTime } = data;
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    select: { hourlyRate: true }
  });
  if (!tutor) {
    throw new AppError_default(status7.NOT_FOUND, "Tutor profile not found.");
  }
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = days[new Date(bookingDate).getUTCDay()];
  const isTutorTeachingSubject = await prisma.tutorSubjects.findFirst({
    where: { tutorId, subjectId }
  });
  if (!isTutorTeachingSubject) {
    throw new AppError_default(status7.BAD_REQUEST, "This tutor does not teach the selected subject.");
  }
  const isAvailable = await prisma.availability.findFirst({
    where: {
      tutorId,
      dayOfWeek,
      isActive: true,
      startTime: { lte: startTime },
      endTime: { gte: endTime }
    }
  });
  if (!isAvailable) {
    throw new AppError_default(status7.BAD_REQUEST, `Tutor is not available on ${dayOfWeek} between ${startTime} - ${endTime}`);
  }
  const existingBooking = await prisma.booking.findFirst({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "ACCEPTED"] },
      OR: [
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
        { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] }
      ]
    }
  });
  if (existingBooking) {
    throw new AppError_default(status7.CONFLICT, "Tutor already has a booking at this time.");
  }
  const start = startTime.split(":").map(Number);
  const end = endTime.split(":").map(Number);
  const durationInHours = end[0] + end[1] / 60 - (start[0] + start[1] / 60);
  if (durationInHours <= 0) {
    throw new AppError_default(status7.BAD_REQUEST, "End time must be after start time.");
  }
  const hourlyRateNumber = Number(tutor.hourlyRate);
  const totalPrice = hourlyRateNumber * durationInHours;
  const newBooking = await prisma.booking.create({
    data: {
      studentId: userId,
      tutorId,
      subjectId,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      totalPrice,
      status: "PENDING"
    }
  });
  return newBooking;
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
    throw new AppError_default(status7.NOT_FOUND, "Booking not found.");
  }
  if (requesterRole === "TUTOR") {
    if (booking.tutor.userId !== requesterId) {
      throw new AppError_default(
        status7.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }
    const allowedTutorTransitions = {
      [BookingStatus.PENDING]: [BookingStatus.ACCEPTED, BookingStatus.REJECTED],
      [BookingStatus.ACCEPTED]: [BookingStatus.COMPLETED],
      [BookingStatus.REJECTED]: [BookingStatus.CANCELLED]
    };
    if (data.status && !allowedTutorTransitions[booking.status]?.includes(data.status)) {
      throw new AppError_default(
        status7.BAD_REQUEST,
        `Cannot transition booking from ${booking.status} to ${data.status}.`
      );
    }
  }
  if (requesterRole === "STUDENT") {
    if (booking.studentId !== requesterId) {
      throw new AppError_default(
        status7.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }
    if (data.status && data.status !== BookingStatus.CANCELLED) {
      throw new AppError_default(
        status7.FORBIDDEN,
        "Students can only cancel bookings."
      );
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError_default(
        status7.BAD_REQUEST,
        "You can only cancel a booking that is still pending."
      );
    }
  }
  if (data.status === BookingStatus.ACCEPTED && !data.meetingLink && !booking.meetingLink) {
    data.meetingLink = `https://meet.jit.si/TutorByte-${booking.id}`;
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...data.status && { status: data.status },
      ...data.meetingLink && { meetingLink: data.meetingLink }
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
    throw new AppError_default(status7.NOT_FOUND, "Tutor profile not found.");
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
var getAllBookings = async (query) => {
  const { page, limit, sortBy, sortOrder, status: status15, searchTerm } = query;
  const { skip, take } = getPagination(page, limit);
  const where = {};
  if (status15) {
    where.status = status15;
  }
  if (searchTerm) {
    where.OR = [
      { student: { name: { contains: searchTerm, mode: "insensitive" } } },
      { tutor: { user: { name: { contains: searchTerm, mode: "insensitive" } } } }
    ];
  }
  const orderBy = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = "desc";
  }
  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        tutor: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        },
        payment: true
      },
      skip,
      take,
      orderBy
    })
  ]);
  return {
    bookings,
    meta: {
      total,
      page: Number(page) || 1,
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
    throw new AppError_default(status7.NOT_FOUND, "Booking not found.");
  }
  const isStudent = booking.studentId === requesterId;
  const isTutor = booking.tutorId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  if (!isStudent && !isTutor && !isAdmin) {
    throw new AppError_default(status7.FORBIDDEN, "You do not have access to this booking.");
  }
  return booking;
};
var createReview = async (studentId, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId }
  });
  if (!booking) {
    throw new AppError_default(status7.NOT_FOUND, "Booking not found.");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(
      status7.FORBIDDEN,
      "You can only review your own bookings."
    );
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError_default(
      status7.BAD_REQUEST,
      "You can only review a completed session."
    );
  }
  if (booking.tutorId !== data.tutorId) {
    throw new AppError_default(status7.BAD_REQUEST, "Tutor ID does not match the booking.");
  }
  const existingReview = await prisma.review.findFirst({
    where: { studentId, tutorId: data.tutorId }
  });
  if (existingReview) {
    throw new AppError_default(
      status7.CONFLICT,
      "You have already reviewed this tutor for this booking."
    );
  }
  const [review] = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        studentId,
        tutorId: data.tutorId,
        rating: data.rating,
        comment: data.comment || ""
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
var getMyReviews = async (studentId) => {
  return await prisma.review.findMany({
    where: { studentId },
    include: {
      tutor: { include: { user: { select: { name: true } } } }
    },
    orderBy: { createdAt: "desc" }
  });
};
var bookingService = {
  createBooking,
  updateBookingStatus,
  getBookingsByStudent,
  getBookingsByTutor,
  getAllBookings,
  getBookingById,
  createReview,
  getMyReviews
};

// src/app/module/booking/booking.controller.ts
var createBooking2 = catchAsync(async (req, res) => {
  const user = req.user;
  const booking = await bookingService.createBooking(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status8.CREATED,
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
    httpStatusCode: status8.OK,
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
    httpStatusCode: status8.OK,
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
    httpStatusCode: status8.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings,
    meta: result.meta
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
    httpStatusCode: status8.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings,
    meta: result.meta
  });
});
var getAllBookings2 = catchAsync(async (req, res) => {
  const result = await bookingService.getAllBookings(req.query);
  sendResponse(res, {
    httpStatusCode: status8.OK,
    success: true,
    message: "All bookings retrieved successfully for admin",
    data: result
  });
});
var createReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const review = await bookingService.createReview(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status8.CREATED,
    success: true,
    message: "Review submitted successfully.",
    data: review
  });
});
var getMyReviews2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await bookingService.getMyReviews(user?.userId);
  sendResponse(res, {
    httpStatusCode: status8.OK,
    success: true,
    message: "My reviews fetched successfully",
    data: result
  });
});
var bookingControllers = {
  createBooking: createBooking2,
  updateBooking,
  getBookingById: getBookingById2,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  getAllBookings: getAllBookings2,
  createReview: createReview2,
  getMyReviews: getMyReviews2
};

// src/app/module/booking/booking.validation.ts
import { z as z2 } from "zod";
var timeRegex2 = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
var createBookingSchema = z2.object({
  body: z2.object({
    tutorId: z2.string({ message: "Tutor ID is required." }).uuid("Invalid tutor ID."),
    subjectId: z2.string({ message: "Subject ID is required." }).uuid("Invalid subject ID."),
    bookingDate: z2.string({ message: "Booking date is required." }).refine((val) => {
      const selectedDate = new Date(val);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, "Booking date cannot be in the past."),
    startTime: z2.string({ message: "Start time is required." }).regex(timeRegex2, "startTime must be HH:MM (24-hour)."),
    endTime: z2.string({ message: "End time is required." }).regex(timeRegex2, "endTime must be HH:MM (24-hour).")
  }).refine(
    (data) => data.startTime < data.endTime,
    { message: "startTime must be before endTime.", path: ["endTime"] }
  )
});
var updateBookingSchema = z2.object({
  body: z2.object({
    status: z2.enum(BookingStatus).optional(),
    meetingLink: z2.string({ message: "Meeting link is required." }).url("Must be a valid URL.").optional()
  }).refine(
    (data) => data.status !== void 0 || data.meetingLink !== void 0,
    { message: "Provide at least status or meetingLink." }
  )
});
var bookingQuerySchema = z2.object({
  query: z2.object({
    status: z2.enum(BookingStatus).optional(),
    page: z2.coerce.number().int().positive().default(1),
    limit: z2.coerce.number().int().min(1).max(50).default(10),
    searchTerm: z2.string().optional(),
    sortBy: z2.string().optional(),
    sortOrder: z2.enum(["asc", "desc"]).optional()
  })
});
var createReviewSchema = z2.object({
  body: z2.object({
    bookingId: z2.string().uuid("Invalid booking ID."),
    tutorId: z2.string().uuid("Invalid tutor ID."),
    rating: z2.number({ message: "Rating is required." }).int().min(1, "Minimum rating is 1.").max(5, "Maximum rating is 5."),
    comment: z2.string({ message: "Comment is required." }).min(10, "Comment must be at least 10 characters.").max(500, "Comment must not exceed 500 characters.")
    // Optional: adjust length constraints as needed
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
  "/student",
  checkAuth(UserRole.STUDENT),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsStudent
);
router3.get(
  "/tutor",
  checkAuth(UserRole.TUTOR),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsTutor
);
router3.get(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(bookingQuerySchema),
  bookingControllers.getAllBookings
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
  "/my-reviews/",
  checkAuth(UserRole.STUDENT),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyReviews
);
var BookingRoute = router3;

// src/app/module/admin/admin.route.ts
import { Router as Router4 } from "express";

// src/app/module/admin/admin.controller.ts
import httpStatus from "http-status";

// src/app/module/admin/admin.service.ts
import status9 from "http-status";
var getAllUsers = async (query) => {
  const searchableFields = ["name", "email"];
  const searchConditions = QueryHelper.search(query.searchTerm, searchableFields);
  const filterConditions = QueryHelper.filter(query);
  const { skip, take, page, limit, orderBy } = QueryHelper.paginateAndSort(query);
  const where = {
    ...searchConditions,
    ...filterConditions
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        tutorProfile: true
      }
    }),
    prisma.user.count({ where })
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    },
    data: users
  };
};
var updateUserStatus = async (userId, status15, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        status: status15
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user status of ${userId} to ${status15}`
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
  const averageRating = await prisma.tutorProfile.aggregate({
    _avg: {
      averageRating: true
    }
  });
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    averageRating
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
    throw new AppError_default(status9.BAD_REQUEST, "Failed to create admin user");
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
      throw new AppError_default(status9.NOT_FOUND, "User not found");
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
      throw new AppError_default(status9.NOT_FOUND, "Tutor not found");
    }
    if (user.role !== UserRole.TUTOR) {
      throw new AppError_default(status9.BAD_REQUEST, "User is not a tutor");
    }
    if (!user.tutorProfile) {
      throw new AppError_default(status9.BAD_REQUEST, "Tutor profile not found");
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
      throw new AppError_default(status9.NOT_FOUND, "Tutor not found");
    }
    if (user.role !== UserRole.TUTOR) {
      throw new AppError_default(status9.BAD_REQUEST, "User is not a tutor");
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
  const { status: status15 } = req.body;
  const adminId = req.user.userId;
  const result = await AdminService.updateUserStatus(id, status15, adminId);
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
  deleteSubject: deleteSubject2
};

// src/app/module/subject/subject.validation.ts
import { z as z4 } from "zod";
var createSubjectValidationSchema = z4.object({
  body: z4.object({
    name: z4.string().min(1, "Name is required"),
    category: z4.enum(SubjectCategory, {
      message: "Category is required"
    })
  })
});
var SubjectValidation = {
  createSubjectValidationSchema
};

// src/app/module/subject/subject.route.ts
var router5 = Router5();
router5.get("/", SubjectController.getAllSubjects);
router5.get("/:id", SubjectController.getSubjectById);
router5.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(SubjectValidation.createSubjectValidationSchema),
  SubjectController.createSubject
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
  checkAuth(UserRole.ADMIN),
  validateRequest(LanguageValidation.createLanguageValidationSchema),
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

// src/app/module/availability/availability.service.ts
import status10 from "http-status";
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
  const day = new Date(dateStr).getUTCDay();
  return DAY_ORDER[day];
};
var getTutorProfileId = async (userId) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError_default(status10.NOT_FOUND, "Tutor profile not found.");
  return profile.id;
};
var setAvailability = async (user, payload) => {
  const tutorId = await getTutorProfileId(user.userId);
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { tutorId } }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        tutorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive ?? true
      }))
    })
  ]);
  return getGroupedAvailability(tutorId);
};
var updateSlot = async (user, slotId, data) => {
  const tutorId = await getTutorProfileId(user.userId);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });
  if (!slot || slot.tutorId !== tutorId) {
    throw new AppError_default(status10.FORBIDDEN, "Access denied or slot not found.");
  }
  return await prisma.availability.update({
    where: { id: slotId },
    data: {
      ...data.startTime && { startTime: data.startTime },
      ...data.endTime && { endTime: data.endTime },
      ...data.isActive !== void 0 && { isActive: data.isActive }
    }
  });
};
var checkAvailability = async (payload) => {
  const { tutorId, bookingDate, startTime, endTime } = payload;
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
    return { available: false, reason: "Tutor is not available in this time slot." };
  }
  const existingBookings = await prisma.booking.findMany({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "ACCEPTED"] }
    }
  });
  for (const booking of existingBookings) {
    const bStart = new Date(booking.startTime).toISOString().substring(11, 16);
    const bEnd = new Date(booking.endTime).toISOString().substring(11, 16);
    if (overlaps(startTime, endTime, bStart, bEnd)) {
      return { available: false, reason: "Tutor is already booked at this time." };
    }
  }
  return { available: true, slot: coveringSlot };
};
var getMyAvailability = async (user) => {
  const tutorId = await getTutorProfileId(user.userId);
  return getGroupedAvailability(tutorId);
};
var getPublicAvailability = async (tutorProfileId) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorProfileId, isActive: true },
    orderBy: { startTime: "asc" }
  });
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day)
  }));
};
var deleteSlot = async (user, slotId) => {
  const tutorId = await getTutorProfileId(user.userId);
  await prisma.availability.delete({ where: { id: slotId, tutorId } });
  return { message: "Slot deleted." };
};
var getGroupedAvailability = async (tutorId) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId },
    orderBy: { startTime: "asc" }
  });
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day)
  }));
};
var availabilityService = {
  setAvailability,
  updateSlot,
  deleteSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability
};

// src/app/module/availability/availability.controller.ts
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
  updateSlot: updateSlot2,
  deleteSlot: deleteSlot2,
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
import { Router as Router8 } from "express";

// src/app/module/payment/payment.controller.ts
import status13 from "http-status";

// src/app/module/payment/payment.service.ts
import status12 from "http-status";
import Stripe from "stripe";
var stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10"
});
var initiateStripePayment = async (booking) => {
  const amountInCents = Math.round(Number(booking.totalPrice) * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: { bookingId: booking.id },
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
    update: { transactionId: paymentIntent.id }
  });
  return {
    gateway: "STRIPE",
    clientSecret: paymentIntent.client_secret,
    amount: Number(booking.totalPrice)
  };
};
var handleStripeWebhook = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new AppError_default(status12.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) {
      console.warn("Webhook: PaymentIntent missing bookingId in metadata", paymentIntent.id);
      return { success: true, message: "No action taken (missing bookingId)" };
    }
    const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;
    await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.PAID,
          transactionId: paymentIntent.id,
          // অটোমেটিক Stripe ID বসবে
          paymentMethod: "STRIPE_CARD"
        }
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.ACCEPTED,
          meetingLink
        }
      })
    ]);
    console.log(`\u2705 Stripe payment & Meeting Link auto-generated for: ${bookingId}`);
  }
  return { success: true, message: "Webhook processed" };
};
var submitManualPayment = async (studentId, payload) => {
  const { bookingId, transactionId, paymentMethod } = payload;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.studentId !== studentId) {
    throw new AppError_default(status12.FORBIDDEN, "Invalid booking or access denied.");
  }
  return await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId,
      // স্টুডেন্টের দেওয়া বিকাশ/নগদ TxID
      paymentMethod
    },
    update: { transactionId, status: PaymentStatus.PENDING }
  });
};
var approveManualPayment = async (bookingId, userId, role) => {
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;
  if (role === "TUTOR") {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tutor: true }
    });
    if (!booking || booking.tutor.userId !== userId) {
      throw new AppError_default(status12.FORBIDDEN, "You can only approve payments for your own bookings.");
    }
  }
  return await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.PAID }
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.ACCEPTED,
        meetingLink
      }
    })
  ]);
};
var getPaymentHistoryFromDB = async (userId, role) => {
  let whereCondition = {};
  if (role === "STUDENT") {
    whereCondition = {
      booking: {
        studentId: userId
        // বুকিং টেবিল থেকে স্টুডেন্ট আইডি ম্যাচ করবে
      }
    };
  } else if (role === "TUTOR") {
    whereCondition = {
      booking: {
        tutorId: userId
        // বুকিং টেবিল থেকে টিউটর আইডি ম্যাচ করবে
      },
      status: "PAID"
      // টিউটর সাধারণত শুধু সাকসেসফুল পেমেন্টগুলো দেখতে চায়
    };
  } else if (role === "ADMIN") {
    whereCondition = {};
  }
  const result = await prisma.payment.findMany({
    where: whereCondition,
    include: {
      booking: {
        include: {
          student: {
            select: { name: true, email: true }
          },
          tutor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return result;
};
var paymentService = {
  initiateStripePayment,
  handleStripeWebhook,
  submitManualPayment,
  approveManualPayment,
  getPaymentHistoryFromDB
};

// src/app/module/payment/payment.controller.ts
var initiatePayment = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.initiateStripePayment(req.body);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: "Stripe PaymentIntent created. Complete payment on frontend.",
    data: result
  });
});
var stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    res.status(status13.BAD_REQUEST).json({ success: false, message: "No signature." });
    return;
  }
  const result = await paymentService.handleStripeWebhook(req.body, signature);
  res.status(status13.OK).json(result);
});
var submitManualPayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.submitManualPayment(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: "Manual payment submitted. Waiting for admin approval.",
    data: result
  });
});
var approveManualPayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.approveManualPayment(req.params.bookingId, user.userId, user.role);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: "Payment approved and meeting link generated.",
    data: result
  });
});
var getPaymentHistory = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const result = await paymentService.getPaymentHistoryFromDB(userId, role);
    res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};
var paymentController = {
  initiatePayment,
  stripeWebhook,
  submitManualPayment: submitManualPayment2,
  approveManualPayment: approveManualPayment2,
  getPaymentHistory
};

// src/app/module/payment/payment.validation.ts
import { z as z7 } from "zod";
var initiatePaymentSchema = z7.object({
  body: z7.object({
    bookingId: z7.string({
      message: "Booking ID is required."
    }).uuid("Invalid booking ID format."),
    gateway: z7.enum(["STRIPE"], {
      message: "Gateway is required and must be STRIPE."
    })
  })
});
var manualPaymentSchema = z7.object({
  body: z7.object({
    bookingId: z7.string({
      message: "Booking ID is required."
    }).uuid("Invalid booking ID format."),
    transactionId: z7.string({
      message: "Transaction ID (TxID) is required."
    }).min(8, "Transaction ID is too short.").max(25, "Transaction ID is too long."),
    paymentMethod: z7.enum(["BKASH", "NAGAD", "ROCKET"], {
      message: "Payment method is required (BKASH, NAGAD, or ROCKET)."
    })
  })
});
var PaymentValidation = {
  initiatePaymentSchema,
  manualPaymentSchema
};

// src/app/module/payment/payment.route.ts
var router8 = Router8();
router8.post(
  "/webhook/stripe",
  paymentController.stripeWebhook
);
router8.post(
  "/initiate",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.initiatePaymentSchema),
  paymentController.initiatePayment
);
router8.post(
  "/submit-manual",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.manualPaymentSchema),
  // Zod Schema থাকতে হবে
  paymentController.submitManualPayment
);
router8.patch(
  "/approve/:bookingId",
  checkAuth(UserRole.ADMIN, UserRole.TUTOR),
  paymentController.approveManualPayment
);
router8.get(
  "/history",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  paymentController.getPaymentHistory
);
var PaymentRoutes = router8;

// src/app/module/student/student.route.ts
import express2 from "express";

// src/app/module/student/student.controller.ts
import status14 from "http-status";

// src/app/module/student/student.service.ts
var getStudentDashboardStatsFromDB = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required!");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false }
  });
  if (!user) {
    throw new Error("User not found!");
  }
  const [completedSessions, payments, reviews] = await prisma.$transaction([
    prisma.booking.findMany({
      where: {
        studentId: userId,
        // আপনার রিলেশনে studentId হিসেবে User ID ব্যবহার হচ্ছে
        status: "COMPLETED"
      },
      select: { startTime: true, endTime: true }
    }),
    prisma.payment.aggregate({
      where: {
        booking: { studentId: userId },
        status: "PAID"
      },
      _sum: { amount: true }
    }),
    prisma.review.aggregate({
      where: { studentId: userId },
      _avg: { rating: true }
    })
  ]);
  let totalMinutes = 0;
  completedSessions.forEach((session) => {
    try {
      const [startH, startM] = session.startTime.split(":").map(Number);
      const [endH, endM] = session.endTime.split(":").map(Number);
      totalMinutes += endH * 60 + endM - (startH * 60 + startM);
    } catch (e) {
      console.error("Time parsing error:", e);
    }
  });
  return {
    totalSessions: completedSessions.length,
    hoursLearned: `${Math.max(0, Math.floor(totalMinutes / 60))}h`,
    totalInvested: payments._sum.amount || 0,
    avgRating: Number((reviews._avg.rating || 0).toFixed(1))
  };
};
var updateProfileInDB = async (userId, payload) => {
  return await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: { id: true, name: true, image: true, email: true }
  });
};
var UserService = {
  getStudentDashboardStatsFromDB,
  updateProfileInDB
};

// src/app/module/student/student.controller.ts
var getStudentStats = catchAsync(async (req, res) => {
  const user = req.user;
  console.log(user);
  const result = await UserService.getStudentDashboardStatsFromDB(user?.userId);
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "Student stats fetched successfully.",
    data: result
  });
});
var updateProfile = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserService.updateProfileInDB(user.id, req.body);
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "Profile updated successfully.",
    data: result
  });
});
var UserController = {
  getStudentStats,
  updateProfile
};

// src/app/module/student/student.validation.ts
import { z as z8 } from "zod";
var updateProfileZodSchema = z8.object({
  body: z8.object({
    name: z8.string().min(3).optional(),
    image: z8.string().url().optional()
  })
});
var UserValidation = {
  updateProfileZodSchema
};

// src/app/module/student/student.route.ts
var router9 = express2.Router();
router9.get(
  "/student-stats",
  checkAuth(UserRole.STUDENT),
  UserController.getStudentStats
);
router9.patch(
  "/update-profile",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile
);
var UserRoutes = router9;

// src/app/module/ai/ai.routes.ts
import express3 from "express";

// src/app/module/ai/ai.service.ts
var getSearchSuggestions = async (query) => {
  const search = query.trim().toLowerCase();
  const subjects = await prisma.subject.findMany({
    where: {
      name: { contains: search, mode: "insensitive" }
    },
    select: {
      id: true,
      name: true
    },
    take: 5
  });
  const languages = await prisma.language.findMany({
    where: {
      name: { contains: search, mode: "insensitive" }
    },
    select: {
      id: true,
      name: true
    },
    take: 5
  });
  const tutors = await prisma.tutorProfile.findMany({
    where: {
      OR: [
        { bio: { contains: search, mode: "insensitive" } },
        {
          user: {
            name: { contains: search, mode: "insensitive" }
          }
        }
      ]
    },
    select: {
      id: true,
      bio: true,
      user: {
        select: {
          name: true
        }
      }
    },
    take: 5
  });
  return {
    subjects,
    languages,
    tutors
  };
};
var getRecommendedTutors = async (userId) => {
  const userBookings = await prisma.booking.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  const subjectIds = userBookings.map((b) => b.subjectId);
  const tutors = await prisma.tutorProfile.findMany({
    where: {
      subjects: {
        some: {
          subjectId: { in: subjectIds }
        }
      }
    },
    take: 6,
    include: {
      user: true,
      subjects: true,
      languages: true,
      _count: true
    }
  });
  return tutors;
};
var AIService = {
  getSearchSuggestions,
  getRecommendedTutors
};

// src/app/module/ai/ai.controller.ts
var getSuggestions = catchAsync(async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query is required"
    });
  }
  const data = await AIService.getSearchSuggestions(query);
  res.status(200).json({
    success: true,
    message: "Suggestions fetched successfully",
    data
  });
});
var getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
  const data = await AIService.getRecommendedTutors(userId);
  res.status(200).json({
    success: true,
    message: "Recommended tutors fetched successfully",
    data
  });
});

// src/app/module/ai/ai.routes.ts
var router10 = express3.Router();
router10.get("/suggestions", getSuggestions);
router10.get(
  "/recommendations",
  checkAuth(),
  // validateRequest(recommendationValidation),
  getRecommendations
);
var AIRoutes = router10;

// src/app/routes/index.ts
var router11 = Router9();
router11.use("/auth", AuthRoutes);
router11.use("/tutors", TutorRoutes);
router11.use("/users", UserRoutes);
router11.use("/bookings", BookingRoute);
router11.use("/admin", AdminRoutes);
router11.use("/subject", SubjectRoutes);
router11.use("/language", LanguageRoutes);
router11.use("/availability", AvailabilityRoutes);
router11.use("/payments", PaymentRoutes);
router11.use("/ai", AIRoutes);
var IndexRoutes = router11;

// src/app.ts
var app = express4();
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook/stripe") {
    express4.raw({ type: "application/json" })(req, res, next);
  } else {
    express4.json()(req, res, next);
  }
});
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
