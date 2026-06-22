export function showToast(message: string, type: 'success' | 'error'): void {
  const existingToast = document.querySelector(`.toast-${type}`);
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
