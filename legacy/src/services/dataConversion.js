exports.convertToCSV = (expenses) => {
    const headers = ['ExpenseID', 'Description', 'Amount', 'Date']; // Define CSV headers
    const rows = expenses.map(expense => [expense.id, expense.description, expense.amount, expense.createdAt]); // Map expenses to rows
    const csvContent = [headers, ...rows].map(row => row.join(',')); // Combine headers and rows
    return csvContent.join('\n'); // Join rows with newline characters
}