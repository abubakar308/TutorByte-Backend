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
  "inlineSchema": 'model AdminLog {\n  id        String   @id @default(uuid())\n  adminId   String\n  action    String\n  createdAt DateTime @default(now())\n  admin     User     @relation("adminLogs", fields: [adminId], references: [id])\n}\n\nmodel User {\n  id                 String         @id @default(uuid())\n  name               String         @db.VarChar(255)\n  email              String         @unique\n  emailVerified      Boolean        @default(false)\n  image              String?\n  role               UserRole       @default(STUDENT)\n  isVerified         Boolean        @default(false)\n  status             UserStatus     @default(ACTIVE)\n  createdAt          DateTime       @default(now())\n  updatedAt          DateTime       @updatedAt\n  needPasswordChange Boolean        @default(false)\n  deletedAt          DateTime?\n  isDeleted          Boolean        @default(false)\n  adminLogs          AdminLog[]     @relation("adminLogs")\n  accounts           Account[]\n  bookings           Booking[]      @relation("studentBookings")\n  receivedMessages   Message[]      @relation("receivedMessages")\n  sentMessages       Message[]      @relation("sentMessages")\n  notifications      Notification[]\n  reviews            Review[]       @relation("studentReviews")\n  sessions           Session[]\n  tutorProfile       TutorProfile?\n\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id @default(uuid())\n  expiresAt DateTime\n  token     String   @unique\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Availability {\n  id        String        @id @default(uuid())\n  tutorId   String?\n  dayOfWeek DayOfWeek\n  isActive  Boolean       @default(true)\n  startTime String\n  endTime   String\n  tutor     TutorProfile? @relation(fields: [tutorId], references: [id])\n\n  @@map("availability")\n}\n\nmodel Booking {\n  id          String        @id @default(uuid())\n  studentId   String\n  tutorId     String\n  subjectId   String\n  bookingDate DateTime\n  startTime   String\n  endTime     String\n  status      BookingStatus @default(PENDING)\n  totalPrice  Decimal       @db.Decimal(10, 2)\n  meetingLink String?\n  createdAt   DateTime      @default(now())\n  reason      String?\n  student     User          @relation("studentBookings", fields: [studentId], references: [id])\n  subject     Subject       @relation(fields: [subjectId], references: [id])\n  tutor       TutorProfile  @relation(fields: [tutorId], references: [id])\n  payment     Payment?\n\n  @@map("bookings")\n}\n\nenum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BLOCKED\n  INACTIVE\n}\n\nenum SubjectCategory {\n  ACADEMIC\n  SKILLS\n  LANGUAGE\n}\n\nenum DayOfWeek {\n  SUN\n  MON\n  TUE\n  WED\n  THU\n  FRI\n  SAT\n}\n\nenum BookingStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  REFUNDED\n}\n\nmodel Language {\n  id     String           @id @default(uuid())\n  name   String           @unique\n  image  String?\n  tutors TutorLanguages[]\n\n  @@map("languages")\n}\n\nmodel Message {\n  id         String   @id @default(uuid())\n  senderId   String\n  receiverId String\n  message    String\n  isRead     Boolean\n  createdAt  DateTime @default(now())\n  receiver   User     @relation("receivedMessages", fields: [receiverId], references: [id])\n  sender     User     @relation("sentMessages", fields: [senderId], references: [id])\n\n  @@map("messages")\n}\n\nmodel Notification {\n  id        String   @id @default(uuid())\n  userId    String\n  title     String\n  message   String\n  isRead    Boolean\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id])\n\n  @@map("notifications")\n}\n\nmodel Payment {\n  id              String        @id @default(uuid())\n  bookingId       String        @unique\n  amount          Decimal       @db.Decimal(10, 2)\n  status          PaymentStatus @default(PENDING)\n  transactionId   String?       @unique\n  gatewayResponse Json?\n  paymentMethod   String?\n  createdAt       DateTime      @default(now())\n  booking         Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@map("payments")\n}\n\nmodel Review {\n  id        String       @id @default(uuid())\n  studentId String\n  tutorId   String\n  rating    Int\n  comment   String\n  createdAt DateTime     @default(now())\n  student   User         @relation("studentReviews", fields: [studentId], references: [id])\n  tutor     TutorProfile @relation(fields: [tutorId], references: [id])\n\n  @@map("reviews")\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Subject {\n  id       String          @id @default(uuid())\n  name     String          @unique\n  category SubjectCategory\n  image    String?\n  tutors   TutorSubjects[]\n  bookings Booking[]\n\n  @@map("subjects")\n}\n\nmodel TutorLanguages {\n  id         String       @id @default(uuid())\n  tutorId    String\n  languageId String\n  language   Language     @relation(fields: [languageId], references: [id])\n  tutor      TutorProfile @relation(fields: [tutorId], references: [id])\n\n  @@map("tutor_languages")\n}\n\nmodel TutorProfile {\n  id              String           @id @default(uuid())\n  userId          String           @unique\n  bio             String?\n  experienceYears Int?\n  hourlyRate      Decimal          @db.Decimal(8, 2)\n  averageRating   Float?           @default(0.0)\n  totalReviews    Int\n  isApproved      Boolean\n  createdAt       DateTime         @default(now())\n  languages       TutorLanguages[]\n  subjects        TutorSubjects[]\n  availabilities  Availability[]\n  bookings        Booking[]\n  reviews         Review[]\n  user            User             @relation(fields: [userId], references: [id])\n\n  @@map("tutor_profiles")\n}\n\nmodel TutorSubjects {\n  id        String       @id @default(uuid())\n  tutorId   String\n  subjectId String\n  subject   Subject      @relation(fields: [subjectId], references: [id])\n  tutor     TutorProfile @relation(fields: [tutorId], references: [id])\n\n  @@map("tutor_subjects")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"AdminLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"admin","kind":"object","type":"User","relationName":"adminLogs"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"needPasswordChange","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"adminLogs","kind":"object","type":"AdminLog","relationName":"adminLogs"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"bookings","kind":"object","type":"Booking","relationName":"studentBookings"},{"name":"receivedMessages","kind":"object","type":"Message","relationName":"receivedMessages"},{"name":"sentMessages","kind":"object","type":"Message","relationName":"sentMessages"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"studentReviews"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Availability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"dayOfWeek","kind":"enum","type":"DayOfWeek"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"AvailabilityToTutorProfile"}],"dbName":"availability"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"bookingDate","kind":"scalar","type":"DateTime"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"totalPrice","kind":"scalar","type":"Decimal"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"reason","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"studentBookings"},{"name":"subject","kind":"object","type":"Subject","relationName":"BookingToSubject"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"}],"dbName":"bookings"},"Language":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"tutors","kind":"object","type":"TutorLanguages","relationName":"LanguageToTutorLanguages"}],"dbName":"languages"},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"receiverId","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"receiver","kind":"object","type":"User","relationName":"receivedMessages"},{"name":"sender","kind":"object","type":"User","relationName":"sentMessages"}],"dbName":"messages"},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"}],"dbName":"notifications"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"gatewayResponse","kind":"scalar","type":"Json"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"}],"dbName":"payments"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"studentReviews"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"}],"dbName":"reviews"},"Subject":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"category","kind":"enum","type":"SubjectCategory"},{"name":"image","kind":"scalar","type":"String"},{"name":"tutors","kind":"object","type":"TutorSubjects","relationName":"SubjectToTutorSubjects"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToSubject"}],"dbName":"subjects"},"TutorLanguages":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"languageId","kind":"scalar","type":"String"},{"name":"language","kind":"object","type":"Language","relationName":"LanguageToTutorLanguages"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorLanguagesToTutorProfile"}],"dbName":"tutor_languages"},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"experienceYears","kind":"scalar","type":"Int"},{"name":"hourlyRate","kind":"scalar","type":"Decimal"},{"name":"averageRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"languages","kind":"object","type":"TutorLanguages","relationName":"TutorLanguagesToTutorProfile"},{"name":"subjects","kind":"object","type":"TutorSubjects","relationName":"TutorProfileToTutorSubjects"},{"name":"availabilities","kind":"object","type":"Availability","relationName":"AvailabilityToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"}],"dbName":"tutor_profiles"},"TutorSubjects":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"subjectId","kind":"scalar","type":"String"},{"name":"subject","kind":"object","type":"Subject","relationName":"SubjectToTutorSubjects"},{"name":"tutor","kind":"object","type":"TutorProfile","relationName":"TutorProfileToTutorSubjects"}],"dbName":"tutor_subjects"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","adminLogs","user","accounts","student","subject","tutors","_count","language","tutor","languages","subjects","availabilities","bookings","reviews","booking","payment","receiver","sender","receivedMessages","sentMessages","notifications","sessions","tutorProfile","admin","AdminLog.findUnique","AdminLog.findUniqueOrThrow","AdminLog.findFirst","AdminLog.findFirstOrThrow","AdminLog.findMany","data","AdminLog.createOne","AdminLog.createMany","AdminLog.createManyAndReturn","AdminLog.updateOne","AdminLog.updateMany","AdminLog.updateManyAndReturn","create","update","AdminLog.upsertOne","AdminLog.deleteOne","AdminLog.deleteMany","having","_min","_max","AdminLog.groupBy","AdminLog.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Availability.findUnique","Availability.findUniqueOrThrow","Availability.findFirst","Availability.findFirstOrThrow","Availability.findMany","Availability.createOne","Availability.createMany","Availability.createManyAndReturn","Availability.updateOne","Availability.updateMany","Availability.updateManyAndReturn","Availability.upsertOne","Availability.deleteOne","Availability.deleteMany","Availability.groupBy","Availability.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","_avg","_sum","Booking.groupBy","Booking.aggregate","Language.findUnique","Language.findUniqueOrThrow","Language.findFirst","Language.findFirstOrThrow","Language.findMany","Language.createOne","Language.createMany","Language.createManyAndReturn","Language.updateOne","Language.updateMany","Language.updateManyAndReturn","Language.upsertOne","Language.deleteOne","Language.deleteMany","Language.groupBy","Language.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Subject.findUnique","Subject.findUniqueOrThrow","Subject.findFirst","Subject.findFirstOrThrow","Subject.findMany","Subject.createOne","Subject.createMany","Subject.createManyAndReturn","Subject.updateOne","Subject.updateMany","Subject.updateManyAndReturn","Subject.upsertOne","Subject.deleteOne","Subject.deleteMany","Subject.groupBy","Subject.aggregate","TutorLanguages.findUnique","TutorLanguages.findUniqueOrThrow","TutorLanguages.findFirst","TutorLanguages.findFirstOrThrow","TutorLanguages.findMany","TutorLanguages.createOne","TutorLanguages.createMany","TutorLanguages.createManyAndReturn","TutorLanguages.updateOne","TutorLanguages.updateMany","TutorLanguages.updateManyAndReturn","TutorLanguages.upsertOne","TutorLanguages.deleteOne","TutorLanguages.deleteMany","TutorLanguages.groupBy","TutorLanguages.aggregate","TutorProfile.findUnique","TutorProfile.findUniqueOrThrow","TutorProfile.findFirst","TutorProfile.findFirstOrThrow","TutorProfile.findMany","TutorProfile.createOne","TutorProfile.createMany","TutorProfile.createManyAndReturn","TutorProfile.updateOne","TutorProfile.updateMany","TutorProfile.updateManyAndReturn","TutorProfile.upsertOne","TutorProfile.deleteOne","TutorProfile.deleteMany","TutorProfile.groupBy","TutorProfile.aggregate","TutorSubjects.findUnique","TutorSubjects.findUniqueOrThrow","TutorSubjects.findFirst","TutorSubjects.findFirstOrThrow","TutorSubjects.findMany","TutorSubjects.createOne","TutorSubjects.createMany","TutorSubjects.createManyAndReturn","TutorSubjects.updateOne","TutorSubjects.updateMany","TutorSubjects.updateManyAndReturn","TutorSubjects.upsertOne","TutorSubjects.deleteOne","TutorSubjects.deleteMany","TutorSubjects.groupBy","TutorSubjects.aggregate","AND","OR","NOT","id","tutorId","subjectId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","userId","bio","experienceYears","hourlyRate","averageRating","totalReviews","isApproved","createdAt","every","some","none","languageId","name","SubjectCategory","category","image","studentId","rating","comment","bookingId","amount","PaymentStatus","status","transactionId","gatewayResponse","paymentMethod","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","title","message","isRead","senderId","receiverId","bookingDate","startTime","endTime","BookingStatus","totalPrice","meetingLink","reason","DayOfWeek","dayOfWeek","isActive","identifier","value","expiresAt","updatedAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","UserRole","role","isVerified","UserStatus","needPasswordChange","deletedAt","isDeleted","adminId","action","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "6AeNAYACCBoAAN4DACCjAgAApgQAMKQCAAADABClAgAApgQAMKYCAQAAAAG7AkAA2AMAIfwCAQDlAwAh_QIBAOUDACEBAAAAAQAgCBoAAN4DACCjAgAApgQAMKQCAAADABClAgAApgQAMKYCAQDlAwAhuwJAANgDACH8AgEA5QMAIf0CAQDlAwAhARoAAJsFACADAAAAAwAgAQAABAAwAgAAAQAgEQQAAN4DACCjAgAApQQAMKQCAAAGABClAgAApQQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIeYCQADYAwAh5wIBAOUDACHoAgEA5QMAIekCAQDSAwAh6gIBANIDACHrAgEA0gMAIewCQACPBAAh7QJAAI8EACHuAgEA0gMAIe8CAQDSAwAhCAQAAJsFACDpAgAArwQAIOoCAACvBAAg6wIAAK8EACDsAgAArwQAIO0CAACvBAAg7gIAAK8EACDvAgAArwQAIBEEAADeAwAgowIAAKUEADCkAgAABgAQpQIAAKUEADCmAgEAAAABtAIBAOUDACG7AkAA2AMAIeYCQADYAwAh5wIBAOUDACHoAgEA5QMAIekCAQDSAwAh6gIBANIDACHrAgEA0gMAIewCQACPBAAh7QJAAI8EACHuAgEA0gMAIe8CAQDSAwAhAwAAAAYAIAEAAAcAMAIAAAgAIBMGAADeAwAgBwAAoQQAIAsAAJsEACASAACkBAAgowIAAKIEADCkAgAACgAQpQIAAKIEADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACG7AkAA2AMAIcQCAQDlAwAhygIAAKME3QIi2QJAANgDACHaAgEA5QMAIdsCAQDlAwAh3QIQANQDACHeAgEA0gMAId8CAQDSAwAhBgYAAJsFACAHAAD9BgAgCwAA9gYAIBIAAP4GACDeAgAArwQAIN8CAACvBAAgEwYAAN4DACAHAAChBAAgCwAAmwQAIBIAAKQEACCjAgAAogQAMKQCAAAKABClAgAAogQAMKYCAQAAAAGnAgEA5QMAIagCAQDlAwAhuwJAANgDACHEAgEA5QMAIcoCAACjBN0CItkCQADYAwAh2gIBAOUDACHbAgEA5QMAId0CEADUAwAh3gIBANIDACHfAgEA0gMAIQMAAAAKACABAAALADACAAAMACAIBwAAoQQAIAsAAJsEACCjAgAAoAQAMKQCAAAOABClAgAAoAQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIQIHAAD9BgAgCwAA9gYAIAgHAAChBAAgCwAAmwQAIKMCAACgBAAwpAIAAA4AEKUCAACgBAAwpgIBAAAAAacCAQDlAwAhqAIBAOUDACEDAAAADgAgAQAADwAwAgAAEAAgCAoAAJ8EACALAACbBAAgowIAAJ4EADCkAgAAEgAQpQIAAJ4EADCmAgEA5QMAIacCAQDlAwAhvwIBAOUDACECCgAA_AYAIAsAAPYGACAICgAAnwQAIAsAAJsEACCjAgAAngQAMKQCAAASABClAgAAngQAMKYCAQAAAAGnAgEA5QMAIb8CAQDlAwAhAwAAABIAIAEAABMAMAIAABQAIAMAAAASACABAAATADACAAAUACABAAAAEgAgAwAAAA4AIAEAAA8AMAIAABAAIAoLAACVBAAgowIAAJwEADCkAgAAGQAQpQIAAJwEADCmAgEA5QMAIacCAQDSAwAh2gIBAOUDACHbAgEA5QMAIeECAACdBOECIuICIADXAwAhAgsAAPYGACCnAgAArwQAIAoLAACVBAAgowIAAJwEADCkAgAAGQAQpQIAAJwEADCmAgEAAAABpwIBANIDACHaAgEA5QMAIdsCAQDlAwAh4QIAAJ0E4QIi4gIgANcDACEDAAAAGQAgAQAAGgAwAgAAGwAgEgQAAN4DACAMAADZAwAgDQAA2gMAIA4AANsDACAPAADcAwAgEAAA3QMAIKMCAADRAwAwpAIAAB0AEKUCAADRAwAwpgIBAOUDACG0AgEA5QMAIbUCAQDSAwAhtgICANMDACG3AhAA1AMAIbgCCADVAwAhuQICANYDACG6AiAA1wMAIbsCQADYAwAhAQAAAB0AIAMAAAAKACABAAALADACAAAMACALBgAA3gMAIAsAAJsEACCjAgAAmgQAMKQCAAAgABClAgAAmgQAMKYCAQDlAwAhpwIBAOUDACG7AkAA2AMAIcQCAQDlAwAhxQICANYDACHGAgEA5QMAIQIGAACbBQAgCwAA9gYAIAsGAADeAwAgCwAAmwQAIKMCAACaBAAwpAIAACAAEKUCAACaBAAwpgIBAAAAAacCAQDlAwAhuwJAANgDACHEAgEA5QMAIcUCAgDWAwAhxgIBAOUDACEDAAAAIAAgAQAAIQAwAgAAIgAgAQAAABIAIAEAAAAOACABAAAAGQAgAQAAAAoAIAEAAAAgACADAAAACgAgAQAACwAwAgAADAAgAQAAAA4AIAEAAAAKACAMEQAA8QMAIKMCAADuAwAwpAIAACwAEKUCAADuAwAwpgIBAOUDACG7AkAA2AMAIccCAQDlAwAhyAIQANQDACHKAgAA7wPKAiLLAgEA0gMAIcwCAADwAwAgzQIBANIDACEBAAAALAAgCxMAAN4DACAUAADeAwAgowIAAJkEADCkAgAALgAQpQIAAJkEADCmAgEA5QMAIbsCQADYAwAh1QIBAOUDACHWAiAA1wMAIdcCAQDlAwAh2AIBAOUDACECEwAAmwUAIBQAAJsFACALEwAA3gMAIBQAAN4DACCjAgAAmQQAMKQCAAAuABClAgAAmQQAMKYCAQAAAAG7AkAA2AMAIdUCAQDlAwAh1gIgANcDACHXAgEA5QMAIdgCAQDlAwAhAwAAAC4AIAEAAC8AMAIAADAAIAMAAAAuACABAAAvADACAAAwACAKBAAA3gMAIKMCAACYBAAwpAIAADMAEKUCAACYBAAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh1AIBAOUDACHVAgEA5QMAIdYCIADXAwAhAQQAAJsFACAKBAAA3gMAIKMCAACYBAAwpAIAADMAEKUCAACYBAAwpgIBAAAAAbQCAQDlAwAhuwJAANgDACHUAgEA5QMAIdUCAQDlAwAh1gIgANcDACEDAAAAMwAgAQAANAAwAgAANQAgAwAAACAAIAEAACEAMAIAACIAIAwEAADeAwAgowIAAJcEADCkAgAAOAAQpQIAAJcEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHlAkAA2AMAIeYCQADYAwAh8AIBAOUDACHxAgEA0gMAIfICAQDSAwAhAwQAAJsFACDxAgAArwQAIPICAACvBAAgDAQAAN4DACCjAgAAlwQAMKQCAAA4ABClAgAAlwQAMKYCAQAAAAG0AgEA5QMAIbsCQADYAwAh5QJAANgDACHmAkAA2AMAIfACAQAAAAHxAgEA0gMAIfICAQDSAwAhAwAAADgAIAEAADkAMAIAADoAIAEAAAAdACABAAAAAwAgAQAAAAYAIAEAAAAKACABAAAALgAgAQAAAC4AIAEAAAAzACABAAAAIAAgAQAAADgAIAEAAAABACADAAAAAwAgAQAABAAwAgAAAQAgAwAAAAMAIAEAAAQAMAIAAAEAIAMAAAADACABAAAEADACAAABACAFGgAA-wYAIKYCAQAAAAG7AkAAAAAB_AIBAAAAAf0CAQAAAAEBIAAASQAgBKYCAQAAAAG7AkAAAAAB_AIBAAAAAf0CAQAAAAEBIAAASwAwASAAAEsAMAUaAAD6BgAgpgIBAKoEACG7AkAAuwQAIfwCAQCqBAAh_QIBAKoEACECAAAAAQAgIAAATgAgBKYCAQCqBAAhuwJAALsEACH8AgEAqgQAIf0CAQCqBAAhAgAAAAMAICAAAFAAIAIAAAADACAgAABQACADAAAAAQAgJwAASQAgKAAATgAgAQAAAAEAIAEAAAADACADCQAA9wYAIC0AAPkGACAuAAD4BgAgB6MCAACWBAAwpAIAAFcAEKUCAACWBAAwpgIBALcDACG7AkAAwgMAIfwCAQC3AwAh_QIBALcDACEDAAAAAwAgAQAAVgAwLAAAVwAgAwAAAAMAIAEAAAQAMAIAAAEAIBkDAACQBAAgBQAAkQQAIA8AANwDACAQAADdAwAgFQAAkgQAIBYAAJIEACAXAACTBAAgGAAAlAQAIBkAAJUEACCjAgAAjAQAMKQCAABdABClAgAAjAQAMKYCAQAAAAG7AkAA2AMAIcACAQDlAwAhwwIBANIDACHKAgAAjgT5AiLmAkAA2AMAIfMCAQAAAAH0AiAA1wMAIfYCAACNBPYCIvcCIADXAwAh-QIgANcDACH6AkAAjwQAIfsCIADXAwAhAQAAAFoAIAEAAABaACAZAwAAkAQAIAUAAJEEACAPAADcAwAgEAAA3QMAIBUAAJIEACAWAACSBAAgFwAAkwQAIBgAAJQEACAZAACVBAAgowIAAIwEADCkAgAAXQAQpQIAAIwEADCmAgEA5QMAIbsCQADYAwAhwAIBAOUDACHDAgEA0gMAIcoCAACOBPkCIuYCQADYAwAh8wIBAOUDACH0AiAA1wMAIfYCAACNBPYCIvcCIADXAwAh-QIgANcDACH6AkAAjwQAIfsCIADXAwAhCwMAAPEGACAFAADyBgAgDwAAmQUAIBAAAJoFACAVAADzBgAgFgAA8wYAIBcAAPQGACAYAAD1BgAgGQAA9gYAIMMCAACvBAAg-gIAAK8EACADAAAAXQAgAQAAXgAwAgAAWgAgAwAAAF0AIAEAAF4AMAIAAFoAIAMAAABdACABAABeADACAABaACAWAwAA6AYAIAUAAOkGACAPAADqBgAgEAAA7gYAIBUAAOsGACAWAADsBgAgFwAA7QYAIBgAAO8GACAZAADwBgAgpgIBAAAAAbsCQAAAAAHAAgEAAAABwwIBAAAAAcoCAAAA-QIC5gJAAAAAAfMCAQAAAAH0AiAAAAAB9gIAAAD2AgL3AiAAAAAB-QIgAAAAAfoCQAAAAAH7AiAAAAABASAAAGIAIA2mAgEAAAABuwJAAAAAAcACAQAAAAHDAgEAAAABygIAAAD5AgLmAkAAAAAB8wIBAAAAAfQCIAAAAAH2AgAAAPYCAvcCIAAAAAH5AiAAAAAB-gJAAAAAAfsCIAAAAAEBIAAAZAAwASAAAGQAMBYDAACDBgAgBQAAhAYAIA8AAIUGACAQAACJBgAgFQAAhgYAIBYAAIcGACAXAACIBgAgGAAAigYAIBkAAIsGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHDAgEAtQQAIcoCAACCBvkCIuYCQAC7BAAh8wIBAKoEACH0AiAAugQAIfYCAACBBvYCIvcCIAC6BAAh-QIgALoEACH6AkAA9gUAIfsCIAC6BAAhAgAAAFoAICAAAGcAIA2mAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHDAgEAtQQAIcoCAACCBvkCIuYCQAC7BAAh8wIBAKoEACH0AiAAugQAIfYCAACBBvYCIvcCIAC6BAAh-QIgALoEACH6AkAA9gUAIfsCIAC6BAAhAgAAAF0AICAAAGkAIAIAAABdACAgAABpACADAAAAWgAgJwAAYgAgKAAAZwAgAQAAAFoAIAEAAABdACAFCQAA_gUAIC0AAIAGACAuAAD_BQAgwwIAAK8EACD6AgAArwQAIBCjAgAAhQQAMKQCAABwABClAgAAhQQAMKYCAQC3AwAhuwJAAMIDACHAAgEAtwMAIcMCAQC8AwAhygIAAIcE-QIi5gJAAMIDACHzAgEAtwMAIfQCIADBAwAh9gIAAIYE9gIi9wIgAMEDACH5AiAAwQMAIfoCQACBBAAh-wIgAMEDACEDAAAAXQAgAQAAbwAwLAAAcAAgAwAAAF0AIAEAAF4AMAIAAFoAIAEAAAA6ACABAAAAOgAgAwAAADgAIAEAADkAMAIAADoAIAMAAAA4ACABAAA5ADACAAA6ACADAAAAOAAgAQAAOQAwAgAAOgAgCQQAAP0FACCmAgEAAAABtAIBAAAAAbsCQAAAAAHlAkAAAAAB5gJAAAAAAfACAQAAAAHxAgEAAAAB8gIBAAAAAQEgAAB4ACAIpgIBAAAAAbQCAQAAAAG7AkAAAAAB5QJAAAAAAeYCQAAAAAHwAgEAAAAB8QIBAAAAAfICAQAAAAEBIAAAegAwASAAAHoAMAkEAAD8BQAgpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh5QJAALsEACHmAkAAuwQAIfACAQCqBAAh8QIBALUEACHyAgEAtQQAIQIAAAA6ACAgAAB9ACAIpgIBAKoEACG0AgEAqgQAIbsCQAC7BAAh5QJAALsEACHmAkAAuwQAIfACAQCqBAAh8QIBALUEACHyAgEAtQQAIQIAAAA4ACAgAAB_ACACAAAAOAAgIAAAfwAgAwAAADoAICcAAHgAICgAAH0AIAEAAAA6ACABAAAAOAAgBQkAAPkFACAtAAD7BQAgLgAA-gUAIPECAACvBAAg8gIAAK8EACALowIAAIQEADCkAgAAhgEAEKUCAACEBAAwpgIBALcDACG0AgEAtwMAIbsCQADCAwAh5QJAAMIDACHmAkAAwgMAIfACAQC3AwAh8QIBALwDACHyAgEAvAMAIQMAAAA4ACABAACFAQAwLAAAhgEAIAMAAAA4ACABAAA5ADACAAA6ACABAAAACAAgAQAAAAgAIAMAAAAGACABAAAHADACAAAIACADAAAABgAgAQAABwAwAgAACAAgAwAAAAYAIAEAAAcAMAIAAAgAIA4EAAD4BQAgpgIBAAAAAbQCAQAAAAG7AkAAAAAB5gJAAAAAAecCAQAAAAHoAgEAAAAB6QIBAAAAAeoCAQAAAAHrAgEAAAAB7AJAAAAAAe0CQAAAAAHuAgEAAAAB7wIBAAAAAQEgAACOAQAgDaYCAQAAAAG0AgEAAAABuwJAAAAAAeYCQAAAAAHnAgEAAAAB6AIBAAAAAekCAQAAAAHqAgEAAAAB6wIBAAAAAewCQAAAAAHtAkAAAAAB7gIBAAAAAe8CAQAAAAEBIAAAkAEAMAEgAACQAQAwDgQAAPcFACCmAgEAqgQAIbQCAQCqBAAhuwJAALsEACHmAkAAuwQAIecCAQCqBAAh6AIBAKoEACHpAgEAtQQAIeoCAQC1BAAh6wIBALUEACHsAkAA9gUAIe0CQAD2BQAh7gIBALUEACHvAgEAtQQAIQIAAAAIACAgAACTAQAgDaYCAQCqBAAhtAIBAKoEACG7AkAAuwQAIeYCQAC7BAAh5wIBAKoEACHoAgEAqgQAIekCAQC1BAAh6gIBALUEACHrAgEAtQQAIewCQAD2BQAh7QJAAPYFACHuAgEAtQQAIe8CAQC1BAAhAgAAAAYAICAAAJUBACACAAAABgAgIAAAlQEAIAMAAAAIACAnAACOAQAgKAAAkwEAIAEAAAAIACABAAAABgAgCgkAAPMFACAtAAD1BQAgLgAA9AUAIOkCAACvBAAg6gIAAK8EACDrAgAArwQAIOwCAACvBAAg7QIAAK8EACDuAgAArwQAIO8CAACvBAAgEKMCAACABAAwpAIAAJwBABClAgAAgAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeYCQADCAwAh5wIBALcDACHoAgEAtwMAIekCAQC8AwAh6gIBALwDACHrAgEAvAMAIewCQACBBAAh7QJAAIEEACHuAgEAvAMAIe8CAQC8AwAhAwAAAAYAIAEAAJsBADAsAACcAQAgAwAAAAYAIAEAAAcAMAIAAAgAIAmjAgAA_wMAMKQCAACiAQAQpQIAAP8DADCmAgEAAAABuwJAANgDACHjAgEA5QMAIeQCAQDlAwAh5QJAANgDACHmAkAA2AMAIQEAAACfAQAgAQAAAJ8BACAJowIAAP8DADCkAgAAogEAEKUCAAD_AwAwpgIBAOUDACG7AkAA2AMAIeMCAQDlAwAh5AIBAOUDACHlAkAA2AMAIeYCQADYAwAhAAMAAACiAQAgAQAAowEAMAIAAJ8BACADAAAAogEAIAEAAKMBADACAACfAQAgAwAAAKIBACABAACjAQAwAgAAnwEAIAamAgEAAAABuwJAAAAAAeMCAQAAAAHkAgEAAAAB5QJAAAAAAeYCQAAAAAEBIAAApwEAIAamAgEAAAABuwJAAAAAAeMCAQAAAAHkAgEAAAAB5QJAAAAAAeYCQAAAAAEBIAAAqQEAMAEgAACpAQAwBqYCAQCqBAAhuwJAALsEACHjAgEAqgQAIeQCAQCqBAAh5QJAALsEACHmAkAAuwQAIQIAAACfAQAgIAAArAEAIAamAgEAqgQAIbsCQAC7BAAh4wIBAKoEACHkAgEAqgQAIeUCQAC7BAAh5gJAALsEACECAAAAogEAICAAAK4BACACAAAAogEAICAAAK4BACADAAAAnwEAICcAAKcBACAoAACsAQAgAQAAAJ8BACABAAAAogEAIAMJAADwBQAgLQAA8gUAIC4AAPEFACAJowIAAP4DADCkAgAAtQEAEKUCAAD-AwAwpgIBALcDACG7AkAAwgMAIeMCAQC3AwAh5AIBALcDACHlAkAAwgMAIeYCQADCAwAhAwAAAKIBACABAAC0AQAwLAAAtQEAIAMAAACiAQAgAQAAowEAMAIAAJ8BACABAAAAGwAgAQAAABsAIAMAAAAZACABAAAaADACAAAbACADAAAAGQAgAQAAGgAwAgAAGwAgAwAAABkAIAEAABoAMAIAABsAIAcLAADvBQAgpgIBAAAAAacCAQAAAAHaAgEAAAAB2wIBAAAAAeECAAAA4QIC4gIgAAAAAQEgAAC9AQAgBqYCAQAAAAGnAgEAAAAB2gIBAAAAAdsCAQAAAAHhAgAAAOECAuICIAAAAAEBIAAAvwEAMAEgAAC_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_AEAEKUCAAD0AwAwpgIBALcDACHAAgEAtwMAIcMCAQC8AwAhAwAAAOkBACABAAD7AQAwLAAA_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-BQAgkAEAAMEFACAJowIAAOcDADCkAgAA1gIAEKUCAADnAwAwpgIBALcDACGnAgEAtwMAIbsCQADCAwAhxAIBALcDACHFAgIAwAMAIcYCAQC3AwAhAwAAACAAIAEAANUCADAsAADWAgAgAwAAACAAIAEAACEAMAIAACIAIAkIAADaAwAgDwAA3AMAIKMCAADkAwAwpAIAANwCABClAgAA5AMAMKYCAQAAAAHAAgEAAAABwgIAAOYDwgIiwwIBANIDACEBAAAA2QIAIAEAAADZAgAgCQgAANoDACAPAADcAwAgowIAAOQDADCkAgAA3AIAEKUCAADkAwAwpgIBAOUDACHAAgEA5QMAIcICAADmA8ICIsMCAQDSAwAhAwgAAJcFACAPAACZBQAgwwIAAK8EACADAAAA3AIAIAEAAN0CADACAADZAgAgAwAAANwCACABAADdAgAwAgAA2QIAIAMAAADcAgAgAQAA3QIAMAIAANkCACAGCAAAuwUAIA8AALwFACCmAgEAAAABwAIBAAAAAcICAAAAwgICwwIBAAAAAQEgAADhAgAgBKYCAQAAAAHAAgEAAAABwgIAAADCAgLDAgEAAAABASAAAOMCADABIAAA4wIAMAYIAAClBQAgDwAApgUAIKYCAQCqBAAhwAIBAKoEACHCAgAApAXCAiLDAgEAtQQAIQIAAADZAgAgIAAA5gIAIASmAgEAqgQAIcACAQCqBAAhwgIAAKQFwgIiwwIBALUEACECAAAA3AIAICAAAOgCACACAAAA3AIAICAAAOgCACADAAAA2QIAICcAAOECACAoAADmAgAgAQAAANkCACABAAAA3AIAIAQJAAChBQAgLQAAowUAIC4AAKIFACDDAgAArwQAIAejAgAA4AMAMKQCAADvAgAQpQIAAOADADCmAgEAtwMAIcACAQC3AwAhwgIAAOEDwgIiwwIBALwDACEDAAAA3AIAIAEAAO4CADAsAADvAgAgAwAAANwCACABAADdAgAwAgAA2QIAIAEAAAAUACABAAAAFAAgAwAAABIAIAEAABMAMAIAABQAIAMAAAASACABAAATADACAAAUACADAAAAEgAgAQAAEwAwAgAAFAAgBQoAAI8FACALAACgBQAgpgIBAAAAAacCAQAAAAG_AgEAAAABASAAAPcCACADpgIBAAAAAacCAQAAAAG_AgEAAAABASAAAPkCADABIAAA-QIAMAUKAACNBQAgCwAAnwUAIKYCAQCqBAAhpwIBAKoEACG_AgEAqgQAIQIAAAAUACAgAAD8AgAgA6YCAQCqBAAhpwIBAKoEACG_AgEAqgQAIQIAAAASACAgAAD-AgAgAgAAABIAICAAAP4CACADAAAAFAAgJwAA9wIAICgAAPwCACABAAAAFAAgAQAAABIAIAMJAACcBQAgLQAAngUAIC4AAJ0FACAGowIAAN8DADCkAgAAhQMAEKUCAADfAwAwpgIBALcDACGnAgEAtwMAIb8CAQC3AwAhAwAAABIAIAEAAIQDADAsAACFAwAgAwAAABIAIAEAABMAMAIAABQAIBIEAADeAwAgDAAA2QMAIA0AANoDACAOAADbAwAgDwAA3AMAIBAAAN0DACCjAgAA0QMAMKQCAAAdABClAgAA0QMAMKYCAQAAAAG0AgEAAAABtQIBANIDACG2AgIA0wMAIbcCEADUAwAhuAIIANUDACG5AgIA1gMAIboCIADXAwAhuwJAANgDACEBAAAAiAMAIAEAAACIAwAgCQQAAJsFACAMAACWBQAgDQAAlwUAIA4AAJgFACAPAACZBQAgEAAAmgUAILUCAACvBAAgtgIAAK8EACC4AgAArwQAIAMAAAAdACABAACLAwAwAgAAiAMAIAMAAAAdACABAACLAwAwAgAAiAMAIAMAAAAdACABAACLAwAwAgAAiAMAIA8EAACVBQAgDAAAkAUAIA0AAJEFACAOAACSBQAgDwAAkwUAIBAAAJQFACCmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAEBIAAAjwMAIAmmAgEAAAABtAIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAEBIAAAkQMAMAEgAACRAwAwDwQAAMEEACAMAAC8BAAgDQAAvQQAIA4AAL4EACAPAAC_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-gJAAI8EACH7AiAA1wMAIf4CAABdACD_AgAAXQAgBqMCAADfAwAwpAIAAIUDABClAgAA3wMAMKYCAQC3AwAhpwIBALcDACG_AgEAtwMAIQejAgAA4AMAMKQCAADvAgAQpQIAAOADADCmAgEAtwMAIcACAQC3AwAhwgIAAOEDwgIiwwIBALwDACEHCQAAuQMAIC0AAOMDACAuAADjAwAgqQIAAADCAgKqAgAAAMICCKsCAAAAwgIIswIAAOIDwgIiBwkAALkDACAtAADjAwAgLgAA4wMAIKkCAAAAwgICqgIAAADCAgirAgAAAMICCLMCAADiA8ICIgSpAgAAAMICAqoCAAAAwgIIqwIAAADCAgizAgAA4wPCAiIJCAAA2gMAIA8AANwDACCjAgAA5AMAMKQCAADcAgAQpQIAAOQDADCmAgEA5QMAIcACAQDlAwAhwgIAAOYDwgIiwwIBANIDACELqQIBAAAAAaoCAQAAAASrAgEAAAAErAIBAAAAAa0CAQAAAAGuAgEAAAABrwIBAAAAAbACAQAAAAGxAgEAAAABsgIBAAAAAbMCAQC6AwAhBKkCAAAAwgICqgIAAADCAgirAgAAAMICCLMCAADjA8ICIgmjAgAA5wMAMKQCAADWAgAQpQIAAOcDADCmAgEAtwMAIacCAQC3AwAhuwJAAMIDACHEAgEAtwMAIcUCAgDAAwAhxgIBALcDACELowIAAOgDADCkAgAAwAIAEKUCAADoAwAwpgIBALcDACG7AkAAwgMAIccCAQC3AwAhyAIQAL4DACHKAgAA6QPKAiLLAgEAvAMAIcwCAADqAwAgzQIBALwDACEHCQAAuQMAIC0AAO0DACAuAADtAwAgqQIAAADKAgKqAgAAAMoCCKsCAAAAygIIswIAAOwDygIiDwkAAMoDACAtAADrAwAgLgAA6wMAIKkCgAAAAAGsAoAAAAABrQKAAAAAAa4CgAAAAAGvAoAAAAABswKAAAAAAc4CAQAAAAHPAgEAAAAB0AIBAAAAAdECgAAAAAHSAoAAAAAB0wKAAAAAAQypAoAAAAABrAKAAAAAAa0CgAAAAAGuAoAAAAABrwKAAAAAAbMCgAAAAAHOAgEAAAABzwIBAAAAAdACAQAAAAHRAoAAAAAB0gKAAAAAAdMCgAAAAAEHCQAAuQMAIC0AAO0DACAuAADtAwAgqQIAAADKAgKqAgAAAMoCCKsCAAAAygIIswIAAOwDygIiBKkCAAAAygICqgIAAADKAgirAgAAAMoCCLMCAADtA8oCIgwRAADxAwAgowIAAO4DADCkAgAALAAQpQIAAO4DADCmAgEA5QMAIbsCQADYAwAhxwIBAOUDACHIAhAA1AMAIcoCAADvA8oCIssCAQDSAwAhzAIAAPADACDNAgEA0gMAIQSpAgAAAMoCAqoCAAAAygIIqwIAAADKAgizAgAA7QPKAiIMqQKAAAAAAawCgAAAAAGtAoAAAAABrgKAAAAAAa8CgAAAAAGzAoAAAAABzgIBAAAAAc8CAQAAAAHQAgEAAAAB0QKAAAAAAdICgAAAAAHTAoAAAAABFQYAAN4DACAHAAChBAAgCwAAmwQAIBIAAKQEACCjAgAAogQAMKQCAAAKABClAgAAogQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIbsCQADYAwAhxAIBAOUDACHKAgAAowTdAiLZAkAA2AMAIdoCAQDlAwAh2wIBAOUDACHdAhAA1AMAId4CAQDSAwAh3wIBANIDACH-AgAACgAg_wIAAAoAIAmjAgAA8gMAMKQCAACoAgAQpQIAAPIDADCmAgEAtwMAIbQCAQC3AwAhuwJAAMIDACHUAgEAtwMAIdUCAQC3AwAh1gIgAMEDACEJowIAAPMDADCkAgAAkgIAEKUCAADzAwAwpgIBALcDACG7AkAAwgMAIdUCAQC3AwAh1gIgAMEDACHXAgEAtwMAIdgCAQC3AwAhBqMCAAD0AwAwpAIAAPwBABClAgAA9AMAMKYCAQC3AwAhwAIBALcDACHDAgEAvAMAIQcIAADZAwAgowIAAPUDADCkAgAA6QEAEKUCAAD1AwAwpgIBAOUDACHAAgEA5QMAIcMCAQDSAwAhD6MCAAD2AwAwpAIAAOMBABClAgAA9gMAMKYCAQC3AwAhpwIBALcDACGoAgEAtwMAIbsCQADCAwAhxAIBALcDACHKAgAA9wPdAiLZAkAAwgMAIdoCAQC3AwAh2wIBALcDACHdAhAAvgMAId4CAQC8AwAh3wIBALwDACEHCQAAuQMAIC0AAPkDACAuAAD5AwAgqQIAAADdAgKqAgAAAN0CCKsCAAAA3QIIswIAAPgD3QIiBwkAALkDACAtAAD5AwAgLgAA-QMAIKkCAAAA3QICqgIAAADdAgirAgAAAN0CCLMCAAD4A90CIgSpAgAAAN0CAqoCAAAA3QIIqwIAAADdAgizAgAA-QPdAiIJowIAAPoDADCkAgAAzQEAEKUCAAD6AwAwpgIBALcDACGnAgEAvAMAIdoCAQC3AwAh2wIBALcDACHhAgAA-wPhAiLiAiAAwQMAIQcJAAC5AwAgLQAA_QMAIC4AAP0DACCpAgAAAOECAqoCAAAA4QIIqwIAAADhAgizAgAA_APhAiIHCQAAuQMAIC0AAP0DACAuAAD9AwAgqQIAAADhAgKqAgAAAOECCKsCAAAA4QIIswIAAPwD4QIiBKkCAAAA4QICqgIAAADhAgirAgAAAOECCLMCAAD9A-ECIgmjAgAA_gMAMKQCAAC1AQAQpQIAAP4DADCmAgEAtwMAIbsCQADCAwAh4wIBALcDACHkAgEAtwMAIeUCQADCAwAh5gJAAMIDACEJowIAAP8DADCkAgAAogEAEKUCAAD_AwAwpgIBAOUDACG7AkAA2AMAIeMCAQDlAwAh5AIBAOUDACHlAkAA2AMAIeYCQADYAwAhEKMCAACABAAwpAIAAJwBABClAgAAgAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeYCQADCAwAh5wIBALcDACHoAgEAtwMAIekCAQC8AwAh6gIBALwDACHrAgEAvAMAIewCQACBBAAh7QJAAIEEACHuAgEAvAMAIe8CAQC8AwAhCwkAAMoDACAtAACDBAAgLgAAgwQAIKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAAggQAIQsJAADKAwAgLQAAgwQAIC4AAIMEACCpAkAAAAABqgJAAAAABasCQAAAAAWsAkAAAAABrQJAAAAAAa4CQAAAAAGvAkAAAAABswJAAIIEACEIqQJAAAAAAaoCQAAAAAWrAkAAAAAFrAJAAAAAAa0CQAAAAAGuAkAAAAABrwJAAAAAAbMCQACDBAAhC6MCAACEBAAwpAIAAIYBABClAgAAhAQAMKYCAQC3AwAhtAIBALcDACG7AkAAwgMAIeUCQADCAwAh5gJAAMIDACHwAgEAtwMAIfECAQC8AwAh8gIBALwDACEQowIAAIUEADCkAgAAcAAQpQIAAIUEADCmAgEAtwMAIbsCQADCAwAhwAIBALcDACHDAgEAvAMAIcoCAACHBPkCIuYCQADCAwAh8wIBALcDACH0AiAAwQMAIfYCAACGBPYCIvcCIADBAwAh-QIgAMEDACH6AkAAgQQAIfsCIADBAwAhBwkAALkDACAtAACLBAAgLgAAiwQAIKkCAAAA9gICqgIAAAD2AgirAgAAAPYCCLMCAACKBPYCIgcJAAC5AwAgLQAAiQQAIC4AAIkEACCpAgAAAPkCAqoCAAAA-QIIqwIAAAD5AgizAgAAiAT5AiIHCQAAuQMAIC0AAIkEACAuAACJBAAgqQIAAAD5AgKqAgAAAPkCCKsCAAAA-QIIswIAAIgE-QIiBKkCAAAA-QICqgIAAAD5AgirAgAAAPkCCLMCAACJBPkCIgcJAAC5AwAgLQAAiwQAIC4AAIsEACCpAgAAAPYCAqoCAAAA9gIIqwIAAAD2AgizAgAAigT2AiIEqQIAAAD2AgKqAgAAAPYCCKsCAAAA9gIIswIAAIsE9gIiGQMAAJAEACAFAACRBAAgDwAA3AMAIBAAAN0DACAVAACSBAAgFgAAkgQAIBcAAJMEACAYAACUBAAgGQAAlQQAIKMCAACMBAAwpAIAAF0AEKUCAACMBAAwpgIBAOUDACG7AkAA2AMAIcACAQDlAwAhwwIBANIDACHKAgAAjgT5AiLmAkAA2AMAIfMCAQDlAwAh9AIgANcDACH2AgAAjQT2AiL3AiAA1wMAIfkCIADXAwAh-gJAAI8EACH7AiAA1wMAIQSpAgAAAPYCAqoCAAAA9gIIqwIAAAD2AgizAgAAiwT2AiIEqQIAAAD5AgKqAgAAAPkCCKsCAAAA-QIIswIAAIkE-QIiCKkCQAAAAAGqAkAAAAAFqwJAAAAABawCQAAAAAGtAkAAAAABrgJAAAAAAa8CQAAAAAGzAkAAgwQAIQO8AgAAAwAgvQIAAAMAIL4CAAADACADvAIAAAYAIL0CAAAGACC-AgAABgAgA7wCAAAuACC9AgAALgAgvgIAAC4AIAO8AgAAMwAgvQIAADMAIL4CAAAzACADvAIAADgAIL0CAAA4ACC-AgAAOAAgFAQAAN4DACAMAADZAwAgDQAA2gMAIA4AANsDACAPAADcAwAgEAAA3QMAIKMCAADRAwAwpAIAAB0AEKUCAADRAwAwpgIBAOUDACG0AgEA5QMAIbUCAQDSAwAhtgICANMDACG3AhAA1AMAIbgCCADVAwAhuQICANYDACG6AiAA1wMAIbsCQADYAwAh_gIAAB0AIP8CAAAdACAHowIAAJYEADCkAgAAVwAQpQIAAJYEADCmAgEAtwMAIbsCQADCAwAh_AIBALcDACH9AgEAtwMAIQwEAADeAwAgowIAAJcEADCkAgAAOAAQpQIAAJcEADCmAgEA5QMAIbQCAQDlAwAhuwJAANgDACHlAkAA2AMAIeYCQADYAwAh8AIBAOUDACHxAgEA0gMAIfICAQDSAwAhCgQAAN4DACCjAgAAmAQAMKQCAAAzABClAgAAmAQAMKYCAQDlAwAhtAIBAOUDACG7AkAA2AMAIdQCAQDlAwAh1QIBAOUDACHWAiAA1wMAIQsTAADeAwAgFAAA3gMAIKMCAACZBAAwpAIAAC4AEKUCAACZBAAwpgIBAOUDACG7AkAA2AMAIdUCAQDlAwAh1gIgANcDACHXAgEA5QMAIdgCAQDlAwAhCwYAAN4DACALAACbBAAgowIAAJoEADCkAgAAIAAQpQIAAJoEADCmAgEA5QMAIacCAQDlAwAhuwJAANgDACHEAgEA5QMAIcUCAgDWAwAhxgIBAOUDACEUBAAA3gMAIAwAANkDACANAADaAwAgDgAA2wMAIA8AANwDACAQAADdAwAgowIAANEDADCkAgAAHQAQpQIAANEDADCmAgEA5QMAIbQCAQDlAwAhtQIBANIDACG2AgIA0wMAIbcCEADUAwAhuAIIANUDACG5AgIA1gMAIboCIADXAwAhuwJAANgDACH-AgAAHQAg_wIAAB0AIAoLAACVBAAgowIAAJwEADCkAgAAGQAQpQIAAJwEADCmAgEA5QMAIacCAQDSAwAh2gIBAOUDACHbAgEA5QMAIeECAACdBOECIuICIADXAwAhBKkCAAAA4QICqgIAAADhAgirAgAAAOECCLMCAAD9A-ECIggKAACfBAAgCwAAmwQAIKMCAACeBAAwpAIAABIAEKUCAACeBAAwpgIBAOUDACGnAgEA5QMAIb8CAQDlAwAhCQgAANkDACCjAgAA9QMAMKQCAADpAQAQpQIAAPUDADCmAgEA5QMAIcACAQDlAwAhwwIBANIDACH-AgAA6QEAIP8CAADpAQAgCAcAAKEEACALAACbBAAgowIAAKAEADCkAgAADgAQpQIAAKAEADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACELCAAA2gMAIA8AANwDACCjAgAA5AMAMKQCAADcAgAQpQIAAOQDADCmAgEA5QMAIcACAQDlAwAhwgIAAOYDwgIiwwIBANIDACH-AgAA3AIAIP8CAADcAgAgEwYAAN4DACAHAAChBAAgCwAAmwQAIBIAAKQEACCjAgAAogQAMKQCAAAKABClAgAAogQAMKYCAQDlAwAhpwIBAOUDACGoAgEA5QMAIbsCQADYAwAhxAIBAOUDACHKAgAAowTdAiLZAkAA2AMAIdoCAQDlAwAh2wIBAOUDACHdAhAA1AMAId4CAQDSAwAh3wIBANIDACEEqQIAAADdAgKqAgAAAN0CCKsCAAAA3QIIswIAAPkD3QIiDhEAAPEDACCjAgAA7gMAMKQCAAAsABClAgAA7gMAMKYCAQDlAwAhuwJAANgDACHHAgEA5QMAIcgCEADUAwAhygIAAO8DygIiywIBANIDACHMAgAA8AMAIM0CAQDSAwAh_gIAACwAIP8CAAAsACARBAAA3gMAIKMCAAClBAAwpAIAAAYAEKUCAAClBAAwpgIBAOUDACG0AgEA5QMAIbsCQADYAwAh5gJAANgDACHnAgEA5QMAIegCAQDlAwAh6QIBANIDACHqAgEA0gMAIesCAQDSAwAh7AJAAI8EACHtAkAAjwQAIe4CAQDSAwAh7wIBANIDACEIGgAA3gMAIKMCAACmBAAwpAIAAAMAEKUCAACmBAAwpgIBAOUDACG7AkAA2AMAIfwCAQDlAwAh_QIBAOUDACEAAAABgwMBAAAAAQUnAADhBwAgKAAA5wcAIIADAADiBwAggQMAAOYHACCGAwAA2QIAIAUnAADfBwAgKAAA5AcAIIADAADgBwAggQMAAOMHACCGAwAAiAMAIAMnAADhBwAggAMAAOIHACCGAwAA2QIAIAMnAADfBwAggAMAAOAHACCGAwAAiAMAIAAAAAAAAAGDAwEAAAABBYMDAgAAAAGJAwIAAAABigMCAAAAAYsDAgAAAAGMAwIAAAABBYMDEAAAAAGJAxAAAAABigMQAAAAAYsDEAAAAAGMAxAAAAABBYMDCAAAAAGJAwgAAAABigMIAAAAAYsDCAAAAAGMAwgAAAABBYMDAgAAAAGJAwIAAAABigMCAAAAAYsDAgAAAAGMAwIAAAABAYMDIAAAAAEBgwNAAAAAAQsnAACCBQAwKAAAhwUAMIADAACDBQAwgQMAAIQFADCCAwAAhQUAIIMDAACGBQAwhAMAAIYFADCFAwAAhgUAMIYDAACGBQAwhwMAAIgFADCIAwAAiQUAMAsnAAD2BAAwKAAA-wQAMIADAAD3BAAwgQMAAPgEADCCAwAA-QQAIIMDAAD6BAAwhAMAAPoEADCFAwAA-gQAMIYDAAD6BAAwhwMAAPwEADCIAwAA_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-BAAgIAAA_wQAIAajAgAA_QQAMKQCAAD-BAAQpQIAAP0EADCmAgEA5QMAIacCAQDlAwAhqAIBAOUDACEGowIAAP0EADCkAgAA_gQAEKUCAAD9BAAwpgIBAOUDACGnAgEA5QMAIagCAQDlAwAhAqYCAQCqBAAhqAIBAKoEACEDBwAAqwQAIKYCAQCqBAAhqAIBAKoEACEDBwAArQQAIKYCAQAAAAGoAgEAAAABAwoAAI8FACCmAgEAAAABvwIBAAAAAQIAAAAUACAnAACOBQAgAwAAABQAICcAAI4FACAoAACMBQAgASAAAMgHADAICgAAnwQAIAsAAJsEACCjAgAAngQAMKQCAAASABClAgAAngQAMKYCAQAAAAGnAgEA5QMAIb8CAQDlAwAhAgAAABQAICAAAIwFACACAAAAigUAICAAAIsFACAGowIAAIkFADCkAgAAigUAEKUCAACJBQAwpgIBAOUDACGnAgEA5QMAIb8CAQDlAwAhBqMCAACJBQAwpAIAAIoFABClAgAAiQUAMKYCAQDlAwAhpwIBAOUDACG_AgEA5QMAIQKmAgEAqgQAIb8CAQCqBAAhAwoAAI0FACCmAgEAqgQAIb8CAQCqBAAhBScAAMMHACAoAADGBwAggAMAAMQHACCBAwAAxQcAIIYDAADmAQAgAwoAAI8FACCmAgEAAAABvwIBAAAAAQMnAADDBwAggAMAAMQHACCGAwAA5gEAIAQnAACCBQAwgAMAAIMFADCCAwAAhQUAIIYDAACGBQAwBCcAAPYEADCAAwAA9wQAMIIDAAD5BAAghgMAAPoEADAEJwAA6QQAMIADAADqBAAwggMAAOwEACCGAwAA7QQAMAQnAADQBAAwgAMAANEEADCCAwAA0wQAIIYDAADUBAAwBCcAAMIEADCAAwAAwwQAMIIDAADFBAAghgMAAMYEADADJwAAwQcAIIADAADCBwAghgMAAFoAIAAAAAAACwMAAPEGACAFAADyBgAgDwAAmQUAIBAAAJoFACAVAADzBgAgFgAA8wYAIBcAAPQGACAYAAD1BgAgGQAA9gYAIMMCAACvBAAg-gIAAK8EACAAAAAFJwAAvAcAICgAAL8HACCAAwAAvQcAIIEDAAC-BwAghgMAAIgDACADJwAAvAcAIIADAAC9BwAghgMAAIgDACAAAAABgwMAAADCAgILJwAAsgUAMCgAALYFADCAAwAAswUAMIEDAAC0BQAwggMAALUFACCDAwAA-gQAMIQDAAD6BAAwhQMAAPoEADCGAwAA-gQAMIcDAAC3BQAwiAMAAP0EADALJwAApwUAMCgAAKsFADCAAwAAqAUAMIEDAACpBQAwggMAAKoFACCDAwAA1AQAMIQDAADUBAAwhQMAANQEADCGAwAA1AQAMIcDAACsBQAwiAMAANcEADAOBgAA5gQAIAsAALEFACASAADoBAAgpgIBAAAAAacCAQAAAAG7AkAAAAABxAIBAAAAAcoCAAAA3QIC2QJAAAAAAdoCAQAAAAHbAgEAAAAB3QIQAAAAAd4CAQAAAAHfAgEAAAABAgAAAAwAICcAALAFACADAAAADAAgJwAAsAUAICgAAK4FACABIAAAuwcAMAIAAAAMACAgAACuBQAgAgAAANgEACAgAACtBQAgC6YCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAQCqBAAhygIAANoE3QIi2QJAALsEACHaAgEAqgQAIdsCAQCqBAAh3QIQALcEACHeAgEAtQQAId8CAQC1BAAhDgYAANwEACALAACvBQAgEgAA3gQAIKYCAQCqBAAhpwIBAKoEACG7AkAAuwQAIcQCAQCqBAAhygIAANoE3QIi2QJAALsEACHaAgEAqgQAIdsCAQCqBAAh3QIQALcEACHeAgEAtQQAId8CAQC1BAAhBScAALYHACAoAAC5BwAggAMAALcHACCBAwAAuAcAIIYDAACIAwAgDgYAAOYEACALAACxBQAgEgAA6AQAIKYCAQAAAAGnAgEAAAABuwJAAAAAAcQCAQAAAAHKAgAAAN0CAtkCQAAAAAHaAgEAAAAB2wIBAAAAAd0CEAAAAAHeAgEAAAAB3wIBAAAAAQMnAAC2BwAggAMAALcHACCGAwAAiAMAIAMLAACuBAAgpgIBAAAAAacCAQAAAAECAAAAEAAgJwAAugUAIAMAAAAQACAnAAC6BQAgKAAAuQUAIAEgAAC1BwAwAgAAABAAICAAALkFACACAAAA_gQAICAAALgFACACpgIBAKoEACGnAgEAqgQAIQMLAACsBAAgpgIBAKoEACGnAgEAqgQAIQMLAACuBAAgpgIBAAAAAacCAQAAAAEEJwAAsgUAMIADAACzBQAwggMAALUFACCGAwAA-gQAMAQnAACnBQAwgAMAAKgFADCCAwAAqgUAIIYDAADUBAAwAAAAAAAFJwAAsAcAICgAALMHACCAAwAAsQcAIIEDAACyBwAghgMAAIgDACADJwAAsAcAIIADAACxBwAghgMAAIgDACAAAAAAAAUnAACrBwAgKAAArgcAIIADAACsBwAggQMAAK0HACCGAwAADAAgAycAAKsHACCAAwAArAcAIIYDAAAMACAGBgAAmwUAIAcAAP0GACALAAD2BgAgEgAA_gYAIN4CAACvBAAg3wIAAK8EACAAAAAFJwAApgcAICgAAKkHACCAAwAApwcAIIEDAACoBwAghgMAAFoAIAMnAACmBwAggAMAAKcHACCGAwAAWgAgAAAABScAAJ4HACAoAACkBwAggAMAAJ8HACCBAwAAowcAIIYDAABaACAFJwAAnAcAICgAAKEHACCAAwAAnQcAIIEDAACgBwAghgMAAFoAIAMnAACeBwAggAMAAJ8HACCGAwAAWgAgAycAAJwHACCAAwAAnQcAIIYDAABaACAAAAALJwAA3AUAMCgAAOAFADCAAwAA3QUAMIEDAADeBQAwggMAAN8FACCDAwAAhgUAMIQDAACGBQAwhQMAAIYFADCGAwAAhgUAMIcDAADhBQAwiAMAAIkFADADCwAAoAUAIKYCAQAAAAGnAgEAAAABAgAAABQAICcAAOQFACADAAAAFAAgJwAA5AUAICgAAOMFACABIAAAmwcAMAIAAAAUACAgAADjBQAgAgAAAIoFACAgAADiBQAgAqYCAQCqBAAhpwIBAKoEACEDCwAAnwUAIKYCAQCqBAAhpwIBAKoEACEDCwAAoAUAIKYCAQAAAAGnAgEAAAABBCcAANwFADCAAwAA3QUAMIIDAADfBQAghgMAAIYFADAAAAAAAAAAAAcnAACWBwAgKAAAmQcAIIADAACXBwAggQMAAJgHACCEAwAAHQAghQMAAB0AIIYDAACIAwAgAycAAJYHACCAAwAAlwcAIIYDAACIAwAgAAAAAAAAAYMDQAAAAAEFJwAAkQcAICgAAJQHACCAAwAAkgcAIIEDAACTBwAghgMAAFoAIAMnAACRBwAggAMAAJIHACCGAwAAWgAgAAAABScAAIwHACAoAACPBwAggAMAAI0HACCBAwAAjgcAIIYDAABaACADJwAAjAcAIIADAACNBwAghgMAAFoAIAAAAAGDAwAAAPYCAgGDAwAAAPkCAgsnAADcBgAwKAAA4QYAMIADAADdBgAwgQMAAN4GADCCAwAA3wYAIIMDAADgBgAwhAMAAOAGADCFAwAA4AYAMIYDAADgBgAwhwMAAOIGADCIAwAA4wYAMAsnAADQBgAwKAAA1QYAMIADAADRBgAwgQMAANIGADCCAwAA0wYAIIMDAADUBgAwhAMAANQGADCFAwAA1AYAMIYDAADUBgAwhwMAANYGADCIAwAA1wYAMAsnAADHBgAwKAAAywYAMIADAADIBgAwgQMAAMkGADCCAwAAygYAIIMDAADUBAAwhAMAANQEADCFAwAA1AQAMIYDAADUBAAwhwMAAMwGADCIAwAA1wQAMAsnAAC-BgAwKAAAwgYAMIADAAC_BgAwgQMAAMAGADCCAwAAwQYAIIMDAAC2BgAwhAMAALYGADCFAwAAtgYAMIYDAAC2BgAwhwMAAMMGADCIAwAAuQYAMAsnAACyBgAwKAAAtwYAMIADAACzBgAwgQMAALQGADCCAwAAtQYAIIMDAAC2BgAwhAMAALYGADCFAwAAtgYAMIYDAAC2BgAwhwMAALgGADCIAwAAuQYAMAsnAACmBgAwKAAAqwYAMIADAACnBgAwgQMAAKgGADCCAwAAqQYAIIMDAACqBgAwhAMAAKoGADCFAwAAqgYAMIYDAACqBgAwhwMAAKwGADCIAwAArQYAMAsnAACdBgAwKAAAoQYAMIADAACeBgAwgQMAAJ8GADCCAwAAoAYAIIMDAADGBAAwhAMAAMYEADCFAwAAxgQAMIYDAADGBAAwhwMAAKIGADCIAwAAyQQAMAsnAACRBgAwKAAAlgYAMIADAACSBgAwgQMAAJMGADCCAwAAlAYAIIMDAACVBgAwhAMAAJUGADCFAwAAlQYAMIYDAACVBgAwhwMAAJcGADCIAwAAmAYAMAcnAACMBgAgKAAAjwYAIIADAACNBgAggQMAAI4GACCEAwAAHQAghQMAAB0AIIYDAACIAwAgDQwAAJAFACANAACRBQAgDgAAkgUAIA8AAJMFACAQAACUBQAgpgIBAAAAAbUCAQAAAAG2AgIAAAABtwIQAAAAAbgCCAAAAAG5AgIAAAABugIgAAAAAbsCQAAAAAECAAAAiAMAICcAAIwGACADAAAAHQAgJwAAjAYAICgAAJAGACAPAAAAHQAgDAAAvAQAIA0AAL0EACAOAAC-BAAgDwAAvwQAIBAAAMAEACAgAACQBgAgpgIBAKoEACG1AgEAtQQAIbYCAgC2BAAhtwIQALcEACG4AggAuAQAIbkCAgC5BAAhugIgALoEACG7AkAAuwQAIQ0MAAC8BAAgDQAAvQQAIA4AAL4EACAPAAC_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_QIBAAAAAQIAAAABACAnAADnBgAgAwAAAAEAICcAAOcGACAoAADmBgAgASAAAIQHADAIGgAA3gMAIKMCAACmBAAwpAIAAAMAEKUCAACmBAAwpgIBAAAAAbsCQADYAwAh_AIBAOUDACH9AgEA5QMAIQIAAAABACAgAADmBgAgAgAAAOQGACAgAADlBgAgB6MCAADjBgAwpAIAAOQGABClAgAA4wYAMKYCAQDlAwAhuwJAANgDACH8AgEA5QMAIf0CAQDlAwAhB6MCAADjBgAwpAIAAOQGABClAgAA4wYAMKYCAQDlAwAhuwJAANgDACH8AgEA5QMAIf0CAQDlAwAhA6YCAQCqBAAhuwJAALsEACH9AgEAqgQAIQOmAgEAqgQAIbsCQAC7BAAh_QIBAKoEACEDpgIBAAAAAbsCQAAAAAH9AgEAAAABBCcAANwGADCAAwAA3QYAMIIDAADfBgAghgMAAOAGADAEJwAA0AYAMIADAADRBgAwggMAANMGACCGAwAA1AYAMAQnAADHBgAwgAMAAMgGADCCAwAAygYAIIYDAADUBAAwBCcAAL4GADCAAwAAvwYAMIIDAADBBgAghgMAALYGADAEJwAAsgYAMIADAACzBgAwggMAALUGACCGAwAAtgYAMAQnAACmBgAwgAMAAKcGADCCAwAAqQYAIIYDAACqBgAwBCcAAJ0GADCAAwAAngYAMIIDAACgBgAghgMAAMYEADAEJwAAkQYAMIADAACSBgAwggMAAJQGACCGAwAAlQYAMAMnAACMBgAggAMAAI0GACCGAwAAiAMAIAAAAAAACQQAAJsFACAMAACWBQAgDQAAlwUAIA4AAJgFACAPAACZBQAgEAAAmgUAILUCAACvBAAgtgIAAK8EACC4AgAArwQAIAAAAAUnAAD_BgAgKAAAggcAIIADAACABwAggQMAAIEHACCGAwAAWgAgAycAAP8GACCAAwAAgAcAIIYDAABaACACCAAAlgUAIMMCAACvBAAgAwgAAJcFACAPAACZBQAgwwIAAK8EACAEEQAAywUAIMsCAACvBAAgzAIAAK8EACDNAgAArwQAIBUFAADpBgAgDwAA6gYAIBAAAO4GACAVAADrBgAgFgAA7AYAIBcAAO0GACAYAADvBgAgGQAA8AYAIKYCAQAAAAG7AkAAAAABwAIBAAAAAcMCAQAAAAHKAgAAAPkCAuYCQAAAAAHzAgEAAAAB9AIgAAAAAfYCAAAA9gIC9wIgAAAAAfkCIAAAAAH6AkAAAAAB-wIgAAAAAQIAAABaACAnAAD_BgAgAwAAAF0AICcAAP8GACAoAACDBwAgFwAAAF0AIAUAAIQGACAPAACFBgAgEAAAiQYAIBUAAIYGACAWAACHBgAgFwAAiAYAIBgAAIoGACAZAACLBgAgIAAAgwcAIKYCAQCqBAAhuwJAALsEACHAAgEAqgQAIcMCAQC1BAAhygIAAIIG-QIi5gJAALsEACHzAgEAqgQAIfQCIAC6BAAh9gIAAIEG9gIi9wIgALoEACH5AiAAugQAIfoCQAD2BQAh-wIgALoEACEVBQAAhAYAIA8AAIUGACAQAACJBgAgFQAAhgYAIBYAAIcGACAXAACIBgAgGAAAigYAIBkAAIsGACCmAgEAqgQAIbsCQAC7BAAhwAIBAKoEACHDAgEAtQQAIcoCAACCBvkCIuYCQAC7BAAh8wIBAKoEACH0AiAAugQAIfYCAACBBvYCIvcCIAC6BAAh-QIgALoEACH6AkAA9gUAIfsCIAC6BAAhA6YCAQAAAAG7AkAAAAAB_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_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_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_BAAgEAAAwAQAICAAAOUHACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEOBAAAwQQAIAwAALwEACAOAAC-BAAgDwAAvwQAIBAAAMAEACCmAgEAqgQAIbQCAQCqBAAhtQIBALUEACG2AgIAtgQAIbcCEAC3BAAhuAIIALgEACG5AgIAuQQAIboCIAC6BAAhuwJAALsEACEDAAAA3AIAICcAAOEHACAoAADoBwAgBwAAANwCACAPAACmBQAgIAAA6AcAIKYCAQCqBAAhwAIBAKoEACHCAgAApAXCAiLDAgEAtQQAIQUPAACmBQAgpgIBAKoEACHAAgEAqgQAIcICAACkBcICIsMCAQC1BAAhARoAAgoDBQEFCQMJABMPDQQQNwwVMRAWMhAXNhEYOxIZPAcBBAACBAYAAgcABQsABxItDwMIEQYJAA4PKQQCBwAFCwAHBwQAAgkADQwVCA0YBg4cCw8fBBAjDAIKAAkLAAcCCBYICQAKAQgXAAELHgcCBgACCwAHBQwkAA0lAA4mAA8nABAoAAIIKgAPKwABEQAEAhMAAhQAAgEEAAIBBAACCAM9AAU-AA8_ABBDABVAABZBABdCABhEAAABGgACARoAAgMJABgtABkuABoAAAADCQAYLQAZLgAaAAADCQAfLQAgLgAhAAAAAwkAHy0AIC4AIQEEAAIBBAACAwkAJi0AJy4AKAAAAAMJACYtACcuACgBBAACAQQAAgMJAC0tAC4uAC8AAAADCQAtLQAuLgAvAAAAAwkANS0ANi4ANwAAAAMJADUtADYuADcBC8IBBwELyAEHAwkAPC0APS4APgAAAAMJADwtAD0uAD4DBgACBwAFCwAHAwYAAgcABQsABwUJAEMtAEYuAEePAQBEkAEARQAAAAAABQkAQy0ARi4AR48BAESQAQBFAAADCQBMLQBNLgBOAAAAAwkATC0ATS4ATgITAAIUAAICEwACFAACAwkAUy0AVC4AVQAAAAMJAFMtAFQuAFUBBAACAQQAAgMJAFotAFsuAFwAAAADCQBaLQBbLgBcAREABAERAAQFCQBhLQBkLgBljwEAYpABAGMAAAAAAAUJAGEtAGQuAGWPAQBikAEAYwIGAAILAAcCBgACCwAHBQkAai0AbS4Abo8BAGuQAQBsAAAAAAAFCQBqLQBtLgBujwEAa5ABAGwAAAMJAHMtAHQuAHUAAAADCQBzLQB0LgB1AgoACQsABwIKAAkLAAcDCQB6LQB7LgB8AAAAAwkAei0Aey4AfAEEAAIBBAACBQkAgQEtAIQBLgCFAY8BAIIBkAEAgwEAAAAAAAUJAIEBLQCEAS4AhQGPAQCCAZABAIMBAgcABQsABwIHAAULAAcDCQCKAS0AiwEuAIwBAAAAAwkAigEtAIsBLgCMARsCARxFAR1GAR5HAR9IASFKASJMFCNNFSRPASVRFCZSFilTASpUAStVFC9YFzBZGzFbAjJcAjNfAjRgAjVhAjZjAjdlFDhmHDloAjpqFDtrHTxsAj1tAj5uFD9xHkByIkFzEkJ0EkN1EkR2EkV3EkZ5Ekd7FEh8I0l-EkqAARRLgQEkTIIBEk2DARJOhAEUT4cBJVCIASlRiQEDUooBA1OLAQNUjAEDVY0BA1aPAQNXkQEUWJIBKlmUAQNalgEUW5cBK1yYAQNdmQEDXpoBFF-dASxgngEwYaABMWKhATFjpAExZKUBMWWmATFmqAExZ6oBFGirATJprQExaq8BFGuwATNssQExbbIBMW6zARRvtgE0cLcBOHG4AQtyuQELc7oBC3S7AQt1vAELdr4BC3fAARR4wQE5ecQBC3rGARR7xwE6fMkBC33KAQt-ywEUf84BO4ABzwE_gQHQAQSCAdEBBIMB0gEEhAHTAQSFAdQBBIYB1gEEhwHYARSIAdkBQIkB2wEEigHdARSLAd4BQYwB3wEEjQHgAQSOAeEBFJEB5AFCkgHlAUiTAecBCZQB6AEJlQHrAQmWAewBCZcB7QEJmAHvAQmZAfEBFJoB8gFJmwH0AQmcAfYBFJ0B9wFKngH4AQmfAfkBCaAB-gEUoQH9AUuiAf4BT6MB_wEQpAGAAhClAYECEKYBggIQpwGDAhCoAYUCEKkBhwIUqgGIAlCrAYoCEKwBjAIUrQGNAlGuAY4CEK8BjwIQsAGQAhSxAZMCUrIBlAJWswGVAhG0AZYCEbUBlwIRtgGYAhG3AZkCEbgBmwIRuQGdAhS6AZ4CV7sBoAIRvAGiAhS9AaMCWL4BpAIRvwGlAhHAAaYCFMEBqQJZwgGqAl3DAawCD8QBrQIPxQGvAg_GAbACD8cBsQIPyAGzAg_JAbUCFMoBtgJeywG4Ag_MAboCFM0BuwJfzgG8Ag_PAb0CD9ABvgIU0QHBAmDSAcICZtMBwwIM1AHEAgzVAcUCDNYBxgIM1wHHAgzYAckCDNkBywIU2gHMAmfbAc4CDNwB0AIU3QHRAmjeAdICDN8B0wIM4AHUAhThAdcCaeIB2AJv4wHaAgXkAdsCBeUB3gIF5gHfAgXnAeACBegB4gIF6QHkAhTqAeUCcOsB5wIF7AHpAhTtAeoCce4B6wIF7wHsAgXwAe0CFPEB8AJy8gHxAnbzAfICCPQB8wII9QH0Agj2AfUCCPcB9gII-AH4Agj5AfoCFPoB-wJ3-wH9Agj8Af8CFP0BgAN4_gGBAwj_AYIDCIACgwMUgQKGA3mCAocDfYMCiQMHhAKKAweFAowDB4YCjQMHhwKOAweIApADB4kCkgMUigKTA36LApUDB4wClwMUjQKYA3-OApkDB48CmgMHkAKbAxSRAp4DgAGSAp8DhgGTAqADBpQCoQMGlQKiAwaWAqMDBpcCpAMGmAKmAwaZAqgDFJoCqQOHAZsCqwMGnAKtAxSdAq4DiAGeAq8DBp8CsAMGoAKxAxShArQDiQGiArUDjQE"
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
  BLOCKED: "BLOCKED",
  INACTIVE: "INACTIVE"
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
    "SUPER_ADMIN_PASSWORD",
    "GEMINI_API_KEY"
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
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
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
import { Router as Router10 } from "express";

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
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const startIndex = uploadIndex + 1 + (parts[uploadIndex + 1]?.startsWith("v") ? 1 : 0);
    return parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
  } catch (error) {
    return null;
  }
};

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
var uploadAvatar = async (user, fileBuffer, mimetype) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) throw new Error("User not found.");
  if (dbUser.image) {
    const publicId = getPublicIdFromUrl(dbUser.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }
  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/avatars", {
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    format: "webp"
  });
  return await prisma.user.update({
    where: { id: user.userId },
    data: { image: url },
    select: { id: true, name: true, image: true, email: true }
  });
};
var UserService = {
  getStudentDashboardStatsFromDB,
  updateProfileInDB,
  uploadAvatar
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
var uploadAvatar2 = async (user, fileBuffer, mimetype) => {
  const result = await UserService.uploadAvatar(user, fileBuffer, mimetype);
  return { avatarUrl: result.image };
};
var getAllTutors = async (query) => {
  const searchTerm = query.searchTerm || query.search;
  const searchConditions = searchTerm ? {
    OR: [
      { user: { name: { contains: query.search, mode: "insensitive" } } },
      { bio: { contains: query.search, mode: "insensitive" } }
    ]
  } : {};
  const { subject, language, ...remainingQuery } = query;
  const filterConditions = QueryHelper.filter(remainingQuery);
  const { skip, take, page, limit, orderBy } = QueryHelper.paginateAndSort(query);
  const where = {
    isApproved: true,
    ...searchConditions,
    ...filterConditions
  };
  if (subject) {
    where.subjects = {
      some: {
        subject: {
          name: { contains: subject, mode: "insensitive" }
        }
      }
    };
  }
  if (language) {
    where.languages = {
      some: {
        language: {
          name: { contains: language, mode: "insensitive" }
        }
      }
    };
  }
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
  uploadAvatar: uploadAvatar2,
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
var uploadAvatar3 = catchAsync(async (req, res) => {
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
  uploadAvatar: uploadAvatar3,
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

// src/app/middleware/fileUpload.ts
import multer from "multer";
import status7 from "http-status";
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError_default(status7.BAD_REQUEST, "Only image files are allowed!"), false);
  }
};
var fileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});

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
  fileUpload.single("avatar"),
  TutorController.uploadAvatar
);
var TutorRoutes = router2;

