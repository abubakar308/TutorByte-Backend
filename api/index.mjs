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
  "inlineSchema": 'model AdminLog {\n  id        String   @id @default(uuid())\n  adminId   String\n  action    String\n  createdAt DateTime @default(now())\n\n  admin User @relation("adminLogs", fields: [adminId], references: [id])\n}\n\nmodel User {\n  id                 String     @id @default(uuid())\n  name               String     @db.VarChar(255)\n  email              String     @unique\n  emailVerified      Boolean    @default(false)\n  image              String?\n  role               UserRole   @default(STUDENT)\n  needPasswordChange Boolean    @default(false)\n  isDeleted          Boolean    @default(false)\n  deletedAt          DateTime?\n  isVerified         Boolean    @default(false)\n  status             UserStatus @default(ACTIVE)\n  createdAt          DateTime   @default(now())\n  updatedAt          DateTime   @updatedAt\n\n  sessions Session[]\n  accounts Account[]\n\n  tutorProfile     TutorProfile?\n  reviews          Review[]       @relation("studentReviews")\n  bookings         Booking[]      @relation("studentBookings")\n  sentMessages     Message[]      @relation("sentMessages")\n  receivedMessages Message[]      @relation("receivedMessages")\n  notifications    Notification[]\n  adminLogs        AdminLog[]     @relation("adminLogs")\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id @default(uuid())\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Availability {\n  id        String    @id @default(uuid())\n  tutorId   String?\n  dayOfWeek DayOfWeek\n  startTime String\n  endTime   String\n  isActive  Boolean   @default(true)\n\n  tutor TutorProfile? @relation(fields: [tutorId], references: [id])\n\n  @@map("availability")\n}\n\nmodel Booking {\n  id          String        @id @default(uuid())\n  studentId   String\n  tutorId     String\n  subjectId   String\n  bookingDate DateTime\n  startTime   String\n  endTime     String\n  status      BookingStatus @default(PENDING)\n  totalPrice  Decimal       @db.Decimal(10, 2)\n  meetingLink String?\n  createdAt   DateTime      @default(now())\n\n  student User         @relation("studentBookings", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n  payment Payment?\n\n  @@map("bookings")\n}\n\nenum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  BLOCKED\n}\n\nenum SubjectCategory {\n  ACADEMIC\n  SKILLS\n  LANGUAGE\n}\n\nenum DayOfWeek {\n  SUN\n  MON\n  TUE\n  WED\n  THU\n  FRI\n  SAT\n}\n\nenum BookingStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel Language {\n  id   String @id @default(uuid())\n  name String @unique\n\n  tutors TutorLanguages[]\n}\n\nmodel Message {\n  id         String   @id @default(uuid())\n  senderId   String\n  receiverId String\n  message    String\n  isRead     Boolean\n  createdAt  DateTime @default(now())\n\n  sender   User @relation("sentMessages", fields: [senderId], references: [id])\n  receiver User @relation("receivedMessages", fields: [receiverId], references: [id])\n\n  @@map("messages")\n}\n\nmodel Notification {\n  id        String   @id @default(uuid())\n  userId    String\n  title     String\n  message   String\n  isRead    Boolean\n  createdAt DateTime @default(now())\n\n  user User @relation(fields: [userId], references: [id])\n\n  @@map("notifications")\n}\n\nmodel Payment {\n  id              String        @id @default(uuid())\n  bookingId       String        @unique\n  amount          Decimal       @db.Decimal(10, 2)\n  status          PaymentStatus @default(PENDING)\n  transactionId   String?       @unique\n  gatewayResponse Json?\n  paymentMethod   String? // "STRIPE", "SSLCOMMERZ", "BKASH"\n  createdAt       DateTime      @default(now())\n\n  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@map("payments")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  studentId String\n  tutorId   String\n  rating    Int\n  comment   String\n  createdAt DateTime @default(now())\n\n  student User         @relation("studentReviews", fields: [studentId], references: [id])\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Subject {\n  id       String          @id @default(uuid())\n  name     String          @unique\n  category SubjectCategory\n\n  tutors   TutorSubjects[]\n  bookings Booking[]\n\n  @@map("subjects")\n}\n\nmodel TutorLanguages {\n  id         String @id @default(uuid())\n  tutorId    String\n  languageId String\n\n  tutor    TutorProfile @relation(fields: [tutorId], references: [id])\n  language Language     @relation(fields: [languageId], references: [id])\n}\n\nmodel TutorProfile {\n  id              String   @id @default(uuid())\n  userId          String   @unique\n  bio             String?\n  experienceYears Int?\n  hourlyRate      Decimal  @db.Decimal(8, 2)\n  averageRating   Float?   @default(0.0)\n  totalReviews    Int\n  isApproved      Boolean\n  createdAt       DateTime @default(now())\n\n  user           User             @relation(fields: [userId], references: [id])\n  subjects       TutorSubjects[]\n  languages      TutorLanguages[]\n  availabilities Availability[]\n  reviews        Review[]\n  bookings       Booking[]\n\n  @@map("tutor_profiles")\n}\n\nmodel TutorSubjects {\n  id        String @id @default(uuid())\n  tutorId   String\n  subjectId String\n\n  tutor   TutorProfile @relation(fields: [tutorId], references: [id])\n  subject Subject      @relation(fields: [subjectId], references: [id])\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"AdminLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"admin","kind":"object","type":"User","relationName":"adminLogs"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"needPasswordChange","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"studentReviews"},{"name":"bookings","kind":"object","type":"Booking","relationName":"studentBookings"},{"name":"sentMessages","kind":"object","type":"Message","relationName":"sentMessages"},{"name":"receivedMessages","kind":"object","type":"Message","relationName":"receivedMessages"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"adminLogs","kind":"object","type":"AdminLog","relationName":"adminLogs"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Availability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"dayOfWeek","kind":"enum","type":"DayOfWeek"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"AvailabilityToTutorProfile"}],"dbName":"availability"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"bookingDate","kind":"scalar","type":"DateTime"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"totalPrice","kind":"scalar","type":"Decimal"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentBookings"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"subject","kind":"object","type":"Subject","relationName":"BookingToSubject"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"}],"dbName":"bookings"},"Language":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tutors","kind":"object","type":"TutorLanguages","relationName":"LanguageToTutorLanguages"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"receiverId","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"sender","kind":"object","type":"User","relationName":"sentMessages"},{"name":"receiver","kind":"object","type":"User","relationName":"receivedMessages"}],"dbName":"messages"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"gatewayResponse","kind":"scalar","type":"Json"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"}],"dbName":"payments"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentReviews"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"}],"dbName":"reviews"},"Subject":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"category","kind":"enum","type":"SubjectCategory"},{"name":"tutors","kind":"object","type":"TutorSubjects","relationName":"SubjectToTutorSubjects"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToSubject"}],"dbName":"subjects"},"TutorLanguages":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"languageId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorLanguagesToTutorProfile"},{"name":"language","kind":"object","type":"Language","relationName":"LanguageToTutorLanguages"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"experienceYears","kind":"scalar","type":"Int"},{"name":"hourlyRate","kind":"scalar","type":"Decimal"},{"name":"averageRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"subjects","kind":"object","type":"TutorSubjects","relationName":"TutorProfileToTutorSubjects"},{"name":"languages","kind":"object","type":"TutorLanguages","relationName":"TutorLanguagesToTutorProfile"},{"name":"availabilities","kind":"object","type":"Availability","relationName":"AvailabilityToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"}],"dbName":"tutor_profiles"},"TutorSubjects":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorProfileToTutorSubjects"},{"name":"subject","kind":"object","type":"Subject","relationName":"SubjectToTutorSubjects"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","tutor","tutors","student","subject","booking","payment","bookings","_count","subjects","language","languages","availabilities","reviews","tutorProfile","sender","receiver","sentMessages","receivedMessages","notifications","adminLogs","admin","AdminLog.findUnique","AdminLog.findUniqueOrThrow","AdminLog.findFirst","AdminLog.findFirstOrThrow","AdminLog.findMany","data","AdminLog.createOne","AdminLog.createMany","AdminLog.createManyAndReturn","AdminLog.updateOne","AdminLog.updateMany","AdminLog.updateManyAndReturn","create","update","AdminLog.upsertOne","AdminLog.deleteOne","AdminLog.deleteMany","having","_min","_max","AdminLog.groupBy","AdminLog.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Availability.findUnique","Availability.findUniqueOrThrow","Availability.findFirst","Availability.findFirstOrThrow","Availability.findMany","Availability.createOne","Availability.createMany","Availability.createManyAndReturn","Availability.updateOne","Availability.updateMany","Availability.updateManyAndReturn","Availability.upsertOne","Availability.deleteOne","Availability.deleteMany","Availability.groupBy","Availability.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","_avg","_sum","Booking.groupBy","Booking.aggregate","Language.findUnique","Language.findUniqueOrThrow","Language.findFirst","Language.findFirstOrThrow","Language.findMany","Language.createOne","Language.createMany","Language.createManyAndReturn","Language.updateOne","Language.updateMany","Language.updateManyAndReturn","Language.upsertOne","Language.deleteOne","Language.deleteMany","Language.groupBy","Language.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Subject.findUnique","Subject.findUniqueOrThrow","Subject.findFirst","Subject.findFirstOrThrow","Subject.findMany","Subject.createOne","Subject.createMany","Subject.createManyAndReturn","Subject.updateOne","Subject.updateMany","Subject.updateManyAndReturn","Subject.upsertOne","Subject.deleteOne","Subject.deleteMany","Subject.groupBy","Subject.aggregate","TutorLanguages.findUnique","TutorLanguages.findUniqueOrThrow","TutorLanguages.findFirst","TutorLanguages.findFirstOrThrow","TutorLanguages.findMany","TutorLanguages.createOne","TutorLanguages.createMany","TutorLanguages.createManyAndReturn","TutorLanguages.updateOne","TutorLanguages.updateMany","TutorLanguages.updateManyAndReturn","TutorLanguages.upsertOne","TutorLanguages.deleteOne","TutorLanguages.deleteMany","TutorLanguages.groupBy","TutorLanguages.aggregate","TutorProfile.findUnique","TutorProfile.findUniqueOrThrow","TutorProfile.findFirst","TutorProfile.findFirstOrThrow","TutorProfile.findMany","TutorProfile.createOne","TutorProfile.createMany","TutorProfile.createManyAndReturn","TutorProfile.updateOne","TutorProfile.updateMany","TutorProfile.updateManyAndReturn","TutorProfile.upsertOne","TutorProfile.deleteOne","TutorProfile.deleteMany","TutorProfile.groupBy","TutorProfile.aggregate","TutorSubjects.findUnique","TutorSubjects.findUniqueOrThrow","TutorSubjects.findFirst","TutorSubjects.findFirstOrThrow","TutorSubjects.findMany","TutorSubjects.createOne","TutorSubjects.createMany","TutorSubjects.createManyAndReturn","TutorSubjects.updateOne","TutorSubjects.updateMany","TutorSubjects.updateManyAndReturn","TutorSubjects.upsertOne","TutorSubjects.deleteOne","TutorSubjects.deleteMany","TutorSubjects.groupBy","TutorSubjects.aggregate","AND","OR","NOT","id","tutorId","subjectId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","userId","bio","experienceYears","hourlyRate","averageRating","totalReviews","isApproved","createdAt","every","some","none","languageId","name","SubjectCategory","category","studentId","rating","comment","bookingId","amount","PaymentStatus","status","transactionId","gatewayResponse","paymentMethod","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","title","message","isRead","senderId","receiverId","bookingDate","startTime","endTime","BookingStatus","totalPrice","meetingLink","DayOfWeek","dayOfWeek","isActive","identifier","value","expiresAt","updatedAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","image","UserRole","role","needPasswordChange","isDeleted","deletedAt","isVerified","UserStatus","adminId","action","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "6AeNAYACCBoAANkDACCjAgAAlwQAMKQCAAA6ABClAgAAlwQAMKYCAQAAAAG7AkAA2AMAIfsCAQDlAwAh_AIBAOUDACEBAAAAAQAgDAMAANkDACCjAgAApgQAMKQCAAADABClAgAApgQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeMCQADYAwAh5AJAANgDACHuAgEA5QMAIe8CAQDSAwAh8AIBANIDACEDAwAAlgUAIO8CAACvBAAg8AIAAK8EACAMAwAA2QMAIKMCAACmBAAwpAIAAAMAEKUCAACmBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHjAkAA2AMAIeQCQADYAwAh7gIBAAAAAe8CAQDSAwAh8AIBANIDACEDAAAAAwAgAQAABAAwAgAABQAgEQMAANkDACCjAgAApQQAMKQCAAAHABClAgAApQQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeQCQADYAwAh5QIBAOUDACHmAgEA5QMAIecCAQDSAwAh6AIBANIDACHpAgEA0gMAIeoCQACOBAAh6wJAAI4EACHsAgEA0gMAIe0CAQDSAwAhCAMAAJYFACDnAgAArwQAIOgCAACvBAAg6QIAAK8EACDqAgAArwQAIOsCAACvBAAg7AIAAK8EACDtAgAArwQAIBEDAADZAwAgowIAAKUEADCkAgAABwAQpQIAAKUEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIeQCQADYAwAh5QIBAOUDACHmAgEA5QMAIecCAQDSAwAh6AIBANIDACHpAgEA0gMAIeoCQACOBAAh6wJAAI4EACHsAgEA0gMAIe0CAQDSAwAhAwAAAAcAIAEAAAgAMAIAAAkAIBIDAADZAwAgDAAA3gMAIA4AANoDACAQAADbAwAgEQAA3AMAIBIAAN0DACCjAgAA0QMAMKQCAAALABClAgAA0QMAMKYCAQDlAwAhtAIBAOUDACG1AgEA0gMAIbYCAgDTAwAhtwIQANQDACG4AggA1QMAIbkCAgDWAwAhugIgANcDACG7AkAA2AMAIQEAAAALACAIBgAAmwQAIAkAAKIEACCjAgAApAQAMKQCAAANABClAgAApAQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIQIGAADzBgAgCQAA_QYAIAgGAACbBAAgCQAAogQAIKMCAACkBAAwpAIAAA0AEKUCAACkBAAwpgIBAAAAAacCAQDlAwAhqAIBAOUDACEDAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIBIGAACbBAAgCAAA2QMAIAkAAKIEACALAACjBAAgowIAAKAEADCkAgAAEgAQpQIAAKAEADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACG7AkAA2AMAIcMCAQDlAwAhyQIAAKEE3AIi2AJAANgDACHZAgEA5QMAIdoCAQDlAwAh3AIQANQDACHdAgEA0gMAIQUGAADzBgAgCAAAlgUAIAkAAP0GACALAAD-BgAg3QIAAK8EACASBgAAmwQAIAgAANkDACAJAACiBAAgCwAAowQAIKMCAACgBAAwpAIAABIAEKUCAACgBAAwpgIBAAAAAacCAQDlAwAhqAIBAOUDACG7AkAA2AMAIcMCAQDlAwAhyQIAAKEE3AIi2AJAANgDACHZAgEA5QMAIdoCAQDlAwAh3AIQANQDACHdAgEA0gMAIQMAAAASACABAAATADACAAAUACAMCgAA8QMAIKMCAADuAwAwpAIAABYAEKUCAADuAwAwpgIBAOUDACG7AkAA2AMAIcYCAQDlAwAhxwIQANQDACHJAgAA7wPJAiLKAgEA0gMAIcsCAADwAwAgzAIBANIDACEBAAAAFgAgAQAAAA0AIAEAAAASACAIBgAAmwQAIA8AAJ8EACCjAgAAngQAMKQCAAAaABClAgAAngQAMKYCAQDlAwAhpwIBAOUDACG_AgEA5QMAIQIGAADzBgAgDwAA_AYAIAgGAACbBAAgDwAAnwQAIKMCAACeBAAwpAIAABoAEKUCAACeBAAwpgIBAAAAAacCAQDlAwAhvwIBAOUDACEDAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAEAAAAaACAKBgAAkgQAIKMCAACcBAAwpAIAACAAEKUCAACcBAAwpgIBAOUDACGnAgEA0gMAIdkCAQDlAwAh2gIBAOUDACHfAgAAnQTfAiLgAiAA1wMAIQIGAADzBgAgpwIAAK8EACAKBgAAkgQAIKMCAACcBAAwpAIAACAAEKUCAACcBAAwpgIBAAAAAacCAQDSAwAh2QIBAOUDACHaAgEA5QMAId8CAACdBN8CIuACIADXAwAhAwAAACAAIAEAACEAMAIAACIAIAEAAAALACALBgAAmwQAIAgAANkDACCjAgAAmgQAMKQCAAAlABClAgAAmgQAMKYCAQDlAwAhpwIBAOUDACG7AkAA2AMAIcMCAQDlAwAhxAICANYDACHFAgEA5QMAIQIGAADzBgAgCAAAlgUAIAsGAACbBAAgCAAA2QMAIKMCAACaBAAwpAIAACUAEKUCAACaBAAwpgIBAAAAAacCAQDlAwAhuwJAANgDACHDAgEA5QMAIcQCAgDWAwAhxQIBAOUDACEDAAAAJQAgAQAAJgAwAgAAJwAgAwAAABIAIAEAABMAMAIAABQAIAEAAAANACABAAAAGgAgAQAAACAAIAEAAAAlACABAAAAEgAgAwAAACUAIAEAACYAMAIAACcAIAMAAAASACABAAATADACAAAUACALFAAA2QMAIBUAANkDACCjAgAAmQQAMKQCAAAxABClAgAAmQQAMKYCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQIUAACWBQAgFQAAlgUAIAsUAADZAwAgFQAA2QMAIKMCAACZBAAwpAIAADEAEKUCAACZBAAwpgIBAAAAAbsCQADYAwAh1AIBAOUDACHVAiAA1wMAIdYCAQDlAwAh1wIBAOUDACEDAAAAMQAgAQAAMgAwAgAAMwAgAwAAADEAIAEAADIAMAIAADMAIAoDAADZAwAgowIAAJgEADCkAgAANgAQpQIAAJgEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACEBAwAAlgUAIAoDAADZAwAgowIAAJgEADCkAgAANgAQpQIAAJgEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIdMCAQDlAwAh1AIBAOUDACHVAiAA1wMAIQMAAAA2ACABAAA3ADACAAA4ACAIGgAA2QMAIKMCAACXBAAwpAIAADoAEKUCAACXBAAwpgIBAOUDACG7AkAA2AMAIfsCAQDlAwAh_AIBAOUDACEBGgAAlgUAIAMAAAA6ACABAAA7ADACAAABACABAAAAAwAgAQAAAAcAIAEAAAAlACABAAAAEgAgAQAAADEAIAEAAAAxACABAAAANgAgAQAAADoAIAEAAAABACADAAAAOgAgAQAAOwAwAgAAAQAgAwAAADoAIAEAADsAMAIAAAEAIAMAAAA6ACABAAA7ADACAAABACAFGgAA-wYAIKYCAQAAAAG7AkAAAAAB-wIBAAAAAfwCAQAAAAEBIAAASQAgBKYCAQAAAAG7AkAAAAAB-wIBAAAAAfwCAQAAAAEBIAAASwAwASAAAEsAMAUaAAD6BgAgpgIBAKoEACG7AkAAuwQAIfsCAQCqBAAh_AIBAKoEACECAAAAAQAgIAAATgAgBKYCAQCqBAAhuwJAALsEACH7AgEAqgQAIfwCAQCqBAAhAgAAADoAICAAAFAAIAIAAAA6ACAgAABQACADAAAAAQAgJwAASQAgKAAATgAgAQAAAAEAIAEAAAA6ACADDQAA9wYAIC0AAPkGACAuAAD4BgAgB6MCAACWBAAwpAIAAFcAEKUCAACWBAAwpgIBALcDACG7AkAAwgMAIfsCAQC3AwAh_AIBALcDACEDAAAAOgAgAQAAVgAwLAAAVwAgAwAAADoAIAEAADsAMAIAAAEAIBkEAACQBAAgBQAAkQQAIAwAAN4DACASAADdAwAgEwAAkgQAIBYAAJMEACAXAACTBAAgGAAAlAQAIBkAAJUEACCjAgAAjAQAMKQCAABdABClAgAAjAQAMKYCAQAAAAG7AkAA2AMAIcACAQDlAwAhyQIAAI8E-wIi5AJAANgDACHxAgEAAAAB8gIgANcDACHzAgEA0gMAIfUCAACNBPUCIvYCIADXAwAh9wIgANcDACH4AkAAjgQAIfkCIADXAwAhAQAAAFoAIAEAAABaACAZBAAAkAQAIAUAAJEEACAMAADeAwAgEgAA3QMAIBMAAJIEACAWAACTBAAgFwAAkwQAIBgAAJQEACAZAACVBAAgowIAAIwEADCkAgAAXQAQpQIAAIwEADCmAgEA5QMAIbsCQADYAwAhwAIBAOUDACHJAgAAjwT7AiLkAkAA2AMAIfECAQDlAwAh8gIgANcDACHzAgEA0gMAIfUCAACNBPUCIvYCIADXAwAh9wIgANcDACH4AkAAjgQAIfkCIADXAwAhCwQAAPEGACAFAADyBgAgDAAAmwUAIBIAAJoFACATAADzBgAgFgAA9AYAIBcAAPQGACAYAAD1BgAgGQAA9gYAIPMCAACvBAAg-AIAAK8EACADAAAAXQAgAQAAXgAwAgAAWgAgAwAAAF0AIAEAAF4AMAIAAFoAIAMAAABdACABAABeADACAABaACAWBAAA6AYAIAUAAOkGACAMAADsBgAgEgAA6wYAIBMAAOoGACAWAADtBgAgFwAA7gYAIBgAAO8GACAZAADwBgAgpgIBAAAAAbsCQAAAAAHAAgEAAAAByQIAAAD7AgLkAkAAAAAB8QIBAAAAAfICIAAAAAHzAgEAAAAB9QIAAAD1AgL2AiAAAAAB9wIgAAAAAfgCQAAAAAH5AiAAAAABASAAAGIAIA2mAgEAAAABuwJAAAAAAcACAQAAAAHJAgAAAPsCAuQCQAAAAAHxAgEAAAAB8gIgAAAAAfMCAQAAAAH1AgAAAPUCAvYCIAAAAAH3AiAAAAAB-AJAAAAAAfkCIAAAAAEBIAAAZAAwASAAAGQAMBYEAACDBgAgBQAAhAYAIAwAAIcGACASAACGBgAgEwAAhQYAIBYAAIgGACAXAACJBgAgGAAAigYAIBkAAIsGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb7AiLkAkAAuwQAIfECAQCqBAAh8gIgALoEACHzAgEAtQQAIfUCAACBBvUCIvYCIAC6BAAh9wIgALoEACH4AkAA9gUAIfkCIAC6BAAhAgAAAFoAICAAAGcAIA2mAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb7AiLkAkAAuwQAIfECAQCqBAAh8gIgALoEACHzAgEAtQQAIfUCAACBBvUCIvYCIAC6BAAh9wIgALoEACH4AkAA9gUAIfkCIAC6BAAhAgAAAF0AICAAAGkAIAIAAABdACAgAABpACADAAAAWgAgJwAAYgAgKAAAZwAgAQAAAFoAIAEAAABdACAFDQAA_gUAIC0AAIAGACAuAAD_BQAg8wIAAK8EACD4AgAArwQAIBCjAgAAhQQAMKQCAABwABClAgAAhQQAMKYCAQC3AwAhuwJAAMIDACHAAgEAtwMAIckCAACHBPsCIuQCQADCAwAh8QIBALcDACHyAiAAwQMAIfMCAQC8AwAh9QIAAIYE9QIi9gIgAMEDACH3AiAAwQMAIfgCQACBBAAh-QIgAMEDACEDAAAAXQAgAQAAbwAwLAAAcAAgAwAAAF0AIAEAAF4AMAIAAFoAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCQMAAP0FACCmAgEAAAABtAIBAAAAAbsCQAAAAAHjAkAAAAAB5AJAAAAAAe4CAQAAAAHvAgEAAAAB8AIBAAAAAQEgAAB4ACAIpgIBAAAAAbQCAQAAAAG7AkAAAAAB4wJAAAAAAeQCQAAAAAHuAgEAAAAB7wIBAAAAAfACAQAAAAEBIAAAegAwASAAAHoAMAkDAAD8BQAgpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh4wJAALsEACHkAkAAuwQAIe4CAQCqBAAh7wIBALUEACHwAgEAtQQAIQIAAAAFACAgAAB9ACAIpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh4wJAALsEACHkAkAAuwQAIe4CAQCqBAAh7wIBALUEACHwAgEAtQQAIQIAAAADACAgAAB_ACACAAAAAwAgIAAAfwAgAwAAAAUAICcAAHgAICgAAH0AIAEAAAAFACABAAAAAwAgBQ0AAPkFACAtAAD7BQAgLgAA-gUAIO8CAACvBAAg8AIAAK8EACALowIAAIQEADCkAgAAhgEAEKUCAACEBAAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh4wJAAMIDACHkAkAAwgMAIe4CAQC3AwAh7wIBALwDACHwAgEAvAMAIQMAAAADACABAACFAQAwLAAAhgEAIAMAAAADACABAAAEADACAAAFACABAAAACQAgAQAAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIA4DAAD4BQAgpgIBAAAAAbQCAQAAAAG7AkAAAAAB5AJAAAAAAeUCAQAAAAHmAgEAAAAB5wIBAAAAAegCAQAAAAHpAgEAAAAB6gJAAAAAAesCQAAAAAHsAgEAAAAB7QIBAAAAAQEgAACOAQAgDaYCAQAAAAG0AgEAAAABuwJAAAAAAeQCQAAAAAHlAgEAAAAB5gIBAAAAAecCAQAAAAHoAgEAAAAB6QIBAAAAAeoCQAAAAAHrAkAAAAAB7AIBAAAAAe0CAQAAAAEBIAAAkAEAMAEgAACQAQAwDgMAAPcFACCmAgEAqgQAIbQCAQCqBAAhuwJAALsEACHkAkAAuwQAIeUCAQCqBAAh5gIBAKoEACHnAgEAtQQAIegCAQC1BAAh6QIBALUEACHqAkAA9gUAIesCQAD2BQAh7AIBALUEACHtAgEAtQQAIQIAAAAJACAgAACTAQAgDaYCAQCqBAAhtAIBAKoEACG7AkAAuwQAIeQCQAC7BAAh5QIBAKoEACHmAgEAqgQAIecCAQC1BAAh6AIBALUEACHpAgEAtQQAIeoCQAD2BQAh6wJAAPYFACHsAgEAtQQAIe0CAQC1BAAhAgAAAAcAICAAAJUBACACAAAABwAgIAAAlQEAIAMAAAAJACAnAACOAQAgKAAAkwEAIAEAAAAJACABAAAABwAgCg0AAPMFACAtAAD1BQAgLgAA9AUAIOcCAACvBAAg6AIAAK8EACDpAgAArwQAIOoCAACvBAAg6wIAAK8EACDsAgAArwQAIO0CAACvBAAgEKMCAACABAAwpAIAAJwBABClAgAAgAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeQCQADCAwAh5QIBALcDACHmAgEAtwMAIecCAQC8AwAh6AIBALwDACHpAgEAvAMAIeoCQACBBAAh6wJAAIEEACHsAgEAvAMAIe0CAQC8AwAhAwAAAAcAIAEAAJsBADAsAACcAQAgAwAAAAcAIAEAAAgAMAIAAAkAIAmjAgAA_wMAMKQCAACiAQAQpQIAAP8DADCmAgEAAAABuwJAANgDACHhAgEA5QMAIeICAQDlAwAh4wJAANgDACHkAkAA2AMAIQEAAACfAQAgAQAAAJ8BACAJowIAAP8DADCkAgAAogEAEKUCAAD_AwAwpgIBAOUDACG7AkAA2AMAIeECAQDlAwAh4gIBAOUDACHjAkAA2AMAIeQCQADYAwAhAAMAAACiAQAgAQAAowEAMAIAAJ8BACADAAAAogEAIAEAAKMBADACAACfAQAgAwAAAKIBACABAACjAQAwAgAAnwEAIAamAgEAAAABuwJAAAAAAeECAQAAAAHiAgEAAAAB4wJAAAAAAeQCQAAAAAEBIAAApwEAIAamAgEAAAABuwJAAAAAAeECAQAAAAHiAgEAAAAB4wJAAAAAAeQCQAAAAAEBIAAAqQEAMAEgAACpAQAwBqYCAQCqBAAhuwJAALsEACHhAgEAqgQAIeICAQCqBAAh4wJAALsEACHkAkAAuwQAIQIAAACfAQAgIAAArAEAIAamAgEAqgQAIbsCQAC7BAAh4QIBAKoEACHiAgEAqgQAIeMCQAC7BAAh5AJAALsEACECAAAAogEAICAAAK4BACACAAAAogEAICAAAK4BACADAAAAnwEAICcAAKcBACAoAACsAQAgAQAAAJ8BACABAAAAogEAIAMNAADwBQAgLQAA8gUAIC4AAPEFACAJowIAAP4DADCkAgAAtQEAEKUCAAD-AwAwpgIBALcDACG7AkAAwgMAIeECAQC3AwAh4gIBALcDACHjAkAAwgMAIeQCQADCAwAhAwAAAKIBACABAAC0AQAwLAAAtQEAIAMAAACiAQAgAQAAowEAMAIAAJ8BACABAAAAIgAgAQAAACIAIAMAAAAgACABAAAhADACAAAiACADAAAAIAAgAQAAIQAwAgAAIgAgAwAAACAAIAEAACEAMAIAACIAIAcGAADvBQAgpgIBAAAAAacCAQAAAAHZAgEAAAAB2gIBAAAAAd8CAAAA3wIC4AIgAAAAAQEgAAC9AQAgBqYCAQAAAAGnAgEAAAAB2QIBAAAAAdoCAQAAAAHfAgAAAN8CAuACIAAAAAEBIAAAvwEAMAEgAAC_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_AEAEKUCAAD0AwAwpgIBALcDACHAAgEAtwMAIQMAAADpAQAgAQAA-wEAMCwAAPwBACADAAAA6QEAIAEAAOoBADACAADmAQAgAQAAADMAIAEAAAAzACADAAAAMQAgAQAAMgAwAgAAMwAgAwAAADEAIAEAADIAMAIAADMAIAMAAAAxACABAAAyADACAAAzACAIFAAA1gUAIBUAANcFACCmAgEAAAABuwJAAAAAAdQCAQAAAAHVAiAAAAAB1gIBAAAAAdcCAQAAAAEBIAAAhAIAIAamAgEAAAABuwJAAAAAAdQCAQAAAAHVAiAAAAAB1gIBAAAAAdcCAQAAAAEBIAAAhgIAMAEgAACGAgAwCBQAANQFACAVAADVBQAgpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIdcCAQCqBAAhAgAAADMAICAAAIkCACAGpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIdcCAQCqBAAhAgAAADEAICAAAIsCACACAAAAMQAgIAAAiwIAIAMAAAAzACAnAACEAgAgKAAAiQIAIAEAAAAzACABAAAAMQAgAw0AANEFACAtAADTBQAgLgAA0gUAIAmjAgAA8wMAMKQCAACSAgAQpQIAAPMDADCmAgEAtwMAIbsCQADCAwAh1AIBALcDACHVAiAAwQMAIdYCAQC3AwAh1wIBALcDACEDAAAAMQAgAQAAkQIAMCwAAJICACADAAAAMQAgAQAAMgAwAgAAMwAgAQAAADgAIAEAAAA4ACADAAAANgAgAQAANwAwAgAAOAAgAwAAADYAIAEAADcAMAIAADgAIAMAAAA2ACABAAA3ADACAAA4ACAHAwAA0AUAIKYCAQAAAAG0AgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQEgAACaAgAgBqYCAQAAAAG0AgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQEgAACcAgAwASAAAJwCADAHAwAAzwUAIKYCAQCqBAAhtAIBAKoEACG7AkAAuwQAIdMCAQCqBAAh1AIBAKoEACHVAiAAugQAIQIAAAA4ACAgAACfAgAgBqYCAQCqBAAhtAIBAKoEACG7AkAAuwQAIdMCAQCqBAAh1AIBAKoEACHVAiAAugQAIQIAAAA2ACAgAAChAgAgAgAAADYAICAAAKECACADAAAAOAAgJwAAmgIAICgAAJ8CACABAAAAOAAgAQAAADYAIAMNAADMBQAgLQAAzgUAIC4AAM0FACAJowIAAPIDADCkAgAAqAIAEKUCAADyAwAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh0wIBALcDACHUAgEAtwMAIdUCIADBAwAhAwAAADYAIAEAAKcCADAsAACoAgAgAwAAADYAIAEAADcAMAIAADgAIAwKAADxAwAgowIAAO4DADCkAgAAFgAQpQIAAO4DADCmAgEAAAABuwJAANgDACHGAgEAAAABxwIQANQDACHJAgAA7wPJAiLKAgEAAAABywIAAPADACDMAgEA0gMAIQEAAACrAgAgAQAAAKsCACAECgAAywUAIMoCAACvBAAgywIAAK8EACDMAgAArwQAIAMAAAAWACABAACuAgAwAgAAqwIAIAMAAAAWACABAACuAgAwAgAAqwIAIAMAAAAWACABAACuAgAwAgAAqwIAIAkKAADKBQAgpgIBAAAAAbsCQAAAAAHGAgEAAAABxwIQAAAAAckCAAAAyQICygIBAAAAAcsCgAAAAAHMAgEAAAABASAAALICACAIpgIBAAAAAbsCQAAAAAHGAgEAAAABxwIQAAAAAckCAAAAyQICygIBAAAAAcsCgAAAAAHMAgEAAAABASAAALQCADABIAAAtAIAMAkKAADJBQAgpgIBAKoEACG7AkAAuwQAIcYCAQCqBAAhxwIQALcEACHJAgAA1gTJAiLKAgEAtQQAIcsCgAAAAAHMAgEAtQQAIQIAAACrAgAgIAAAtwIAIAimAgEAqgQAIbsCQAC7BAAhxgIBAKoEACHHAhAAtwQAIckCAADWBMkCIsoCAQC1BAAhywKAAAAAAcwCAQC1BAAhAgAAABYAICAAALkCACACAAAAFgAgIAAAuQIAIAMAAACrAgAgJwAAsgIAICgAALcCACABAAAAqwIAIAEAAAAWACAIDQAAxAUAIC0AAMcFACAuAADGBQAgjwEAAMUFACCQAQAAyAUAIMoCAACvBAAgywIAAK8EACDMAgAArwQAIAujAgAA6AMAMKQCAADAAgAQpQIAAOgDADCmAgEAtwMAIbsCQADCAwAhxgIBALcDACHHAhAAvgMAIckCAADpA8kCIsoCAQC8AwAhywIAAOoDACDMAgEAvAMAIQMAAAAWACABAAC_AgAwLAAAwAIAIAMAAAAWACABAACuAgAwAgAAqwIAIAEAAAAnACABAAAAJwAgAwAAACUAIAEAACYAMAIAACcAIAMAAAAlACABAAAmADACAAAnACADAAAAJQAgAQAAJgAwAgAAJwAgCAYAAMMFACAIAADoBAAgpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABASAAAMgCACAGpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABASAAAMoCADABIAAAygIAMAgGAADCBQAgCAAA5gQAIKYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcMCAQCqBAAhxAICALkEACHFAgEAqgQAIQIAAAAnACAgAADNAgAgBqYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcMCAQCqBAAhxAICALkEACHFAgEAqgQAIQIAAAAlACAgAADPAgAgAgAAACUAICAAAM8CACADAAAAJwAgJwAAyAIAICgAAM0CACABAAAAJwAgAQAAACUAIAUNAAC9BQAgLQAAwAUAIC4AAL8FACCPAQAAvgUAIJABAADBBQAgCaMCAADnAwAwpAIAANYCABClAgAA5wMAMKYCAQC3AwAhpwIBALcDACG7AkAAwgMAIcMCAQC3AwAhxAICAMADACHFAgEAtwMAIQMAAAAlACABAADVAgAwLAAA1gIAIAMAAAAlACABAAAmADACAAAnACAIBwAA2gMAIAwAAN4DACCjAgAA5AMAMKQCAADcAgAQpQIAAOQDADCmAgEAAAABwAIBAAAAAcICAADmA8ICIgEAAADZAgAgAQAAANkCACAIBwAA2gMAIAwAAN4DACCjAgAA5AMAMKQCAADcAgAQpQIAAOQDADCmAgEA5QMAIcACAQDlAwAhwgIAAOYDwgIiAgcAAJcFACAMAACbBQAgAwAAANwCACABAADdAgAwAgAA2QIAIAMAAADcAgAgAQAA3QIAMAIAANkCACADAAAA3AIAIAEAAN0CADACAADZAgAgBQcAALsFACAMAAC8BQAgpgIBAAAAAcACAQAAAAHCAgAAAMICAgEgAADhAgAgA6YCAQAAAAHAAgEAAAABwgIAAADCAgIBIAAA4wIAMAEgAADjAgAwBQcAAKUFACAMAACmBQAgpgIBAKoEACHAAgEAqgQAIcICAACkBcICIgIAAADZAgAgIAAA5gIAIAOmAgEAqgQAIcACAQCqBAAhwgIAAKQFwgIiAgAAANwCACAgAADoAgAgAgAAANwCACAgAADoAgAgAwAAANkCACAnAADhAgAgKAAA5gIAIAEAAADZAgAgAQAAANwCACADDQAAoQUAIC0AAKMFACAuAACiBQAgBqMCAADgAwAwpAIAAO8CABClAgAA4AMAMKYCAQC3AwAhwAIBALcDACHCAgAA4QPCAiIDAAAA3AIAIAEAAO4CADAsAADvAgAgAwAAANwCACABAADdAgAwAgAA2QIAIAEAAAAcACABAAAAHAAgAwAAABoAIAEAABsAMAIAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgBQYAAKAFACAPAACDBQAgpgIBAAAAAacCAQAAAAG_AgEAAAABASAAAPcCACADpgIBAAAAAacCAQAAAAG_AgEAAAABASAAAPkCADABIAAA-QIAMAUGAACfBQAgDwAAgQUAIKYCAQCqBAAhpwIBAKoEACG_AgEAqgQAIQIAAAAcACAgAAD8AgAgA6YCAQCqBAAhpwIBAKoEACG_AgEAqgQAIQIAAAAaACAgAAD-AgAgAgAAABoAICAAAP4CACADAAAAHAAgJwAA9wIAICgAAPwCACABAAAAHAAgAQAAABoAIAMNAACcBQAgLQAAngUAIC4AAJ0FACAGowIAAN8DADCkAgAAhQMAEKUCAADfAwAwpgIBALcDACGnAgEAtwMAIb8CAQC3AwAhAwAAABoAIAEAAIQDADAsAACFAwAgAwAAABoAIAEAABsAMAIAABwAIBIDAADZAwAgDAAA3gMAIA4AANoDACAQAADbAwAgEQAA3AMAIBIAAN0DACCjAgAA0QMAMKQCAAALABClAgAA0QMAMKYCAQAAAAG0AgEAAAABtQIBANIDACG2AgIA0wMAIbcCEADUAwAhuAIIANUDACG5AgIA1gMAIboCIADXAwAhuwJAANgDACEBAAAAiAMAIAEAAACIAwAgCQMAAJYFACAMAACbBQAgDgAAlwUAIBAAAJgFACARAACZBQAgEgAAmgUAILUCAACvBAAgtgIAAK8EACC4AgAArwQAIAMAAAALACABAACLAwAwAgAAiAMAIAMAAAALACABAACLAwAwAgAAiAMAIAMAAAALACABAACLAwAwAgAAiAMAIA8DAACQBQAgDAAAlQUAIA4AAJEFACAQAACSBQAgEQAAkwUAIBIAAJQFACCmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAEBIAAAjwMAIAmmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAEBIAAAkQMAMAEgAACRAwAwDwMAALwEACAMAADBBAAgDgAAvQQAIBAAAL4EACARAAC_BAAgEgAAwAQAIKYCAQCqBAAhtAIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQIAAACIAwAgIAAAlAMAIAmmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACECAAAACwAgIAAAlgMAIAIAAAALACAgAACWAwAgAwAAAIgDACAnAACPAwAgKAAAlAMAIAEAAACIAwAgAQAAAAsAIAgNAACwBAAgLQAAswQAIC4AALIEACCPAQAAsQQAIJABAAC0BAAgtQIAAK8EACC2AgAArwQAILgCAACvBAAgDKMCAAC7AwAwpAIAAJ0DABClAgAAuwMAMKYCAQC3AwAhtAIBALcDACG1AgEAvAMAIbYCAgC9AwAhtwIQAL4DACG4AggAvwMAIbkCAgDAAwAhugIgAMEDACG7AkAAwgMAIQMAAAALACABAACcAwAwLAAAnQMAIAMAAAALACABAACLAwAwAgAAiAMAIAEAAAAPACABAAAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAANACABAAAOADACAAAPACADAAAADQAgAQAADgAwAgAADwAgBQYAAK0EACAJAACuBAAgpgIBAAAAAacCAQAAAAGoAgEAAAABASAAAKUDACADpgIBAAAAAacCAQAAAAGoAgEAAAABASAAAKcDADABIAAApwMAMAUGAACrBAAgCQAArAQAIKYCAQCqBAAhpwIBAKoEACGoAgEAqgQAIQIAAAAPACAgAACqAwAgA6YCAQCqBAAhpwIBAKoEACGoAgEAqgQAIQIAAAANACAgAACsAwAgAgAAAA0AICAAAKwDACADAAAADwAgJwAApQMAICgAAKoDACABAAAADwAgAQAAAA0AIAMNAACnBAAgLQAAqQQAIC4AAKgEACAGowIAALYDADCkAgAAswMAEKUCAAC2AwAwpgIBALcDACGnAgEAtwMAIagCAQC3AwAhAwAAAA0AIAEAALIDADAsAACzAwAgAwAAAA0AIAEAAA4AMAIAAA8AIAajAgAAtgMAMKQCAACzAwAQpQIAALYDADCmAgEAtwMAIacCAQC3AwAhqAIBALcDACEODQAAuQMAIC0A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-QIgANcDACH9AgAAXQAg_gIAAF0AIAO8AgAADQAgvQIAAA0AIL4CAAANACADvAIAABoAIL0CAAAaACC-AgAAGgAgA7wCAAAgACC9AgAAIAAgvgIAACAAIAO8AgAAJQAgvQIAACUAIL4CAAAlACADvAIAABIAIL0CAAASACC-AgAAEgAgBqMCAADfAwAwpAIAAIUDABClAgAA3wMAMKYCAQC3AwAhpwIBALcDACG_AgEAtwMAIQajAgAA4AMAMKQCAADvAgAQpQIAAOADADCmAgEAtwMAIcACAQC3AwAhwgIAAOEDwgIiBw0AALkDACAtAADjAwAgLgAA4wMAIKkCAAAAwgICqgIAAADCAgirAgAAAMICCLMCAADiA8ICIgcNAAC5AwAgLQAA4wMAIC4AAOMDACCpAgAAAMICAqoCAAAAwgIIqwIAAADCAgizAgAA4gPCAiIEqQIAAADCAgKqAgAAAMICCKsCAAAAwgIIswIAAOMDwgIiCAcAANoDACAMAADeAwAgowIAAOQDADCkAgAA3AIAEKUCAADkAwAwpgIBAOUDACHAAgEA5QMAIcICAADmA8ICIgupAgEAAAABqgIBAAAABKsCAQAAAASsAgEAAAABrQIBAAAAAa4CAQAAAAGvAgEAAAABsAIBAAAAAbECAQAAAAGyAgEAAAABswIBALoDACEEqQIAAADCAgKqAgAAAMICCKsCAAAAwgIIswIAAOMDwgIiCaMCAADnAwAwpAIAANYCABClAgAA5wMAMKYCAQC3AwAhpwIBALcDACG7AkAAwgMAIcMCAQC3AwAhxAICAMADACHFAgEAtwMAIQujAgAA6AMAMKQCAADAAgAQpQIAAOgDADCmAgEAtwMAIbsCQADCAwAhxgIBALcDACHHAhAAvgMAIckCAADpA8kCIsoCAQC8AwAhywIAAOoDACDMAgEAvAMAIQcNAAC5AwAgLQAA7QMAIC4AAO0DACCpAgAAAMkCAqoCAAAAyQIIqwIAAADJAgizAgAA7APJAiIPDQAAygMAIC0AAOsDACAuAADrAwAgqQKAAAAAAawCgAAAAAGtAoAAAAABrgKAAAAAAa8CgAAAAAGzAoAAAAABzQIBAAAAAc4CAQAAAAHPAgEAAAAB0AKAAAAAAdECgAAAAAHSAoAAAAABDKkCgAAAAAGsAoAAAAABrQKAAAAAAa4CgAAAAAGvAoAAAAABswKAAAAAAc0CAQAAAAHOAgEAAAABzwIBAAAAAdACgAAAAAHRAoAAAAAB0gKAAAAAAQcNAAC5AwAgLQAA7QMAIC4AAO0DACCpAgAAAMkCAqoCAAAAyQIIqwIAAADJAgizAgAA7APJAiIEqQIAAADJAgKqAgAAAMkCCKsCAAAAyQIIswIAAO0DyQIiDAoAAPEDACCjAgAA7gMAMKQCAAAWABClAgAA7gMAMKYCAQDlAwAhuwJAANgDACHGAgEA5QMAIccCEADUAwAhyQIAAO8DyQIiygIBANIDACHLAgAA8AMAIMwCAQDSAwAhBKkCAAAAyQICqgIAAADJAgirAgAAAMkCCLMCAADtA8kCIgypAoAAAAABrAKAAAAAAa0CgAAAAAGuAoAAAAABrwKAAAAAAbMCgAAAAAHNAgEAAAABzgIBAAAAAc8CAQAAAAHQAoAAAAAB0QKAAAAAAdICgAAAAAEUBgAAmwQAIAgAANkDACAJAACiBAAgCwAAowQAIKMCAACgBAAwpAIAABIAEKUCAACgBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACH9AgAAEgAg_gIAABIAIAmjAgAA8gMAMKQCAACoAgAQpQIAAPIDADCmAgEAtwMAIbQCAQC3AwAhuwJAAMIDACHTAgEAtwMAIdQCAQC3AwAh1QIgAMEDACEJowIAAPMDADCkAgAAkgIAEKUCAADzAwAwpgIBALcDACG7AkAAwgMAIdQCAQC3AwAh1QIgAMEDACHWAgEAtwMAIdcCAQC3AwAhBaMCAAD0AwAwpAIAAPwBABClAgAA9AMAMKYCAQC3AwAhwAIBALcDACEGBwAA2wMAIKMCAAD1AwAwpAIAAOkBABClAgAA9QMAMKYCAQDlAwAhwAIBAOUDACEOowIAAPYDADCkAgAA4wEAEKUCAAD2AwAwpgIBALcDACGnAgEAtwMAIagCAQC3AwAhuwJAAMIDACHDAgEAtwMAIckCAAD3A9wCItgCQADCAwAh2QIBALcDACHaAgEAtwMAIdwCEAC-AwAh3QIBALwDACEHDQAAuQMAIC0AAPkDACAuAAD5AwAgqQIAAADcAgKqAgAAANwCCKsCAAAA3AIIswIAAPgD3AIiBw0AALkDACAtAAD5AwAgLgAA-QMAIKkCAAAA3AICqgIAAADcAgirAgAAANwCCLMCAAD4A9wCIgSpAgAAANwCAqoCAAAA3AIIqwIAAADcAgizAgAA-QPcAiIJowIAAPoDADCkAgAAzQEAEKUCAAD6AwAwpgIBALcDACGnAgEAvAMAIdkCAQC3AwAh2gIBALcDACHfAgAA-wPfAiLgAiAAwQMAIQcNAAC5AwAgLQAA_QMAIC4AAP0DACCpAgAAAN8CAqoCAAAA3wIIqwIAAADfAgizAgAA_APfAiIHDQAAuQMAIC0AAP0DACAuAAD9AwAgqQIAAADfAgKqAgAAAN8CCKsCAAAA3wIIswIAAPwD3wIiBKkCAAAA3wICqgIAAADfAgirAgAAAN8CCLMCAAD9A98CIgmjAgAA_gMAMKQCAAC1AQAQpQIAAP4DADCmAgEAtwMAIbsCQADCAwAh4QIBALcDACHiAgEAtwMAIeMCQADCAwAh5AJAAMIDACEJowIAAP8DADCkAgAAogEAEKUCAAD_AwAwpgIBAOUDACG7AkAA2AMAIeECAQDlAwAh4gIBAOUDACHjAkAA2AMAIeQCQADYAwAhEKMCAACABAAwpAIAAJwBABClAgAAgAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeQCQADCAwAh5QIBALcDACHmAgEAtwMAIecCAQC8AwAh6AIBALwDACHpAgEAvAMAIeoCQACBBAAh6wJAAIEEACHsAgEAvAMAIe0CAQC8AwAhCw0AAMoDACAtAACDBAAgLgAAgwQAIKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAAggQAIQsNAADKAwAgLQAAgwQAIC4AAIMEACCpAkAAAAABqgJAAAAABasCQAAAAAWsAkAAAAABrQJAAAAAAa4CQAAAAAGvAkAAAAABswJAAIIEACEIqQJAAAAAAaoCQAAAAAWrAkAAAAAFrAJAAAAAAa0CQAAAAAGuAkAAAAABrwJAAAAAAbMCQACDBAAhC6MCAACEBAAwpAIAAIYBABClAgAAhAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeMCQADCAwAh5AJAAMIDACHuAgEAtwMAIe8CAQC8AwAh8AIBALwDACEQowIAAIUEADCkAgAAcAAQpQIAAIUEADCmAgEAtwMAIbsCQADCAwAhwAIBALcDACHJAgAAhwT7AiLkAkAAwgMAIfECAQC3AwAh8gIgAMEDACHzAgEAvAMAIfUCAACGBPUCIvYCIADBAwAh9wIgAMEDACH4AkAAgQQAIfkCIADBAwAhBw0AALkDACAtAACLBAAgLgAAiwQAIKkCAAAA9QICqgIAAAD1AgirAgAAAPUCCLMCAACKBPUCIgcNAAC5AwAgLQAAiQQAIC4AAIkEACCpAgAAAPsCAqoCAAAA-wIIqwIAAAD7AgizAgAAiAT7AiIHDQAAuQMAIC0AAIkEACAuAACJBAAgqQIAAAD7AgKqAgAAAPsCCKsCAAAA-wIIswIAAIgE-wIiBKkCAAAA-wICqgIAAAD7AgirAgAAAPsCCLMCAACJBPsCIgcNAAC5AwAgLQAAiwQAIC4AAIsEACCpAgAAAPUCAqoCAAAA9QIIqwIAAAD1AgizAgAAigT1AiIEqQIAAAD1AgKqAgAAAPUCCKsCAAAA9QIIswIAAIsE9QIiGQQAAJAEACAFAACRBAAgDAAA3gMAIBIAAN0DACATAACSBAAgFgAAkwQAIBcAAJMEACAYAACUBAAgGQAAlQQAIKMCAACMBAAwpAIAAF0AEKUCAACMBAAwpgIBAOUDACG7AkAA2AMAIcACAQDlAwAhyQIAAI8E-wIi5AJAANgDACHxAgEA5QMAIfICIADXAwAh8wIBANIDACH1AgAAjQT1AiL2AiAA1wMAIfcCIADXAwAh-AJAAI4EACH5AiAA1wMAIQSpAgAAAPUCAqoCAAAA9QIIqwIAAAD1AgizAgAAiwT1AiIIqQJAAAAAAaoCQAAAAAWrAkAAAAAFrAJAAAAAAa0CQAAAAAGuAkAAAAABrwJAAAAAAbMCQACDBAAhBKkCAAAA-wICqgIAAAD7AgirAgAAAPsCCLMCAACJBPsCIgO8AgAAAwAgvQIAAAMAIL4CAAADACADvAIAAAcAIL0CAAAHACC-AgAABwAgFAMAANkDACAMAADeAwAgDgAA2gMAIBAAANsDACARAADcAwAgEgAA3QMAIKMCAADRAwAwpAIAAAsAEKUCAADRAwAwpgIBAOUDACG0AgEA5QMAIbUCAQDSAwAhtgICANMDACG3AhAA1AMAIbgCCADVAwAhuQICANYDACG6AiAA1wMAIbsCQADYAwAh_QIAAAsAIP4CAAALACADvAIAADEAIL0CAAAxACC-AgAAMQAgA7wCAAA2ACC9AgAANgAgvgIAADYAIAO8AgAAOgAgvQIAADoAIL4CAAA6ACAHowIAAJYEADCkAgAAVwAQpQIAAJYEADCmAgEAtwMAIbsCQADCAwAh-wIBALcDACH8AgEAtwMAIQgaAADZAwAgowIAAJcEADCkAgAAOgAQpQIAAJcEADCmAgEA5QMAIbsCQADYAwAh-wIBAOUDACH8AgEA5QMAIQoDAADZAwAgowIAAJgEADCkAgAANgAQpQIAAJgEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACELFAAA2QMAIBUAANkDACCjAgAAmQQAMKQCAAAxABClAgAAmQQAMKYCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQsGAACbBAAgCAAA2QMAIKMCAACaBAAwpAIAACUAEKUCAACaBAAwpgIBAOUDACGnAgEA5QMAIbsCQADYAwAhwwIBAOUDACHEAgIA1gMAIcUCAQDlAwAhFAMAANkDACAMAADeAwAgDgAA2gMAIBAAANsDACARAADcAwAgEgAA3QMAIKMCAADRAwAwpAIAAAsAEKUCAADRAwAwpgIBAOUDACG0AgEA5QMAIbUCAQDSAwAhtgICANMDACG3AhAA1AMAIbgCCADVAwAhuQICANYDACG6AiAA1wMAIbsCQADYAwAh_QIAAAsAIP4CAAALACAKBgAAkgQAIKMCAACcBAAwpAIAACAAEKUCAACcBAAwpgIBAOUDACGnAgEA0gMAIdkCAQDlAwAh2gIBAOUDACHfAgAAnQTfAiLgAiAA1wMAIQSpAgAAAN8CAqoCAAAA3wIIqwIAAADfAgizAgAA_QPfAiIIBgAAmwQAIA8AAJ8EACCjAgAAngQAMKQCAAAaABClAgAAngQAMKYCAQDlAwAhpwIBAOUDACG_AgEA5QMAIQgHAADbAwAgowIAAPUDADCkAgAA6QEAEKUCAAD1AwAwpgIBAOUDACHAAgEA5QMAIf0CAADpAQAg_gIAAOkBACASBgAAmwQAIAgAANkDACAJAACiBAAgCwAAowQAIKMCAACgBAAwpAIAABIAEKUCAACgBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACEEqQIAAADcAgKqAgAAANwCCKsCAAAA3AIIswIAAPkD3AIiCgcAANoDACAMAADeAwAgowIAAOQDADCkAgAA3AIAEKUCAADkAwAwpgIBAOUDACHAAgEA5QMAIcICAADmA8ICIv0CAADcAgAg_gIAANwCACAOCgAA8QMAIKMCAADuAwAwpAIAABYAEKUCAADuAwAwpgIBAOUDACG7AkAA2AMAIcYCAQDlAwAhxwIQANQDACHJAgAA7wPJAiLKAgEA0gMAIcsCAADwAwAgzAIBANIDACH9AgAAFgAg_gIAABYAIAgGAACbBAAgCQAAogQAIKMCAACkBAAwpAIAAA0AEKUCAACkBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhEQMAANkDACCjAgAApQQAMKQCAAAHABClAgAApQQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeQCQADYAwAh5QIBAOUDACHmAgEA5QMAIecCAQDSAwAh6AIBANIDACHpAgEA0gMAIeoCQACOBAAh6wJAAI4EACHsAgEA0gMAIe0CAQDSAwAhDAMAANkDACCjAgAApgQAMKQCAAADABClAgAApgQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeMCQADYAwAh5AJAANgDACHuAgEA5QMAIe8CAQDSAwAh8AIBANIDACEAAAABggMBAAAAAQUnAADhBwAgKAAA5wcAIP8CAADiBwAggAMAAOYHACCFAwAAiAMAIAUnAADfBwAgKAAA5AcAIP8CAADgBwAggAMAAOMHACCFAwAA2QIAIAMnAADhBwAg_wIAAOIHACCFAwAAiAMAIAMnAADfBwAg_wIAAOAHACCFAwAA2QIAIAAAAAAAAAGCAwEAAAABBYIDAgAAAAGIAwIAAAABiQMCAAAAAYoDAgAAAAGLAwIAAAABBYIDEAAAAAGIAxAAAAABiQMQAAAAAYoDEAAAAAGLAxAAAAABBYIDCAAAAAGIAwgAAAABiQMIAAAAAYoDCAAAAAGLAwgAAAABBYIDAgAAAAGIAwIAAAABiQMCAAAAAYoDAgAAAAGLAwIAAAABAYIDIAAAAAEBggNAAAAAAQUnAADBBwAgKAAA3QcAIP8CAADCBwAggAMAANwHACCFAwAAWgAgCycAAIQFADAoAACJBQAw_wIAAIUFADCAAwAAhgUAMIEDAACHBQAgggMAAIgFADCDAwAAiAUAMIQDAACIBQAwhQMAAIgFADCGAwAAigUAMIcDAACLBQAwCycAAPYEADAoAAD7BAAw_wIAAPcEADCAAwAA-AQAMIEDAAD5BAAgggMAAPoEADCDAwAA-gQAMIQDAAD6BAAwhQMAAPoEADCGAwAA_AQAMIcDAAD9BAAwCycAAOkEADAoAADuBAAw_wIAAOoEADCAAwAA6wQAMIEDAADsBAAgggMAAO0EADCDAwAA7QQAMIQDAADtBAAwhQMAAO0EADCGAwAA7wQAMIcDAADwBAAwCycAANsEADAoAADgBAAw_wIAANwEADCAAwAA3QQAMIEDAADeBAAgggMAAN8EADCDAwAA3wQAMIQDAADfBAAwhQMAAN8EADCGAwAA4QQAMIcDAADiBAAwCycAAMIEADAoAADHBAAw_wIAAMMEADCAAwAAxAQAMIEDAADFBAAgggMAAMYEADCDAwAAxgQAMIQDAADGBAAwhQMAAMYEADCGAwAAyAQAMIcDAADJBAAwDQgAANgEACAJAADZBAAgCwAA2gQAIKYCAQAAAAGoAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAABAgAAABQAICcAANcEACADAAAAFAAgJwAA1wQAICgAAM0EACABIAAA2wcAMBIGAACbBAAgCAAA2QMAIAkAAKIEACALAACjBAAgowIAAKAEADCkAgAAEgAQpQIAAKAEADCmAgEAAAABpwIBAOUDACGoAgEA5QMAIbsCQADYAwAhwwIBAOUDACHJAgAAoQTcAiLYAkAA2AMAIdkCAQDlAwAh2gIBAOUDACHcAhAA1AMAId0CAQDSAwAhAgAAABQAICAAAM0EACACAAAAygQAICAAAMsEACAOowIAAMkEADCkAgAAygQAEKUCAADJBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACEOowIAAMkEADCkAgAAygQAEKUCAADJBAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHDAgEA5QMAIckCAAChBNwCItgCQADYAwAh2QIBAOUDACHaAgEA5QMAIdwCEADUAwAh3QIBANIDACEKpgIBAKoEACGoAgEAqgQAIbsCQAC7BAAhwwIBAKoEACHJAgAAzATcAiLYAkAAuwQAIdkCAQCqBAAh2gIBAKoEACHcAhAAtwQAId0CAQC1BAAhAYIDAAAA3AICDQgAAM4EACAJAADPBAAgCwAA0AQAIKYCAQCqBAAhqAIBAKoEACG7AkAAuwQAIcMCAQCqBAAhyQIAAMwE3AIi2AJAALsEACHZAgEAqgQAIdoCAQCqBAAh3AIQALcEACHdAgEAtQQAIQUnAADTBwAgKAAA2QcAIP8CAADUBwAggAMAANgHACCFAwAAWgAgBScAANEHACAoAADWBwAg_wIAANIHACCAAwAA1QcAIIUDAADZAgAgBycAANEEACAoAADUBAAg_wIAANIEACCAAwAA0wQAIIMDAAAWACCEAwAAFgAghQMAAKsCACAHpgIBAAAAAbsCQAAAAAHHAhAAAAAByQIAAADJAgLKAgEAAAABywKAAAAAAcwCAQAAAAECAAAAqwIAICcAANEEACADAAAAFgAgJwAA0QQAICgAANUEACAJAAAAFgAgIAAA1QQAIKYCAQCqBAAhuwJAALsEACHHAhAAtwQAIckCAADWBMkCIsoCAQC1BAAhywKAAAAAAcwCAQC1BAAhB6YCAQCqBAAhuwJAALsEACHHAhAAtwQAIckCAADWBMkCIsoCAQC1BAAhywKAAAAAAcwCAQC1BAAhAYIDAAAAyQICDQgAANgEACAJAADZBAAgCwAA2gQAIKYCAQAAAAGoAgEAAAABuwJAAAAAAcMCAQAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAABAycAANMHACD_AgAA1AcAIIUDAABaACADJwAA0QcAIP8CAADSBwAghQMAANkCACADJwAA0QQAIP8CAADSBAAghQMAAKsCACAGCAAA6AQAIKYCAQAAAAG7AkAAAAABwwIBAAAAAcQCAgAAAAHFAgEAAAABAgAAACcAICcAAOcEACADAAAAJwAgJwAA5wQAICgAAOUEACABIAAA0AcAMAsGAACbBAAgCAAA2QMAIKMCAACaBAAwpAIAACUAEKUCAACaBAAwpgIBAAAAAacCAQDlAwAhuwJAANgDACHDAgEA5QMAIcQCAgDWAwAhxQIBAOUDACECAAAAJwAgIAAA5QQAIAIAAADjBAAgIAAA5AQAIAmjAgAA4gQAMKQCAADjBAAQpQIAAOIEADCmAgEA5QMAIacCAQDlAwAhuwJAANgDACHDAgEA5QMAIcQCAgDWAwAhxQIBAOUDACEJowIAAOIEADCkAgAA4wQAEKUCAADiBAAwpgIBAOUDACGnAgEA5QMAIbsCQADYAwAhwwIBAOUDACHEAgIA1gMAIcUCAQDlAwAhBaYCAQCqBAAhuwJAALsEACHDAgEAqgQAIcQCAgC5BAAhxQIBAKoEACEGCAAA5gQAIKYCAQCqBAAhuwJAALsEACHDAgEAqgQAIcQCAgC5BAAhxQIBAKoEACEFJwAAywcAICgAAM4HACD_AgAAzAcAIIADAADNBwAghQMAAFoAIAYIAADoBAAgpgIBAAAAAbsCQAAAAAHDAgEAAAABxAICAAAAAcUCAQAAAAEDJwAAywcAIP8CAADMBwAghQMAAFoAIAWmAgEAAAAB2QIBAAAAAdoCAQAAAAHfAgAAAN8CAuACIAAAAAECAAAAIgAgJwAA9QQAIAMAAAAiACAnAAD1BAAgKAAA9AQAIAEgAADKBwAwCgYAAJIEACCjAgAAnAQAMKQCAAAgABClAgAAnAQAMKYCAQAAAAGnAgEA0gMAIdkCAQDlAwAh2gIBAOUDACHfAgAAnQTfAiLgAiAA1wMAIQIAAAAiACAgAAD0BAAgAgAAAPEEACAgAADyBAAgCaMCAADwBAAwpAIAAPEEABClAgAA8AQAMKYCAQDlAwAhpwIBANIDACHZAgEA5QMAIdoCAQDlAwAh3wIAAJ0E3wIi4AIgANcDACEJowIAAPAEADCkAgAA8QQAEKUCAADwBAAwpgIBAOUDACGnAgEA0gMAIdkCAQDlAwAh2gIBAOUDACHfAgAAnQTfAiLgAiAA1wMAIQWmAgEAqgQAIdkCAQCqBAAh2gIBAKoEACHfAgAA8wTfAiLgAiAAugQAIQGCAwAAAN8CAgWmAgEAqgQAIdkCAQCqBAAh2gIBAKoEACHfAgAA8wTfAiLgAiAAugQAIQWmAgEAAAAB2QIBAAAAAdoCAQAAAAHfAgAAAN8CAuACIAAAAAEDDwAAgwUAIKYCAQAAAAG_AgEAAAABAgAAABwAICcAAIIFACADAAAAHAAgJwAAggUAICgAAIAFACABIAAAyQcAMAgGAACbBAAgDwAAnwQAIKMCAACeBAAwpAIAABoAEKUCAACeBAAwpgIBAAAAAacCAQDlAwAhvwIBAOUDACECAAAAHAAgIAAAgAUAIAIAAAD-BAAgIAAA_wQAIAajAgAA_QQAMKQCAAD-BAAQpQIAAP0EADCmAgEA5QMAIacCAQDlAwAhvwIBAOUDACEGowIAAP0EADCkAgAA_gQAEKUCAAD9BAAwpgIBAOUDACGnAgEA5QMAIb8CAQDlAwAhAqYCAQCqBAAhvwIBAKoEACEDDwAAgQUAIKYCAQCqBAAhvwIBAKoEACEFJwAAxAcAICgAAMcHACD_AgAAxQcAIIADAADGBwAghQMAAOYBACADDwAAgwUAIKYCAQAAAAG_AgEAAAABAycAAMQHACD_AgAAxQcAIIUDAADmAQAgAwkAAK4EACCmAgEAAAABqAIBAAAAAQIAAAAPACAnAACPBQAgAwAAAA8AICcAAI8FACAoAACOBQAgASAAAMMHADAIBgAAmwQAIAkAAKIEACCjAgAApAQAMKQCAAANABClAgAApAQAMKYCAQAAAAGnAgEA5QMAIagCAQDlAwAhAgAAAA8AICAAAI4FACACAAAAjAUAICAAAI0FACAGowIAAIsFADCkAgAAjAUAEKUCAACLBQAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhBqMCAACLBQAwpAIAAIwFABClAgAAiwUAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIQKmAgEAqgQAIagCAQCqBAAhAwkAAKwEACCmAgEAqgQAIagCAQCqBAAhAwkAAK4EACCmAgEAAAABqAIBAAAAAQMnAADBBwAg_wIAAMIHACCFAwAAWgAgBCcAAIQFADD_AgAAhQUAMIEDAACHBQAghQMAAIgFADAEJwAA9gQAMP8CAAD3BAAwgQMAAPkEACCFAwAA-gQAMAQnAADpBAAw_wIAAOoEADCBAwAA7AQAIIUDAADtBAAwBCcAANsEADD_AgAA3AQAMIEDAADeBAAghQMAAN8EADAEJwAAwgQAMP8CAADDBAAwgQMAAMUEACCFAwAAxgQAMAsEAADxBgAgBQAA8gYAIAwAAJsFACASAACaBQAgEwAA8wYAIBYAAPQGACAXAAD0BgAgGAAA9QYAIBkAAPYGACDzAgAArwQAIPgCAACvBAAgAAAAAAAAAAAFJwAAvAcAICgAAL8HACD_AgAAvQcAIIADAAC-BwAghQMAAIgDACADJwAAvAcAIP8CAAC9BwAghQMAAIgDACAAAAABggMAAADCAgILJwAAsgUAMCgAALYFADD_AgAAswUAMIADAAC0BQAwgQMAALUFACCCAwAAiAUAMIMDAACIBQAwhAMAAIgFADCFAwAAiAUAMIYDAAC3BQAwhwMAAIsFADALJwAApwUAMCgAAKsFADD_AgAAqAUAMIADAACpBQAwgQMAAKoFACCCAwAAxgQAMIMDAADGBAAwhAMAAMYEADCFAwAAxgQAMIYDAACsBQAwhwMAAMkEADANBgAAsQUAIAgAANgEACALAADaBAAgpgIBAAAAAacCAQAAAAG7AkAAAAABwwIBAAAAAckCAAAA3AIC2AJAAAAAAdkCAQAAAAHaAgEAAAAB3AIQAAAAAd0CAQAAAAECAAAAFAAgJwAAsAUAIAMAAAAUACAnAACwBQAgKAAArgUAIAEgAAC7BwAwAgAAABQAICAAAK4FACACAAAAygQAICAAAK0FACAKpgIBAKoEACGnAgEAqgQAIbsCQAC7BAAhwwIBAKoEACHJAgAAzATcAiLYAkAAuwQAIdkCAQCqBAAh2gIBAKoEACHcAhAAtwQAId0CAQC1BAAhDQYAAK8FACAIAADOBAAgCwAA0AQAIKYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcMCAQCqBAAhyQIAAMwE3AIi2AJAALsEACHZAgEAqgQAIdoCAQCqBAAh3AIQALcEACHdAgEAtQQAIQUnAAC2BwAgKAAAuQcAIP8CAAC3BwAggAMAALgHACCFAwAAiAMAIA0GAACxBQAgCAAA2AQAIAsAANoEACCmAgEAAAABpwIBAAAAAbsCQAAAAAHDAgEAAAAByQIAAADcAgLYAkAAAAAB2QIBAAAAAdoCAQAAAAHcAhAAAAAB3QIBAAAAAQMnAAC2BwAg_wIAALcHACCFAwAAiAMAIAMGAACtBAAgpgIBAAAAAacCAQAAAAECAAAADwAgJwAAugUAIAMAAAAPACAnAAC6BQAgKAAAuQUAIAEgAAC1BwAwAgAAAA8AICAAALkFACACAAAAjAUAICAAALgFACACpgIBAKoEACGnAgEAqgQAIQMGAACrBAAgpgIBAKoEACGnAgEAqgQAIQMGAACtBAAgpgIBAAAAAacCAQAAAAEEJwAAsgUAMP8CAACzBQAwgQMAALUFACCFAwAAiAUAMAQnAACnBQAw_wIAAKgFADCBAwAAqgUAIIUDAADGBAAwAAAAAAAFJwAAsAcAICgAALMHACD_AgAAsQcAIIADAACyBwAghQMAAIgDACADJwAAsAcAIP8CAACxBwAghQMAAIgDACAAAAAAAAUnAACrBwAgKAAArgcAIP8CAACsBwAggAMAAK0HACCFAwAAFAAgAycAAKsHACD_AgAArAcAIIUDAAAUACAFBgAA8wYAIAgAAJYFACAJAAD9BgAgCwAA_gYAIN0CAACvBAAgAAAABScAAKYHACAoAACpBwAg_wIAAKcHACCAAwAAqAcAIIUDAABaACADJwAApgcAIP8CAACnBwAghQMAAFoAIAAAAAUnAACeBwAgKAAApAcAIP8CAACfBwAggAMAAKMHACCFAwAAWgAgBScAAJwHACAoAAChBwAg_wIAAJ0HACCAAwAAoAcAIIUDAABaACADJwAAngcAIP8CAACfBwAghQMAAFoAIAMnAACcBwAg_wIAAJ0HACCFAwAAWgAgAAAACycAANwFADAoAADgBQAw_wIAAN0FADCAAwAA3gUAMIEDAADfBQAgggMAAPoEADCDAwAA-gQAMIQDAAD6BAAwhQMAAPoEADCGAwAA4QUAMIcDAAD9BAAwAwYAAKAFACCmAgEAAAABpwIBAAAAAQIAAAAcACAnAADkBQAgAwAAABwAICcAAOQFACAoAADjBQAgASAAAJsHADACAAAAHAAgIAAA4wUAIAIAAAD-BAAgIAAA4gUAIAKmAgEAqgQAIacCAQCqBAAhAwYAAJ8FACCmAgEAqgQAIacCAQCqBAAhAwYAAKAFACCmAgEAAAABpwIBAAAAAQQnAADcBQAw_wIAAN0FADCBAwAA3wUAIIUDAAD6BAAwAAAAAAAAAAAHJwAAlgcAICgAAJkHACD_AgAAlwcAIIADAACYBwAggwMAAAsAIIQDAAALACCFAwAAiAMAIAMnAACWBwAg_wIAAJcHACCFAwAAiAMAIAAAAAAAAAGCA0AAAAABBScAAJEHACAoAACUBwAg_wIAAJIHACCAAwAAkwcAIIUDAABaACADJwAAkQcAIP8CAACSBwAghQMAAFoAIAAAAAUnAACMBwAgKAAAjwcAIP8CAACNBwAggAMAAI4HACCFAwAAWgAgAycAAIwHACD_AgAAjQcAIIUDAABaACAAAAABggMAAAD1AgIBggMAAAD7AgILJwAA3AYAMCgAAOEGADD_AgAA3QYAMIADAADeBgAwgQMAAN8GACCCAwAA4AYAMIMDAADgBgAwhAMAAOAGADCFAwAA4AYAMIYDAADiBgAwhwMAAOMGADALJwAA0AYAMCgAANUGADD_AgAA0QYAMIADAADSBgAwgQMAANMGACCCAwAA1AYAMIMDAADUBgAwhAMAANQGADCFAwAA1AYAMIYDAADWBgAwhwMAANcGADAHJwAAywYAICgAAM4GACD_AgAAzAYAIIADAADNBgAggwMAAAsAIIQDAAALACCFAwAAiAMAIAsnAADCBgAwKAAAxgYAMP8CAADDBgAwgAMAAMQGADCBAwAAxQYAIIIDAADfBAAwgwMAAN8EADCEAwAA3wQAMIUDAADfBAAwhgMAAMcGADCHAwAA4gQAMAsnAAC5BgAwKAAAvQYAMP8CAAC6BgAwgAMAALsGADCBAwAAvAYAIIIDAADGBAAwgwMAAMYEADCEAwAAxgQAMIUDAADGBAAwhgMAAL4GADCHAwAAyQQAMAsnAACwBgAwKAAAtAYAMP8CAACxBgAwgAMAALIGADCBAwAAswYAIIIDAACoBgAwgwMAAKgGADCEAwAAqAYAMIUDAACoBgAwhgMAALUGADCHAwAAqwYAMAsnAACkBgAwKAAAqQYAMP8CAAClBgAwgAMAAKYGADCBAwAApwYAIIIDAACoBgAwgwMAAKgGADCEAwAAqAYAMIUDAACoBgAwhgMAAKoGADCHAwAAqwYAMAsnAACYBgAwKAAAnQYAMP8CAACZBgAwgAMAAJoGADCBAwAAmwYAIIIDAACcBgAwgwMAAJwGADCEAwAAnAYAMIUDAACcBgAwhgMAAJ4GADCHAwAAnwYAMAsnAACMBgAwKAAAkQYAMP8CAACNBgAwgAMAAI4GADCBAwAAjwYAIIIDAACQBgAwgwMAAJAGADCEAwAAkAYAMIUDAACQBgAwhgMAAJIGADCHAwAAkwYAMAOmAgEAAAABuwJAAAAAAfwCAQAAAAECAAAAAQAgJwAAlwYAIAMAAAABACAnAACXBgAgKAAAlgYAIAEgAACLBwAwCBoAANkDACCjAgAAlwQAMKQCAAA6ABClAgAAlwQAMKYCAQAAAAG7AkAA2AMAIfsCAQDlAwAh_AIBAOUDACECAAAAAQAgIAAAlgYAIAIAAACUBgAgIAAAlQYAIAejAgAAkwYAMKQCAACUBgAQpQIAAJMGADCmAgEA5QMAIbsCQADYAwAh-wIBAOUDACH8AgEA5QMAIQejAgAAkwYAMKQCAACUBgAQpQIAAJMGADCmAgEA5QMAIbsCQADYAwAh-wIBAOUDACH8AgEA5QMAIQOmAgEAqgQAIbsCQAC7BAAh_AIBAKoEACEDpgIBAKoEACG7AkAAuwQAIfwCAQCqBAAhA6YCAQAAAAG7AkAAAAAB_AIBAAAAAQWmAgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQIAAAA4ACAnAACjBgAgAwAAADgAICcAAKMGACAoAACiBgAgASAAAIoHADAKAwAA2QMAIKMCAACYBAAwpAIAADYAEKUCAACYBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACECAAAAOAAgIAAAogYAIAIAAACgBgAgIAAAoQYAIAmjAgAAnwYAMKQCAACgBgAQpQIAAJ8GADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHTAgEA5QMAIdQCAQDlAwAh1QIgANcDACEJowIAAJ8GADCkAgAAoAYAEKUCAACfBgAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh0wIBAOUDACHUAgEA5QMAIdUCIADXAwAhBaYCAQCqBAAhuwJAALsEACHTAgEAqgQAIdQCAQCqBAAh1QIgALoEACEFpgIBAKoEACG7AkAAuwQAIdMCAQCqBAAh1AIBAKoEACHVAiAAugQAIQWmAgEAAAABuwJAAAAAAdMCAQAAAAHUAgEAAAAB1QIgAAAAAQYUAADWBQAgpgIBAAAAAbsCQAAAAAHUAgEAAAAB1QIgAAAAAdYCAQAAAAECAAAAMwAgJwAArwYAIAMAAAAzACAnAACvBgAgKAAArgYAIAEgAACJBwAwCxQAANkDACAVAADZAwAgowIAAJkEADCkAgAAMQAQpQIAAJkEADCmAgEAAAABuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQIAAAAzACAgAACuBgAgAgAAAKwGACAgAACtBgAgCaMCAACrBgAwpAIAAKwGABClAgAAqwYAMKYCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCIADXAwAh1gIBAOUDACHXAgEA5QMAIQmjAgAAqwYAMKQCAACsBgAQpQIAAKsGADCmAgEA5QMAIbsCQADYAwAh1AIBAOUDACHVAiAA1wMAIdYCAQDlAwAh1wIBAOUDACEFpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIQYUAADUBQAgpgIBAKoEACG7AkAAuwQAIdQCAQCqBAAh1QIgALoEACHWAgEAqgQAIQYUAADWBQAgpgIBAAAAAbsCQAAAAAHUAgEAAAAB1QIgAAAAAdYCAQAAAAEGFQAA1wUAIKYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHXAgEAAAABAgAAADMAICcAALgGACADAAAAMwAgJwAAuAYAICgAALcGACABIAAAiAcAMAIAAAAzACAgAAC3BgAgAgAAAKwGACAgAAC2BgAgBaYCAQCqBAAhuwJAALsEACHUAgEAqgQAIdUCIAC6BAAh1wIBAKoEACEGFQAA1QUAIKYCAQCqBAAhuwJAALsEACHUAgEAqgQAIdUCIAC6BAAh1wIBAKoEACEGFQAA1wUAIKYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHXAgEAAAABDQYAALEFACAJAADZBAAgCwAA2gQAIKYCAQAAAAGnAgEAAAABqAIBAAAAAbsCQAAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAABAgAAABQAICcAAMEGACADAAAAFAAgJwAAwQYAICgAAMAGACABIAAAhwcAMAIAAAAUACAgAADABgAgAgAAAMoEACAgAAC_BgAgCqYCAQCqBAAhpwIBAKoEACGoAgEAqgQAIbsCQAC7BAAhyQIAAMwE3AIi2AJAALsEACHZAgEAqgQAIdoCAQCqBAAh3AIQALcEACHdAgEAtQQAIQ0GAACvBQAgCQAAzwQAIAsAANAEACCmAgEAqgQAIacCAQCqBAAhqAIBAKoEACG7AkAAuwQAIckCAADMBNwCItgCQAC7BAAh2QIBAKoEACHaAgEAqgQAIdwCEAC3BAAh3QIBALUEACENBgAAsQUAIAkAANkEACALAADaBAAgpgIBAAAAAacCAQAAAAGoAgEAAAABuwJAAAAAAckCAAAA3AIC2AJAAAAAAdkCAQAAAAHaAgEAAAAB3AIQAAAAAd0CAQAAAAEGBgAAwwUAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABAgAAACcAICcAAMoGACADAAAAJwAgJwAAygYAICgAAMkGACABIAAAhgcAMAIAAAAnACAgAADJBgAgAgAAAOMEACAgAADIBgAgBaYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAgC5BAAhxQIBAKoEACEGBgAAwgUAIKYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAgC5BAAhxQIBAKoEACEGBgAAwwUAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABDQwAAJUFACAOAACRBQAgEAAAkgUAIBEAAJMFACASAACUBQAgpgIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAiAMAICcAAMsGACADAAAACwAgJwAAywYAICgAAM8GACAPAAAACwAgDAAAwQQAIA4AAL0EACAQAAC-BAAgEQAAvwQAIBIAAMAEACAgAADPBgAgpgIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQ0MAADBBAAgDgAAvQQAIBAAAL4EACARAAC_BAAgEgAAwAQAIKYCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEMpgIBAAAAAbsCQAAAAAHkAkAAAAAB5QIBAAAAAeYCAQAAAAHnAgEAAAAB6AIBAAAAAekCAQAAAAHqAkAAAAAB6wJAAAAAAewCAQAAAAHtAgEAAAABAgAAAAkAICcAANsGACADAAAACQAgJwAA2wYAICgAANoGACABIAAAhQcAMBEDAADZAwAgowIAAKUEADCkAgAABwAQpQIAAKUEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIeQCQADYAwAh5QIBAOUDACHmAgEA5QMAIecCAQDSAwAh6AIBANIDACHpAgEA0gMAIeoCQACOBAAh6wJAAI4EACHsAgEA0gMAIe0CAQDSAwAhAgAAAAkAICAAANoGACACAAAA2AYAICAAANkGACAQowIAANcGADCkAgAA2AYAEKUCAADXBgAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh5AJAANgDACHlAgEA5QMAIeYCAQDlAwAh5wIBANIDACHoAgEA0gMAIekCAQDSAwAh6gJAAI4EACHrAkAAjgQAIewCAQDSAwAh7QIBANIDACEQowIAANcGADCkAgAA2AYAEKUCAADXBgAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh5AJAANgDACHlAgEA5QMAIeYCAQDlAwAh5wIBANIDACHoAgEA0gMAIekCAQDSAwAh6gJAAI4EACHrAkAAjgQAIewCAQDSAwAh7QIBANIDACEMpgIBAKoEACG7AkAAuwQAIeQCQAC7BAAh5QIBAKoEACHmAgEAqgQAIecCAQC1BAAh6AIBALUEACHpAgEAtQQAIeoCQAD2BQAh6wJAAPYFACHsAgEAtQQAIe0CAQC1BAAhDKYCAQCqBAAhuwJAALsEACHkAkAAuwQAIeUCAQCqBAAh5gIBAKoEACHnAgEAtQQAIegCAQC1BAAh6QIBALUEACHqAkAA9gUAIesCQAD2BQAh7AIBALUEACHtAgEAtQQAIQymAgEAAAABuwJAAAAAAeQCQAAAAAHlAgEAAAAB5gIBAAAAAecCAQAAAAHoAgEAAAAB6QIBAAAAAeoCQAAAAAHrAkAAAAAB7AIBAAAAAe0CAQAAAAEHpgIBAAAAAbsCQAAAAAHjAkAAAAAB5AJAAAAAAe4CAQAAAAHvAgEAAAAB8AIBAAAAAQIAAAAFACAnAADnBgAgAwAAAAUAICcAAOcGACAoAADmBgAgASAAAIQHADAMAwAA2QMAIKMCAACmBAAwpAIAAAMAEKUCAACmBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHjAkAA2AMAIeQCQADYAwAh7gIBAAAAAe8CAQDSAwAh8AIBANIDACECAAAABQAgIAAA5gYAIAIAAADkBgAgIAAA5QYAIAujAgAA4wYAMKQCAADkBgAQpQIAAOMGADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHjAkAA2AMAIeQCQADYAwAh7gIBAOUDACHvAgEA0gMAIfACAQDSAwAhC6MCAADjBgAwpAIAAOQGABClAgAA4wYAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeMCQADYAwAh5AJAANgDACHuAgEA5QMAIe8CAQDSAwAh8AIBANIDACEHpgIBAKoEACG7AkAAuwQAIeMCQAC7BAAh5AJAALsEACHuAgEAqgQAIe8CAQC1BAAh8AIBALUEACEHpgIBAKoEACG7AkAAuwQAIeMCQAC7BAAh5AJAALsEACHuAgEAqgQAIe8CAQC1BAAh8AIBALUEACEHpgIBAAAAAbsCQAAAAAHjAkAAAAAB5AJAAAAAAe4CAQAAAAHvAgEAAAAB8AIBAAAAAQQnAADcBgAw_wIAAN0GADCBAwAA3wYAIIUDAADgBgAwBCcAANAGADD_AgAA0QYAMIEDAADTBgAghQMAANQGADADJwAAywYAIP8CAADMBgAghQMAAIgDACAEJwAAwgYAMP8CAADDBgAwgQMAAMUGACCFAwAA3wQAMAQnAAC5BgAw_wIAALoGADCBAwAAvAYAIIUDAADGBAAwBCcAALAGADD_AgAAsQYAMIEDAACzBgAghQMAAKgGADAEJwAApAYAMP8CAAClBgAwgQMAAKcGACCFAwAAqAYAMAQnAACYBgAw_wIAAJkGADCBAwAAmwYAIIUDAACcBgAwBCcAAIwGADD_AgAAjQYAMIEDAACPBgAghQMAAJAGADAAAAkDAACWBQAgDAAAmwUAIA4AAJcFACAQAACYBQAgEQAAmQUAIBIAAJoFACC1AgAArwQAILYCAACvBAAguAIAAK8EACAAAAAAAAAFJwAA_wYAICgAAIIHACD_AgAAgAcAIIADAACBBwAghQMAAFoAIAMnAAD_BgAg_wIAAIAHACCFAwAAWgAgAQcAAJgFACACBwAAlwUAIAwAAJsFACAECgAAywUAIMoCAACvBAAgywIAAK8EACDMAgAArwQAIBUEAADoBgAgBQAA6QYAIAwAAOwGACASAADrBgAgEwAA6gYAIBYAAO0GACAXAADuBgAgGAAA7wYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAckCAAAA-wIC5AJAAAAAAfECAQAAAAHyAiAAAAAB8wIBAAAAAfUCAAAA9QIC9gIgAAAAAfcCIAAAAAH4AkAAAAAB-QIgAAAAAQIAAABaACAnAAD_BgAgAwAAAF0AICcAAP8GACAoAACDBwAgFwAAAF0AIAQAAIMGACAFAACEBgAgDAAAhwYAIBIAAIYGACATAACFBgAgFgAAiAYAIBcAAIkGACAYAACKBgAgIAAAgwcAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIckCAACCBvsCIuQCQAC7BAAh8QIBAKoEACHyAiAAugQAIfMCAQC1BAAh9QIAAIEG9QIi9gIgALoEACH3AiAAugQAIfgCQAD2BQAh-QIgALoEACEVBAAAgwYAIAUAAIQGACAMAACHBgAgEgAAhgYAIBMAAIUGACAWAACIBgAgFwAAiQYAIBgAAIoGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHJAgAAggb7AiLkAkAAuwQAIfECAQCqBAAh8gIgALoEACHzAgEAtQQAIfUCAACBBvUCIvYCIAC6BAAh9wIgALoEACH4AkAA9gUAIfkCIAC6BAAhB6YCAQAAAAG7AkAAAAAB4wJAAAAAAeQCQAAAAAHuAgEAAAAB7wIBAAAAAfACAQAAAAEMpgIBAAAAAbsCQAAAAAHkAkAAAAAB5QIBAAAAAeYCAQAAAAHnAgEAAAAB6AIBAAAAAekCAQAAAAHqAkAAAAAB6wJAAAAAAewCAQAAAAHtAgEAAAABBaYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAgAAAAHFAgEAAAABCqYCAQAAAAGnAgEAAAABqAIBAAAAAbsCQAAAAAHJAgAAANwCAtgCQAAAAAHZAgEAAAAB2gIBAAAAAdwCEAAAAAHdAgEAAAABBaYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHXAgEAAAABBaYCAQAAAAG7AkAAAAAB1AIBAAAAAdUCIAAAAAHWAgEAAAABBaYCAQAAAAG7AkAAAAAB0wIBAAAAAdQCAQAAAAHVAiAAAAABA6YCAQAAAAG7AkAAAAAB_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_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_BAAgEgAAwAQAIKYCAQCqBAAhtAIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQEaAAIKBAYDBQoEDDAIDQATEi8PEwwFFjQRFzURGDkSGTwBAQMAAgEDAAIHAwACDCkIDQAQDhAGEB0LESMOEigPAgYABQkABwMHEQYMFQgNAAoEBgAFCAACCQAHCxcJAQoACAIHGAAMGQACBgAFDwAMAgceCw0ADQEHHwABBiQFAgYABQgAAgUMLgAOKgAQKwARLAASLQACFAACFQACAQMAAggEPQAFPgAMQAASPwAWQQAXQgAYQwAZRAAAARoAAgEaAAIDDQAYLQAZLgAaAAAAAw0AGC0AGS4AGgAAAw0AHy0AIC4AIQAAAAMNAB8tACAuACEBAwACAQMAAgMNACYtACcuACgAAAADDQAmLQAnLgAoAQMAAgEDAAIDDQAtLQAuLgAvAAAAAw0ALS0ALi4ALwAAAAMNADUtADYuADcAAAADDQA1LQA2LgA3AQbCAQUBBsgBBQMNADwtAD0uAD4AAAADDQA8LQA9LgA-AwYABQgAAgkABwMGAAUIAAIJAAcFDQBDLQBGLgBHjwEARJABAEUAAAAAAAUNAEMtAEYuAEePAQBEkAEARQAAAw0ATC0ATS4ATgAAAAMNAEwtAE0uAE4CFAACFQACAhQAAhUAAgMNAFMtAFQuAFUAAAADDQBTLQBULgBVAQMAAgEDAAIDDQBaLQBbLgBcAAAAAw0AWi0AWy4AXAEKAAgBCgAIBQ0AYS0AZC4AZY8BAGKQAQBjAAAAAAAFDQBhLQBkLgBljwEAYpABAGMCBgAFCAACAgYABQgAAgUNAGotAG0uAG6PAQBrkAEAbAAAAAAABQ0Aai0AbS4Abo8BAGuQAQBsAAADDQBzLQB0LgB1AAAAAw0Acy0AdC4AdQIGAAUPAAwCBgAFDwAMAw0Aei0Aey4AfAAAAAMNAHotAHsuAHwBAwACAQMAAgUNAIEBLQCEAS4AhQGPAQCCAZABAIMBAAAAAAAFDQCBAS0AhAEuAIUBjwEAggGQAQCDAQIGAAUJAAcCBgAFCQAHAw0AigEtAIsBLgCMAQAAAAMNAIoBLQCLAS4AjAEbAgEcRQEdRgEeRwEfSAEhSgEiTBQjTRUkTwElURQmUhYpUwEqVAErVRQvWBcwWRsxWwIyXAIzXwI0YAI1YQI2YwI3ZRQ4Zhw5aAI6ahQ7ax08bAI9bQI-bhQ_cR5AciJBcwNCdANDdQNEdgNFdwNGeQNHexRIfCNJfgNKgAEUS4EBJEyCAQNNgwEDToQBFE-HASVQiAEpUYkBBFKKAQRTiwEEVIwBBFWNAQRWjwEEV5EBFFiSASpZlAEEWpYBFFuXAStcmAEEXZkBBF6aARRfnQEsYJ4BMGGgATFioQExY6QBMWSlATFlpgExZqgBMWeqARRoqwEyaa0BMWqvARRrsAEzbLEBMW2yATFuswEUb7YBNHC3AThxuAEOcrkBDnO6AQ50uwEOdbwBDna-AQ53wAEUeMEBOXnEAQ56xgEUe8cBOnzJAQ59ygEOfssBFH_OATuAAc8BP4EB0AEIggHRAQiDAdIBCIQB0wEIhQHUAQiGAdYBCIcB2AEUiAHZAUCJAdsBCIoB3QEUiwHeAUGMAd8BCI0B4AEIjgHhARSRAeQBQpIB5QFIkwHnAQyUAegBDJUB6wEMlgHsAQyXAe0BDJgB7wEMmQHxARSaAfIBSZsB9AEMnAH2ARSdAfcBSp4B-AEMnwH5AQygAfoBFKEB_QFLogH-AU-jAf8BEaQBgAIRpQGBAhGmAYICEacBgwIRqAGFAhGpAYcCFKoBiAJQqwGKAhGsAYwCFK0BjQJRrgGOAhGvAY8CEbABkAIUsQGTAlKyAZQCVrMBlQIStAGWAhK1AZcCErYBmAIStwGZAhK4AZsCErkBnQIUugGeAle7AaACErwBogIUvQGjAli-AaQCEr8BpQISwAGmAhTBAakCWcIBqgJdwwGsAgnEAa0CCcUBrwIJxgGwAgnHAbECCcgBswIJyQG1AhTKAbYCXssBuAIJzAG6AhTNAbsCX84BvAIJzwG9AgnQAb4CFNEBwQJg0gHCAmbTAcMCD9QBxAIP1QHFAg_WAcYCD9cBxwIP2AHJAg_ZAcsCFNoBzAJn2wHOAg_cAdACFN0B0QJo3gHSAg_fAdMCD-AB1AIU4QHXAmniAdgCb-MB2gIH5AHbAgflAd4CB-YB3wIH5wHgAgfoAeICB-kB5AIU6gHlAnDrAecCB-wB6QIU7QHqAnHuAesCB-8B7AIH8AHtAhTxAfACcvIB8QJ28wHyAgv0AfMCC_UB9AIL9gH1Agv3AfYCC_gB-AIL-QH6AhT6AfsCd_sB_QIL_AH_AhT9AYADeP4BgQML_wGCAwuAAoMDFIEChgN5ggKHA32DAokDBYQCigMFhQKMAwWGAo0DBYcCjgMFiAKQAwWJApIDFIoCkwN-iwKVAwWMApcDFI0CmAN_jgKZAwWPApoDBZACmwMUkQKeA4ABkgKfA4YBkwKgAwaUAqEDBpUCogMGlgKjAwaXAqQDBpgCpgMGmQKoAxSaAqkDhwGbAqsDBpwCrQMUnQKuA4gBngKvAwafArADBqACsQMUoQK0A4kBogK1A40B"
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
  const searchTerm = query.search;
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
      total: tutors.length
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
var getDashboardStats = async (user) => {
  const profile = await getMyProfile(user);
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
    totalEarningsResult,
    monthEarningsResult,
    recentReviews,
    upcomingBookings
  ] = await prisma.$transaction([
    // 1. Total bookings ever
    prisma.booking.count({ where: { tutorId: profile.id } }),
    // 2. Completed sessions
    prisma.booking.count({ where: { tutorId: profile.id, status: "COMPLETED" } }),
    // 3. Pending approval
    prisma.booking.count({ where: { tutorId: profile.id, status: "PENDING" } }),
    // 4. This month's bookings
    prisma.booking.count({
      where: { tutorId: profile.id, createdAt: { gte: startOfMonth } }
    }),
    // 5. Last month's bookings
    prisma.booking.count({
      where: { tutorId: profile.id, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }),
    // 6. Total earnings
    prisma.payment.aggregate({
      where: { booking: { tutorId: profile.id }, status: "PAID" },
      _sum: { amount: true }
    }),
    // 7. This month's earnings (তারিখ অ্যাড করা হয়েছে)
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: profile.id },
        status: "PAID",
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),
    // 8. Latest 5 reviews
    prisma.review.findMany({
      where: { tutorId: profile.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, name: true } } }
    }),
    // 9. Next 5 upcoming accepted sessions (ভবিষ্যতের তারিখ চেক করা হয়েছে)
    prisma.booking.findMany({
      where: {
        tutorId: profile.id,
        status: "ACCEPTED",
        startTime: { gte: now }
        // শুধুমাত্র বর্তমান সময়ের পরের সেশনগুলো
      },
      take: 5,
      orderBy: { startTime: "asc" },
      // সবচেয়ে কাছের বুকিংগুলো আগে দেখাবে
      include: {
        student: { select: { id: true, name: true } },
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
var searchTutors = catchAsync(async (req, res) => {
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
  getAllTutors: getAllTutors2,
  getPublicProfile: getPublicProfile2,
  searchTutors,
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
router2.get(
  "/search",
  // validateRequest(TutorValidation.searchQuerySchema),
  TutorController.searchTutors
);
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
    if (data.status === BookingStatus.ACCEPTED && !data.meetingLink && !booking.meetingLink) {
      throw new AppError_default(status7.BAD_REQUEST, "Please provide a meeting link to accept the booking.");
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
  const { page, limit, sortBy, sortOrder, status: status14, searchTerm } = query;
  const { skip, take } = getPagination(page, limit);
  const where = {};
  if (status14) {
    where.status = status14;
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
    throw new AppError_default(status7.NOT_FOUND, "Tutor not found.");
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
  getAllBookings,
  getBookingById,
  createReview,
  getReviewsByTutor
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
var getReviewsByTutor2 = catchAsync(async (req, res) => {
  const tutorId = req.params.tutorId;
  const result = await bookingService.getReviewsByTutor(tutorId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10
  });
  sendResponse(res, {
    httpStatusCode: status8.OK,
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
  getAllBookings: getAllBookings2,
  createReview: createReview2,
  getReviewsByTutor: getReviewsByTutor2
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
  "/reviews/:tutorId",
  bookingControllers.getReviewsByTutor
);
var BookingRoute = router3;

// src/app/module/admin/admin.route.ts
import { Router as Router4 } from "express";

// src/app/module/admin/admin.controller.ts
import httpStatus from "http-status";

// src/app/module/admin/admin.service.ts
import status9 from "http-status";
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
import express, { Router as Router8 } from "express";

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
var handleStripeSuccess = async (intent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;
  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.PAID,
        transactionId: intent.id,
        // অটোমেটিক Stripe ID বসবে
        paymentMethod: "STRIPE_CARD"
      }
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PAID,
        meetingLink
      }
    })
  ]);
  console.log(`\u2705 Stripe payment & Meeting Link auto-generated for: ${bookingId}`);
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
var approveManualPayment = async (bookingId) => {
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;
  return await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.PAID }
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PAID,
        meetingLink
      }
    })
  ]);
};
var paymentService = {
  initiateStripePayment,
  handleStripeSuccess,
  submitManualPayment,
  approveManualPayment
  // Webhook Signature verification function here...
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
  const result = await paymentService.approveManualPayment(req.params.bookingId);
  sendResponse(res, {
    httpStatusCode: status13.OK,
    success: true,
    message: "Payment approved and meeting link generated.",
    data: result
  });
});
var paymentController = {
  initiatePayment,
  stripeWebhook,
  submitManualPayment: submitManualPayment2,
  approveManualPayment: approveManualPayment2
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
  express.raw({ type: "application/json" }),
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
  checkAuth(UserRole.ADMIN),
  paymentController.approveManualPayment
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
