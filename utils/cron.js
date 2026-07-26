const cron = require("node-cron");
const prisma = require("../config/prisma");
const { addDays, addWeeks, addMonths, addYears, startOfDay, isBefore } = require("date-fns");

// Run every day at midnight
const startRecurringTransactionsCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Checking for recurring transactions...");
    try {
      const today = startOfDay(new Date());

      // Find all transactions that are recurring and where the next recurring date is today or earlier
      const recurringTransactions = await prisma.transaction.findMany({
        where: {
          isRecurring: true,
          nextRecurringDate: {
            lte: today,
          },
        },
      });

      if (recurringTransactions.length === 0) {
        console.log("[CRON] No recurring transactions to process today.");
        return;
      }

      console.log(`[CRON] Found ${recurringTransactions.length} recurring transactions to process.`);

      for (const transaction of recurringTransactions) {
        // Create the new transaction
        await prisma.transaction.create({
          data: {
            userId: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            categoryId: transaction.categoryId,
            description: transaction.description ? `${transaction.description} (Auto-recurring)` : "(Auto-recurring)",
            date: new Date(),
            isRecurring: false, // The generated transaction is not recurring itself, just the result
          },
        });

        // Calculate the next recurring date based on the interval
        let nextDate;
        switch (transaction.recurringInterval) {
          case "daily":
            nextDate = addDays(transaction.nextRecurringDate, 1);
            break;
          case "weekly":
            nextDate = addWeeks(transaction.nextRecurringDate, 1);
            break;
          case "monthly":
            nextDate = addMonths(transaction.nextRecurringDate, 1);
            break;
          case "yearly":
            nextDate = addYears(transaction.nextRecurringDate, 1);
            break;
          default:
            nextDate = addMonths(transaction.nextRecurringDate, 1);
        }

        // Catch-up logic: if nextDate is still in the past (e.g. server was off), skip forward until it's in the future
        while (isBefore(nextDate, today)) {
          switch (transaction.recurringInterval) {
            case "daily":
              nextDate = addDays(nextDate, 1);
              break;
            case "weekly":
              nextDate = addWeeks(nextDate, 1);
              break;
            case "monthly":
              nextDate = addMonths(nextDate, 1);
              break;
            case "yearly":
              nextDate = addYears(nextDate, 1);
              break;
          }
        }

        // Update the original recurring transaction with the new nextRecurringDate
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { nextRecurringDate: nextDate },
        });
      }
      
      console.log("[CRON] Recurring transactions processed successfully.");
    } catch (error) {
      console.error("[CRON] Error processing recurring transactions:", error);
    }
  });
};

module.exports = { startRecurringTransactionsCron };