// src/app/module/booking/booking.route.ts
import { Router as Router3 } from "express";

// src/app/module/booking/booking.controller.ts
import status9 from "http-status";

// src/app/module/booking/booking.service.ts
import status8 from "http-status";
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
    throw new AppError_default(status8.NOT_FOUND, "Tutor profile not found.");
  }
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = days[new Date(bookingDate).getUTCDay()];
  const isTutorTeachingSubject = await prisma.tutorSubjects.findFirst({
    where: { tutorId, subjectId }
  });
  if (!isTutorTeachingSubject) {
    throw new AppError_default(status8.BAD_REQUEST, "This tutor does not teach the selected subject.");
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
    throw new AppError_default(status8.BAD_REQUEST, `Tutor is not available on ${dayOfWeek} between ${startTime} - ${endTime}`);
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
    throw new AppError_default(status8.CONFLICT, "Tutor already has a booking at this time.");
  }
  const start = startTime.split(":").map(Number);
  const end = endTime.split(":").map(Number);
  const durationInHours = end[0] + end[1] / 60 - (start[0] + start[1] / 60);
  if (durationInHours <= 0) {
    throw new AppError_default(status8.BAD_REQUEST, "End time must be after start time.");
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
      [BookingStatus.ACCEPTED]: [BookingStatus.COMPLETED],
      [BookingStatus.REJECTED]: [BookingStatus.CANCELLED]
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
var getAllBookings = async (query) => {
  const { page, limit, sortBy, sortOrder, status: status20, searchTerm } = query;
  const { skip, take } = getPagination(page, limit);
  const where = {};
  if (status20) {
    where.status = status20;
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
var bookingService = {
  createBooking,
  updateBookingStatus,
  getBookingsByStudent,
  getBookingsByTutor,
  getAllBookings,
  getBookingById
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
    httpStatusCode: status9.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings,
    meta: result.meta
  });
});
var getAllBookings2 = catchAsync(async (req, res) => {
  const result = await bookingService.getAllBookings(req.query);
  sendResponse(res, {
    httpStatusCode: status9.OK,
    success: true,
    message: "All bookings retrieved successfully for admin",
    data: result
  });
});
var bookingControllers = {
  createBooking: createBooking2,
  updateBooking,
  getBookingById: getBookingById2,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  getAllBookings: getAllBookings2
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
var BookingRoute = router3;

// src/app/module/admin/admin.route.ts
import { Router as Router4 } from "express";

// src/app/module/admin/admin.controller.ts
import httpStatus from "http-status";

// src/app/module/admin/admin.service.ts
import status10 from "http-status";
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
var updateUserStatus = async (userId, status20, adminId) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId
      },
      data: {
        status: status20
      }
    });
    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user status of ${userId} to ${status20}`
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
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true
    }
  });
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    averageRating,
    totalRevenue: totalRevenue._sum.amount || 0
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
  const { status: status20 } = req.body;
  const adminId = req.user.userId;
  const result = await AdminService.updateUserStatus(id, status20, adminId);
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
import status11 from "http-status";
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
    where: { id }
  });
  return result;
};
var deleteSubject = async (id) => {
  const result = await prisma.subject.delete({
    where: { id }
  });
  return result;
};
var uploadIcon = async (id, fileBuffer) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new AppError_default(status11.NOT_FOUND, "Subject not found.");
  if (subject.image) {
    const publicId = getPublicIdFromUrl(subject.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }
  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/subjects", {
    transformation: [{ width: 200, height: 200, crop: "pad", background: "auto" }],
    format: "webp"
  });
  return await prisma.subject.update({
    where: { id },
    data: { image: url }
  });
};
var SubjectService = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  deleteSubject,
  uploadIcon
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
var uploadIcon2 = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(httpStatus2.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'icon'."
    });
    return;
  }
  const result = await SubjectService.uploadIcon(req.params.id, req.file.buffer);
  sendResponse(res, {
    httpStatusCode: httpStatus2.OK,
    success: true,
    message: "Subject icon uploaded successfully",
    data: result
  });
});
var SubjectController = {
  createSubject: createSubject2,
  getAllSubjects: getAllSubjects2,
  getSubjectById: getSubjectById2,
  deleteSubject: deleteSubject2,
  uploadIcon: uploadIcon2
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
router5.post(
  "/:id/upload-icon",
  checkAuth(UserRole.ADMIN),
  fileUpload.single("icon"),
  SubjectController.uploadIcon
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
import status12 from "http-status";
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
    where: { id }
  });
  return result;
};
var updateLanguage = async (id, payload) => {
  const result = await prisma.language.update({
    where: { id },
    data: payload
  });
  return result;
};
var deleteLanguage = async (id) => {
  const result = await prisma.language.delete({
    where: { id }
  });
  return result;
};
var uploadIcon3 = async (id, fileBuffer) => {
  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) throw new AppError_default(status12.NOT_FOUND, "Language not found.");
  if (language.image) {
    const publicId = getPublicIdFromUrl(language.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }
  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/languages", {
    transformation: [{ width: 100, height: 100, crop: "pad", background: "auto" }],
    format: "webp"
  });
  return await prisma.language.update({
    where: { id },
    data: { image: url }
  });
};
var LanguageService = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  uploadIcon: uploadIcon3
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
var uploadIcon4 = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(httpStatus3.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'icon'."
    });
    return;
  }
  const result = await LanguageService.uploadIcon(req.params.id, req.file.buffer);
  sendResponse(res, {
    httpStatusCode: httpStatus3.OK,
    success: true,
    message: "Language icon uploaded successfully",
    data: result
  });
});
var LanguageController = {
  createLanguage: createLanguage2,
  getAllLanguages: getAllLanguages2,
  getLanguageById: getLanguageById2,
  updateLanguage: updateLanguage2,
  deleteLanguage: deleteLanguage2,
  uploadIcon: uploadIcon4
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
router6.post(
  "/:id/upload-icon",
  checkAuth(UserRole.ADMIN),
  fileUpload.single("icon"),
  LanguageController.uploadIcon
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
import status14 from "http-status";

// src/app/module/availability/availability.service.ts
import status13 from "http-status";
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
  if (!profile) throw new AppError_default(status13.NOT_FOUND, "Tutor profile not found.");
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
    throw new AppError_default(status13.FORBIDDEN, "Access denied or slot not found.");
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
    httpStatusCode: status14.OK,
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
    httpStatusCode: status14.OK,
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
    httpStatusCode: status14.OK,
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
    httpStatusCode: status14.OK,
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
    httpStatusCode: status14.OK,
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
    httpStatusCode: status14.OK,
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
import status16 from "http-status";

// src/app/module/payment/payment.service.ts
import status15 from "http-status";
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
    throw new AppError_default(status15.BAD_REQUEST, `Webhook Error: ${err.message}`);
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
    throw new AppError_default(status15.FORBIDDEN, "Invalid booking or access denied.");
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
      throw new AppError_default(status15.FORBIDDEN, "You can only approve payments for your own bookings.");
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
    httpStatusCode: status16.OK,
    success: true,
    message: "Stripe PaymentIntent created. Complete payment on frontend.",
    data: result
  });
});
var stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    res.status(status16.BAD_REQUEST).json({ success: false, message: "No signature." });
    return;
  }
  const result = await paymentService.handleStripeWebhook(req.body, signature);
  res.status(status16.OK).json(result);
});
var submitManualPayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.submitManualPayment(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status16.OK,
    success: true,
    message: "Manual payment submitted. Waiting for admin approval.",
    data: result
  });
});
var approveManualPayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await paymentService.approveManualPayment(req.params.bookingId, user.userId, user.role);
  sendResponse(res, {
    httpStatusCode: status16.OK,
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
import status17 from "http-status";
var getStudentStats = catchAsync(async (req, res) => {
  const user = req.user;
  console.log(user);
  const result = await UserService.getStudentDashboardStatsFromDB(user?.userId);
  sendResponse(res, {
    httpStatusCode: status17.OK,
    success: true,
    message: "Student stats fetched successfully.",
    data: result
  });
});
var updateProfile = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserService.updateProfileInDB(user.id, req.body);
  sendResponse(res, {
    httpStatusCode: status17.OK,
    success: true,
    message: "Profile updated successfully.",
    data: result
  });
});
var uploadAvatar4 = catchAsync(async (req, res) => {
  if (!req.file) {
    res.status(status17.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'avatar'."
    });
    return;
  }
  const result = await UserService.uploadAvatar(
    req.user,
    req.file.buffer,
    req.file.mimetype
  );
  sendResponse(res, {
    httpStatusCode: status17.OK,
    success: true,
    message: "Avatar uploaded successfully.",
    data: result
  });
});
var UserController = {
  getStudentStats,
  updateProfile,
  uploadAvatar: uploadAvatar4
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
router9.post(
  "/upload-avatar",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  fileUpload.single("avatar"),
  UserController.uploadAvatar
);
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
import { GoogleGenerativeAI } from "@google/generative-ai";
var genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY);
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
var generateChatReply = async (messages) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: `
      You are TutorByte AI Assistant.
      You help users with tutor booking, payments, becoming a tutor, dashboard help, and common FAQs.
      Keep answers concise, helpful, and practical.
      Always refer to the platform as TutorByte.
      If you don't know something, suggest contacting support.
    `
  });
  const chat = model.startChat({
    history: messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }))
  });
  const latestMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(latestMessage);
  const response = await result.response;
  return {
    reply: response.text()
  };
};
var generateTutorBio = async (payload) => {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  const prompt = `
    Act as a professional tutor copywriter. 
    Generate a compelling and professional "About Me" bio for a tutor.
    Subjects taught: ${payload.subjects.join(", ")}.
    Years of experience: ${payload.experienceYears}.
    Teaching style: ${payload.teachingStyle || "Professional and engaging"}.
    
    The bio should be around 100-150 words, highlight their expertise, and encourage students to book a session.
    Format the output as plain text.
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return {
    bio: response.text()
  };
};
var AIService = {
  getSearchSuggestions,
  getRecommendedTutors,
  generateChatReply,
  generateTutorBio
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
var generateChatReply2 = catchAsync(async (req, res) => {
  const { messages } = req.body;
  const data = await AIService.generateChatReply(messages);
  res.status(200).json({
    success: true,
    message: "Chat reply generated successfully",
    data
  });
});
var generateBio = catchAsync(async (req, res) => {
  const data = await AIService.generateTutorBio(req.body);
  res.status(200).json({
    success: true,
    message: "Tutor bio generated successfully",
    data
  });
});

// src/app/module/ai/ai.routes.ts
var router10 = express3.Router();
router10.get("/suggestions", getSuggestions);
router10.get(
  "/recommendations",
  // checkAuth(),
  // validateRequest(recommendationValidation),
  getRecommendations
);
router10.post("/ai-chat", generateChatReply2);
router10.post("/generate-bio", checkAuth(UserRole.TUTOR, UserRole.STUDENT), generateBio);
var AIRoutes = router10;

// src/app/module/review/reviews.route.ts
import { Router as Router9 } from "express";

// src/app/module/review/reviews.controller.ts
import status19 from "http-status";

// src/app/module/review/reviews.service.ts
import status18 from "http-status";
var createReview = async (studentId, data) => {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId }
  });
  if (!booking) {
    throw new AppError_default(status18.NOT_FOUND, "Booking not found.");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(
      status18.FORBIDDEN,
      "You can only review your own bookings."
    );
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError_default(
      status18.BAD_REQUEST,
      "You can only review a completed session."
    );
  }
  if (booking.tutorId !== data.tutorId) {
    throw new AppError_default(status18.BAD_REQUEST, "Tutor ID does not match the booking.");
  }
  const existingReview = await prisma.review.findFirst({
    where: { studentId, tutorId: data.tutorId }
  });
  if (existingReview) {
    throw new AppError_default(
      status18.CONFLICT,
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
var getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      tutor: {
        select: {
          id: true,
          bio: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return reviews;
};
var reviewService = {
  createReview,
  getMyReviews,
  getAllReviews
};

// src/app/module/review/reviews.controller.ts
var createReview2 = catchAsync(async (req, res) => {
  const user = req.user;
  const review = await reviewService.createReview(user.userId, req.body);
  sendResponse(res, {
    httpStatusCode: status19.CREATED,
    success: true,
    message: "Review submitted successfully.",
    data: review
  });
});
var getMyReviews2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await reviewService.getMyReviews(user?.userId);
  sendResponse(res, {
    httpStatusCode: status19.OK,
    success: true,
    message: "My reviews fetched successfully",
    data: result
  });
});
var getAllReviews2 = catchAsync(async (req, res) => {
  const result = await reviewService.getAllReviews();
  sendResponse(res, {
    httpStatusCode: status19.OK,
    success: true,
    message: "All reviews fetched successfully",
    data: result
  });
});
var reviewControllers = {
  createReview: createReview2,
  getMyReviews: getMyReviews2,
  getAllReviews: getAllReviews2
};

// src/app/module/review/reviews.route.ts
var router11 = Router9();
router11.post(
  "/",
  checkAuth(UserRole.STUDENT),
  validateRequest(createReviewSchema),
  reviewControllers.createReview
);
router11.get(
  "/me",
  checkAuth(UserRole.STUDENT),
  validateRequest(bookingQuerySchema),
  reviewControllers.getMyReviews
);
router11.get(
  "/",
  // validateRequest(bookingQuerySchema),
  reviewControllers.getAllReviews
);
var reviewRoutes = router11;

// src/app/routes/index.ts
var router12 = Router10();
router12.use("/auth", AuthRoutes);
router12.use("/tutors", TutorRoutes);
router12.use("/users", UserRoutes);
router12.use("/bookings", BookingRoute);
router12.use("/reviews", reviewRoutes);
router12.use("/admin", AdminRoutes);
router12.use("/subject", SubjectRoutes);
router12.use("/language", LanguageRoutes);
router12.use("/availability", AvailabilityRoutes);
router12.use("/payments", PaymentRoutes);
router12.use("/ai", AIRoutes);
var IndexRoutes = router12;

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
      "https://tutorbyte.vercel.app"
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
