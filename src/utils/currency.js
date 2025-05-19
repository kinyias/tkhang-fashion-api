export function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return formatted + 'đ';
  }