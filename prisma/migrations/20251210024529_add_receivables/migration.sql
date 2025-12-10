-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtorName" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReceivablePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receivableId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReceivablePayment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReceivablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
